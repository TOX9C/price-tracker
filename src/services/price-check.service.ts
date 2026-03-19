import { scrapePrice, ScraperResult } from '../scrapers/index.js';
import { priceRepository, UrlToCheck, PriceUpdate } from '../repositories/price.repository.js';
import { itemRepository } from '../repositories/item.repository.js';
import { notificationService } from './notification.service.js';

export interface PriceCheckResult {
  trackedUrlId: string;
  url: string;
  success: boolean;
  price: number | null;
  oldPrice: number | null;
  priceDrop: boolean;
  error?: string;
}

export const priceCheckService = {
  /**
   * Check a single URL for price updates
   */
  async checkUrl(urlToCheck: UrlToCheck): Promise<PriceCheckResult> {
    const { id: trackedUrlId, url, item_id, store_name, current_price: oldPrice } = urlToCheck;

    try {
      const result: ScraperResult = await scrapePrice(url);

      if (result.extractionMethod === 'failed' || result.price === null) {
        // Update last_checked even if failed
        await priceRepository.updatePrice({
          trackedUrlId,
          price: null,
          currency: 'USD',
          availability: 'unknown',
          extractionMethod: 'failed',
          checkFailed: true,
        });

        return {
          trackedUrlId,
          url,
          success: false,
          price: null,
          oldPrice,
          priceDrop: false,
          error: 'No price found',
        };
      }

      // Check for price drop
      const priceCheck = await priceRepository.detectPriceDrop(trackedUrlId, result.price);
      const priceDrop = priceCheck.dropped && priceCheck.oldPrice !== null;

      // Update tracked URL
      const update: PriceUpdate = {
        trackedUrlId,
        price: result.price,
        currency: result.currency,
        availability: result.availability,
        extractionMethod: result.extractionMethod,
        checkFailed: false,
      };
      await priceRepository.updatePrice(update);

      // Add to price history
      await priceRepository.addPriceHistory(
        trackedUrlId,
        result.price,
        result.currency,
        result.availability
      );

      // Create notification if price dropped
      if (priceDrop && priceCheck.oldPrice !== null) {
        await this.createPriceDropNotification(
          item_id,
          trackedUrlId,
          store_name || 'Unknown Store',
          priceCheck.oldPrice,
          result.price
        );
      }

      return {
        trackedUrlId,
        url,
        success: true,
        price: result.price,
        oldPrice,
        priceDrop,
      };
    } catch (error) {
      // Mark as failed
      await priceRepository.updatePrice({
        trackedUrlId,
        price: null,
        currency: 'USD',
        availability: 'unknown',
        extractionMethod: 'failed',
        checkFailed: true,
      });

      return {
        trackedUrlId,
        url,
        success: false,
        price: null,
        oldPrice,
        priceDrop: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Check multiple URLs for price updates
   */
  async checkUrls(urls: UrlToCheck[]): Promise<PriceCheckResult[]> {
    const results: PriceCheckResult[] = [];

    // Process in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => this.checkUrl(url))
      );
      results.push(...batchResults);

      // Small delay between batches to be respectful
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  },

  /**
   * Get URLs that need checking and process them all
   */
  async runScheduledCheck(limit: number = 100): Promise<{
    checked: number;
    successful: number;
    priceDrops: number;
    errors: number;
  }> {
    const urls = await priceRepository.getUrlsForCheck(limit);

    if (urls.length === 0) {
      return { checked: 0, successful: 0, priceDrops: 0, errors: 0 };
    }

    const results = await this.checkUrls(urls);

    const successful = results.filter(r => r.success).length;
    const priceDrops = results.filter(r => r.priceDrop).length;
    const errors = results.filter(r => !r.success).length;

    return {
      checked: results.length,
      successful,
      priceDrops,
      errors,
    };
  },

  /**
   * Create a price drop notification
   */
  async createPriceDropNotification(
    itemId: string,
    trackedUrlId: string,
    storeName: string,
    oldPrice: number,
    newPrice: number
  ): Promise<void> {
    // Get item details to find user and name
    const item = await itemRepository.findByIdInternal(itemId);
    if (!item) return;

    const percentDrop = ((oldPrice - newPrice) / oldPrice) * 100;

    await notificationService.createPriceDropNotification({
      userId: item.user_id,
      itemId: item.id,
      itemName: item.name,
      storeName,
      oldPrice,
      newPrice,
      percentDrop,
    });
  },
};

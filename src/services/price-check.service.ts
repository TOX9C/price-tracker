import { scrapePrice, ScraperResult } from '../scrapers/index.js';
import { priceRepository, UrlToCheck, PriceUpdate } from '../repositories/price.repository.js';
import { itemRepository } from '../repositories/item.repository.js';
import { notificationService } from './notification.service.js';
import {
  initQueue,
  addPriceCheckJob,
  getJobStatus,
  checkRateLimit,
  getQueueStats,
  PriceCheckJob,
  JobResult,
  updateJobStatus,
  getMaxConcurrency,
  setJobProcessor,
  startWorker,
} from './queue.service.js';
import {
  scrapeWithExternalProvider,
  configureExternalScraping,
  isExternalScrapingConfigured,
} from './external-scraping.service.js';
import { env } from '../config/env.js';

export interface PriceCheckResult {
  trackedUrlId: string;
  url: string;
  success: boolean;
  price: number | null;
  oldPrice: number | null;
  priceDrop: boolean;
  error?: string;
  jobId?: string;
}

// Initialize queue and external scraping on module load
let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;

  // Configure external scraping if set
  if (env.SCRAPING_PROVIDER !== 'none' && env.SCRAPING_API_KEY) {
    configureExternalScraping({
      provider: env.SCRAPING_PROVIDER as 'scrapingbee' | 'scraperapi' | 'zenrows',
      apiKey: env.SCRAPING_API_KEY,
    });
  }

  // Initialize queue
  initQueue();

  initialized = true;
}

export const priceCheckService = {
  /**
   * Initialize services
   */
  init(): void {
    ensureInitialized();

    // Set up job processor and start worker
    setJobProcessor(async (job: PriceCheckJob): Promise<JobResult> => {
      const urlToCheck: UrlToCheck = {
        id: job.trackedUrlId,
        url: job.url,
        item_id: job.itemId,
        store_name: job.storeName,
        current_price: null,
      };
      const result = await this.checkUrl(urlToCheck);
      return {
        success: result.success,
        price: result.price,
        error: result.error,
      };
    });
    startWorker();
  },

  /**
   * Queue a price check for an item's URLs
   * Returns job IDs for tracking
   */
  async queueItemCheck(
    itemId: string,
    userId: string
 ): Promise<{ jobs: { jobId: string; url: string; storeName: string }[]; rateLimited: boolean; retryAfter?: number }> {
    ensureInitialized();

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return {
        jobs: [],
        rateLimited: true,
        retryAfter: rateLimit.retryAfter,
      };
    }

    // Get item and its URLs
    const item = await itemRepository.findById(itemId, userId);
    if (!item) {
      throw new Error('Item not found');
    }

    const jobs: { jobId: string; url: string; storeName: string }[] = [];

    for (const url of item.urls) {
      const job: PriceCheckJob = {
        trackedUrlId: url.id,
        url: url.url,
        itemId: item.id,
        storeName: url.store_name || 'Unknown',
        userId,
        priority: 5, // Normal priority for user-triggered checks
      };

      const result = await addPriceCheckJob(job);
      jobs.push({
        jobId: result.jobId,
        url: url.url,
        storeName: url.store_name || 'Unknown',
      });
    }

    return { jobs, rateLimited: false };
 },

 /**
   * Queue a price check for a single URL
   */
 async queueUrlCheck(
   trackedUrlId: string,
   url: string,
   itemId: string,
   storeName: string | null,
   userId: string
 ): Promise<{ jobId: string; rateLimited: boolean; retryAfter?: number }> {
   ensureInitialized();

   // Check rate limit
   const rateLimit = checkRateLimit(userId);
   if (!rateLimit.allowed) {
     return {
       jobId: '',
       rateLimited: true,
       retryAfter: rateLimit.retryAfter,
     };
   }

   const job: PriceCheckJob = {
     trackedUrlId,
     url,
     itemId,
     storeName: storeName || 'Unknown',
     userId,
     priority: 5,
   };

   const result = await addPriceCheckJob(job);
   return { jobId: result.jobId, rateLimited: false };
 },

 /**
   * Get status of a price check job
   */
 async getCheckStatus(jobId: string): Promise<{
   status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
   result?: JobResult;
   error?: string;
 }> {
   return getJobStatus(jobId);
 },

 /**
   * Get queue statistics
   */
 async getStats(): Promise<{
   queue: {
     waiting: number;
     active: number;
     completed: number;
     failed: number;
   };
   maxConcurrency: number;
   externalScraping: boolean;
 }> {
   const stats = await getQueueStats();
   return {
     queue: stats,
     maxConcurrency: getMaxConcurrency(),
     externalScraping: isExternalScrapingConfigured(),
   };
 },

  /**
   * Check a single URL for price updates (used by worker)
   */
  async checkUrl(urlToCheck: UrlToCheck): Promise<PriceCheckResult> {
    const { id: trackedUrlId, url, item_id, store_name, current_price: oldPrice } = urlToCheck;

    try {
      // Use external scraping provider if configured, otherwise local
      const result: ScraperResult = isExternalScrapingConfigured()
        ? await scrapeWithExternalProvider(url)
        : await scrapePrice(url);

      // Log if blocked
      if (result.blocked) {
        console.log(`[PriceCheck] URL blocked/CAPTCHA: ${url}`);
      }

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
          error: result.blocked ? 'Blocked by anti-bot protection' : 'No price found',
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
    const batchSize = getMaxConcurrency();
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
    ensureInitialized();

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

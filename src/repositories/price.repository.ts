import { query, queryOne } from '../config/database.js';
import { TrackedUrl, PriceHistory } from '../models/types.js';

export interface UrlToCheck {
  id: string;
  url: string;
  item_id: string;
  store_name: string | null;
  current_price: number | null;
}

export interface PriceUpdate {
  trackedUrlId: string;
  price: number;
  currency: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  extractionMethod: string;
  checkFailed: boolean;
}

export const priceRepository = {
  async getUrlsForCheck(limit: number = 100): Promise<UrlToCheck[]> {
    return query<UrlToCheck>(
      `SELECT id, url, item_id, store_name, current_price
       FROM tracked_urls
       WHERE last_checked IS NULL
         OR last_checked < NOW() - INTERVAL '1 hour'
       ORDER BY last_checked ASC NULLS FIRST
       LIMIT $1`,
      [limit]
    );
  },

  async updatePrice(update: PriceUpdate): Promise<void> {
    await queryOne<TrackedUrl>(
      `UPDATE tracked_urls
       SET current_price = $1,
           availability = $2,
           last_checked = NOW(),
           last_check_failed = $3,
           extraction_method = $4
       WHERE id = $5`,
      [update.price, update.availability, update.checkFailed, update.extractionMethod, update.trackedUrlId]
    );
  },

  async addPriceHistory(
    trackedUrlId: string,
    price: number,
    currency: string | null,
    availability: string
  ): Promise<PriceHistory> {
    const result = await queryOne<PriceHistory>(
      `INSERT INTO price_history (tracked_url_id, price, currency, availability)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trackedUrlId, price, currency || 'USD', availability]
    );
    if (!result) throw new Error('Failed to add price history');
    return result;
  },

  async getLatestPrice(trackedUrlId: string): Promise<PriceHistory | null> {
    return queryOne<PriceHistory>(
      `SELECT * FROM price_history
       WHERE tracked_url_id = $1
       ORDER BY checked_at DESC
       LIMIT 1`,
      [trackedUrlId]
    );
  },

  async getPriceHistory(trackedUrlId: string, days: number = 30): Promise<PriceHistory[]> {
    return query<PriceHistory>(
      `SELECT * FROM price_history
       WHERE tracked_url_id = $1
         AND checked_at > NOW() - INTERVAL '1 day' * $2
       ORDER BY checked_at ASC`,
      [trackedUrlId, days]
    );
  },

  async detectPriceDrop(trackedUrlId: string, newPrice: number): Promise<{ dropped: boolean; oldPrice: number | null }> {
    const result = await queryOne<{ old_price: number | null }>(
      `SELECT current_price as old_price
       FROM tracked_urls
       WHERE id = $1 AND current_price IS NOT NULL`,
      [trackedUrlId]
    );

    if (!result || result.old_price === null) {
      return { dropped: false, oldPrice: null };
    }

    return {
      dropped: newPrice < result.old_price,
      oldPrice: result.old_price,
    };
  },
};

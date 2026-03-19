import { query, queryOne, getClient } from '../config/database.js';
import { PoolClient } from 'pg';
import { Item, TrackedUrl } from '../models/types.js';

export interface ItemWithUrls extends Item {
  urls: TrackedUrl[];
  best_price: number | null;
  best_store: string | null;
}

export interface ItemWithPrice {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  best_price: number | null;
  best_store: string | null;
  url_count: number;
}

export const itemRepository = {
  async create(
    userId: string,
    name: string,
    imageUrl: string | null,
    category: string | null,
    urls: { url: string; storeName?: string }[]
  ): Promise<ItemWithUrls> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const itemResult = await client.query<Item>(
        `INSERT INTO items (user_id, name, image_url, category)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, name, imageUrl, category]
      );
      const item = itemResult.rows[0];

      const trackedUrls: TrackedUrl[] = [];
      for (const urlData of urls) {
        const urlResult = await client.query<TrackedUrl>(
          `INSERT INTO tracked_urls (item_id, url, store_name)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [item.id, urlData.url, urlData.storeName ?? null]
        );
        trackedUrls.push(urlResult.rows[0]);
      }

      await client.query('COMMIT');

      return {
        ...item,
        urls: trackedUrls,
        best_price: null,
        best_store: null,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findByUserId(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<{ items: ItemWithPrice[]; nextCursor: string | null }> {
    const offset = cursor
      ? parseInt(Buffer.from(cursor, 'base64').toString(), 10)
      : 0;

    const items = await query<ItemWithPrice>(
      `SELECT
        i.id,
        i.name,
        i.image_url,
        i.category,
        MIN(tu.current_price) FILTER (WHERE tu.current_price IS NOT NULL) as best_price,
        (SELECT tu2.store_name FROM tracked_urls tu2
         WHERE tu2.item_id = i.id AND tu2.current_price = MIN(tu.current_price)
         LIMIT 1) as best_store,
        COUNT(tu.id) as url_count
       FROM items i
       LEFT JOIN tracked_urls tu ON tu.item_id = i.id
       WHERE i.user_id = $1 AND i.deleted_at IS NULL
       GROUP BY i.id
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit + 1, offset]
    );

    let nextCursor: string | null = null;
    if (items.length > limit) {
      items.pop();
      nextCursor = Buffer.from(String(offset + limit)).toString('base64');
    }

    return { items, nextCursor };
  },

  async findById(itemId: string, userId: string): Promise<ItemWithUrls | null> {
    const item = await queryOne<Item>(
      `SELECT * FROM items WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [itemId, userId]
    );

    if (!item) return null;

    const urls = await query<TrackedUrl>(
      `SELECT * FROM tracked_urls WHERE item_id = $1 ORDER BY created_at`,
      [itemId]
    );

    const bestUrl = urls
      .filter(u => u.current_price !== null)
      .sort((a, b) => (a.current_price ?? Infinity) - (b.current_price ?? Infinity))[0];

    return {
      ...item,
      urls,
      best_price: bestUrl?.current_price ?? null,
      best_store: bestUrl?.store_name ?? null,
    };
  },

  async findByIdInternal(itemId: string): Promise<{ id: string; user_id: string; name: string } | null> {
    return queryOne<{ id: string; user_id: string; name: string }>(
      `SELECT id, user_id, name FROM items WHERE id = $1 AND deleted_at IS NULL`,
      [itemId]
    );
  },

  async addUrl(
    itemId: string,
    url: string,
    storeName?: string
  ): Promise<TrackedUrl> {
    const result = await queryOne<TrackedUrl>(
      `INSERT INTO tracked_urls (item_id, url, store_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [itemId, url, storeName ?? null]
    );
    if (!result) throw new Error('Failed to add URL');
    return result;
  },

  async removeUrl(itemId: string, urlId: string, userId: string): Promise<boolean> {
    const result = await queryOne<TrackedUrl>(
      `DELETE FROM tracked_urls
       WHERE id = $1 AND item_id = $2
       AND EXISTS (SELECT 1 FROM items WHERE id = $2 AND user_id = $3)
       RETURNING id`,
      [urlId, itemId, userId]
    );
    return result !== null;
  },

  async update(
    itemId: string,
    userId: string,
    updates: { name?: string; category?: string }
  ): Promise<Item | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }

    if (setClauses.length === 0) return null;

    values.push(itemId, userId);
    return queryOne<Item>(
      `UPDATE items SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
  },

  async softDelete(itemId: string, userId: string): Promise<boolean> {
    const result = await queryOne<Item>(
      `UPDATE items SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [itemId, userId]
    );
    return result !== null;
  },

  async urlExists(itemId: string, url: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM tracked_urls WHERE item_id = $1 AND url = $2) as exists`,
      [itemId, url]
    );
    return result?.exists ?? false;
  },
};

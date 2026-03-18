import { query, queryOne } from '../config/database.js';
import { Notification } from '../models/types.js';

export interface PriceDropNotification {
  userId: string;
  itemId: string;
  itemName: string;
  storeName: string;
  oldPrice: number;
  newPrice: number;
  percentDrop: number;
}

export const notificationService = {
  async createPriceDropNotification(data: PriceDropNotification): Promise<Notification> {
    const message = `Price drop! ${data.itemName} is now $${data.newPrice.toFixed(2)} at ${data.storeName} (down ${data.percentDrop.toFixed(1)}% from $${data.oldPrice.toFixed(2)})`;

    const result = await queryOne<Notification>(
      `INSERT INTO notifications (user_id, type, message, data)
       VALUES ($1, 'price_drop', $2, $3)
       RETURNING *`,
      [
        data.userId,
        message,
        JSON.stringify({
          item_id: data.itemId,
          old_price: data.oldPrice,
          new_price: data.newPrice,
          store: data.storeName,
          percent_drop: data.percentDrop,
        }),
      ]
    );

    if (!result) throw new Error('Failed to create notification');
    return result;
  },

  async getUserNotifications(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; nextCursor: string | null }> {
    let queryText = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params: unknown[] = [userId];

    if (cursor) {
      queryText += ` AND sent_at < $${params.length + 1}`;
      params.push(cursor);
    }

    queryText += ` ORDER BY sent_at DESC LIMIT $${params.length + 1}`;
    params.push(limit + 1);

    const notifications = await query<Notification>(queryText, params);

    let nextCursor: string | null = null;
    if (notifications.length > limit) {
      notifications.pop();
      nextCursor = notifications[notifications.length - 1]?.sent_at.toISOString() || null;
    }

    return { notifications, nextCursor };
  },

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await queryOne<Notification>(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    );
    return result !== null;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );
    return parseInt(result?.count || '0', 10);
  },
};

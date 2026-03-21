import { query, queryOne } from '../config/database.js';
import { Notification } from '../models/types.js';
import { sendPriceDropEmail, isEmailConfigured } from './email.service.js';

export interface PriceDropNotification {
  userId: string;
  itemId: string;
  itemName: string;
  storeName: string;
  oldPrice: number;
  newPrice: number;
  percentDrop: number;
}

export interface UserNotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  notify_on_drop_percentage: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export const notificationService = {
  async createPriceDropNotification(data: PriceDropNotification): Promise<Notification> {
    const message = `Price drop! ${data.itemName} is now $${data.newPrice.toFixed(2)} at ${data.storeName} (down ${data.percentDrop.toFixed(1)}% from $${data.oldPrice.toFixed(2)})`;

    // Store notification in database
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

    // Send email notification if enabled
    await this.sendEmailNotificationIfEnabled(data);

    return result;
  },

  /**
   * Send email notification if user has email notifications enabled
   */
  async sendEmailNotificationIfEnabled(data: PriceDropNotification): Promise<void> {
    if (!isEmailConfigured()) {
      console.log('[Notification] Email not configured, skipping');
      return;
    }

    // Get user's email and notification preferences
    const user = await queryOne<{
      email: string;
      name: string | null;
      notification_preferences: UserNotificationPreferences;
    }>(
      `SELECT email, name, notification_preferences FROM users WHERE id = $1`,
      [data.userId]
    );

    if (!user) {
      console.log('[Notification] User not found for email');
      return;
    }

    const prefs = user.notification_preferences;

    // Check if email notifications are enabled
    if (!prefs.email_enabled) {
      console.log('[Notification] User has email notifications disabled');
      return;
    }

    // Check if drop percentage meets threshold
    if (data.percentDrop < prefs.notify_on_drop_percentage) {
      console.log(`[Notification] Drop ${data.percentDrop}% below threshold ${prefs.notify_on_drop_percentage}%`);
      return;
    }

    // Check quiet hours
    if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
      const now = new Date();
      const currentHour = now.getHours();
      const startHour = parseInt(prefs.quiet_hours_start.split(':')[0], 10);
      const endHour = parseInt(prefs.quiet_hours_end.split(':')[0], 10);

      if (startHour <= endHour) {
        // Quiet hours within same day (e.g., 22:00 - 06:00)
        if (currentHour >= startHour || currentHour < endHour) {
          console.log('[Notification] Within quiet hours, skipping email');
          return;
        }
      } else {
        // Quiet hours span midnight (e.g., 22:00 - 06:00)
        if (currentHour >= startHour || currentHour < endHour) {
          console.log('[Notification] Within quiet hours, skipping email');
          return;
        }
      }
    }

    // Get item URL for CTA
    const itemUrl = await queryOne<{ url: string }>(
      `SELECT url FROM tracked_urls WHERE item_id = $1 AND store_name = $2 LIMIT 1`,
      [data.itemId, data.storeName]
    );

    // Send the email
    await sendPriceDropEmail({
      userEmail: user.email,
      userName: user.name || undefined,
      itemName: data.itemName,
      storeName: data.storeName,
      oldPrice: data.oldPrice,
      newPrice: data.newPrice,
      percentDrop: data.percentDrop,
      itemUrl: itemUrl?.url,
    });
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

  async markAllAsRead(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = $1 AND read_at IS NULL
      RETURNING COUNT(*) as count`,
      [userId]
    );
    return parseInt(result?.count || '0', 10);
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

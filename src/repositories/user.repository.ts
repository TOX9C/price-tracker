import { query, queryOne } from '../config/database.js';
import { User, NotificationPreferences } from '../models/types.js';

export const userRepository = {
  async create(
    email: string,
    passwordHash: string
  ): Promise<User> {
    const result = await queryOne<User>(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *`,
      [email, passwordHash]
    );
    if (!result) throw new Error('Failed to create user');
    return result;
  },

  async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
  },

  async findById(id: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
  },

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<User | null> {
    return queryOne<User>(
      `UPDATE users SET notification_preferences = notification_preferences || $1::jsonb WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [JSON.stringify(preferences), userId]
    );
  },

  async softDelete(userId: string): Promise<boolean> {
    const result = await queryOne<User>(
      `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [userId]
    );
    return result !== null;
  },
};

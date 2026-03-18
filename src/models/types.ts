export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  notification_preferences: NotificationPreferences;
  deleted_at: Date | null;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  notify_on_drop_percentage: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface Item {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface TrackedUrl {
  id: string;
  item_id: string;
  url: string;
  store_name: string | null;
  current_price: number | null;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  last_checked: Date | null;
  last_check_failed: boolean;
  extraction_method: string | null;
  created_at: Date;
}

export interface PriceHistory {
  id: string;
  tracked_url_id: string;
  price: number;
  currency: string;
  availability: string | null;
  checked_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  data: Record<string, unknown> | null;
  sent_at: Date;
  read_at: Date | null;
}

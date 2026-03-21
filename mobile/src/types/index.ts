export interface User {
  id: string
  email: string
  created_at: string
  notification_preferences: NotificationPreferences
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  notify_on_drop_percentage: number
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

export interface Item {
  id: string
  name: string
  image_url: string | null
  category: string | null
  best_price: number | null
  best_store: string | null
  url_count: number
  price_trend?: number
  last_checked?: string | null
}

export interface ItemDetail extends Item {
  urls: TrackedUrl[]
}

export interface TrackedUrl {
  id: string
  url: string
  store_name: string | null
  current_price: number | null
  currency: string
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown'
  last_checked: string | null
  extraction_method: string | null
}

export interface PriceHistory {
  id: string
  tracked_url_id: string
  price: number
  currency: string
  checked_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  data: Record<string, unknown> | null
  sent_at: string
  read_at: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  next_cursor: string | null
  has_more?: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

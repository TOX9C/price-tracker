-- src/db/migrations/001_initial_schema.sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    notification_preferences JSONB DEFAULT '{
        "email_enabled": true,
        "push_enabled": true,
        "notify_on_drop_percentage": 5,
        "quiet_hours_start": null,
        "quiet_hours_end": null
    }',
    deleted_at TIMESTAMP DEFAULT NULL
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL
);

-- Tracked URLs table
CREATE TABLE IF NOT EXISTS tracked_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    store_name VARCHAR(255),
    current_price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    availability VARCHAR(50) DEFAULT 'in_stock',
    last_checked TIMESTAMP,
    last_check_failed BOOLEAN DEFAULT FALSE,
    extraction_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_item_url UNIQUE (item_id, url)
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_url_id UUID REFERENCES tracked_urls(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    availability VARCHAR(50),
    checked_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tracked_urls_item ON tracked_urls(item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_url ON price_history(tracked_url_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

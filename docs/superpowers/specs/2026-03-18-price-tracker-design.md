# PriceHawk - Price Tracking App Design

**Date:** 2026-03-18
**Status:** Approved for Implementation

## Overview

PriceHawk is a price tracking application that monitors e-commerce prices and notifies users of price drops. Users add items they want to track, paste store URLs, and receive notifications when prices drop.

## Architecture

### Platform Support
- **Web App:** React + Vite, deployed to Vercel
- **Mobile Apps:** React Native CLI, shared business logic with web
- **Backend:** Node.js + Express, deployed to Railway/Render
- **Database:** PostgreSQL

### System Components

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Web App    │     │ Mobile App  │     │   Backend   │
│  (React)    │     │ (RN CLI)    │     │ (Express)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                                   │
                          ┌────────┴────────┐
                          │   PostgreSQL    │
                          │    Database     │
                          └─────────────────┘
```

### Background Processing
- Price checking runs hourly per item (staggered to avoid bursts)
- Uses node-cron for scheduling within the same backend process
- Email notifications via Resend or SendGrid
- Push notifications via Expo Push API

## Data Model

### Tables

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  notification_preferences JSONB DEFAULT '{}'
);

-- Items (user's tracked products)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tracked URLs (store links for each item)
CREATE TABLE tracked_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  store_name VARCHAR(255),
  current_price DECIMAL(10, 2),
  last_checked TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_url_id UUID REFERENCES tracked_urls(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  checked_at TIMESTAMP DEFAULT NOW()
);

-- Notifications sent to users
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_tracked_urls_item ON tracked_urls(item_id);
CREATE INDEX idx_price_history_url ON price_history(tracked_url_id, checked_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

### Relationships

- User has many items
- Item has many tracked_urls (different stores for same product)
- TrackedURL has many price_history entries
- User has many notifications

## Price Extraction

### Strategy: 3-Tier Fallback

1. **Structured Data (Primary)**
   - Extract from JSON-LD (schema.org Product markup)
   - Most major retailers include price in standardized format
   - Fast and reliable when present

2. **Site-Specific Selectors (Secondary)**
   - CSS selector lookup table per domain
   - Examples:
     - Amazon: `#priceblock_ourprice`, `.a-price-whole`
     - Best Buy: `.priceView-hero-price span`
     - Newegg: `.price-current`
   - Start with top 20 retailers, expand as needed

3. **Heuristic Fallback (Tertiary)**
   - Search for elements matching price patterns
   - Use heuristics: largest font price near title, lowest on page
   - Mark as low-confidence for manual review

### Implementation

- Use `cheerio` for HTML parsing
- Use Playwright for JavaScript-rendered pages or anti-bot measures
- Store extraction method alongside price for debugging
- Respect robots.txt, rate limit (1 req/10s per domain), rotate user agents

## API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Start session
- `POST /auth/logout` - End session

### Items
- `GET /items` - List user's tracked items with best prices
- `POST /items` - Add new item with URLs
- `GET /items/:id` - Item detail with all store prices and history
- `PUT /items/:id` - Update item name/category
- `DELETE /items/:id` - Remove item and tracked URLs

### Tracked URLs
- `POST /items/:id/urls` - Add another store to existing item
- `DELETE /items/:id/urls/:urlId` - Remove a store
- `POST /items/:id/check` - Manual price check (throttled)

### Notifications
- `GET /notifications` - List unread notifications
- `POST /notifications/:id/read` - Mark as read
- `PATCH /users/me/preferences` - Update notification settings

### Internal
- `POST /internal/check-prices` - Cron-triggered scheduled checks
- `GET /internal/health` - Health check endpoint

## Web UI

### Pages

1. **Landing Page**
   - Hero section with value proposition
   - Feature highlights
   - Pricing CTA
   - Login/signup links

2. **Dashboard**
   - Grid of tracked items as cards
   - Each card shows: image, name, best price, trend (up/down/flat), store, last checked
   - Add Item button
   - Notification bell with unread count

3. **Item Detail**
   - Prices from all tracked stores side-by-side
   - Historical price chart (30 days)
   - Add/remove store URLs
   - Notification threshold setting

4. **Settings**
   - Account management
   - Notification preferences
   - Billing (future)

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ PriceHawk [Dashboard] [Add Item] [Settings] [Bell(3)] [Avatar]       │
├──────────────────────────────────────────────────────────────────────┤
│ Your Items                                    [+ Add Item]            │
├──────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│ │ [Image]         │ │ [Image]         │ │ [Image]         │         │
│ │                 │ │                 │ │                 │         │
│ │ RTX 4090        │ │ iPhone 15 Pro   │ │ PlayStation 5   │         │
│ │                 │ │                 │ │                 │         │
│ │ $1,599 ↓12%     │ │ $999 →0%        │ │ $449 ↓8%        │         │
│ │ Best: Newegg    │ │ Best: Apple     │ │ Best: Walmart   │         │
│ │ Checked 2h ago  │ │ Checked 1h ago  │ │ Checked 3h ago  │         │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└──────────────────────────────────────────────────────────────────────┘
```

### Card Elements

- Item image (user-uploaded or scraped)
- Item name
- Current best price with trend indicator
- Store name with best price
- Last checked timestamp
- Visual hierarchy: Price is largest, trend badge colorful (green/red), store and timestamp muted

## Mobile UI

### Navigation
- Tab bar: Dashboard | Add | Settings
- No sidebar navigation

### Differences from Web
- Add flow optimized for mobile: camera/gallery image + paste URL
- Swipe left on item to delete
- Swipe right to manually check price
- Bottom sheet for item details

### Shared Code
- ~70% business logic shared via monorepo packages
- UI components differ (React vs React Native primitives)
- Shared design tokens (colors, spacing, typography)

## Add Item Flow

### Step 1: Paste URL
- Simple modal with URL input
- Continue button scrapes the URL
- Shows loading state during scrape

### Step 2: Confirm Details
- Auto-populated from scrape: image, name, price, store
- User can edit item name
- Category dropdown
- Optional notification threshold
- "Add Another URL" for multi-store tracking

### Step 3: Success
- Confirmation with current best price
- Options to add another or view dashboard

## Tech Stack

### Frontend
- **Web:** React 18, Vite, TypeScript
- **Mobile:** React Native CLI, TypeScript
- **State:** React Query for server state, Zustand for local state
- **Styling:** Tailwind CSS (web), StyleSheet (mobile)
- **Charts:** Recharts (web), Victory (mobile)

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** PostgreSQL with pg driver
- **Auth:** bcrypt for passwords, JWT for sessions
- **Scraping:** cheerio, Playwright
- **Scheduling:** node-cron
- **Email:** Resend or SendGrid
- **Push:** Expo Push API

### Deployment
- **Web:** Vercel
- **Backend + DB:** Railway or Render
- **Mobile:** Apple App Store, Google Play Store

## Future Considerations

- Proxy/rotating IP service for scaling scraping
- Browser extension for one-click tracking
- Price prediction using ML
- Browser extension for easier tracking
- Wishlist sharing
- Price alerts for specific thresholds
- Historical price comparisons across retailers

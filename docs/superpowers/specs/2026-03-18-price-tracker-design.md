# PriceHawk - Price Tracking App Design

**Date:** 2026-03-18
**Status:** Under Review

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

## Security

### Authentication Security
- **Password Hashing:** bcrypt with cost factor 12
- **Session Tokens:** JWT with 7-day expiration, signed with RS256
- **Rate Limiting:** Auth endpoints limited to 5 attempts per minute per IP
- **Token Refresh:** Refresh tokens with 30-day expiration, stored in httpOnly cookie

### API Security
- **Internal Endpoints:** Protected by API key passed in `X-Internal-Key` header
  - `/internal/check-prices` requires valid API key
  - API key stored in environment variable, rotated monthly
- **Rate Limiting:** General API: 100 requests/minute per user
- **CORS:** Whitelist only deployed domains (web app, mobile deep links)
- **Helmet.js:** Security headers (CSP, HSTS, X-Frame-Options)
- **HTTPS:** Enforced on all endpoints via Vercel/Railway TLS

### Input Validation
- **Library:** Zod for all request validation
- **Sanitization:** DOMPurify for any user-provided HTML content
- **SQL Injection:** Parameterized queries via pg driver (never string interpolation)
- **XSS Prevention:** React's default escaping + Content Security Policy

### Request Validation Schema Examples
```typescript
// POST /items validation
const CreateItemSchema = z.object({
  name: z.string().min(1).max(255),
  urls: z.array(z.string().url()).min(1).max(5),
  category: z.enum(['electronics', 'gaming', 'home', 'fashion', 'other']).optional(),
  notificationThreshold: z.number().positive().optional()
});
```

## Error Handling

### HTTP Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": { }
  }
}
```

### Error Codes
- `VALIDATION_ERROR` (400) - Invalid input
- `UNAUTHORIZED` (401) - Missing/invalid token
- `FORBIDDEN` (403) - Valid token, wrong permissions
- `NOT_FOUND` (404) - Resource doesn't exist
- `RATE_LIMITED` (429) - Too many requests
- `SCRAPING_FAILED` (502) - Could not extract price
- `INTERNAL_ERROR` (500) - Unexpected server error

### Scraping Error Handling
- **Retry Logic:** 3 retries with exponential backoff (1s, 5s, 15s)
- **Fallback:** If all retries fail, mark as `last_check_failed: true`
- **User Notification:** Dashboard shows "Unable to check" status with retry button
- **Graceful Degradation:** Show last known price with "(unavailable)" badge

### User-Facing Error States
- Network errors: "Unable to connect. Please check your connection."
- Scraping errors: "Could not fetch price from this store. Try again later."
- Duplicate URL: "You're already tracking this product."

## Data Model

### Tables

```sql
-- Users
CREATE TABLE users (
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

-- Items (user's tracked products)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL
);

-- Tracked URLs (store links for each item)
CREATE TABLE tracked_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  store_name VARCHAR(255),
  current_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  availability VARCHAR(50) DEFAULT 'in_stock', -- in_stock, out_of_stock, hidden_price, unknown
  last_checked TIMESTAMP,
  last_check_failed BOOLEAN DEFAULT FALSE,
  extraction_method VARCHAR(50), -- json_ld, selector, heuristic, manual
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_item_url UNIQUE (item_id, url)
);

-- Price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_url_id UUID REFERENCES tracked_urls(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  availability VARCHAR(50),
  checked_at TIMESTAMP DEFAULT NOW()
);

-- Notifications sent to users
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- price_drop, back_in_stock, threshold_reached
  message TEXT NOT NULL,
  data JSONB, -- { item_id, old_price, new_price, store }
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_items_user ON items(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tracked_urls_item ON tracked_urls(item_id);
CREATE INDEX idx_price_history_url ON price_history(tracked_url_id, checked_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
```

### Relationships

- User has many items
- Item has many tracked_urls (different stores for same product)
- TrackedURL has many price_history entries
- User has many notifications

### Soft Deletes
- `deleted_at` column on users and items
- Queries filter out deleted records by default
- Hard delete after 30 days via cleanup job

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

### Availability Handling
- **In Stock:** Normal price tracking
- **Out of Stock:** Mark availability, don't update price, notify user of restock
- **Hidden Price:** ("Add to cart to see price") Mark as `hidden_price`, skip notification
- **Unknown:** Extraction failed, show stale data with warning

### Currency Handling
- Primary: USD (normalize all prices to USD)
- Store original currency alongside normalized price
- Exchange rates fetched daily from open exchange rate API
- User can set preferred display currency (future)

### Implementation

- Use `cheerio` for HTML parsing
- Use Playwright for JavaScript-rendered pages or anti-bot measures
- Store extraction method alongside price for debugging
- Respect robots.txt, rate limit (1 req/10s per domain), rotate user agents

## API Endpoints

### API Versioning
- All endpoints prefixed with `/api/v1/`
- Version in URL for explicit versioning

### Pagination
- Cursor-based pagination for list endpoints
- Query params: `cursor` (item ID), `limit` (default 20, max 50)
- Response includes `next_cursor` and `has_more`

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Start session
- `POST /api/v1/auth/logout` - End session
- `POST /api/v1/auth/refresh` - Refresh tokens

### Items
- `GET /api/v1/items?cursor=&limit=20` - List user's tracked items
- `POST /api/v1/items` - Add new item with URLs
- `GET /api/v1/items/:id` - Item detail with prices and history
- `PUT /api/v1/items/:id` - Update item name/category
- `DELETE /api/v1/items/:id` - Soft delete item

### Tracked URLs
- `POST /api/v1/items/:id/urls` - Add another store
- `DELETE /api/v1/items/:id/urls/:urlId` - Remove a store
- `POST /api/v1/items/:id/check` - Manual price check (throttled to 1/hour)

### Notifications
- `GET /api/v1/notifications?cursor=&limit=20` - List notifications
- `POST /api/v1/notifications/:id/read` - Mark as read
- `PATCH /api/v1/users/me/preferences` - Update notification settings

### Internal (API Key Required)
- `POST /api/v1/internal/check-prices` - Trigger scheduled checks
- `GET /api/v1/internal/health` - Health check (public)
- `GET /api/v1/internal/metrics` - Prometheus metrics (internal)

### Rate Limits
| Endpoint | Limit |
|----------|-------|
| POST /auth/* | 5/minute/IP |
| GET /items | 60/minute/user |
| POST /items | 10/minute/user |
| POST /items/:id/check | 1/hour/item |

## Web UI

### Pages

1. **Landing Page**
   - Hero section with value proposition
   - Feature highlights
   - Pricing CTA
   - Login/signup links

2. **Dashboard**
   - Grid of tracked items as cards
   - Each card shows: image, name, best price, trend, store, last checked
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

### Empty State
```
┌──────────────────────────────────────────────────────────────────────┐
│ Your Items                                                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                     [Illustration of price tag]                      │
│                                                                      │
│                     Start tracking prices                            │
│                                                                      │
│      Add your first item to get notified when prices drop.           │
│                                                                      │
│                        [+ Add Your First Item]                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Loading States
- Dashboard: Skeleton cards with pulsing animation
- Item detail: Skeleton chart, placeholder price boxes
- Add flow: Spinner with "Checking price..." text

### Error States
- Failed scrape: Card shows last price with "(check failed)" badge, retry button
- Network error: Toast notification "Connection lost. Retrying..."
- Validation error: Inline field errors with red border

### Responsive Design
- Breakpoints: 640px (mobile), 1024px (tablet), 1280px (desktop)
- Mobile: Single column, bottom nav instead of top nav
- Tablet: 2-column grid
- Desktop: 3-4 column grid

## Mobile UI

### Navigation
- Tab bar: Dashboard | Add | Settings
- No sidebar navigation

### Mobile Dashboard

```
┌────────────────────────────┐
│ PriceHawk        [Bell(3)] │
├────────────────────────────┤
│ Your Items        [+]      │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ [Img] RTX 4090         │ │
│ │       $1,599 ↓12%      │ │
│ │       Best: Newegg     │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ [Img] iPhone 15 Pro    │ │
│ │       $999 →0%         │ │
│ │       Best: Apple      │ │
│ └────────────────────────┘ │
│                            │
│  [Dashboard] [Add] [Setup] │
└────────────────────────────┘
```

### Mobile Add Flow
- **Step 1:** Full-screen with large URL input, camera icon for barcode scan
- **Step 2:** Bottom sheet with scraped details, swipe down to cancel
- **Step 3:** Success animation, auto-dismiss after 2s

### Offline Handling
- **Cache:** Last-seen data stored locally (AsyncStorage)
- **Offline Indicator:** Banner shows "Offline - showing cached data"
- **Queue Actions:** Add/remove items queued, synced on reconnect
- **Pull to Refresh:** Triggers sync when online, shows "Offline" snackbar when not

### Differences from Web
- Camera/gallery image + paste URL
- Swipe left on item to delete (with confirmation)
- Swipe right to manually check price
- Bottom sheet for item details
- Haptic feedback on notifications

### Shared Code
- ~70% business logic shared via monorepo packages
- UI components differ (React vs React Native primitives)
- Shared design tokens (colors, spacing, typography)

## Add Item Flow

### Step 1: Paste URL
- Simple modal with URL input
- URL validation (valid format, reachable, supported protocol)
- Continue button scrapes the URL
- Shows loading state during scrape

### URL Validation
- Must be valid URL format (protocol required)
- Must be reachable (HEAD request to verify)
- If unsupported store: "This store isn't fully supported. Price may not be accurate. Continue?"

### Duplicate Detection
- Check if URL already exists for this user
- If found: "You're already tracking this product." with link to existing item

### Step 2: Confirm Details
- Auto-populated from scrape: image, name, price, store
- User can edit item name
- Category dropdown
- Optional notification threshold
- "Add Another URL" for multi-store tracking
- Show availability status if out of stock

### Step 3: Success
- Confirmation with current best price
- Options to add another or view dashboard
- If price significantly different from expected: warning badge

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
- **Validation:** Zod
- **Logging:** Pino

### Deployment
- **Web:** Vercel
- **Backend + DB:** Railway or Render
- **Mobile:** Apple App Store, Google Play Store

## Observability

### Logging
- **Library:** Pino with structured JSON logs
- **Levels:** error, warn, info, debug
- **Fields:** timestamp, requestId, userId, endpoint, duration, statusCode
- **Format:** JSON in production, pretty-print in development

### Error Tracking
- **Integration:** Sentry
- **Capture:** Unhandled exceptions, failed scrapes, API errors
- **Context:** User ID, item ID, URL being scraped

### Metrics
- **Scraping:** Success rate, latency per domain, retry count
- **API:** Request rate, error rate, latency percentile (p50, p95, p99)
- **Business:** Active users, items tracked, notifications sent

### Alerting
- Scraping success rate < 80%: Warning
- Scraping success rate < 50%: Critical
- API error rate > 5%: Warning
- API latency p95 > 2s: Warning

## Testing

### Backend
- **Unit:** Jest with supertest for API testing
- **Mocking:** Mock cheerio responses for predictable scraping tests
- **Coverage:** >80% coverage on business logic

### Frontend (Web)
- **Unit:** Vitest + React Testing Library
- **E2E:** Playwright for critical user flows
- **Coverage:** Component tests for all shared components

### Frontend (Mobile)
- **Unit:** Jest + React Native Testing Library
- **E2E:** Detox for iOS/Android flows

### Integration Tests
- Docker Compose for local PostgreSQL
- Test against real DB for auth and item flows
- Scraping tests use recorded HTML fixtures

## Future Considerations

- Proxy/rotating IP service for scaling scraping
- Browser extension for one-click tracking
- Price prediction using ML
- Wishlist sharing
- Price alerts for specific thresholds
- Historical price comparisons across retailers

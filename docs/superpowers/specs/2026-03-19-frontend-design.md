# PriceHawk Frontend Design Spec

**Date:** 2026-03-19
**Status:** Approved

## Overview

React web application for PriceHawk - a price tracking platform. Includes marketing landing page and full authenticated app experience. Built with Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn components (button, card, input, etc.)
│   │   ├── layout/       # header, footer, sidebar, mobile-nav
│   │   └── shared/       # price-card, item-card, notification-bell
│   ├── pages/
│   │   ├── landing/      # marketing page with hero, features, pricing
│   │   ├── auth/         # login, register, forgot-password
│   │   ├── dashboard/    # main app dashboard
│   │   ├── item/         # item detail with price chart
│   │   ├── add-item/     # multi-step add flow
│   │   └── settings/     # account + notification preferences
│   ├── hooks/            # custom hooks (useAuth, useItems, usePriceHistory)
│   ├── lib/              # api client, utils, cn helper
│   ├── stores/           # zustand stores (ui store, auth store)
│   └── types/            # shared TypeScript types
├── public/               # static assets
└── index.html
```

The backend remains in existing `src/` directory. Frontend lives in `web/` folder at project root.

## Marketing / Landing Page

### Hero Section
- **Headline:** "Never miss a price drop"
- **Subheadline:** "Track prices across Amazon, Best Buy, Newegg, and more. Get notified instantly when prices drop."
- **Primary CTA:** "Start Tracking Free" → redirects to register
- **Secondary CTA:** "See How It Works" → scroll to features or modal demo
- **Visual:** Animated mockup of dashboard with price notifications appearing

### Features Grid
Four feature cards with icons and short descriptions:
1. **Multi-Store Tracking** - Compare prices across retailers for the same product
2. **Instant Notifications** - Email and push alerts when prices drop
3. **Price History Charts** - Visual 30-day price trends
4. **Smart Detection** - Auto-detect product details from pasted URL

### Pricing Section
- **Free tier:** 10 items tracked, email notifications
- **Pro tier:** Unlimited items, push notifications, custom price alerts
- **Enterprise:** Contact for custom needs

### Footer
- Links: About, Privacy Policy, Terms of Service, Support
- Social: Twitter, GitHub
- Copyright notice

## Authenticated App

### Header
- Logo "PriceHawk" → links to dashboard
- Navigation: Dashboard | Items | Settings
- Right side: Notification bell with unread badge + Avatar dropdown
- Mobile: Hamburger menu with slide-out drawer

### Dashboard Page
- **Item Grid:** Responsive layout
  - Desktop: 3 columns
  - Tablet: 2 columns
  - Mobile: 1 column
- **Item Card Components:**
  - Product thumbnail image
  - Item name (truncated if long)
  - Best price with trend arrow (↓ green / → gray / ↑ red)
  - Store name with best price
  - "Checked X ago" timestamp
- **Actions:**
  - "Add Item" floating action button (bottom-right on mobile)
  - Search/filter bar above grid (filter by category, sort by price/date)
- **Empty State:** Illustration with "Add your first item" CTA

### Item Detail Page
- **Header Section:** Full-bleed with product image, name, category badge
- **Price History Chart:**
  - 30-day default view
  - Zoom/pan capability
  - Hover tooltip with date and exact price
  - Markers for significant drops
- **Store Comparison Table:**
  - Store name, current price, availability, last checked
  - "Add another store" button
- **Settings Section:**
  - Notification threshold (notify when drops by X%)
  - Delete item action (with confirmation)

### Add Item Flow
**Step 1: Paste URL**
- Modal with large URL input
- URL validation (format, reachable)
- "Continue" button triggers scrape
- Loading state: "Checking price..."

**Step 2: Review Details**
- Show scraped data: image, name, current price, store
- Editable item name field
- Category dropdown
- Optional: notification threshold
- "Add Another URL" option for multi-store tracking
- Out of stock warning if applicable

**Step 3: Success**
- Confirmation message with current best price
- Price mismatch warning if significantly different from expected
- Actions: "Add another item" or "View dashboard"

### Settings Page
- **Account:** Email, change password, delete account
- **Notifications:** Email toggle, push toggle, quiet hours
- **Preferences:** Default currency (future), theme (light/dark/system)

## Visual Design

### Color Palette
- **Primary:** Teal-600 (#0D9488)
- **Accent:** Amber-500 (#F59E0B) - for price drops, CTAs
- **Background:** Slate-50 (light mode) / Slate-900 (dark mode)
- **Cards:** White with Slate-200 border, subtle shadow on hover
- **Text:** Slate-900 (light) / Slate-100 (dark)

### Typography
- **Headlines:** Outfit font family - geometric, modern, distinctive
- **Body:** Plus Jakarta Sans - readable, slightly wider letter-spacing
- **Prices:** Tabular nums, semibold, 1.25x body size

### Interactions & Animations
- **Price Drop:** Green pulse animation on card, trend arrow bounces
- **Loading:** Skeleton cards with shimmer animation
- **Success:** Brief confetti burst on item added
- **Hover:** Cards lift 2px, price text highlights
- **Transitions:** 150ms ease for micro-interactions, 300ms for page transitions

### Dark Mode
- Full support via Tailwind `dark:` variants
- Preference persisted in localStorage
- System preference detection as default
- Smooth transition when toggling

## Data Flow & State Management

### Authentication
- Backend returns JWT, stored in httpOnly cookie (secure, httpOnly, sameSite: strict)
- Frontend fetches user data via `/api/v1/auth/me` on app load
- React Query manages auth state with automatic retry on 401
- Protected routes redirect to login if unauthenticated

### Items & Dashboard
- `useItems()` hook using React Query's `useInfiniteQuery`
- Cursor-based pagination, infinite scroll trigger at 80% viewport height
- Cache invalidation triggered on add/delete operations
- Background refetch every 5 minutes when tab visible

### Price Checking
- Scheduled checks run hourly on backend via node-cron
- Dashboard displays relative time "Last checked: X ago"
- Manual check button with throttling (1 check per hour per item, API enforced)
- Optimistic UI update during check, reverts on error

### Notifications
- Poll `/api/v1/notifications` every 60 seconds when tab is visible
- Unread count displayed in header bell icon
- Dropdown shows 5 most recent, click-through to full list
- Future: WebSocket for real-time push

### Error Handling
- Global error boundary catches React rendering errors, shows fallback UI
- API errors trigger toast notifications via `sonner` library
- Network failures show persistent offline banner with auto-retry
- Form validation errors shown inline below fields

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Build | Vite |
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui (Radix primitives) |
| State (Server) | @tanstack/react-query |
| State (Client) | zustand |
| Charts | Recharts |
| Forms | react-hook-form + zod |
| Notifications | sonner |
| Router | react-router-dom v7 |
| HTTP | ky (lightweight fetch wrapper) |

## API Integration

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/register` | POST | Create account |
| `/api/v1/auth/login` | POST | Start session |
| `/api/v1/auth/logout` | POST | End session |
| `/api/v1/auth/me` | GET | Get current user |
| `/api/v1/items` | GET | List user's items (paginated) |
| `/api/v1/items` | POST | Add new item |
| `/api/v1/items/:id` | GET | Item detail |
| `/api/v1/items/:id` | DELETE | Remove item |
| `/api/v1/items/:id/urls` | POST | Add store URL |
| `/api/v1/items/:id/urls/:urlId` | DELETE | Remove store URL |
| `/api/v1/items/:id/check` | POST | Manual price check |
| `/api/v1/notifications` | GET | List notifications |
| `/api/v1/notifications/:id/read` | POST | Mark as read |

### Request/Response Handling
- All requests include credentials (cookies) via `ky` config
- Base URL from environment variable (`VITE_API_URL`)
- 401 responses trigger logout and redirect to login
- 429 responses show rate limit message with retry countdown

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| sm | 640px | Mobile (single column) |
| md | 768px | Tablet (2 columns) |
| lg | 1024px | Desktop (3 columns) |
| xl | 1280px | Large desktop (4 columns) |

## Accessibility

- All interactive elements keyboard navigable
- Focus indicators visible on all focusable elements
- ARIA labels on icons and interactive elements
- Color contrast meets WCAG 2.1 AA
- Screen reader announcements for dynamic content (price drops, errors)

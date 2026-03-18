# Price Extraction Engine Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the price extraction system with 3-tier fallback scraping, background scheduler, and price check API endpoints.

**Architecture:** Scraper service with modular extractors (JSON-LD, selectors, heuristics). Background scheduler runs hourly checks per item using node-cron. Results stored in price_history table with notifications triggered on price drops.

**Tech Stack:** cheerio for HTML parsing, node-cron for scheduling, user-agents for rotation.

---

## File Structure

```
src/
├── scrapers/
│   ├── index.ts              # Main scraper orchestrator
│   ├── fetch.ts              # HTTP fetching with retry/user-agent rotation
│   ├── extractors/
│   │   ├── json-ld.ts        # JSON-LD (schema.org) extractor
│   │   ├── selectors.ts      # Site-specific CSS selectors
│   │   └── heuristic.ts      # Heuristic price finder
│   └── sites/
│       ├── amazon.ts         # Amazon-specific handling
│       ├── bestbuy.ts        # Best Buy-specific handling
│       └── newegg.ts         # Newegg-specific handling
├── services/
│   ├── price-check.service.ts    # Orchestrates scraping + updates
│   └── notification.service.ts   # Creates price drop notifications
├── repositories/
│   └── price.repository.ts       # Price history CRUD
├── jobs/
│   └── scheduler.ts          # node-cron job definitions
└── controllers/
    └── internal.controller.ts    # /internal/check-prices endpoint
```

---

## Task 1: Install Scraper Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install cheerio and node-cron**
```bash
npm install cheerio node-cron user-agents
npm install -D @types/node-cron
```

- [ ] **Step 2: Verify installation**
```bash
npm ls cheerio node-cron
```
Expected: Both packages listed

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add scraper dependencies (cheerio, node-cron, user-agents)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Create HTTP Fetcher with Retry

**Files:**
- Create: `src/scrapers/fetch.ts`

- [ ] **Step 1: Create scrapers directory**
```bash
mkdir -p src/scrapers/extractors src/scrapers/sites
```

- [ ] **Step 2: Write fetch module**
```typescript
// src/scrapers/fetch.ts
import UserAgent from 'user-agents';

export interface FetchResult {
  html: string;
  statusCode: number;
  headers: Record<string, string>;
}

export interface FetchOptions {
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 3;

export async function fetchUrl(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = options.retries ?? DEFAULT_RETRIES;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const userAgent = new UserAgent();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent.toString(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return { html, statusCode: response.status, headers };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Fetch failed');
}
```

- [ ] **Step 3: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 4: Commit**
```bash
git add src/scrapers/fetch.ts
git commit -m "feat: add HTTP fetcher with retry and user-agent rotation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create JSON-LD Extractor

**Files:**
- Create: `src/scrapers/extractors/json-ld.ts`

- [ ] **Step 1: Write JSON-LD extractor**
```typescript
// src/scrapers/extractors/json-ld.ts
import * as cheerio from 'cheerio';
import { z } from 'zod';

export interface ExtractedPrice {
  price: number | null;
  currency: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  name?: string;
  image?: string;
  confidence: 'high' | 'medium' | 'low';
}

const ProductSchema = z.object({
  '@type': z.union([z.literal('Product'), z.literal('product')]).optional(),
  offers: z.union([
    z.object({
      '@type': z.literal('Offer').optional(),
      price: z.union([z.number(), z.string()]).optional(),
      priceCurrency: z.string().optional(),
      availability: z.string().optional(),
    }),
    z.array(z.object({
      '@type': z.literal('Offer').optional(),
      price: z.union([z.number(), z.string()]).optional(),
      priceCurrency: z.string().optional(),
      availability: z.string().optional(),
    })),
  ]).optional(),
  name: z.string().optional(),
  image: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough();

export function extractJsonLd(html: string): ExtractedPrice | null {
  const $ = cheerio.load(html);
  const jsonLdScripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const scriptContent = $(jsonLdScripts[i]).html();
      if (!scriptContent) continue;

      let data = JSON.parse(scriptContent);

      // Handle @graph format
      if (data['@graph']) {
        data = data['@graph'].find((item: unknown) => {
          const parsed = ProductSchema.safeParse(item);
          return parsed.success && parsed.data.offers;
        }) || data;
      }

      const parsed = ProductSchema.safeParse(data);
      if (!parsed.success) continue;

      const product = parsed.data;
      if (!product.offers) continue;

      // Handle single offer or array of offers
      const offers = Array.isArray(product.offers)
        ? product.offers[0]
        : product.offers;

      if (!offers.price) continue;

      const price = typeof offers.price === 'string'
        ? parseFloat(offers.price.replace(/[^0-9.]/g, ''))
        : offers.price;

      if (isNaN(price)) continue;

      const availability = parseAvailability(offers.availability);

      return {
        price,
        currency: offers.priceCurrency || null,
        availability,
        name: product.name,
        image: Array.isArray(product.image) ? product.image[0] : product.image,
        confidence: 'high',
      };
    } catch {
      continue;
    }
  }

  return null;
}

function parseAvailability(availability: string | undefined): 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown' {
  if (!availability) return 'unknown';

  const normalized = availability.toLowerCase();

  if (normalized.includes('instock') || normalized.includes('in_stock')) {
    return 'in_stock';
  }
  if (normalized.includes('outofstock') || normalized.includes('out_of_stock')) {
    return 'out_of_stock';
  }
  if (normalized.includes('soldout') || normalized.includes('discontinued')) {
    return 'out_of_stock';
  }

  return 'unknown';
}
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/scrapers/extractors/json-ld.ts
git commit -m "feat: add JSON-LD price extractor

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create Site-Specific Selectors

**Files:**
- Create: `src/scrapers/extractors/selectors.ts`
- Create: `src/scrapers/sites/amazon.ts`
- Create: `src/scrapers/sites/bestbuy.ts`
- Create: `src/scrapers/sites/newegg.ts`

- [ ] **Step 1: Write selector registry**
```typescript
// src/scrapers/extractors/selectors.ts
import * as cheerio from 'cheerio';

export interface SiteSelector {
  priceSelectors: string[];
  availabilitySelectors?: string[];
  nameSelector?: string;
  imageSelector?: string;
}

export interface SelectorResult {
  price: number | null;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

// Site-specific selectors registry
const siteSelectors: Record<string, SiteSelector> = {
  'amazon.com': {
    priceSelectors: [
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '.a-price .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    ],
    availabilitySelectors: ['#availability span'],
    nameSelector: '#productTitle',
    imageSelector: '#landingImage',
  },
  'bestbuy.com': {
    priceSelectors: [
      '.priceView-hero-price span[aria-hidden="true"]',
      '.priceView-customer-price span[aria-hidden="true"]',
      '.pricing-price__value-sleek',
    ],
    availabilitySelectors: ['.fulfillment-add-to-cart-button'],
    nameSelector: 'h1[data-testid="product-title"]',
    imageSelector: '.primary-image',
  },
  'newegg.com': {
    priceSelectors: [
      '.price-current',
      '.price-current-price',
      '.price_current',
    ],
    availabilitySelectors: ['.product-inventory'],
    nameSelector: 'h1.product-title',
    imageSelector: '.product-view-img-original',
  },
  'walmart.com': {
    priceSelectors: [
      '[data-testid="price-wrap"] [itemprop="price"]',
      '.price-characteristic',
    ],
    availabilitySelectors: ['[data-testid="out-of-stock"]'],
    nameSelector: 'h1[data-testid="main-title"]',
    imageSelector: '[data-testid="hero-image"] img',
  },
  'target.com': {
    priceSelectors: [
      '[data-test="product-price"]',
      '.price-current',
    ],
    nameSelector: 'h1[data-test="product-title"]',
  },
  'ebay.com': {
    priceSelectors: [
      '.x-price-primary .ux-textspans',
      '#notExceededBidPrice',
      '.display-price',
    ],
    nameSelector: '.x-item-title-text',
  },
  'bhphotovideo.com': {
    priceSelectors: [
      '.price_Cc',
      '[data-selenium="product-price"]',
    ],
    nameSelector: 'h1[data-selenium="product-title"]',
  },
};

function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
}

export function extractWithSelectors(html: string, url: string): SelectorResult | null {
  const domain = getDomain(url);
  if (!domain) return null;

  const selector = findSelector(domain);
  if (!selector) return null;

  const $ = cheerio.load(html);

  // Try each price selector
  for (const priceSelector of selector.priceSelectors) {
    const priceEl = $(priceSelector).first();
    if (priceEl.length) {
      const priceText = priceEl.text().trim();
      const price = parsePrice(priceText);

      if (price !== null) {
        const availability = checkAvailability($, selector);
        return {
          price,
          availability,
          confidence: 'medium',
        };
      }
    }
  }

  return null;
}

function findSelector(domain: string): SiteSelector | null {
  // Direct match
  if (siteSelectors[domain]) {
    return siteSelectors[domain];
  }

  // Partial match (for subdomains or regional variants)
  for (const [key, value] of Object.entries(siteSelectors)) {
    if (domain.includes(key) || key.includes(domain)) {
      return value;
    }
  }

  return null;
}

function parsePrice(text: string): number | null {
  // Remove currency symbols and extract number
  const cleaned = text.replace(/[^0-9.,]/g, '');

  // Handle European format (1.234,56) vs US format (1,234.56)
  const hasCommaDecimal = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.');

  let normalized: string;
  if (hasCommaDecimal) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }

  const price = parseFloat(normalized);
  return isNaN(price) ? null : price;
}

function checkAvailability($: cheerio.CheerioAPI, selector: SiteSelector): 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown' {
  if (!selector.availabilitySelectors?.length) {
    return 'unknown';
  }

  for (const availSelector of selector.availabilitySelectors) {
    const el = $(availSelector).first();
    if (!el.length) continue;

    const text = el.text().toLowerCase();

    if (text.includes('out of stock') || text.includes('sold out') || text.includes('unavailable')) {
      return 'out_of_stock';
    }
    if (text.includes('add to cart') || text.includes('in stock') || text.includes('buy')) {
      return 'in_stock';
    }
  }

  return 'unknown';
}

export function hasSelectors(domain: string): boolean {
  return !!findSelector(domain);
}
```

- [ ] **Step 2: Commit**
```bash
git add src/scrapers/extractors/selectors.ts
git commit -m "feat: add site-specific price selectors for major retailers

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Create Heuristic Extractor

**Files:**
- Create: `src/scrapers/extractors/heuristic.ts`

- [ ] **Step 1: Write heuristic extractor**
```typescript
// src/scrapers/extractors/heuristic.ts
import * as cheerio from 'cheerio';

export interface HeuristicResult {
  price: number | null;
  confidence: 'low';
}

const PRICE_PATTERN = /\$[\d,]+\.?\d*|[\d,]+\.?\d*\s*(?:USD|dollars)/gi;
const MIN_REASONABLE_PRICE = 0.01;
const MAX_REASONABLE_PRICE = 100000;

export function extractHeuristic(html: string): HeuristicResult | null {
  const $ = cheerio.load(html);

  // Find all text nodes that might contain prices
  const priceCandidates: { price: number; element: cheerio.Element; weight: number }[] = [];

  $('*').each((_, element) => {
    const el = $(element);
    const text = el.text().trim();

    // Skip if element has many children (likely a container)
    if (el.children().length > 3) return;

    // Skip navigation, header, footer
    const tagName = el.prop('tagName')?.toLowerCase();
    if (['nav', 'header', 'footer', 'script', 'style', 'meta'].includes(tagName || '')) {
      return;
    }

    const prices = findPricesInText(text);
    if (prices.length === 0) return;

    for (const price of prices) {
      if (price < MIN_REASONABLE_PRICE || price > MAX_REASONABLE_PRICE) continue;

      const weight = calculateWeight($, el, price);
      priceCandidates.push({ price, element, weight });
    }

			return;
  });

  if (priceCandidates.length === 0) return null;

  // Sort by weight, return highest weighted price
  priceCandidates.sort((a, b) => b.weight - a.weight);

  return {
    price: priceCandidates[0].price,
    confidence: 'low',
  };
}

function findPricesInText(text: string): number[] {
  const matches = text.match(PRICE_PATTERN) || [];
  const prices: number[] = [];

  for (const match of matches) {
    const cleaned = match.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleaned);
    if (!isNaN(price) && price > 0) {
      prices.push(price);
    }
  }

  return prices;
}

function calculateWeight($: cheerio.CheerioAPI, el: cheerio.Cheerio, price: number): number {
  let weight = 0;

  // Prefer elements with price-related classes
  const className = el.attr('class') || '';
  if (/price|cost|amount|value/i.test(className)) {
    weight += 50;
  }

  // Prefer larger fonts (likely more important)
  const style = el.attr('style') || '';
  const fontSizeMatch = style.match(/font-size:\s*(\d+)/i);
  if (fontSizeMatch) {
    const fontSize = parseInt(fontSizeMatch[1], 10);
    weight += Math.min(fontSize, 30);
  }

  // Prefer elements near "price" text
  const parent = el.parent();
  if (parent.length && /price/i.test(parent.text())) {
    weight += 30;
  }

  // Prefer reasonable price ranges (not too high, not too low)
  if (price >= 1 && price <= 5000) {
    weight += 20;
  }

  // Prefer elements with aria-label containing price
  const ariaLabel = el.attr('aria-label') || '';
  if (/price|\$\d/i.test(ariaLabel)) {
    weight += 40;
  }

  return weight;
}
```

- [ ] **Step 2: Commit**
```bash
git add src/scrapers/extractors/heuristic.ts
git commit -m "feat: add heuristic price extractor

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Create Scraper Orchestrator

**Files:**
- Create: `src/scrapers/index.ts`

- [ ] **Step 1: Write main scraper**
```typescript
// src/scrapers/index.ts
import { fetchUrl } from './fetch.js';
import { extractJsonLd } from './extractors/json-ld.js';
import { extractWithSelectors, hasSelectors } from './extractors/selectors.js';
import { extractHeuristic } from './extractors/heuristic.js';

export interface ScrapeResult {
  price: number | null;
  currency: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  name?: string;
  image?: string;
  extractionMethod: 'json_ld' | 'selector' | 'heuristic' | 'failed';
  confidence: 'high' | 'medium' | 'low';
}

export interface ScraperOptions {
  timeout?: number;
}

const USER_AGENT_BLACKLIST = [
  'cloudflare',
  'akamai',
];

export async function scrapeUrl(
  url: string,
  options: ScraperOptions = {}
): Promise<ScrapeResult> {
  // 1. Try to fetch the page
  let html: string;
  try {
    const result = await fetchUrl(url, { timeout: options.timeout ?? 15000 });
    html = result.html;
  } catch (error) {
    return {
      price: null,
      currency: null,
      availability: 'unknown',
      extractionMethod: 'failed',
      confidence: 'low',
    };
  }

  // 2. Try JSON-LD (most reliable)
  const jsonLdResult = extractJsonLd(html);
  if (jsonLdResult && jsonLdResult.price !== null) {
    return {
      price: jsonLdResult.price,
      currency: jsonLdResult.currency,
      availability: jsonLdResult.availability,
      name: jsonLdResult.name,
      image: jsonLdResult.image,
      extractionMethod: 'json_ld',
      confidence: jsonLdResult.confidence,
    };
  }

  // 3. Try site-specific selectors
  if (hasSelectors(new URL(url).hostname.replace('www.', ''))) {
    const selectorResult = extractWithSelectors(html, url);
    if (selectorResult && selectorResult.price !== null) {
      return {
        price: selectorResult.price,
        currency: null,
        availability: selectorResult.availability,
        extractionMethod: 'selector',
        confidence: selectorResult.confidence,
      };
    }
  }

  // 4. Try heuristic fallback
  const heuristicResult = extractHeuristic(html);
  if (heuristicResult && heuristicResult.price !== null) {
    return {
      price: heuristicResult.price,
      currency: null,
      availability: 'unknown',
      extractionMethod: 'heuristic',
      confidence: 'low',
    };
  }

  // 5. All methods failed
  return {
    price: null,
    currency: null,
    availability: 'unknown',
    extractionMethod: 'failed',
    confidence: 'low',
  };
}

export { fetchUrl };
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/scrapers/index.ts
git commit -m "feat: add scraper orchestrator with 3-tier fallback

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Create Price Repository

**Files:**
- Create: `src/repositories/price.repository.ts`

- [ ] **Step 1: Write price repository**
```typescript
// src/repositories/price.repository.ts
import { query, queryOne } from '../config/database.js';
import { TrackedUrl, PriceHistory } from '../models/types.js';

export interface UrlToCheck {
  id: string;
  url: string;
  item_id: string;
  store_name: string | null;
  current_price: number | null;
}

export interface PriceUpdate {
  trackedUrlId: string;
  price: number;
  currency: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  extractionMethod: string;
  checkFailed: boolean;
}

export const priceRepository = {
  async getUrlsForCheck(limit: number = 100): Promise<UrlToCheck[]> {
    return query<UrlToCheck>(
      `SELECT id, url, item_id, store_name, current_price
       FROM tracked_urls
       WHERE last_checked IS NULL
         OR last_checked < NOW() - INTERVAL '1 hour'
       ORDER BY last_checked ASC NULLS FIRST
       LIMIT $1`,
      [limit]
    );
  },

  async updatePrice(update: PriceUpdate): Promise<void> {
    await queryOne<TrackedUrl>(
      `UPDATE tracked_urls
       SET current_price = $1,
           availability = $2,
           last_checked = NOW(),
           last_check_failed = $3,
           extraction_method = $4
       WHERE id = $5`,
      [update.price, update.availability, update.checkFailed, update.extractionMethod, update.trackedUrlId]
    );
  },

  async addPriceHistory(
    trackedUrlId: string,
    price: number,
    currency: string | null,
    availability: string
  ): Promise<PriceHistory> {
    const result = await queryOne<PriceHistory>(
      `INSERT INTO price_history (tracked_url_id, price, currency, availability)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [trackedUrlId, price, currency || 'USD', availability]
    );
    if (!result) throw new Error('Failed to add price history');
    return result;
  },

  async getLatestPrice(trackedUrlId: string): Promise<PriceHistory | null> {
    return queryOne<PriceHistory>(
      `SELECT * FROM price_history
       WHERE tracked_url_id = $1
       ORDER BY checked_at DESC
       LIMIT 1`,
      [trackedUrlId]
    );
  },

  async getPriceHistory(trackedUrlId: string, days: number = 30): Promise<PriceHistory[]> {
    return query<PriceHistory>(
      `SELECT * FROM price_history
       WHERE tracked_url_id = $1
         AND checked_at > NOW() - INTERVAL '1 day' * $2
       ORDER BY checked_at ASC`,
      [trackedUrlId, days]
    );
  },

  async detectPriceDrop(trackedUrlId: string, newPrice: number): Promise<{ dropped: boolean; oldPrice: number | null }> {
    const result = await queryOne<{ old_price: number | null }>(
      `SELECT current_price as old_price
       FROM tracked_urls
       WHERE id = $1 AND current_price IS NOT NULL`,
      [trackedUrlId]
    );

    if (!result || result.old_price === null) {
      return { dropped: false, oldPrice: null };
    }

    return {
      dropped: newPrice < result.old_price,
      oldPrice: result.old_price,
    };
  },
};
```

- [ ] **Step 2: Commit**
```bash
git add src/repositories/price.repository.ts
git commit -m "feat: add price repository for tracking and history

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Create Notification Service

**Files:**
- Create: `src/services/notification.service.ts`

- [ ] **Step 1: Write notification service**
```typescript
// src/services/notification.service.ts
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
```

- [ ] **Step 2: Commit**
```bash
git add src/services/notification.service.ts
git commit -m "feat: add notification service for price drop alerts

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Create Price Check Service

**Files:**
- Create: `src/services/price-check.service.ts`

- [ ] **Step 1: Write price check service**
```typescript
// src/services/price-check.service.ts
import { scrapeUrl, ScrapeResult } from '../scrapers/index.js';
import { priceRepository } from '../repositories/price.repository.js';
import { notificationService } from './notification.service.js';
import { query, queryOne } from '../config/database.js';

export interface CheckResult {
  trackedUrlId: string;
  success: boolean;
  price: number | null;
  previousPrice: number | null;
  priceDrop: boolean;
  error?: string;
}

export const priceCheckService = {
  async checkUrl(trackedUrlId: string): Promise<CheckResult> {
    // Get URL details
    const urlData = await queryOne<{
      id: string;
      url: string;
      item_id: string;
      current_price: number | null;
      items: { user_id: string; name: string } | null;
    }>(
      `SELECT tu.id, tu.url, tu.item_id, tu.current_price,
              jsonb_build_object('user_id', i.user_id, 'name', i.name) as items
       FROM tracked_urls tu
       JOIN items i ON i.id = tu.item_id
       WHERE tu.id = $1`,
      [trackedUrlId]
    );

    if (!urlData) {
      return { trackedUrlId, success: false, price: null, previousPrice: null, priceDrop: false, error: 'URL not found' };
    }

    try {
      // Scrape the URL
      const scrapeResult = await scrapeUrl(urlData.url);

      if (scrapeResult.extractionMethod === 'failed' || scrapeResult.price === null) {
        // Mark as failed
        await priceRepository.updatePrice({
          trackedUrlId,
          price: urlData.current_price || 0,
          currency: 'USD',
          availability: 'unknown',
          extractionMethod: 'failed',
          checkFailed: true,
        });

        return {
          trackedUrlId,
          success: false,
          price: null,
          previousPrice: urlData.current_price,
          priceDrop: false,
          error: 'Extraction failed',
        };
      }

      const previousPrice = urlData.current_price;
      const priceDrop = previousPrice !== null && scrapeResult.price < previousPrice;

      // Update tracked URL
      await priceRepository.updatePrice({
        trackedUrlId,
        price: scrapeResult.price,
        currency: scrapeResult.currency || 'USD',
        availability: scrapeResult.availability,
        extractionMethod: scrapeResult.extractionMethod,
        checkFailed: false,
      });

      // Add to price history
      await priceRepository.addPriceHistory(
        trackedUrlId,
        scrapeResult.price,
        scrapeResult.currency,
        scrapeResult.availability
      );

      // Create notification if price dropped
      if (priceDrop && urlData.items) {
        const percentDrop = ((previousPrice - scrapeResult.price) / previousPrice) * 100;

        await notificationService.createPriceDropNotification({
          userId: urlData.items.user_id,
          itemId: urlData.item_id,
          itemName: urlData.items.name,
          storeName: new URL(urlData.url).hostname.replace('www.', ''),
          oldPrice: previousPrice,
          newPrice: scrapeResult.price,
          percentDrop,
        });
      }

      return {
        trackedUrlId,
        success: true,
        price: scrapeResult.price,
        previousPrice,
        priceDrop,
      };
    } catch (error) {
      return {
        trackedUrlId,
        success: false,
        price: null,
        previousPrice: urlData.current_price,
        priceDrop: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async checkAllPending(): Promise<{ checked: number; drops: number; errors: number }> {
    const urls = await priceRepository.getUrlsForCheck(50);

    let drops = 0;
    let errors = 0;

    for (const url of urls) {
      // Stagger requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await this.checkUrl(url.id);

      if (!result.success) {
        errors++;
      } else if (result.priceDrop) {
        drops++;
      }
    }

    return {
      checked: urls.length,
      drops,
      errors,
    };
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**
```bash
git add src/services/price-check.service.ts
git commit -m "feat: add price check service with notification triggers

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Create Background Scheduler

**Files:**
- Create: `src/jobs/scheduler.ts`

- [ ] **Step 1: Write scheduler**
```typescript
// src/jobs/scheduler.ts
import cron from 'node-cron';
import { priceCheckService } from '../services/price-check.service.js';
import { env } from '../config/env.js';

let priceCheckJob: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  if (priceCheckJob) {
    console.log('Scheduler already running');
    return;
  }

  // Run price checks every hour at random minute to avoid spikes
  const minute = Math.floor(Math.random() * 60);
  const cronExpression = `${minute} * * * *`;

  console.log(`Starting price check scheduler: ${cronExpression}`);

  priceCheckJob = cron.schedule(cronExpression, async () => {
    console.log('Starting scheduled price check...');
    try {
      const result = await priceCheckService.checkAllPending();
      console.log(`Price check complete: ${result.checked} checked, ${result.drops} drops, ${result.errors} errors`);
    } catch (error) {
      console.error('Scheduled price check failed:', error);
    }
  });
}

export function stopScheduler(): void {
  if (priceCheckJob) {
    priceCheckJob.stop();
    priceCheckJob = null;
    console.log('Price check scheduler stopped');
  }
}

export function triggerManualCheck(): Promise<{ checked: number; drops: number; errors: number }> {
  console.log('Manual price check triggered');
  return priceCheckService.checkAllPending();
}
```

- [ ] **Step 2: Commit**
```bash
git add src/jobs/scheduler.ts
git commit -m "feat: add background scheduler for price checks

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Create Internal API Endpoints

**Files:**
- Create: `src/controllers/internal.controller.ts`
- Create: `src/routes/internal.routes.ts`

- [ ] **Step 1: Write internal controller**
```typescript
// src/controllers/internal.controller.ts
import { Request, Response, NextFunction } from 'express';
import { triggerManualCheck } from '../jobs/scheduler.js';
import { priceCheckService } from '../services/price-check.service.js';

export const internalController = {
  async checkPrices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await triggerManualCheck();
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async checkSingleUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { urlId } = req.params;
      const result = await priceCheckService.checkUrl(urlId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
```

- [ ] **Step 2: Write internal routes**
```typescript
// src/routes/internal.routes.ts
import { Router } from 'express';
import { internalController } from '../controllers/internal.controller.js';

const router = Router();

router.post('/check-prices', internalController.checkPrices);
router.post('/check-prices/:urlId', internalController.checkSingleUrl);

export default router;
```

- [ ] **Step 3: Update routes index**
```typescript
// Add to src/routes/index.ts
import internalRoutes from './internal.routes.js';
// ... existing imports

// Add to router:
router.use('/internal', internalRoutes);
```

- [ ] **Step 4: Commit**
```bash
git add src/controllers/internal.controller.ts src/routes/internal.routes.ts src/routes/index.ts
git commit -m "feat: add internal API endpoints for price checks

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Integrate Scheduler with App

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update entry point to start scheduler**
```typescript
// src/index.ts
import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './config/database.js';
import { startScheduler, stopScheduler } from './jobs/scheduler.js';

const app = createApp();

const server = app.listen(parseInt(env.PORT), () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);

  // Start the scheduler in production/staging
  if (env.NODE_ENV !== 'test') {
    startScheduler();
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopScheduler();
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopScheduler();
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});
```

- [ ] **Step 2: Commit**
```bash
git add src/index.ts
git commit -m "feat: integrate scheduler with app startup

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Add Scraper Tests

**Files:**
- Create: `tests/scraper.test.ts`

- [ ] **Step 1: Write scraper tests**
```typescript
// tests/scraper.test.ts
import { extractJsonLd } from '../src/scrapers/extractors/json-ld.js';
import { extractWithSelectors } from '../src/scrapers/extractors/selectors.js';

describe('JSON-LD Extractor', () => {
  it('should extract price from valid JSON-LD', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Product",
            "name": "Test Product",
            "offers": {
              "@type": "Offer",
              "price": 99.99,
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock"
            }
          }
          </script>
        </head>
        <body></body>
      </html>
    `;

    const result = extractJsonLd(html);

    expect(result).not.toBeNull();
    expect(result?.price).toBe(99.99);
    expect(result?.currency).toBe('USD');
    expect(result?.availability).toBe('in_stock');
    expect(result?.confidence).toBe('high');
  });

  it('should parse price as string', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Product",
            "offers": {
              "price": "149.99"
            }
          }
          </script>
        </head>
      </html>
    `;

    const result = extractJsonLd(html);
    expect(result?.price).toBe(149.99);
  });

  it('should return null for missing JSON-LD', () => {
    const html = '<html><body>No JSON-LD here</body></html>';
    const result = extractJsonLd(html);
    expect(result).toBeNull();
  });
});

describe('Site Selector Extractor', () => {
  it('should extract price from Amazon-like page', () => {
    const html = `
      <html>
        <body>
          <span id="priceblock_ourprice">$1,299.00</span>
        </body>
      </html>
    `;

    const result = extractWithSelectors(html, 'https://amazon.com/dp/B0ABC');

    expect(result).not.toBeNull();
    expect(result?.price).toBe(1299);
    expect(result?.confidence).toBe('medium');
  });

  it('should return null for unknown domain', () => {
    const html = '<html><body>$99</body></html>';
    const result = extractWithSelectors(html, 'https://unknown-store.com/product');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests**
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/scraper.test.ts
```
Expected: Tests pass

- [ ] **Step 3: Commit**
```bash
git add tests/scraper.test.ts
git commit -m "test: add scraper unit tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Final Integration and Verification

- [ ] **Step 1: Build the project**
```bash
npm run build
```
Expected: TypeScript compiles successfully

- [ ] **Step 2: Run all tests**
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```
Expected: All tests pass

- [ ] **Step 3: Final commit**
```bash
git add -A
git commit -m "feat: complete price extraction engine

Phase 2 implementation:
- 3-tier fallback scraper (JSON-LD, selectors, heuristics)
- Site-specific support for Amazon, Best Buy, Newegg, Walmart, Target
- Background scheduler with node-cron
- Price history tracking
- Price drop notifications
- Internal API endpoints

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Summary

This plan delivers:

| Component | Description |
|-----------|-------------|
| **Scraper** | 3-tier fallback: JSON-LD → site selectors → heuristics |
| **Site Support** | Amazon, Best Buy, Newegg, Walmart, Target, eBay, B&H |
| **Scheduler** | Hourly checks via node-cron, staggered to avoid spikes |
| **Price History** | Full history in `price_history` table |
| **Notifications** | Price drop alerts stored in `notifications` table |
| **API** | `/api/v1/internal/check-prices` endpoint |

**Next phases:**
- Phase 3: Web frontend
- Phase 4: Mobile app
- Phase 5: Email/push notifications

---

<!-- STOP -->
## STOP

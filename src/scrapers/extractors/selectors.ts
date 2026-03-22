import * as cheerio from 'cheerio';

export interface SelectorResult {
  price: number | null;
  confidence: 'medium';
  source: string;
}

interface SiteSelector {
  patterns: RegExp[];
  selectors: string[];
  parsePrice: (text: string) => number | null;
  priceValidator?: (price: number) => boolean;
}

// Minimum reasonable prices for common product categories (to filter out accessories/warranties)
const PRICE_VALIDATORS = {
  // Electronics typically cost at least $10
  default: (price: number) => price >= 10 && price <= 10000,
  // Premium electronics (laptops, consoles, phones) typically $100+
  premium: (price: number) => price >= 100 && price <= 5000,
};

const SITE_SELECTORS: SiteSelector[] = [
  {
    patterns: [/amazon\.(com|co\.uk|de|fr|es|it|ca|com\.au)/i],
    selectors: [
      // Primary price block selectors (most reliable)
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '#priceblock_ourprice_lbl + .a-price .a-offscreen',
      // New Amazon layout
      '.reinventPricePriceToPayMargin .a-offscreen',
      '#corePriceDisplay_feature_div .a-price .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
      // Deal prices
      '#priceblock_snsprice_Buybox .a-offscreen',
      '#dealPrice .a-offscreen',
      // Subscribe & Save
      '#snsBasePrice .a-offscreen',
      // Buy box prices
      '#buybox .a-price .a-offscreen',
      '#newBuyBoxPrice',
      // Price to pay in right column
      '#托尼Price_feature_div .a-price .a-offscreen',
      '.a-price-range .a-price .a-offscreen',
      // Visible price elements (not accessibility text)
      '.a-price-whole',
      '.a-price[data-a-color="base"] .a-offscreen',
      // Last resort - get price from aria-label
      '[aria-label*="Price"]',
      '[aria-label*="price"]',
      // Fallback - generic price (may catch accessories)
      '.a-price .a-offscreen',
    ],
    parsePrice: parseAmazonPrice,
    priceValidator: (price) => price >= 20 && price <= 10000, // Filter out obvious accessories
  },
  {
    patterns: [/bestbuy\.com/i],
    selectors: [
      '[data-testid="customer-price"]',
      '.priceView-customer-price span',
      '.pricing-price__value',
      '[data-testid="pricing-price"]',
      '.price-info .screenreader-only',
      '.sr-only:contains("$")',
      '[data-selenium="pricing-price"]',
    ],
    parsePrice: parseStandardPrice,
  },
  {
    patterns: [/newegg\.com/i],
    selectors: [
      '.price-current',
      '.price-current strong',
      '[data-testid="product-price"]',
      '.price-widget-container .price',
    ],
    parsePrice: parseNeweggPrice,
  },
  {
    patterns: [/walmart\.com/i],
    selectors: [
      '[data-testid="price-tags"] span',
      '[itemprop="price"]',
      '.price-characteristic',
      '[data-testid="price-wrap"] [data-testid="price"]',
      '[data-testid="price-value"]',
      'span[data-automation="price"]',
      '[itemprop="price"]',
    ],
    parsePrice: parseStandardPrice,
  },
  {
    patterns: [/target\.com/i],
    selectors: [
      '[data-test="product-price"]',
      '[data-test="current-price"]',
      '.styles__PriceFontSize-sc-1nkrncp-1',
      '[itemprop="price"]',
      'span[aria-label*="current price"]',
      '[data-testid="current-price"]',
    ],
    parsePrice: parseStandardPrice,
  },
  {
    patterns: [/ebay\.(com|co\.uk|de|fr)/i],
    selectors: [
      '[data-testid="x-price-primary"]',
      '.x-price-primary .ux-textspans',
      '#mm-saleDscPrc',
      '.display-price',
      '[itemprop="price"]',
    ],
    parsePrice: parseStandardPrice,
  },
  {
    patterns: [/bhphotovideo\.com/i],
    selectors: [
      '[data-selenium="pricing-price"]',
      '.priceValue',
      '[itemprop="price"]',
    ],
    parsePrice: parseStandardPrice,
  },
];

function parseAmazonPrice(text: string): number | null {
  // Amazon prices can be like "$1,234.56" or "CDN$ 1,234.56"
  // Also handle prices like "$1,234" (no decimals)
  let cleaned = text
    .replace(/[A-Z]{3}\$\s*/g, '')
    .replace(/US\$/g, '')
    .trim();

  // Extract just the number part
  const match = cleaned.match(/[\d,]+\.?\d*/);
  if (!match) return null;

  cleaned = match[0].replace(/,/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) || price <= 0 ? null : price;
}

function parseNeweggPrice(text: string): number | null {
  // Newegg shows prices like "$1,234.56" or "$1,234"
  const match = text.match(/\$[\d,]+\.?\d*/);
  if (!match) return null;

  const cleaned = match[0].replace(/[$,]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) || price <= 0 ? null : price;
}

function parseStandardPrice(text: string): number | null {
  // Standard price format: "$1,234.56"
  const match = text.match(/\$[\d,]+\.?\d*/);
  if (!match) return null;

  const cleaned = match[0].replace(/[$,]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) || price <= 0 ? null : price;
}

export function extractWithSelectors(html: string, url: string): SelectorResult | null {
  const $ = cheerio.load(html);
  const hostname = extractHostname(url);

  // Find matching site selector
  const siteSelector = SITE_SELECTORS.find(s =>
    s.patterns.some(p => p.test(hostname))
  );

  if (!siteSelector) {
    return null;
  }

  // Try each selector until we find a valid price
  for (const selector of siteSelector.selectors) {
    const elements = $(selector);
    if (elements.length === 0) continue;

    // Try all matching elements (sometimes the first one is hidden/accessibility text)
    for (let i = 0; i < Math.min(elements.length, 5); i++) {
      const element = elements.eq(i);
      const text = element.text().trim();

      if (!text || !text.includes('$')) continue;

      const price = siteSelector.parsePrice(text);
      console.log(`[Selectors] ${hostname} | selector: "${selector}" | text: "${text.substring(0, 30)}" | parsed: ${price}`);
      if (price !== null && price > 0) {
        // Validate price is reasonable
        const validator = siteSelector.priceValidator || PRICE_VALIDATORS.default;
        if (validator(price)) {
          return {
            price,
            confidence: 'medium',
            source: hostname,
          };
        }
      }
    }
  }

  return null;
}

function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function getSupportedSites(): string[] {
  return SITE_SELECTORS.flatMap(s => s.patterns.map(p => p.source));
}

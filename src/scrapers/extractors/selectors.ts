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
}

const SITE_SELECTORS: SiteSelector[] = [
  {
    patterns: [/amazon\.(com|co\.uk|de|fr|es|it|ca|com\.au)/i],
    selectors: [
      '.a-price .a-offscreen',
      '.a-price-whole',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '.reinventPricePriceToPayMargin .a-offscreen',
      '#corePriceDisplay_feature_div .a-price .a-offscreen',
    ],
    parsePrice: parseAmazonPrice,
  },
  {
    patterns: [/bestbuy\.com/i],
    selectors: [
      '[data-testid="customer-price"]',
      '.priceView-customer-price span',
      '.pricing-price__value',
      '[data-testid="pricing-price"]',
    ],
    parsePrice: parseStandardPrice,
  },
  {
    patterns: [/newegg\.com/i],
    selectors: [
      '.price-current',
      '.price-current strong',
      '[data-testid="product-price"]',
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
  const cleaned = text.replace(/[A-Z]{3}\$\s*/g, '').replace(/[^0-9.,]/g, '');
  return parsePriceValue(cleaned);
}

function parseNeweggPrice(text: string): number | null {
  // Newegg shows prices like "$1,234.56" or "$1,234"
  const cleaned = text.replace(/[^0-9.,]/g, '');
  return parsePriceValue(cleaned);
}

function parseStandardPrice(text: string): number | null {
  // Standard price format: "$1,234.56"
  const cleaned = text.replace(/[^0-9.,]/g, '');
  return parsePriceValue(cleaned);
}

function parsePriceValue(cleaned: string): number | null {
  if (!cleaned) return null;

  // Handle both comma as thousands separator and decimal separator
  // US format: 1,234.56 -> 1234.56
  // EU format: 1.234,56 -> 1234.56
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastComma > lastDot) {
      // EU format: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Could be EU decimal or US thousands
    // Heuristic: if comma followed by exactly 2 digits, it's a decimal
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const price = parseFloat(cleaned);
  if (isNaN(price) || price <= 0) return null;
  return price;
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
    const element = $(selector).first();
    if (element.length === 0) continue;

    const text = element.text().trim();
    if (!text) continue;

    const price = siteSelector.parsePrice(text);
    if (price !== null && price > 0) {
      return {
        price,
        confidence: 'medium',
        source: hostname,
      };
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

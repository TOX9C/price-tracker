import * as cheerio from 'cheerio';

export interface HeuristicResult {
  price: number | null;
  confidence: 'low';
}

interface PriceCandidate {
  price: number;
  weight: number;
  context: string;
}

const PRICE_REGEX = /\$[\d,]+\.?\d*|\b[\d,]+\.?\d*\s*(?:USD|dollars)\b/gi;

const WEIGHTS = {
  CLASS_CONTAINS_PRICE: 50,
  PROXIMITY_TO_PRICE_TEXT: 30,
  REASONABLE_PRICE_RANGE: 20,
  ARIA_LABEL_CONTAINS_PRICE: 40,
  FONT_SIZE_MULTIPLIER: 2,
  VISIBLE_ELEMENT: 10,
  NOT_IN_SCRIPT: 20,
  MAIN_ELEMENT: 15,
};

// Price range validation - filter out obvious errors
const MIN_PRICE = 1;
const MAX_PRICE = 50000;

// Words that indicate we're NOT looking at the main product price
const IGNORE_KEYWORDS = [
  'shipping', 'delivery', 'tax', 'fee', 'warranty', 'insurance',
  'monthly', 'weekly', 'per month', 'per week', 'subscription',
  'save', 'discount', 'off', 'was', 'original', 'msrp',
  'sold by', 'fulfilled', 'prime', 'coupon', 'rebate',
];

// Words that indicate we ARE looking at the main price
const PRICE_KEYWORDS = [
  'price', 'cost', 'our price', 'your price', 'buy', 'purchase',
  'deal', 'sale', 'offer', 'total', 'amount',
];

export function extractHeuristic(html: string): HeuristicResult | null {
  const $ = cheerio.load(html);
  const candidates: PriceCandidate[] = [];

  // Look for elements that might contain prices
  $('*').not('script, style, noscript, meta, link').each((_, element) => {
    const $element = $(element);
    const text = $element.text().trim();

    // Skip if element contains too much text (probably not the price element)
    if (text.length > 200) return;

    // Skip if text doesn't contain a price-like pattern
    if (!PRICE_REGEX.test(text)) return;

    const matches = text.match(PRICE_REGEX);
    if (!matches || matches.length === 0) return;

    // Reset regex state
    PRICE_REGEX.lastIndex = 0;

    for (const match of matches) {
      const price = parsePrice(match);
      if (price === null) continue;

      // Validate price is in reasonable range
      if (price < MIN_PRICE || price > MAX_PRICE) continue;

      let weight = 0;

      // Check if this is likely the main product price container
      const className = $element.attr('class') || '';
      const id = $element.attr('id') || '';

      // Check for price-related class names
      if (containsPriceKeyword(className) || containsPriceKeyword(id)) {
        weight += WEIGHTS.CLASS_CONTAINS_PRICE;
      }

      // Check font size (larger text is more likely to be the main price)
      const style = $element.attr('style') || '';
      const fontSizeMatch = style.match(/font-size:\s*(\d+)/i);
      if (fontSizeMatch) {
        const fontSize = parseInt(fontSizeMatch[1], 10);
        if (fontSize >= 18) {
          weight += fontSize * WEIGHTS.FONT_SIZE_MULTIPLIER;
        }
      }

      // Check if element is visible (has display:block or is a common visible element)
      if ($element.is('span, div, p, h1, h2, h3, h4, strong, b')) {
        weight += WEIGHTS.VISIBLE_ELEMENT;
      }

      // Check aria-label
      const ariaLabel = $element.attr('aria-label') || '';
      if (containsPriceKeyword(ariaLabel)) {
        weight += WEIGHTS.ARIA_LABEL_CONTAINS_PRICE;
      }

      // Check if element is in main content area
      const parents = $element.parents();
      const isInMain = parents.is('main, [role="main"], #main, .main, .content, #content');
      if (isInMain) {
        weight += WEIGHTS.MAIN_ELEMENT;
      }

      // Check context - reject if contains ignore keywords
      const parent = $element.parent();
      const context = parent.text().toLowerCase();
      if (IGNORE_KEYWORDS.some(kw => context.includes(kw))) {
        weight -= 30;
      }

      // Boost if context contains price keywords
      if (PRICE_KEYWORDS.some(kw => context.includes(kw))) {
        weight += WEIGHTS.PROXIMITY_TO_PRICE_TEXT;
      }

      candidates.push({ price, weight, context: text });
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  // Sort by weight descending
  candidates.sort((a, b) => b.weight - a.weight);

  // Take the highest weighted candidate, but also check for outliers
  const topCandidate = candidates[0];

  // If we have multiple high-weight candidates, verify the price isn't an outlier
  const highWeightCandidates = candidates.filter(c => c.weight >= topCandidate.weight - 20);
  if (highWeightCandidates.length > 1) {
    const prices = highWeightCandidates.map(c => c.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];

    // If top candidate is much lower than median, use median instead
    if (topCandidate.price < median * 0.5) {
      return { price: median, confidence: 'low' };
    }
  }

  return {
    price: topCandidate.price,
    confidence: 'low',
  };
}

function parsePrice(match: string): number | null {
  // Extract price value from text like "$1,234.56"
  let cleaned = match
    .replace(/^\$/, '')
    .replace(/USD$/i, '')
    .replace(/dollars$/i, '')
    .replace(/,/g, '')
    .trim();

  const price = parseFloat(cleaned);
  if (isNaN(price) || price <= 0) {
    return null;
  }

  return price;
}

function containsPriceKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('price') ||
    lower.includes('cost') ||
    lower.includes('current-price') ||
    lower.includes('sale-price') ||
    lower.includes('our-price') ||
    lower.includes('buy-price')
  );
}

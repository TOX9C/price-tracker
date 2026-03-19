import * as cheerio from 'cheerio';

export interface HeuristicResult {
  price: number | null;
  confidence: 'low';
}

interface PriceCandidate {
  price: number;
  weight: number;
}

const PRICE_REGEX = /\$[\d,]+\.?\d*|[\d,]+\.?\d*\s*(?:USD|dollars)/gi;

const WEIGHTS = {
  CLASS_CONTAINS_PRICE: 50,
  PROXIMITY_TO_PRICE_TEXT: 30,
  REASONABLE_PRICE_RANGE: 20,
  ARIA_LABEL_CONTAINS_PRICE: 40,
  FONT_SIZE_MULTIPLIER: 2,
};

const REASONABLE_PRICE_MIN = 1;
const REASONABLE_PRICE_MAX = 5000;

export function extractHeuristic(html: string): HeuristicResult | null {
  const $ = cheerio.load(html);
  const candidates: PriceCandidate[] = [];

  $('*').each((_, element) => {
    const $element = $(element);
    const text = $element.text().trim();

    const matches = text.match(PRICE_REGEX);
    if (!matches || matches.length === 0) return;

    for (const match of matches) {
      const price = parsePrice(match);
      if (price === null) continue;

      let weight = 0;

      // Check if class name contains "price"
      const className = $element.attr('class') || '';
      const id = $element.attr('id') || '';
      if (containsPriceKeyword(className) || containsPriceKeyword(id)) {
        weight += WEIGHTS.CLASS_CONTAINS_PRICE;
      }

      // Check font size
      const style = $element.attr('style') || '';
      const fontSizeMatch = style.match(/font-size:\s*(\d+)/i);
      if (fontSizeMatch) {
        const fontSize = parseInt(fontSizeMatch[1], 10);
        if (fontSize >= 14) {
          weight += fontSize * WEIGHTS.FONT_SIZE_MULTIPLIER;
        }
      }

      // Check proximity to "price" text
      const parent = $element.parent();
      const parentText = parent.text().toLowerCase();
      if (parentText.includes('price') || parentText.includes('cost')) {
        weight += WEIGHTS.PROXIMITY_TO_PRICE_TEXT;
      }

      // Check if in reasonable price range
      if (price >= REASONABLE_PRICE_MIN && price <= REASONABLE_PRICE_MAX) {
        weight += WEIGHTS.REASONABLE_PRICE_RANGE;
      }

      // Check aria-label
      const ariaLabel = $element.attr('aria-label') || '';
      if (containsPriceKeyword(ariaLabel)) {
        weight += WEIGHTS.ARIA_LABEL_CONTAINS_PRICE;
      }

      candidates.push({ price, weight });
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  // Sort by weight descending and return the highest weighted price
  candidates.sort((a, b) => b.weight - a.weight);

  return {
    price: candidates[0].price,
    confidence: 'low',
  };
}

function parsePrice(match: string): number | null {
  // Remove currency symbols and text
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
    lower.includes('amount') ||
    lower.includes('current-price') ||
    lower.includes('sale-price')
  );
}

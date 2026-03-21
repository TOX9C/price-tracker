import { fetchUrl, FetchResult } from './fetch.js';
import { extractJsonLd, ExtractedPrice } from './extractors/json-ld.js';
import { extractWithSelectors, SelectorResult } from './extractors/selectors.js';
import { extractHeuristic, HeuristicResult } from './extractors/heuristic.js';

export interface ScraperResult {
  price: number | null;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  extractionMethod: 'json-ld' | 'selectors' | 'heuristic' | 'failed';
  confidence: 'high' | 'medium' | 'low';
  name?: string;
  image?: string;
  blocked?: boolean;
}

export interface ScraperOptions {
  timeout?: number;
  retries?: number;
}

// Patterns that indicate we're being blocked or seeing a CAPTCHA
const BLOCK_PATTERNS = [
  /captcha/i,
  /bot detect/i,
  /access denied/i,
  /blocked/i,
  /cloudflare/i,
  /challenge/i,
  /verify.*human/i,
  /automated.*access/i,
  /api-services-support@amazon/i,
  /opfcaptcha/i,
];

/**
 * Check if the HTML content indicates a block or CAPTCHA
 */
function detectBlock(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  return BLOCK_PATTERNS.some(pattern => pattern.test(lowerHtml));
}

/**
 * Scrape a URL using the 3-tier fallback strategy:
 * 1. JSON-LD (schema.org) - highest confidence
 * 2. Site-specific selectors - medium confidence
 * 3. Heuristic extraction - low confidence
 */
export async function scrapePrice(
  url: string,
  options: ScraperOptions = {}
): Promise<ScraperResult> {
  let fetchResult: FetchResult;

  try {
    fetchResult = await fetchUrl(url, {
      timeout: options.timeout ?? 15000,
      retries: options.retries ?? 3,
    });
  } catch (error) {
    return {
      price: null,
      currency: 'USD',
      availability: 'unknown',
      extractionMethod: 'failed',
      confidence: 'low',
      blocked: false,
    };
  }

  const html = fetchResult.html;

  // Check for blocks/CAPTCHA
  if (detectBlock(html)) {
    return {
      price: null,
      currency: 'USD',
      availability: 'unknown',
      extractionMethod: 'failed',
      confidence: 'low',
      blocked: true,
    };
  }

  // Tier 1: JSON-LD extraction (high confidence)
  const jsonLdResult = extractJsonLd(html);
  if (jsonLdResult && jsonLdResult.price !== null) {
    return {
      price: jsonLdResult.price,
      currency: jsonLdResult.currency || 'USD',
      availability: jsonLdResult.availability,
      extractionMethod: 'json-ld',
      confidence: 'high',
      name: jsonLdResult.name,
      image: jsonLdResult.image,
      blocked: false,
    };
  }

  // Tier 2: Site-specific selectors (medium confidence)
  const selectorResult = extractWithSelectors(html, url);
  if (selectorResult && selectorResult.price !== null) {
    return {
      price: selectorResult.price,
      currency: 'USD',
      availability: 'unknown',
      extractionMethod: 'selectors',
      confidence: 'medium',
      blocked: false,
    };
  }

  // Tier 3: Heuristic extraction (low confidence)
  const heuristicResult = extractHeuristic(html);
  if (heuristicResult && heuristicResult.price !== null) {
    return {
      price: heuristicResult.price,
      currency: 'USD',
      availability: 'unknown',
      extractionMethod: 'heuristic',
      confidence: 'low',
      blocked: false,
    };
  }

  // No price found
  return {
    price: null,
    currency: 'USD',
    availability: 'unknown',
    extractionMethod: 'failed',
    confidence: 'low',
    blocked: false,
  };
}

export { fetchUrl } from './fetch.js';
export { extractJsonLd } from './extractors/json-ld.js';
export { extractWithSelectors } from './extractors/selectors.js';
export { extractHeuristic } from './extractors/heuristic.js';

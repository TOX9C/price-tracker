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
}

export interface ScraperOptions {
  timeout?: number;
  retries?: number;
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
    };
  }

  const html = fetchResult.html;

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
    };
  }

  // No price found
  return {
    price: null,
    currency: 'USD',
    availability: 'unknown',
    extractionMethod: 'failed',
    confidence: 'low',
  };
}

export { fetchUrl } from './fetch.js';
export { extractJsonLd } from './extractors/json-ld.js';
export { extractWithSelectors } from './extractors/selectors.js';
export { extractHeuristic } from './extractors/heuristic.js';

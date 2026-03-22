import { fetchUrl, FetchResult } from './fetch.js';
import { fetchWithPlaywright, isPlaywrightAvailable, closeBrowser } from './playwright-fetch.js';
import { extractJsonLd, ExtractedPrice } from './extractors/json-ld.js';
import { extractWithSelectors, SelectorResult } from './extractors/selectors.js';
import { extractHeuristic, HeuristicResult } from './extractors/heuristic.js';

// Check if Playwright is enabled (default: true on server, false in dev)
const PLAYWRIGHT_ENABLED = process.env.PLAYWRIGHT_ENABLED !== 'false';

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
 *
 * Also falls back to Playwright (browser) if HTTP fetch is blocked
 */
export async function scrapePrice(
  url: string,
  options: ScraperOptions = {}
): Promise<ScraperResult> {
  // First, try HTTP-based fetching (faster)
  let fetchResult: FetchResult;
  let usedPlaywright = false;

  try {
    fetchResult = await fetchUrl(url, {
      timeout: options.timeout ?? 15000,
      retries: options.retries ?? 3,
    });
  } catch (error) {
    // If HTTP fails and Playwright is available, try browser
    if (PLAYWRIGHT_ENABLED && await isPlaywrightAvailable()) {
      console.log('[Scraper] HTTP fetch failed, trying Playwright...');
      try {
        fetchResult = await fetchWithPlaywright(url, { timeout: options.timeout ?? 30000 });
        usedPlaywright = true;
      } catch (pwError) {
        return {
          price: null,
          currency: 'USD',
          availability: 'unknown',
          extractionMethod: 'failed',
          confidence: 'low',
          blocked: false,
        };
      }
    } else {
      return {
        price: null,
        currency: 'USD',
        availability: 'unknown',
        extractionMethod: 'failed',
        confidence: 'low',
        blocked: false,
      };
    }
  }

  let html = fetchResult.html;

  // Check for blocks/CAPTCHA
  if (detectBlock(html) && !usedPlaywright && PLAYWRIGHT_ENABLED && await isPlaywrightAvailable()) {
    console.log('[Scraper] Detected block/CAPTCHA, trying Playwright...');
    try {
      const pwResult = await fetchWithPlaywright(url, { timeout: options.timeout ?? 30000 });
      html = pwResult.html;
      usedPlaywright = true;
    } catch (pwError) {
      return {
        price: null,
        currency: 'USD',
        availability: 'unknown',
        extractionMethod: 'failed',
        confidence: 'low',
        blocked: true,
      };
    }
  }

  // Check if Playwright also detected CAPTCHA
  if (html.includes('<!-- CAPTCHA_DETECTED -->')) {
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

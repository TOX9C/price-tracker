import { scrapePrice, ScraperResult } from '../scrapers/index.js';

export interface ExternalScrapingConfig {
  provider: 'scrapingbee' | 'scraperapi' | 'zenrows' | 'none';
  apiKey?: string;
}

interface ScrapingProvider {
  name: string;
  scrape: (url: string) => Promise<string | null>;
  creditsPerRequest: number;
}

// Default to no external provider (use local scraping)
let config: ExternalScrapingConfig = {
  provider: 'none',
};

/**
 * Configure external scraping provider
 */
export function configureExternalScraping(newConfig: ExternalScrapingConfig): void {
  config = newConfig;
  console.log(`[ExternalScraping] Configured: ${newConfig.provider}`);
}

/**
 * ScrapingBee provider
 */
const scrapingBee: ScrapingProvider = {
  name: 'scrapingbee',
  creditsPerRequest: 1,
  scrape: async (url: string): Promise<string | null> => {
    if (!config.apiKey) return null;

    try {
      const apiUrl = new URL('https://app.scrapingbee.com/api/v1/');
      apiUrl.searchParams.set('api_key', config.apiKey);
      apiUrl.searchParams.set('url', url);
      apiUrl.searchParams.set('render_js', 'true'); // Enable JavaScript rendering
      apiUrl.searchParams.set('premium_proxy', 'true'); // Use residential proxies for better success
      apiUrl.searchParams.set('country_code', 'us');

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });

      if (!response.ok) {
        console.error(`[ScrapingBee] Error ${response.status}: ${response.statusText}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error('[ScrapingBee] Request failed:', error);
      return null;
    }
  },
};

/**
 * ScraperAPI provider
 */
const scraperApi: ScrapingProvider = {
  name: 'scraperapi',
  creditsPerRequest: 5, // JavaScript rendering costs more
  scrape: async (url: string): Promise<string | null> => {
    if (!config.apiKey) return null;

    try {
      const apiUrl = new URL('http://api.scraperapi.com/');
      apiUrl.searchParams.set('api_key', config.apiKey);
      apiUrl.searchParams.set('url', url);
      apiUrl.searchParams.set('render', 'true'); // Enable JavaScript rendering
      apiUrl.searchParams.set('country_code', 'us');

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        console.error(`[ScraperAPI] Error ${response.status}: ${response.statusText}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error('[ScraperAPI] Request failed:', error);
      return null;
    }
  },
};

/**
 * ZenRows provider
 */
const zenRows: ScrapingProvider = {
  name: 'zenrows',
  creditsPerRequest: 1,
  scrape: async (url: string): Promise<string | null> => {
    if (!config.apiKey) return null;

    try {
      const apiUrl = new URL('https://api.zenrows.com/v1/');
      apiUrl.searchParams.set('apikey', config.apiKey);
      apiUrl.searchParams.set('url', url);
      apiUrl.searchParams.set('js_render', 'true');
      apiUrl.searchParams.set('premium_proxy', 'true');
      apiUrl.searchParams.set('country', 'us');

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        console.error(`[ZenRows] Error ${response.status}: ${response.statusText}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error('[ZenRows] Request failed:', error);
      return null;
    }
  },
};

/**
 * Get the configured provider
 */
function getProvider(): ScrapingProvider | null {
  switch (config.provider) {
    case 'scrapingbee':
      return scrapingBee;
    case 'scraperapi':
      return scraperApi;
    case 'zenrows':
      return zenRows;
    default:
      return null;
  }
}

/**
 * Scrape a URL using external API (falls back to local scraping)
 */
export async function scrapeWithExternalProvider(url: string): Promise<ScraperResult> {
  const provider = getProvider();

  // Try external provider first
  if (provider) {
    console.log(`[ExternalScraping] Using ${provider.name} for: ${url}`);
    const html = await provider.scrape(url);

    if (html) {
      // Import extractors directly
      const { extractJsonLd } = await import('../scrapers/extractors/json-ld.js');
      const { extractWithSelectors } = await import('../scrapers/extractors/selectors.js');
      const { extractHeuristic } = await import('../scrapers/extractors/heuristic.js');

      // Check for blocks/CAPTCHA
      const blockPatterns = [/captcha/i, /bot detect/i, /access denied/i, /blocked/i, /cloudflare/i];
      const isBlocked = blockPatterns.some(p => p.test(html));

      if (isBlocked) {
        console.log(`[ExternalScraping] Provider returned blocked content`);
      } else {
        // Try extraction
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
      }
    }
  }

  // Fall back to local scraping
  console.log(`[ExternalScraping] Falling back to local scraping for: ${url}`);
  return scrapePrice(url);
}

/**
 * Check if external scraping is configured
 */
export function isExternalScrapingConfigured(): boolean {
  return config.provider !== 'none' && !!config.apiKey;
}

/**
 * Get current scraping config (without API key)
 */
export function getScrapingConfig(): { provider: string; configured: boolean } {
  return {
    provider: config.provider,
    configured: isExternalScrapingConfigured(),
  };
}

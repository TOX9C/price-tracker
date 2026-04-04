import axios from "axios";
import * as cheerio from "cheerio";
import UserAgent from "user-agents";
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export type Store = "AMAZON" | "WALMART" | "TARGET" | "BESTBUY" | "EBAY" | "OTHER";

export interface ScrapedProduct {
  name: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  available: boolean;
}

const getRandomHeaders = () => {
  const userAgent = new UserAgent();
  return {
    "User-Agent": userAgent.toString(),
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
};

const parsePrice = (priceStr: string | null | undefined): number | null => {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.replace(",", ".");
  const match = normalized.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
};

const detectStore = (url: string): Store => {
  if (url.includes("amazon.")) return "AMAZON";
  if (url.includes("walmart.")) return "WALMART";
  if (url.includes("target.")) return "TARGET";
  if (url.includes("bestbuy.")) return "BESTBUY";
  if (url.includes("ebay.")) return "EBAY";
  return "OTHER";
};

// Vercel-compatible Puppeteer Scraper for Amazon
export const scrapeAmazon = async (url: string): Promise<ScrapedProduct> => {
  let browser = null;
  try {
    // Determine if we are running in production (Vercel) or locally
    const isLocal = process.env.NODE_ENV === "development" || !process.env.VERCEL;
    
    let executablePath = null;
    if (!isLocal) {
        // In Vercel, we need to use the sparticuz chromium binary
        executablePath = await chromium.executablePath();
    } else {
        // Locally, try to find Chrome or fall back to standard puppeteer if installed
        executablePath = process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
                         process.platform === 'linux' ? '/usr/bin/google-chrome' :
                         '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }

    browser = await puppeteer.launch({
      args: isLocal ? ['--no-sandbox', '--disable-setuid-sandbox'] : chromium.args,
      defaultViewport: (chromium as any).defaultViewport || { width: 1920, height: 1080 },
      executablePath: executablePath || undefined,
      headless: isLocal ? true : (chromium as any).headless,
    });

    const page = await browser.newPage();
    
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });
    
    // Use a realistic user agent
    await page.setUserAgent(new UserAgent({ deviceCategory: 'desktop' }).toString());

    // Go to Amazon URL and wait until the DOM is mostly loaded
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Extract Title
    const name = await page.evaluate(() => {
        const titleEl = document.querySelector('#productTitle') || document.querySelector('h1');
        return titleEl ? titleEl.textContent?.trim() : null;
    });

    
    // Extract Price
    let priceStr = await page.evaluate(() => {
        // Try multiple selectors
        const priceWhole = document.querySelector('.a-price-whole');
        if (priceWhole) {
            const fraction = document.querySelector('.a-price-fraction')?.textContent || '00';
            return priceWhole.textContent?.trim().replace(/[^0-9]/g, '') + '.' + fraction;
        }
        
        const offscreen = document.querySelector('.a-price .a-offscreen') || 
                          document.querySelector('#priceblock_ourprice');
        return offscreen ? offscreen.textContent?.trim() : null;
    });

    // Fallback: If price is hidden because of "Not available in location" or "See All Buying Options"
    // we can extract it from the raw HTML text (Amazon leaves it in scripts/JSONs).
    if (!priceStr) {
        const html = await page.content();
        
        // Sometimes listed in twister or internal JSON states as "priceAmount"
        const amountMatches = html.match(/"priceAmount"\s*:\s*([\d\.]+)/g);
        if (amountMatches && amountMatches.length > 0) {
             const vals = amountMatches.map(m => parseFloat(m.match(/[\d\.]+/)[0])).filter(v => !isNaN(v));
             if (vals.length > 0) {
                 priceStr = Math.max(...vals).toString();
             }
        }
        
        // Final fallback: regex match high-value prices in the raw HTML
        if (!priceStr) {
            const rawPrices = html.match(/\$[1-9][\d]{0,2}(?:,[\d]{3})*\.[\d]{2}/g);
            if (rawPrices && rawPrices.length > 0) {
                 // For laptops/electronics, filter out cheap accessories disguised as the main price
                 const highPrices = rawPrices.map(p => parseFloat(p.replace(/[^\d\.]/g, ''))).filter(p => p > 100);
                 if (highPrices.length > 0) {
                      // Take the most common price or the minimum valid price
                      priceStr = Math.min(...highPrices).toString();
                 }
            }
        }
    }


    // Extract Image
    const imageUrl = await page.evaluate(() => {
        const img = document.querySelector('#landingImage') || 
                    document.querySelector('#imgBlkFront') || 
                    document.querySelector('img[data-old-hires]');
        return img ? (img.getAttribute('src') || null) : null;
    });

    // Extract Availability
    const available = await page.evaluate(() => {
        return !document.querySelector('#outOfStock') && !document.querySelector('.availability-out-of-stock');
    });

    return {
      name: name?.replace(/\s+/g, ' ') || "Unknown Product",
      price: parsePrice(priceStr),
      currency: "USD",
      imageUrl: imageUrl,
      available: available,
    };
  } catch (error) {
    console.error("Amazon scrape error:", error);
    // Fall back to Axios if Puppeteer crashes (unlikely but good for safety)
    return scrapeGeneric(url);
  } finally {
    if (browser !== null) {
      await browser.close().catch(console.error);
    }
  }
};

// eBay scraper
export const scrapeEbay = async (url: string): Promise<ScrapedProduct> => {
  try {
    const response = await axios.get(url, {
      headers: getRandomHeaders(),
      timeout: 15000,
    });
    const $ = cheerio.load(response.data);

    const name = $('[itemprop="name"]').text().trim() ||
                $('#itemTitle').text().trim() ||
                $('.x-item-title__mainTitle').text().trim() ||
                $("h1").first().text().trim();

    let price: number | null = null;
    const priceStr = $('[itemprop="price"]').attr("content") ||
                     $('.x-price-primary').text() ||
                     $('#mm-saleDscPrc').text() ||
                     $('#prcIsum').text();
    price = parsePrice(priceStr);

    const imageUrl = $('#icImg').attr("src") ||
                     $('.zoom-viewport img').attr("src") ||
                     $('[itemprop="image"] img').attr("src") ||
                     null;

    const available = !$('.sold-out').length && !$('.endedListing').length;

    return {
      name: name || "Unknown Product",
      price,
      currency: "USD",
      imageUrl,
      available,
    };
  } catch (error) {
    console.error("eBay scrape error:", error);
    return { name: "Error fetching product", price: null, currency: "USD", imageUrl: null, available: false };
  }
};

// Generic scraper for unknown sites - tries common patterns
export const scrapeGeneric = async (url: string): Promise<ScrapedProduct> => {
  try {
    const response = await axios.get(url, {
      headers: getRandomHeaders(),
      timeout: 15000,
    });
    const $ = cheerio.load(response.data);

    let jsonData: { name?: string; price?: number; image?: string } = {};
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}");
        if (data["@type"] === "Product" || Array.isArray(data)) {
          const product = Array.isArray(data)
            ? data.find((d: { "@type"?: string }) => d["@type"] === "Product")
            : data;
          if (product) {
            jsonData = {
              name: product.name,
              price: product.offers?.price || product.price,
              image: Array.isArray(product.image) ? product.image[0] : product.image,
            };
          }
        }
      } catch {}
    });

    const name =
      jsonData.name ||
      $('[itemprop="name"]').text().trim() ||
      $('h1').first().text().trim() ||
      $('.product-title').text().trim() ||
      $('.product-name').text().trim() ||
      $('#product-title').text().trim() ||
      "Unknown Product";

    let price: number | null = jsonData.price || null;
    if (!price) {
      const priceStr =
        $('[itemprop="price"]').attr("content") ||
        $('[itemprop="price"]').text() ||
        $('.price').first().text() ||
        $('.product-price').text() ||
        $('.current-price').text() ||
        $('#price').text();
      price = parsePrice(priceStr);
    }

    const imageUrl =
      jsonData.image ||
      $('[itemprop="image"] img').attr("src") ||
      $('.product-image img').attr("src") ||
      $('#product-image img').attr("src") ||
      $('img[itemprop="image"]').attr("src") ||
      null;

    const available = !$('[itemprop="availability"]').attr("content")?.includes("OutOfStock");

    return {
      name,
      price,
      currency: "USD",
      imageUrl,
      available,
    };
  } catch (error) {
    console.error("Generic scrape error:", error);
    return { name: "Error fetching product", price: null, currency: "USD", imageUrl: null, available: false };
  }
};

export const scrapeWalmart = async (url: string): Promise<ScrapedProduct> => {
  return {
    name: "Walmart requires manual price check",
    price: null,
    currency: "USD",
    imageUrl: null,
    available: true,
  };
};

export const scrapeTarget = async (url: string): Promise<ScrapedProduct> => {
  return {
    name: "Target requires manual price check",
    price: null,
    currency: "USD",
    imageUrl: null,
    available: true,
  };
};

export const scrapeBestBuy = async (url: string): Promise<ScrapedProduct> => {
  return {
    name: "Best Buy requires manual price check",
    price: null,
    currency: "USD",
    imageUrl: null,
    available: true,
  };
};

export const scrapeProduct = async (url: string): Promise<{ product: ScrapedProduct; store: Store }> => {
  const store = detectStore(url);

  let product: ScrapedProduct;
  switch (store) {
    case "AMAZON":
      product = await scrapeAmazon(url);
      break;
    case "EBAY":
      product = await scrapeEbay(url);
      break;
    case "WALMART":
    case "TARGET":
    case "BESTBUY":
      product = {
        name: `${store.charAt(0) + store.slice(1).toLowerCase()} requires manual price check`,
        price: null,
        currency: "USD",
        imageUrl: null,
        available: true,
      };
      break;
    default:
      product = await scrapeGeneric(url);
  }

  return { product, store };
};

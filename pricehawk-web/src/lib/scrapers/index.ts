import axios from "axios";
import * as cheerio from "cheerio";
import UserAgent from "user-agents";

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

// Dedicated API Scraper built for bypasses: Proxies through ScraperAPI
export const scrapeAmazon = async (url: string): Promise<ScrapedProduct> => {
  try {
    const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "0c3ff44474208a0dcdbcd6e61fbd2958"; 
    
    // ScraperAPI completely masks our Vercel IP as a US residential user allowing us 
    // to bypass the "unshippable location" issue that was hiding the BuyBox price.
    const targetUrl = encodeURIComponent(url);
    const proxyUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${targetUrl}&country_code=us`;

    const response = await axios.get(proxyUrl, { timeout: 30000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // Title
    const name = $('#productTitle').text().trim() || $('h1').text().trim();

    // Price
    let priceStr: string | null = null;
    
    const priceWhole = $('.a-price-whole').first().text().trim();
    if (priceWhole) {
        const fraction = $('.a-price-fraction').first().text().trim() || '00';
        priceStr = priceWhole.replace(/[^0-9]/g, '') + '.' + fraction.replace(/[^0-9]/g, '');
    }

    if (!priceStr) {
        const offscreen = $('#corePriceDisplay_desktop_feature_div .a-offscreen').first().text().trim() || 
                          $('#priceblock_ourprice').text().trim();
        if (offscreen) priceStr = offscreen.replace(/[^0-9\.]/g, '');
    }

    if (!priceStr) {
        // Fallback: raw javascript object variables
        const jsonMatches = html.match(/"priceAmount"\s*:\s*([\d\.]+)/) || html.match(/"displayPrice"\s*:\s*"[^0-9]*([\d\.,]+)"/);
        if (jsonMatches && jsonMatches[1]) {
             priceStr = jsonMatches[1].replace(/[^\d\.]/g, '');
        } else {
             const apexMatch = html.match(/class="a-offscreen">\$([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/);
             if (apexMatch && apexMatch[1]) priceStr = apexMatch[1].replace(/[^\d\.]/g, '');
        }
    }

    // Image
    const imageUrl = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src') || null;
    
    // Auth
    const available = !$('#outOfStock').length && !$('.availability-out-of-stock').length;

    return {
      name: name.replace(/\s+/g, ' ') || "Unknown Product",
      price: parsePrice(priceStr),
      currency: "USD",
      imageUrl: imageUrl,
      available: available,
    };
  } catch (error) {
    console.error("Amazon ScraperAPI error:", error);
    return scrapeGeneric(url);
  }
};

// eBay scraper
export const scrapeEbay = async (url: string): Promise<ScrapedProduct> => {
  try {
    const response = await axios.get(url, { headers: getRandomHeaders(), timeout: 15000 });
    const $ = cheerio.load(response.data);

    const name = $('[itemprop="name"]').text().trim() || $('#itemTitle').text().trim() || $("h1").first().text().trim();
    const priceStr = $('[itemprop="price"]').attr("content") || $('.x-price-primary').text() || $('#mm-saleDscPrc').text() || $('#prcIsum').text();
    const imageUrl = $('#icImg').attr("src") || $('.zoom-viewport img').attr("src") || null;
    const available = !$('.sold-out').length && !$('.endedListing').length;

    return { name: name || "Unknown Product", price: parsePrice(priceStr), currency: "USD", imageUrl, available };
  } catch (error) {
    return scrapeGeneric(url);
  }
};

export const scrapeGeneric = async (url: string): Promise<ScrapedProduct> => {
  try {
    const response = await axios.get(url, { headers: getRandomHeaders(), timeout: 15000 });
    const $ = cheerio.load(response.data);

    let priceStr = $('[itemprop="price"]').attr("content") || $('.price').first().text() || $('.current-price').text();
    const name = $('h1').first().text().trim() || "Unknown Product";
    const imageUrl = $('[itemprop="image"] img').attr("src") || $('.product-image img').attr("src") || null;

    return { name, price: parsePrice(priceStr), currency: "USD", imageUrl, available: true };
  } catch (error) {
    return { name: "Error fetching product", price: null, currency: "USD", imageUrl: null, available: false };
  }
};

export const scrapeWalmart = async (url: string): Promise<ScrapedProduct> => ({ name: "Walmart requires manual check", price: null, currency: "USD", imageUrl: null, available: true });
export const scrapeTarget = async (url: string): Promise<ScrapedProduct> => ({ name: "Target requires manual check", price: null, currency: "USD", imageUrl: null, available: true });
export const scrapeBestBuy = async (url: string): Promise<ScrapedProduct> => ({ name: "Best Buy requires manual check", price: null, currency: "USD", imageUrl: null, available: true });

export const scrapeProduct = async (url: string): Promise<{ product: ScrapedProduct; store: Store }> => {
  const store = detectStore(url);
  let product: ScrapedProduct;
  switch (store) {
    case "AMAZON": product = await scrapeAmazon(url); break;
    case "EBAY": product = await scrapeEbay(url); break;
    case "WALMART": case "TARGET": case "BESTBUY":
      product = { name: `Requires manual price check`, price: null, currency: "USD", imageUrl: null, available: true };
      break;
    default: product = await scrapeGeneric(url);
  }
  return { product, store };
};

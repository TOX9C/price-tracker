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
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
};

const parsePrice = (priceStr: string): number | null => {
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

// Amazon scraper
export const scrapeAmazon = async (url: string): Promise<ScrapedProduct> => {
  try {
    const response = await axios.get(url, {
      headers: getRandomHeaders(),
      timeout: 15000,
    });
    const $ = cheerio.load(response.data);

    const name = $("#productTitle").text().trim() || $("h1").first().text().trim();

    let price: number | null = null;
    const priceWhole = $(".a-price-whole").text();
    const priceFraction = $(".a-price-fraction").text();
    if (priceWhole) {
      price = parseFloat(`${priceWhole.replace(/[^0-9]/g, "")}.${priceFraction || "00"}`);
    }
    if (!price) {
      const priceStr = $(".a-offscreen").first().text() || $("#priceblock_ourprice").text() || $("#priceblock_dealprice").text();
      price = parsePrice(priceStr);
    }

    const imageUrl = $("#landingImage").attr("src") || $("#imgBlkFront").attr("src") || $('img[data-old-hires]').attr("data-old-hires") || null;

    const available = !$("#outOfStock").length && !$('.availability-out-of-stock').length;

    return {
      name: name || "Unknown Product",
      price,
      currency: "USD",
      imageUrl,
      available,
    };
  } catch (error) {
    console.error("Amazon scrape error:", error);
    return { name: "Error fetching product", price: null, currency: "USD", imageUrl: null, available: false };
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

    // eBay product title
    const name = $('[itemprop="name"]').text().trim() ||
                $('#itemTitle').text().trim() ||
                $('.x-item-title__mainTitle').text().trim() ||
                $("h1").first().text().trim();

    // eBay price
    let price: number | null = null;
    const priceStr = $('[itemprop="price"]').attr("content") ||
                     $('.x-price-primary').text() ||
                     $('#mm-saleDscPrc').text() ||
                     $('#prcIsum').text();
    price = parsePrice(priceStr);

    // eBay image
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

    // Try JSON-LD structured data first (most reliable)
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

    // Product name - try multiple strategies
    const name =
      jsonData.name ||
      $('[itemprop="name"]').text().trim() ||
      $('h1').first().text().trim() ||
      $('.product-title').text().trim() ||
      $('.product-name').text().trim() ||
      $('#product-title').text().trim() ||
      "Unknown Product";

    // Price - try multiple strategies
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

    // Image - try multiple strategies
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

// Stub functions for blocked sites - returns error message
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

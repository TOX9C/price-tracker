import * as cheerio from 'cheerio';
import { z } from 'zod';

export interface ExtractedPrice {
  price: number | null;
  currency: string | null;
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown';
  name?: string;
  image?: string;
  confidence: 'high' | 'medium' | 'low';
}

const ProductSchema = z.object({
  '@type': z.union([z.literal('Product'), z.literal('product')]).optional(),
  offers: z.union([
    z.object({
      '@type': z.literal('Offer').optional(),
      price: z.union([z.number(), z.string()]).optional(),
      priceCurrency: z.string().optional(),
      availability: z.string().optional(),
      priceValidUntil: z.string().optional(),
    }),
    z.array(z.object({
      '@type': z.literal('Offer').optional(),
      price: z.union([z.number(), z.string()]).optional(),
      priceCurrency: z.string().optional(),
      availability: z.string().optional(),
    })),
  ]).optional(),
  name: z.string().optional(),
  image: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough();

// Reasonable price bounds - reject obvious errors
const MIN_REASONABLE_PRICE = 0.01;
const MAX_REASONABLE_PRICE = 50000;

export function extractJsonLd(html: string): ExtractedPrice | null {
  const $ = cheerio.load(html);
  const jsonLdScripts = $('script[type="application/ld+json"]');

  const candidates: ExtractedPrice[] = [];

  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const scriptContent = $(jsonLdScripts[i]).html();
      if (!scriptContent) continue;

      let data = JSON.parse(scriptContent);

      // Handle @graph format
      if (data['@graph']) {
        const productData = data['@graph'].find((item: unknown) => {
          const parsed = ProductSchema.safeParse(item);
          return parsed.success && parsed.data.offers;
        });
        if (productData) {
          data = productData;
        }
      }

      const parsed = ProductSchema.safeParse(data);
      if (!parsed.success) continue;

      const product = parsed.data;
      if (!product.offers) continue;

      // Handle multiple offers - pick the one with the lowest price
      const offersList = Array.isArray(product.offers) ? product.offers : [product.offers];

      for (const offers of offersList) {
        if (!offers.price) continue;

        const price = typeof offers.price === 'string'
          ? parseFloat(offers.price.replace(/[^0-9.]/g, ''))
          : offers.price;

        if (isNaN(price)) continue;

        // Validate price is in reasonable range
        if (price < MIN_REASONABLE_PRICE || price > MAX_REASONABLE_PRICE) {
          continue;
        }

        const availability = parseAvailability(offers.availability);
        const image = Array.isArray(product.image) ? product.image[0] : product.image;

        candidates.push({
          price,
          currency: offers.priceCurrency || null,
          availability,
          name: product.name,
          image: image || undefined,
          confidence: 'high',
        });
      }
    } catch {
      continue;
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Return the candidate with the lowest price (best deal)
  // But filter out prices that seem too low compared to others
  candidates.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

  // If the lowest price is more than 50% below the median, it might be wrong
  // In that case, use the median price instead
  if (candidates.length > 1) {
    const medianIndex = Math.floor(candidates.length / 2);
    const medianPrice = candidates[medianIndex].price ?? 0;
    const lowestPrice = candidates[0].price ?? 0;

    // If lowest is more than 50% below median, return median
    if (lowestPrice < medianPrice * 0.5) {
      return candidates[medianIndex];
    }
  }

  return candidates[0];
}

function parseAvailability(availability: string | undefined): 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown' {
  if (!availability) return 'unknown';

  const normalized = availability.toLowerCase();

  if (normalized.includes('instock') || normalized.includes('in_stock') || normalized.includes('available')) {
    return 'in_stock';
  }
  if (normalized.includes('outofstock') || normalized.includes('out_of_stock') || normalized.includes('soldout')) {
    return 'out_of_stock';
  }
  if (normalized.includes('discontinued') || normalized.includes('preorder')) {
    return 'out_of_stock';
  }

  return 'unknown';
}

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

export function extractJsonLd(html: string): ExtractedPrice | null {
  const $ = cheerio.load(html);
  const jsonLdScripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const scriptContent = $(jsonLdScripts[i]).html();
      if (!scriptContent) continue;

      let data = JSON.parse(scriptContent);

      if (data['@graph']) {
        data = data['@graph'].find((item: unknown) => {
          const parsed = ProductSchema.safeParse(item);
          return parsed.success && parsed.data.offers;
        }) || data;
      }

      const parsed = ProductSchema.safeParse(data);
      if (!parsed.success) continue;

      const product = parsed.data;
      if (!product.offers) continue;

      const offers = Array.isArray(product.offers)
        ? product.offers[0]
        : product.offers;

      if (!offers.price) continue;

      const price = typeof offers.price === 'string'
        ? parseFloat(offers.price.replace(/[^0-9.]/g, ''))
        : offers.price;

      if (isNaN(price)) continue;

      const availability = parseAvailability(offers.availability);

      return {
        price,
        currency: offers.priceCurrency || null,
        availability,
        name: product.name,
        image: Array.isArray(product.image) ? product.image[0] : product.image,
        confidence: 'high',
      };
    } catch {
      continue;
    }
  }

  return null;
}

function parseAvailability(availability: string | undefined): 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown' {
  if (!availability) return 'unknown';

  const normalized = availability.toLowerCase();

  if (normalized.includes('instock') || normalized.includes('in_stock')) {
    return 'in_stock';
  }
  if (normalized.includes('outofstock') || normalized.includes('out_of_stock')) {
    return 'out_of_stock';
  }
  if (normalized.includes('soldout') || normalized.includes('discontinued')) {
    return 'out_of_stock';
  }

  return 'unknown';
}

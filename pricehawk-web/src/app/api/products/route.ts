import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeProduct } from "@/lib/scrapers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { userId: session.user.id },
      include: {
        listings: {
          include: {
            priceHistory: {
              orderBy: { checkedAt: "desc" },
              take: 20,
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, productId, name, price, imageUrl, store: extStore } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check if URL already exists in user's listings
    const existingListing = await prisma.storeListing.findUnique({
      where: { url },
      include: { product: true },
    });

    if (existingListing) {
      // Only return error if it belongs to this user
      if (existingListing.product.userId === session.user.id) {
        return NextResponse.json(
          { error: "This URL is already being tracked", product: existingListing.product },
          { status: 409 }
        );
      }
      // URL tracked by another user - treat as not found for security
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let scraped, store;

    // Use extension data if available (avoids bot protection on Target/BestBuy)
    if (name && price !== undefined && price !== null) {
      scraped = { name, price, imageUrl, currency: "USD" };
      store = extStore || "OTHER";
    } else {
      // Fallback to server-side scraping if no extension data
      const result = await scrapeProduct(url);
      scraped = result.product;
      store = result.store;
    }

    // If productId provided, add listing to existing product
    if (productId) {
      // Verify ownership
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct || existingProduct.userId !== session.user.id) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const listing = await prisma.storeListing.create({
        data: {
          productId,
          url,
          store,
          imageUrl: scraped.imageUrl,
          priceHistory: scraped.price
            ? {
                create: {
                  price: scraped.price,
                  currency: scraped.currency,
                },
              }
            : undefined,
        },
        include: {
          priceHistory: { orderBy: { checkedAt: "desc" } },
        },
      });

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          listings: {
            include: {
              priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
            },
          },
        },
      });

      return NextResponse.json({ product });
    }

    // Create new product with first listing
    const newProduct = await prisma.product.create({
      data: {
        userId: session.user.id,
        name: scraped.name,
        imageUrl: scraped.imageUrl,
        listings: {
          create: {
            url,
            store,
            imageUrl: scraped.imageUrl,
            priceHistory: scraped.price
              ? {
                  create: {
                    price: scraped.price,
                    currency: scraped.currency,
                  },
                }
              : undefined,
          },
        },
      },
      include: {
        listings: {
          include: {
            priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
          },
        },
      },
    });

    return NextResponse.json({ product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    const message = error instanceof Error ? error.message : "Failed to add product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

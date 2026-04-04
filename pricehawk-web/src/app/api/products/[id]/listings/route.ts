import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeProduct } from "@/lib/scrapers";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check product exists and belongs to user
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if URL already exists
    const existingListing = await prisma.storeListing.findUnique({
      where: { url },
    });

    if (existingListing) {
      return NextResponse.json(
        { error: "This URL is already being tracked" },
        { status: 409 }
      );
    }

    const { product: scraped, store } = await scrapeProduct(url);

    const listing = await prisma.storeListing.create({
      data: {
        productId: id,
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

    // Return updated product with all listings
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        listings: {
          include: {
            priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
          },
        },
      },
    });

    return NextResponse.json({ product: updatedProduct, listing });
  } catch (error) {
    console.error("Error adding listing:", error);
    const message = error instanceof Error ? error.message : "Failed to add listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

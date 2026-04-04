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

    const product = await prisma.product.findUnique({
      where: { id },
      include: { listings: true },
    });

    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Refresh all listings for this product
    for (const listing of product.listings) {
      try {
        const { product: scraped } = await scrapeProduct(listing.url);

        // Update listing info and add price history if price found
        if (scraped.price) {
          await prisma.storeListing.update({
            where: { id: listing.id },
            data: {
              imageUrl: scraped.imageUrl,
              priceHistory: {
                create: {
                  price: scraped.price,
                  currency: scraped.currency,
                },
              },
            },
          });
        } else {
          // Just update the image if no price
          await prisma.storeListing.update({
            where: { id: listing.id },
            data: { imageUrl: scraped.imageUrl },
          });
        }
      } catch (e) {
        console.error(`Failed to refresh listing ${listing.id}:`, e);
      }
    }

    // Return updated product
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

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error("Error refreshing product:", error);
    return NextResponse.json({ error: "Failed to refresh product" }, { status: 500 });
  }
}

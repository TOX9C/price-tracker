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

    const listing = await prisma.storeListing.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!listing || listing.product.userId !== session.user.id) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const { product: scraped } = await scrapeProduct(listing.url);

    // Update listing and add price history
    if (scraped.price) {
      await prisma.storeListing.update({
        where: { id },
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
      await prisma.storeListing.update({
        where: { id },
        data: { imageUrl: scraped.imageUrl },
      });
    }

    // Return updated product
    const product = await prisma.product.findUnique({
      where: { id: listing.productId },
      include: {
        listings: {
          include: {
            priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
          },
        },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error refreshing listing:", error);
    return NextResponse.json({ error: "Failed to refresh listing" }, { status: 500 });
  }
}

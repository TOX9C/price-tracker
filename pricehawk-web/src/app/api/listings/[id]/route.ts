import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get listing to find product ID and verify ownership
    const listing = await prisma.storeListing.findUnique({
      where: { id },
      select: { productId: true, product: { select: { userId: true } } },
    });

    if (!listing || listing.product.userId !== session.user.id) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Delete the listing
    await prisma.storeListing.delete({ where: { id } });

    // Check if product has no more listings, if so delete product
    const remainingListings = await prisma.storeListing.count({
      where: { productId: listing.productId },
    });

    if (remainingListings === 0) {
      await prisma.product.delete({ where: { id: listing.productId } });
      return NextResponse.json({ success: true, productDeleted: true });
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

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}

export interface PriceHistory {
  id: string;
  price: number;
  currency: string;
  checkedAt: string;
}

export interface StoreListing {
  id: string;
  url: string;
  store: string;
  imageUrl: string | null;
  priceHistory: PriceHistory[];
}

export interface Product {
  id: string;
  name: string | null;
  imageUrl: string | null;
  listings: StoreListing[];
  createdAt: string;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const storeNames: Record<string, string> = {
  AMAZON: "Amazon",
  WALMART: "Walmart",
  TARGET: "Target",
  BESTBUY: "Best Buy",
  EBAY: "eBay",
  COSTCO: "Costco",
  GAMESTOP: "GameStop",
  NEWEGG: "Newegg",
  BH: "B&H Photo",
};

export function getStoreName(store: string): string {
  return storeNames[store] || store;
}

const storeColors: Record<string, string> = {
  AMAZON: "#ff9900",
  WALMART: "#0071ce",
  TARGET: "#cc0000",
  BESTBUY: "#0046be",
  EBAY: "#e53238",
  COSTCO: "#e31837",
  GAMESTOP: "#e41d2d",
  NEWEGG: "#f47b20",
  BH: "#c41230",
};

export function getStoreColor(store: string): string {
  return storeColors[store] || "#888";
}

export function getCurrentPrice(listing: StoreListing): PriceHistory | undefined {
  return listing.priceHistory?.[0];
}

export function getBestListing(product: Product): StoreListing | null {
  const listingsWithPrice = product.listings.filter(
    (l) => l.priceHistory && l.priceHistory.length > 0
  );
  if (listingsWithPrice.length === 0) return null;
  return listingsWithPrice.reduce((best, listing) => {
    const bestPrice = best.priceHistory[0]?.price ?? Infinity;
    const listingPrice = listing.priceHistory[0]?.price ?? Infinity;
    return listingPrice < bestPrice ? listing : best;
  });
}

export function getPriceChange(listing: StoreListing): { change: number; percent: number } | null {
  if (!listing.priceHistory || listing.priceHistory.length < 2) return null;
  const current = listing.priceHistory[0].price;
  const previous = listing.priceHistory[1].price;
  const change = current - previous;
  const percent = parseFloat(((change / previous) * 100).toFixed(1));
  return { change, percent };
}

export function getChartData(listings: StoreListing[]): Record<string, string | number | null>[] {
  const allDates = new Set<string>();
  listings.forEach((listing) => {
    listing.priceHistory.forEach((p) => {
      allDates.add(formatDateShort(p.checkedAt));
    });
  });

  const sortedDates = Array.from(allDates).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return sortedDates.map((date) => {
    const dataPoint: Record<string, string | number | null> = { date };
    listings.forEach((listing) => {
      const priceEntry = listing.priceHistory.find(
        (p) => formatDateShort(p.checkedAt) === date
      );
      dataPoint[listing.store] = priceEntry ? priceEntry.price : null;
    });
    return dataPoint;
  });
}

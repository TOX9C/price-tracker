/*
  Warnings:

  - You are about to drop the column `productId` on the `PriceHistory` table. All the data in the column will be lost.
  - You are about to drop the column `store` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Product` table. All the data in the column will be lost.
  - Added the required column `listingId` to the `PriceHistory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "StoreListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceHistory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "StoreListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PriceHistory" ("checkedAt", "currency", "id", "price") SELECT "checkedAt", "currency", "id", "price" FROM "PriceHistory";
DROP TABLE "PriceHistory";
ALTER TABLE "new_PriceHistory" RENAME TO "PriceHistory";
CREATE INDEX "PriceHistory_listingId_idx" ON "PriceHistory"("listingId");
CREATE INDEX "PriceHistory_checkedAt_idx" ON "PriceHistory"("checkedAt");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "id", "imageUrl", "name", "updatedAt") SELECT "createdAt", "id", "imageUrl", "name", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_name_idx" ON "Product"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StoreListing_url_key" ON "StoreListing"("url");

-- CreateIndex
CREATE INDEX "StoreListing_productId_idx" ON "StoreListing"("productId");

-- CreateIndex
CREATE INDEX "StoreListing_store_idx" ON "StoreListing"("store");

-- CreateIndex
CREATE INDEX "StoreListing_url_idx" ON "StoreListing"("url");

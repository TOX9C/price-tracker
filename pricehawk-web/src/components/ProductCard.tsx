"use client";

import Link from "next/link";
import { type Product, getBestListing, formatPrice, getStoreName } from "@/lib/utils/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const bestListing = getBestListing(product);
  const bestPrice = bestListing?.priceHistory[0];

  return (
    <Link
      href={`/dashboard/${product.id}`}
      style={{
        display: "block",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        padding: "20px",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s ease",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* Product image */}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name || "Product"}
            style={{
              width: "56px",
              height: "56px",
              objectFit: "contain",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-elevated)",
              padding: "6px",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Product name */}
          <div
            style={{
              fontWeight: "600",
              fontSize: "14px",
              color: "var(--text-primary)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontFamily: "var(--font-body)",
            }}
          >
            {product.name || "Unknown Product"}
          </div>

          {/* Store count */}
          <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent)",
                padding: "2px 8px",
                borderRadius: "100px",
                fontSize: "11px",
                fontWeight: "600",
                border: "1px solid var(--border-accent)",
              }}
            >
              {product.listings.length} store{product.listings.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Best price */}
      <div
        style={{
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        {bestPrice ? (
          <>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "500" }}>
              Best: {getStoreName(bestListing!.store)}
            </span>
            <span
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--accent)",
                fontFamily: "var(--font-body)",
                letterSpacing: "-0.02em",
              }}
            >
              {formatPrice(bestPrice.price)}
            </span>
          </>
        ) : (
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>No prices yet</span>
        )}
      </div>
    </Link>
  );
}

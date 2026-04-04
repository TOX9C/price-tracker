"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/components/DashboardHeader";
import {
  type Product,
  formatPrice,
  formatDateShort,
  getStoreName,
  getStoreColor,
  getBestListing,
  getCurrentPrice,
  getPriceChange,
  getChartData,
} from "@/lib/utils/product";

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [addStoreUrl, setAddStoreUrl] = useState("");

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setError("Product not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProduct(data.product);
      setError(null);
    } catch {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const refreshProduct = async () => {
    setRefreshingId("all");
    try {
      const res = await fetch(`/api/products/${id}/refresh`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setProduct(data.product);
    } catch {
      /* ignore */
    } finally {
      setRefreshingId(null);
    }
  };

  const refreshListing = async (listingId: string) => {
    setRefreshingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}/refresh`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setProduct(data.product);
    } catch {
      /* ignore */
    } finally {
      setRefreshingId(null);
    }
  };

  const deleteProduct = async () => {
    if (!confirm("Remove this product from tracking?")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      router.push("/dashboard");
    } catch {
      /* ignore */
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm("Remove this store listing?")) return;
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.productDeleted) {
        router.push("/dashboard");
      } else if (data.product) {
        setProduct(data.product);
      }
    } catch {
      /* ignore */
    }
  };

  const addStoreToProduct = async () => {
    if (!addStoreUrl.trim()) return;
    try {
      const res = await fetch(`/api/products/${id}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: addStoreUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add store");
      } else {
        setProduct(data.product);
        setShowAddStoreModal(false);
        setAddStoreUrl("");
      }
    } catch {
      setError("Failed to add store");
    }
  };

  const btnBase: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    fontWeight: 600,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} className="grid-bg">
        <DashboardHeader />
        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "16px", color: "var(--text-muted)" }}>Loading product...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} className="grid-bg">
        <DashboardHeader />
        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "16px", color: "var(--danger)", marginBottom: "16px" }}>{error || "Product not found"}</div>
            <Link href="/dashboard" style={{ color: "var(--accent)", fontWeight: "600", textDecoration: "none" }}>Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  const bestListing = getBestListing(product);
  const bestPrice = bestListing?.priceHistory[0];
  const chartData = getChartData(product.listings);
  const hasChart = chartData.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} className="grid-bg">
      <DashboardHeader />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Back button */}
        <Link
          href="/dashboard"
          className="animate-fade-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "500",
            marginBottom: "20px",
            transition: "color 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Product Header Card */}
        <div
          className="animate-fade-up"
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "24px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name || "Product"}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "contain",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-elevated)",
                  padding: "8px",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  margin: "0 0 8px",
                  lineHeight: 1.4,
                  fontFamily: "var(--font-body)",
                }}
              >
                {product.name || "Unknown Product"}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    padding: "3px 10px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "1px solid var(--border-accent)",
                  }}
                >
                  {product.listings.length} store{product.listings.length !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Added {formatDateShort(product.createdAt)}
                </span>
              </div>
            </div>

            {/* Best Price */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {bestPrice ? (
                <>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "500" }}>
                    Best: {getStoreName(bestListing!.store)}
                  </div>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      color: "var(--accent)",
                      fontFamily: "var(--font-body)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      marginTop: "2px",
                    }}
                  >
                    {formatPrice(bestPrice.price)}
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>No prices yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Store Listings */}
        <div
          className="animate-fade-up delay-1"
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "20px",
            marginBottom: "16px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Store Listings
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowAddStoreModal(true)}
                style={{ ...btnBase, padding: "7px 14px", background: "var(--accent)", color: "var(--bg-primary)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Store
              </button>
              <button
                onClick={refreshProduct}
                disabled={refreshingId === "all"}
                style={{ ...btnBase, padding: "7px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
                {refreshingId === "all" ? "Refreshing..." : "Refresh All"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            {product.listings.map((listing) => {
              const currentPrice = getCurrentPrice(listing);
              const priceChange = getPriceChange(listing);
              const isBest = bestListing?.id === listing.id;

              return (
                <div
                  key={listing.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    background: isBest ? "rgba(0,229,155,0.06)" : "var(--bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    border: isBest ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: getStoreColor(listing.store),
                      boxShadow: `0 0 6px ${getStoreColor(listing.store)}40`,
                      flexShrink: 0,
                    }}
                  />
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontWeight: "600",
                      minWidth: "72px",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                    }}
                  >
                    {getStoreName(listing.store)}
                  </a>
                  {currentPrice ? (
                    <span style={{ fontWeight: "600", fontSize: "15px", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                      {formatPrice(currentPrice.price)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>No price</span>
                  )}
                  {priceChange && (
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: priceChange.change < 0 ? "var(--accent)" : priceChange.change > 0 ? "var(--danger)" : "var(--text-muted)",
                        background: priceChange.change < 0 ? "var(--accent-subtle)" : priceChange.change > 0 ? "var(--danger-glow)" : "transparent",
                        padding: "2px 8px",
                        borderRadius: "100px",
                      }}
                    >
                      {priceChange.change < 0 ? "↓" : "↑"}{formatPrice(Math.abs(priceChange.change))} ({priceChange.percent > 0 ? "+" : ""}{priceChange.percent}%)
                    </span>
                  )}
                  {isBest && (
                    <span style={{ fontSize: "10px", background: "var(--accent)", color: "var(--bg-primary)", padding: "2px 8px", borderRadius: "100px", fontWeight: "700", letterSpacing: "0.05em" }}>
                      BEST
                    </span>
                  )}
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => refreshListing(listing.id)}
                    disabled={refreshingId === listing.id}
                    style={{ ...btnBase, padding: "5px 10px", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "12px" }}
                  >
                    {refreshingId === listing.id ? "..." : "Refresh"}
                  </button>
                  {product.listings.length > 1 && (
                    <button
                      onClick={() => deleteListing(listing.id)}
                      style={{ ...btnBase, padding: "5px 10px", background: "transparent", color: "var(--danger)", fontSize: "12px", opacity: 0.7 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Price History Chart */}
        {hasChart && (
          <div
            className="animate-fade-up delay-2"
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              padding: "20px 24px",
              marginBottom: "16px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              Price History
            </h3>
            <div style={{ height: "280px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} tickFormatter={(v) => `$${v}`} axisLine={{ stroke: "var(--border)" }} domain={[(d: number) => Math.floor(d * 0.95), (d: number) => Math.ceil(d * 1.05)]} />
                  <Tooltip
                    formatter={(value) => [typeof value === "number" ? formatPrice(value) : "N/A", ""]}
                    contentStyle={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "var(--shadow-md)" }}
                    itemStyle={{ color: "var(--text-primary)" }}
                    labelStyle={{ color: "var(--text-muted)", marginBottom: "4px" }}
                  />
                  <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: "12px" }} />
                  {product.listings.map((listing) => (
                    <Line key={listing.id} type="monotone" dataKey={listing.store} stroke={getStoreColor(listing.store)} strokeWidth={2} dot={{ fill: getStoreColor(listing.store), strokeWidth: 0, r: 4 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div
          className="animate-fade-up delay-3"
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "20px",
            marginBottom: "40px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>Delete Product</div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Remove this product and all its price history permanently.</div>
            </div>
            <button
              onClick={deleteProduct}
              style={{
                ...btnBase,
                padding: "8px 16px",
                background: "var(--danger-glow)",
                color: "var(--danger)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Delete Product
            </button>
          </div>
        </div>
      </main>

      {/* Add Store Modal */}
      {showAddStoreModal && (
        <div
          className="animate-fade-in"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => { setShowAddStoreModal(false); setAddStoreUrl(""); }}
        >
          <div
            className="animate-fade-up"
            style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: "28px", maxWidth: "480px", width: "90%", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "var(--text-primary)" }}>Add Another Store</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "14px" }}>Enter a URL for the same product from a different retailer.</p>
            <input
              type="url"
              value={addStoreUrl}
              onChange={(e) => setAddStoreUrl(e.target.value)}
              placeholder="Paste product URL from another store..."
              style={{ width: "100%", padding: "13px 16px", background: "var(--bg-input)", border: "1px solid", borderColor: addStoreUrl ? "var(--border-accent)" : "var(--border-hover)", borderRadius: "var(--radius-md)", fontSize: "15px", marginBottom: "20px", boxSizing: "border-box", color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-body)", transition: "border-color 0.2s" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowAddStoreModal(false); setAddStoreUrl(""); }} style={{ ...btnBase, padding: "10px 20px", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "14px" }}>
                Cancel
              </button>
              <button onClick={addStoreToProduct} disabled={!addStoreUrl.trim()} style={{ ...btnBase, padding: "10px 20px", background: addStoreUrl.trim() ? "var(--accent)" : "var(--bg-elevated)", color: addStoreUrl.trim() ? "var(--bg-primary)" : "var(--text-muted)", cursor: addStoreUrl.trim() ? "pointer" : "not-allowed", fontSize: "14px" }}>
                Add Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

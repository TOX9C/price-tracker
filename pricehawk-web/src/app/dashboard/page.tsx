"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import ProductCard from "@/components/ProductCard";
import { type Product } from "@/lib/utils/product";

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setProducts(data.products || []);
      setError(null);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setAddingUrl(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add product");
        if (res.status === 409 && data.product) {
          router.push(`/dashboard/${data.product.id}`);
        }
      } else {
        setUrl("");
        router.push(`/dashboard/${data.product.id}`);
      }
    } catch {
      setError("Failed to add product");
    } finally {
      setAddingUrl(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} className="grid-bg">
      <DashboardHeader />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Add Product Form */}
        <div
          className="animate-fade-up"
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
            marginBottom: "28px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <form onSubmit={addProduct}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste product URL from any store..."
                style={{
                  flex: 1,
                  minWidth: "300px",
                  padding: "13px 16px",
                  background: "var(--bg-input)",
                  border: "1px solid",
                  borderColor: url ? "var(--border-accent)" : "var(--border-hover)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "15px",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  transition: "border-color 0.2s",
                }}
                disabled={addingUrl}
              />
              <button
                type="submit"
                disabled={addingUrl || !url.trim()}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  fontWeight: "700",
                  borderRadius: "var(--radius-md)",
                  cursor: addingUrl || !url.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  border: "none",
                  padding: "13px 28px",
                  background: addingUrl || !url.trim() ? "var(--bg-elevated)" : "var(--accent)",
                  color: addingUrl || !url.trim() ? "var(--text-muted)" : "var(--bg-primary)",
                }}
              >
                {addingUrl ? "Adding..." : "Track Product"}
              </button>
            </div>
          </form>

          {error && (
            <div
              className="animate-slide-down"
              style={{
                marginTop: "14px",
                padding: "11px 16px",
                background: "var(--danger-glow)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--radius-md)",
                color: "var(--danger)",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "14px",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px",
                  height: "114px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }}
              >
                <div className="animate-pulse" style={{ width: "64px", height: "64px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)" }} />
                <div style={{ flex: 1 }}>
                  <div className="animate-pulse" style={{ width: "80%", height: "16px", borderRadius: "10px", background: "var(--bg-elevated)", marginBottom: "8px" }} />
                  <div className="animate-pulse" style={{ width: "40%", height: "14px", borderRadius: "10px", background: "var(--bg-elevated)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div className="animate-pulse" style={{ width: "60px", height: "20px", borderRadius: "10px", background: "var(--bg-elevated)", marginBottom: "8px" }} />
                  <div className="animate-pulse" style={{ width: "80px", height: "14px", borderRadius: "10px", background: "var(--bg-elevated)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div
            className="animate-fade-up delay-1"
            style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius-lg)",
                background: "var(--accent-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div style={{ fontSize: "17px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "500" }}>
              No products tracked yet
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Paste a product URL above to start watching its price
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "14px",
            }}
          >
            {products.map((product, idx) => (
              <div key={product.id} className={`animate-fade-up delay-${Math.min(idx + 1, 4)}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

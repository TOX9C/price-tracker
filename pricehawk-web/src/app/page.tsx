import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        <path d="M10 7v6m-3-3h6" />
      </svg>
    ),
    title: "Multi-Store Tracking",
    desc: "Track the same product across retailers. See the best price at a glance.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 6-10" />
      </svg>
    ),
    title: "Price History",
    desc: "Historical charts reveal trends. Know the right moment to buy.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    title: "Price Alerts",
    desc: "Set target prices and get notified the second a product drops.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    title: "Private & Secure",
    desc: "Your data stays yours. No tracking, no selling your info.",
  },
];

const supportedStores = [
  "Amazon", "Walmart", "Best Buy", "Target", "eBay",
  "Costco", "GameStop", "Newegg", "B&H Photo",
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for casual deal hunters",
    features: [
      "5 products",
      "2 stores per product",
      "Daily price checks",
      "7-day history",
    ],
    cta: "Get Started",
    href: "/signup",
    accent: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    desc: "For serious bargain seekers",
    features: [
      "50 products",
      "Unlimited stores",
      "Hourly price checks",
      "90-day history",
      "Price drop alerts",
    ],
    cta: "Start Pro Trial",
    href: "/signup",
    accent: true,
  },
  {
    name: "Enterprise",
    price: "$29",
    period: "/month",
    desc: "Teams and power users",
    features: [
      "Unlimited products",
      "Unlimited stores",
      "Real-time checks",
      "Full history",
      "API access",
      "Team accounts",
    ],
    cta: "Contact Sales",
    href: "/signup",
    accent: false,
  },
];

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
      }}
      className="grid-bg"
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(0,229,155,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(245,166,35,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(13,15,17,0.8)",
          backdropFilter: "blur(20px) saturate(1.2)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 24px",
          zIndex: 100,
        }}
        className="animate-fade-in"
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <Logo size={32} />
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "700",
                margin: 0,
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                letterSpacing: "-0.02em",
              }}
            >
              PriceHawk
            </h1>
          </Link>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                style={{
                  padding: "9px 22px",
                  background: "var(--accent)",
                  color: "var(--bg-primary)",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "14px",
                  borderRadius: "var(--radius-md)",
                  transition: "all 0.2s",
                }}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    padding: "8px 20px",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "14px",
                    borderRadius: "var(--radius-md)",
                    transition: "color 0.2s",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  style={{
                    padding: "9px 22px",
                    background: "var(--accent)",
                    color: "var(--bg-primary)",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    borderRadius: "var(--radius-md)",
                    transition: "all 0.2s",
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: "72px 24px 48px",
          textAlign: "center",
          maxWidth: "860px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="animate-fade-up"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px 6px 8px",
            background: "var(--accent-subtle)",
            border: "1px solid var(--border-accent)",
            borderRadius: "100px",
            marginBottom: "28px",
            fontSize: "13px",
            color: "var(--accent)",
            fontWeight: "500",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
            }}
          />
          Now tracking 9+ major retailers
        </div>

        <h2
          className="animate-fade-up delay-1"
          style={{
            fontSize: "clamp(40px, 6vw, 68px)",
            fontWeight: "300",
            lineHeight: 1.05,
            marginBottom: "24px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.01em",
          }}
        >
          Never overpay
          <br />
          <span
            style={{
              fontStyle: "italic",
              background: "linear-gradient(135deg, var(--accent) 0%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            for anything
          </span>{" "}
          again.
        </h2>

        <p
          className="animate-fade-up delay-2"
          style={{
            fontSize: "17px",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "36px",
            maxWidth: "500px",
            margin: "0 auto 36px",
            fontWeight: "300",
          }}
        >
          PriceHawk watches products across Amazon, Walmart, Best Buy, and more.
          One dashboard. Every price. Zero effort.
        </p>

        <div
          className="animate-fade-up delay-3"
          style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
        >
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              style={{
                padding: "15px 36px",
                background: "var(--accent)",
                color: "var(--bg-primary)",
                textDecoration: "none",
                fontWeight: "700",
                borderRadius: "var(--radius-md)",
                fontSize: "16px",
                transition: "all 0.2s",
                boxShadow: "0 0 30px rgba(0,229,155,0.2)",
              }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                style={{
                  padding: "15px 36px",
                  background: "var(--accent)",
                  color: "var(--bg-primary)",
                  textDecoration: "none",
                  fontWeight: "700",
                  borderRadius: "var(--radius-md)",
                  fontSize: "16px",
                  transition: "all 0.2s",
                  boxShadow: "0 0 30px rgba(0,229,155,0.2)",
                }}
              >
                Start Tracking — Free
              </Link>
              <Link
                href="/login"
                style={{
                  padding: "15px 36px",
                  background: "transparent",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                  fontWeight: "500",
                  borderRadius: "var(--radius-md)",
                  fontSize: "16px",
                  border: "1px solid var(--border-hover)",
                  transition: "all 0.2s",
                }}
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Mock Dashboard Preview — 2 rows */}
      <section
        className="animate-fade-up delay-4"
        style={{
          maxWidth: "800px",
          margin: "0 auto 60px",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
            boxShadow: "var(--shadow-lg), var(--shadow-glow)",
          }}
        >
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                🎧
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>Sony WH-1000XM5</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>3 stores tracked</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--accent)", fontFamily: "var(--font-body)" }}>$278.00</div>
              <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "500" }}>↓ $50 from peak</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                💻
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--text-primary)" }}>MacBook Air M3</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>2 stores tracked</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--amber)", fontFamily: "var(--font-body)" }}>$1,049.00</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>— stable</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "20px 24px 64px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h3
              className="animate-fade-up"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: "400",
                color: "var(--text-primary)",
                margin: "0 0 10px",
              }}
            >
              Built for{" "}
              <span style={{ fontStyle: "italic", color: "var(--accent)" }}>smart</span> shoppers
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: 0 }}>
              Everything you need to stop leaving money on the table.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`animate-fade-up delay-${i + 1}`}
                style={{
                  padding: "24px",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--accent-subtle)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  {feature.icon}
                </div>
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {feature.title}
                </h4>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "13px", margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browser Extension */}
      <section
        style={{
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "var(--radius-lg)",
              background: "var(--accent-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
          <h3
            className="animate-fade-up"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "30px",
              fontWeight: "400",
              color: "var(--text-primary)",
              margin: "0 0 10px",
            }}
          >
            One-click tracking with our{" "}
            <span style={{ fontStyle: "italic", color: "var(--accent)" }}>browser extension</span>
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", marginBottom: "28px", lineHeight: 1.6, maxWidth: "560px", margin: "0 auto 28px" }}>
            Browse any supported store, click the extension, and the product is instantly added to your dashboard. No copy-pasting URLs.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            {supportedStores.map((store) => (
              <span
                key={store}
                style={{
                  padding: "6px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "100px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  fontWeight: "500",
                }}
              >
                {store}
              </span>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            + generic fallback for any store with visible pricing
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section
        style={{
          padding: "48px 24px 64px",
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,229,155,0.04), transparent)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px", position: "relative" }}>
            <h3
              className="animate-fade-up"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: "400",
                color: "var(--text-primary)",
                margin: "0 0 10px",
              }}
            >
              Simple,{" "}
              <span style={{ fontStyle: "italic", color: "var(--accent)" }}>transparent</span> pricing
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "15px", margin: 0 }}>
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
              position: "relative",
            }}
          >
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className="animate-fade-up"
                style={{
                  padding: "28px",
                  borderRadius: "var(--radius-lg)",
                  background: plan.accent ? "var(--bg-card)" : "var(--bg-card)",
                  border: plan.accent ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: plan.accent ? "var(--shadow-glow)" : "none",
                }}
              >
                {plan.accent && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "linear-gradient(90deg, var(--accent), #4ade80)",
                    }}
                  />
                )}
                <div style={{ fontSize: "13px", fontWeight: "600", color: plan.accent ? "var(--accent)" : "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "40px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-body)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.5 }}>
                  {plan.desc}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "11px 20px",
                    background: plan.accent ? "var(--accent)" : "var(--bg-elevated)",
                    color: plan.accent ? "var(--bg-primary)" : "var(--text-secondary)",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "14px",
                    borderRadius: "var(--radius-md)",
                    border: plan.accent ? "none" : "1px solid var(--border)",
                    transition: "all 0.2s",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "56px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(0,229,155,0.06), transparent)",
            pointerEvents: "none",
          }}
        />
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: "400",
            margin: "0 0 14px",
            color: "var(--text-primary)",
            position: "relative",
          }}
        >
          Ready to start{" "}
          <span style={{ fontStyle: "italic", color: "var(--accent)" }}>saving</span>?
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-muted)",
            marginBottom: "28px",
            position: "relative",
          }}
        >
          Join smart shoppers who never miss a price drop.
        </p>
        <Link
          href={isLoggedIn ? "/dashboard" : "/signup"}
          style={{
            display: "inline-block",
            padding: "14px 40px",
            background: "var(--accent)",
            color: "var(--bg-primary)",
            textDecoration: "none",
            fontWeight: "700",
            borderRadius: "var(--radius-md)",
            fontSize: "16px",
            boxShadow: "0 0 40px rgba(0,229,155,0.2)",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "20px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "12px",
          borderTop: "1px solid var(--border)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p style={{ margin: 0 }}>&copy; 2026 PriceHawk. All rights reserved.</p>
      </footer>
    </div>
  );
}

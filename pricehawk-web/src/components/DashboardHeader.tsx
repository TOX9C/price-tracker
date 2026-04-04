"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Logo } from "./Logo";

export default function DashboardHeader() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header
      style={{
        background: "rgba(13,15,17,0.85)",
        backdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 20px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <Logo size={30} />
          <h1
            style={{
              fontSize: "18px",
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
        <button
          onClick={handleSignOut}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: "600",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            transition: "all 0.15s ease",
            padding: "7px 16px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </header>
  );
}

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Simple in-memory store for rate limiting (persists roughly per Vercel edge isolate)
const ipCache = new Map<string, { count: number; expiresAt: number }>();

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // --- 1. RATE LIMITING LOGIC ---
  // Only rate-limit API routes to protect our DB and scraping endpoints
  if (pathname.startsWith("/api")) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 30; // Max 30 requests per minute per IP

    const record = ipCache.get(ip);

    if (!record || now > record.expiresAt) {
      // First request or window expired, reset counter
      ipCache.set(ip, { count: 1, expiresAt: now + windowMs });
    } else {
      record.count += 1;
      if (record.count > maxRequests) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please slow down." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // --- 2. AUTHENTICATION LOGIC ---
  // Public paths that don't require auth
  const publicPaths = ["/", "/login", "/signup"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith("/api/auth")
  );

  // If user is not logged in and path isn't public, redirect to login
  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protect entire dashboard and API routes
    "/dashboard/:path*",
    "/api/:path*",
  ],
};

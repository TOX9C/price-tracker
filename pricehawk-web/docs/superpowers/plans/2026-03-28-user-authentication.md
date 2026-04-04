# User Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-user authentication to PriceHawk with email/password + Google/GitHub OAuth.

**Architecture:** Auth.js v5 (NextAuth) with JWT sessions, Prisma adapter for user storage, middleware for route protection. Each user's products are strictly private.

**Tech Stack:** Next.js 16, Auth.js v5, Prisma, bcryptjs, SQLite (dev) / PostgreSQL (prod)

---

## File Structure

### New Files

```
src/
├── lib/
│   ├── auth.ts                    # Auth.js v5 configuration
│   └── rate-limit.ts              # In-memory rate limiting for dev
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts       # Auth.js API handler
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── signup/
│   │   └── page.tsx               # Signup page
│   └── dashboard/
│       └── page.tsx               # Dashboard (current homepage content)
├── middleware.ts                  # Route protection
└── types/
    └── next-auth.d.ts             # Type augmentations for session.user.id

prisma/
└── migrations/
    └── *_add_user_authentication/ # New migration
```

### Modified Files

```
prisma/schema.prisma              # Add User, Account; update Product with userId
src/app/page.tsx                  # Convert to landing page placeholder
src/lib/db.ts                     # No changes needed
src/app/api/products/route.ts     # Add user filtering, ownership
src/app/api/products/[id]/route.ts              # Add ownership check
src/app/api/products/[id]/listings/route.ts     # Add ownership check
src/app/api/products/[id]/refresh/route.ts      # Add ownership check
src/app/api/listings/[id]/route.ts              # Add ownership check
src/app/api/listings/[id]/refresh/route.ts      # Add ownership check
.env                              # Add AUTH_SECRET, OAuth credentials
```

---

### Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install auth and security packages**
Run:
```bash
npm install next-auth@beta bcryptjs && npm install -D @types/bcryptjs
```

Expected: Packages added to package.json

- [ ] **Step 2: Generate AUTH_SECRET**
Run:
```bash
openssl rand -base64 32
```
Save the output for `.env` file.

- [ ] **Step 3: Add environment variables**
Create/update `.env`:
```env
# Auth.js v5
AUTH_URL=http://localhost:3000
AUTH_SECRET=<generated-secret-from-step-2>

# OAuth Providers (add real values later)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

### Task 2: Update Prisma Schema

**Files:** `prisma/schema.prisma`

- [ ] **Step 1: Add User and Account models**
Edit `prisma/schema.prisma`, add before the Product model:
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // hashed, null for OAuth-only users
  image         String?
  emailVerified DateTime? // Future: email verification flow
  accounts      Account[]
  products      Product[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider          String   // "google", "github", "credentials"
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  expiresAt         Int?
  createdAt         DateTime @default(now())

  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

- [ ] **Step 2: Update Product model to add userId**
Edit the Product model in `prisma/schema.prisma`:
```prisma
model Product {
  id        String       @id @default(cuid())
  userId    String
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String?
  imageUrl  String?
  listings  StoreListing[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([userId])
  @@index([name])
}
```

- [ ] **Step 3: Delete existing database and run migration**
Run:
```bash
rm -f prisma/dev.db prisma/dev.db-journal && npx prisma migrate dev --name add-user-authentication
```

Expected: Migration creates User, Account tables; Product now has userId field.

---

### Task 3: Create Auth Configuration

**Files:** Create `src/lib/auth.ts`, `src/types/next-auth.d.ts`

- [ ] **Step 1: Create auth configuration file**
Create `src/lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Password validation
        if (password.length < 8 || password.length > 128) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Create type augmentations**
Create `src/types/next-auth.d.ts`:
```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 3: Create Auth API route**
Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

---

### Task 4: Create Middleware

**Files:** Create `src/middleware.ts`

- [ ] **Step 1: Create middleware for route protection**
Create `src/middleware.ts`:
```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public paths that don't require auth
  const publicPaths = ["/", "/login", "/signup"];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith("/api/auth")
  );

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/products/:path*",
    "/api/listings/:path*",
  ],
};
```

---

### Task 5: Create Rate Limiting Utility

**Files:** Create `src/lib/rate-limit.ts`

- [ ] **Step 1: Create in-memory rate limiter for development**
Create `src/lib/rate-limit.ts`:
```typescript
// Simple in-memory rate limiter for development
// Replace with @upstash/ratelimit for production

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

export function checkRateLimit(ip: string): { success: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { success: false, retryAfter };
  }

  record.count++;
  return { success: true };
}

export function resetRateLimit(ip: string): void {
  attempts.delete(ip);
}
```

---

### Task 6: Update Products API for User Filtering

**Files:** Modify `src/app/api/products/route.ts`

- [ ] **Step 1: Add auth import and update GET handler**
Edit `src/app/api/products/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeProduct } from "@/lib/scrapers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { userId: session.user.id },
      include: {
        listings: {
          include: {
            priceHistory: {
              orderBy: { checkedAt: "desc" },
              take: 20,
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update POST handler to link products to user**
Continue editing `src/app/api/products/route.ts`:
```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, productId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check if URL already exists in user's listings
    const existingListing = await prisma.storeListing.findUnique({
      where: { url },
      include: { product: true },
    });

    if (existingListing) {
      // Only return error if it belongs to this user
      if (existingListing.product.userId === session.user.id) {
        return NextResponse.json(
          { error: "This URL is already being tracked", product: existingListing.product },
          { status: 409 }
        );
      }
      // URL tracked by another user - treat as not found for security
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const { product: scraped, store } = await scrapeProduct(url);

    // If productId provided, add listing to existing product
    if (productId) {
      // Verify ownership
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!existingProduct || existingProduct.userId !== session.user.id) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const listing = await prisma.storeListing.create({
        data: {
          productId,
          url,
          store,
          imageUrl: scraped.imageUrl,
          priceHistory: scraped.price
            ? {
                create: {
                  price: scraped.price,
                  currency: scraped.currency,
                },
              }
            : undefined,
        },
        include: {
          priceHistory: { orderBy: { checkedAt: "desc" } },
        },
      });

      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          listings: {
            include: {
              priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
            },
          },
        },
      });

      return NextResponse.json({ product });
    }

    // Create new product with first listing
    const newProduct = await prisma.product.create({
      data: {
        userId: session.user.id,
        name: scraped.name,
        imageUrl: scraped.imageUrl,
        listings: {
          create: {
            url,
            store,
            imageUrl: scraped.imageUrl,
            priceHistory: scraped.price
              ? {
                  create: {
                    price: scraped.price,
                    currency: scraped.currency,
                  },
                }
              : undefined,
          },
        },
      },
      include: {
        listings: {
          include: {
            priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
          },
        },
      },
    });

    return NextResponse.json({ product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    const message = error instanceof Error ? error.message : "Failed to add product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

### Task 7: Update Product ID Routes for Ownership

**Files:** Modify `src/app/api/products/[id]/route.ts`

- [ ] **Step 1: Add ownership check to DELETE handler**
Edit `src/app/api/products/[id]/route.ts`:
```typescript
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

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete product (cascade will delete listings and price history)
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
```

---

### Task 8: Update Product Refresh Route

**Files:** Modify `src/app/api/products/[id]/refresh/route.ts`

- [ ] **Step 1: Add ownership check to refresh handler**
Edit `src/app/api/products/[id]/refresh/route.ts`:
```typescript
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

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id },
      include: { listings: true },
    });

    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Refresh all listings
    for (const listing of product.listings) {
      const { product: scraped } = await scrapeProduct(listing.url);

      if (scraped.price) {
        await prisma.storeListing.update({
          where: { id: listing.id },
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
          where: { id: listing.id },
          data: { imageUrl: scraped.imageUrl },
        });
      }
    }

    // Return updated product
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        listings: {
          include: {
            priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
          },
        },
      },
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error("Error refreshing product:", error);
    return NextResponse.json({ error: "Failed to refresh product" }, { status: 500 });
  }
}
```

---

### Task 9: Update Product Listings Route

**Files:** Modify `src/app/api/products/[id]/listings/route.ts`

- [ ] **Step 1: Add ownership check to listings POST handler**
Edit `src/app/api/products/[id]/listings/route.ts`:
```typescript
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
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if URL already exists
    const existingListing = await prisma.storeListing.findUnique({
      where: { url },
    });

    if (existingListing) {
      return NextResponse.json(
        { error: "This URL is already being tracked" },
        { status: 409 }
      );
    }

    const { product: scraped, store } = await scrapeProduct(url);

    const listing = await prisma.storeListing.create({
      data: {
        productId: id,
        url,
        store,
        imageUrl: scraped.imageUrl,
        priceHistory: scraped.price
          ? {
              create: {
                price: scraped.price,
                currency: scraped.currency,
              },
            }
          : undefined,
      },
      include: {
        priceHistory: { orderBy: { checkedAt: "desc" } },
      },
    });

    // Return updated product
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        listings: {
          include: {
            priceHistory: { orderBy: { checkedAt: "desc" }, take: 20 },
          },
        },
      },
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error("Error adding listing:", error);
    return NextResponse.json({ error: "Failed to add listing" }, { status: 500 });
  }
}
```

---

### Task 10: Update Listing Routes for Ownership

**Files:** Modify `src/app/api/listings/[id]/route.ts`

- [ ] **Step 1: Add ownership check to DELETE handler**
Edit `src/app/api/listings/[id]/route.ts`:
```typescript
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

    // Get listing and verify ownership through product
    const listing = await prisma.storeListing.findUnique({
      where: { id },
      select: { productId: true, product: { select: { userId: true } } },
    });

    if (!listing || listing.product.userId !== session.user.id) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Delete the listing
    await prisma.storeListing.delete({ where: { id } });

    // Check if product has no more listings
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
```

---

### Task 11: Update Listing Refresh Route

**Files:** Modify `src/app/api/listings/[id]/refresh/route.ts`

- [ ] **Step 1: Add ownership check to refresh handler**
Edit `src/app/api/listings/[id]/refresh/route.ts`:
```typescript
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

    // Get listing and verify ownership
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
```

---

### Task 12: Create Login Page

**Files:** Create `src/app/login/page.tsx`

- [ ] **Step 1: Create login page with email/password and OAuth buttons**
Create `src/app/login/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    await signIn(provider, { callbackUrl });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "40px", background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ textAlign: "center", margin: "0 0 8px 0", fontSize: "28px", fontWeight: "700" }}>PriceHawk</h1>
        <p style={{ textAlign: "center", color: "#666", margin: "0 0 32px 0" }}>Sign in to your account</p>

        {error && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#333" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "12px 14px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#333" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ width: "100%", padding: "12px 14px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ margin: "24px 0", textAlign: "center", color: "#999", fontSize: "14px" }}>or continue with</div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => handleOAuthSignIn("google")}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              background: "white",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button
            onClick={() => handleOAuthSignIn("github")}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              background: "white",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", color: "#666", fontSize: "14px" }}>
          Don&apos;t have an account?{" "}
          <a href="/signup" style={{ color: "#0070f3", fontWeight: "500", textDecoration: "none" }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}
```

---

### Task 13: Create Signup Page

**Files:** Create `src/app/signup/page.tsx`

- [ ] **Step 1: Create signup page with form**
Create `src/app/signup/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password.length > 128) {
      setError("Password must be less than 128 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Create user via API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Sign in after successful signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "40px", background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ textAlign: "center", margin: "0 0 8px 0", fontSize: "28px", fontWeight: "700" }}>PriceHawk</h1>
        <p style={{ textAlign: "center", color: "#666", margin: "0 0 32px 0" }}>Create your account</p>

        {error && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#333" }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }}
              placeholder="Your name"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#333" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "12px 14px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#333" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              style={{ width: "100%", padding: "12px 14px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }}
              placeholder="Min 8 characters"
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#333" }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "12px 14px", border: "2px solid #e0e0e0", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" }}
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div style={{ margin: "24px 0", textAlign: "center", color: "#999", fontSize: "14px" }}>or continue with</div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => handleOAuthSignIn("google")}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              background: "white",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button
            onClick={() => handleOAuthSignIn("github")}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px",
              background: "white",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", color: "#666", fontSize: "14px" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#0070f3", fontWeight: "500", textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
```

---

### Task 14: Create Signup API Route

**Files:** Create `src/app/api/auth/signup/route.ts`

- [ ] **Step 1: Create signup API route**
Create `src/app/api/auth/signup/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Don't reveal that email exists
      return NextResponse.json(
        { error: "Unable to create account" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
```

---

### Task 15: Move Dashboard and Create Landing Page

**Files:**
- Move: `src/app/page.tsx` → `src/app/dashboard/page.tsx`
- Create: `src/app/page.tsx` (landing page)

- [ ] **Step 1: Create dashboard directory and move page**
Run:
```bash
mkdir -p src/app/dashboard && mv src/app/page.tsx src/app/dashboard/page.tsx
```

- [ ] **Step 2: Create simple landing page placeholder**
Create `src/app/page.tsx`:
```typescript
import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0070f3 0%, #0051cc 100%)" }}>
      {/* Header */}
      <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "white", fontSize: "24px", fontWeight: "700" }}>PriceHawk</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link
            href="/login"
            style={{
              padding: "10px 24px",
              color: "white",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            style={{
              padding: "10px 24px",
              background: "white",
              color: "#0070f3",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 40px", textAlign: "center" }}>
        <h1 style={{ color: "white", fontSize: "56px", fontWeight: "800", margin: "0 0 24px 0" }}>
          Track Prices Across Stores
        </h1>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "20px", margin: "0 0 48px 0", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
          Compare prices from Amazon, Best Buy, Walmart, and more. Get alerts when prices drop.
        </p>
        <Link
          href="/signup"
          style={{
            display: "inline-block",
            padding: "16px 48px",
            background: "white",
            color: "#0070f3",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "700",
            fontSize: "18px",
          }}
        >
          Start Tracking for Free
        </Link>
      </main>
    </div>
  );
}
```

---

### Task 16: Verify Build

- [ ] **Step 1: Run TypeScript check**
Run:
```bash
npx tsc --noEmit
```
Expected: No type errors

- [ ] **Step 2: Run development server**
Run:
```bash
npm run dev
```

- [ ] **Step 3: Test auth flow manually**
1. Visit `http://localhost:3000` — should see landing page
2. Click "Get Started" — should go to signup
3. Create account with email/password
4. Should redirect to dashboard
5. Sign out and test login
6. Test that dashboard requires auth (redirect to login if not signed in)

---

## Self-Review

**Spec coverage:**
- ✅ Task 1-2: Dependencies and Prisma schema (User, Account, userId on Product)
- ✅ Task 3: Auth.js v5 configuration with Credentials, Google, GitHub
- ✅ Task 4: Middleware for route protection
- ✅ Task 5: Rate limiting utility (in-memory)
- ✅ Task 6-11: API routes updated with user filtering and ownership checks
- ✅ Task 12-14: Login, Signup pages and signup API
- ✅ Task 15: Dashboard moved, landing page created
- ✅ Task 16: Build verification

**Placeholder scan:** No TBDs, TODOs, or incomplete sections.

**Type consistency:** All routes use `session.user.id` from type augmentation in Task 3.

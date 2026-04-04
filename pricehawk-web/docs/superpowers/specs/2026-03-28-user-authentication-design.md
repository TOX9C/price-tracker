# User Authentication Design Spec

**Date:** 2026-03-28
**Feature:** Multi-user authentication for PriceHawk SaaS

## Overview

Add user accounts to PriceHawk so users can sign up, log in, and access their price-tracked products from any device. Each user's data is strictly private — no sharing between users.

## Tech Stack

- **Auth.js v5 (NextAuth v5)** — Authentication framework (stable in 2026)
- **bcryptjs** — Password hashing
- **Prisma** — Database adapter for user/account storage
- **JWT sessions** — Stateless session management

## Authentication Methods

1. **Email + Password** — Primary method
2. **Google OAuth** — Optional provider
3. **GitHub OAuth** — Optional provider

## Database Schema

### User Model

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
```

### Account Model

```prisma
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

### Product Model Update

Add `userId` field to link products to users:

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

## Password Requirements

Minimum requirements for email/password signup:

- **Minimum length:** 8 characters
- **Maximum length:** 128 characters
- **No complexity requirements** — Let password managers handle generation
- **Breach check** — Consider integrating HaveIBeenPwned API for breached password detection (future)

Validation happens on both client (UX) and server (security).

## Rate Limiting

Apply rate limiting to prevent brute-force attacks:

### Login/Signup Endpoints

- **Limit:** 5 attempts per IP per minute
- **Implementation:** In-memory for dev, Upstash Redis for production
- **Response:** 429 Too Many Requests with retry-after header

### Implementation

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const loginRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});
```

For development, use a simple in-memory fallback.

## Email Verification

**Status:** Deferred to future iteration

The `emailVerified` field on User model is placeholder. For MVP:

- Email is NOT verified on signup
- User can immediately access dashboard after signup
- Email verification flow to be added later (magic link or verification code)

## Session Configuration

### JWT Callback

Ensure `userId` is available in session:

```typescript
// src/lib/auth.ts
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
```

This makes `session.user.id` available in API routes and server components.

## Account Linking Strategy

When a user signs up with one method and later uses another with the same email:

### Email → OAuth (same email)

- User signs up with email/password: `user@example.com`
- Later clicks "Sign in with Google" with same email
- **Behavior:** Link accounts — Google Account is added to existing User
- User can then log in with either method

### OAuth → Email (same email)

- User signs up with Google: `user@example.com`
- Later tries email/password signup with same email
- **Behavior:** Redirect to login with message "Account exists — try signing in with Google"
- Offer password setup via "Forgot password" flow if they want email/password access

### Multiple OAuth (same email)

- User signs up with Google: `user@example.com`
- Later clicks "Sign in with GitHub" with same email
- **Behavior:** Link accounts — GitHub added to existing User

Implementation: NextAuth v5 handles this automatically with `allowDangerousEmailAccountLinking: true` in provider config. We'll enable it for seamless account linking.

## Error Handling

### Ownership Verification

When user tries to access another user's resource:

- **Return 404 Not Found** — Not 403
- Rationale: 403 confirms the resource exists, leaking information
- 404 gives no confirmation: "This doesn't exist OR you can't see it"

### Error Messages

- **Login failure:** "Invalid email or password" — Don't reveal which is wrong
- **Email exists:** On signup, don't reveal if email is already registered
- Instead: "If this email is available, you'll receive a confirmation" (or just proceed with login)

## Route Protection

### Public Routes

- `/` — Landing page
- `/login` — Login page
- `/signup` — Signup page
- `/api/auth/*` — NextAuth callbacks

### Protected Routes

- `/dashboard` — User dashboard
- `/dashboard/*` — Dashboard subpages (future: item details)
- `/api/products/*` — All product API routes
- `/api/listings/*` — All listing API routes

## Middleware Logic

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public paths
  const publicPaths = ["/", "/login", "/signup"];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith("/api/auth"));

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

## API Changes

### GET /api/products

Before: Returns all products
After: Returns only products where `userId` matches authenticated user

### POST /api/products

Before: Creates product without owner
After: Creates product linked to authenticated user (`userId` from session)

### All /api/products/[id]/* and /api/listings/[id]/*

Add ownership verification:
1. Get authenticated user ID from session
2. Verify product/listing belongs to user
3. Return 404 Not Found if mismatch (not 403)

## Password Flow

### Signup

1. User submits email + password
2. Validate password requirements (8-128 chars)
3. Check rate limit
4. Check if email already exists:
   - If exists: return generic message, don't reveal
5. Hash password with bcryptjs (12 rounds)
6. Create User record
7. Create session, redirect to `/dashboard`

### Login

1. User submits email + password
2. Check rate limit
3. Lookup user by email
4. Compare password with stored hash using bcryptjs
5. If match: create session, redirect to `/dashboard` (or callbackUrl)
6. If no match: return 401 with "Invalid email or password"

## OAuth Flow

### Google

1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User authorizes
4. Google redirects to `/api/auth/callback/google`
5. Auth.js creates/finds user, links account if same email
6. Create session, redirect to `/dashboard`

### GitHub

Same flow, using GitHub OAuth provider.

## Environment Variables

```env
# Auth.js v5
AUTH_URL=http://localhost:3000
AUTH_SECRET=<generated-secret>

# OAuth Providers
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GITHUB_CLIENT_ID=<from-github-settings>
GITHUB_CLIENT_SECRET=<from-github-settings>

# Rate Limiting (production)
UPSTASH_REDIS_REST_URL=<from-upstash>
UPSTASH_REDIS_REST_TOKEN=<from-upstash>
```

## Database Consideration

**Current:** SQLite for development

**Production:** PostgreSQL recommended for SaaS
- SQLite file locking doesn't scale
- Better concurrency support
- Production-ready Postgres providers: Supabase, Neon, Railway, PlanetScale

**Recommendation:** Migrate to PostgreSQL before production. Schema already uses Prisma, so migration is straightforward:
1. Update `DATABASE_URL` to Postgres connection string
2. Run `npx prisma migrate dev`
3. Deploy

## Migration Plan

1. Delete existing `prisma/dev.db` (wiping test data)
2. Update `prisma/schema.prisma` with User and Account models
3. Run `npx prisma migrate dev --name add-user-authentication`
4. Verify tables created correctly

## Implementation Order

1. Install dependencies: `next-auth@beta`, `bcryptjs`, `@types/bcryptjs`, `@upstash/ratelimit`, `@upstash/redis`
2. Update Prisma schema
3. Run migration
4. Create auth configuration files (`src/lib/auth.ts`)
5. Create middleware
6. Add rate limiting utility
7. Update API routes for user filtering and ownership checks
8. Create placeholder auth pages
9. Move dashboard to `/dashboard`
10. Create landing page placeholder

## UI Design (Pending)

User will provide design references for:
- Landing page (hero, features, pricing, reviews)
- Login/signup pages (email/password form, Google/GitHub buttons)
- Dashboard layout
- Item detail pages

UI implementation will be done in a separate phase after design references are provided.

## Dependencies to Add

```json
{
  "next-auth": "beta",
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6",
  "@upstash/ratelimit": "^2.0.0",
  "@upstash/redis": "^1.34.0"
}
```

Note: `next-auth@beta` is the v5 package. In 2026, it may be stable as `next-auth@5` or similar — check npm for current version.

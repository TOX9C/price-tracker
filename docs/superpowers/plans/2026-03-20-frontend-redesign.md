# PriceHawk Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the web UI with warm amber/gold colors, premium cards, and green price badges.

**Architecture:** Update CSS variables and Tailwind config for new color palette, then cascade changes through components (buttons, badges, cards) and finally update all pages (landing, dashboard, auth).

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, Vite

---

## File Structure

| File | Purpose |
|------|---------|
| `web/src/index.css` | CSS variables for color palette, font import |
| `web/tailwind.config.js` | Tailwind theme extensions (colors, shadows, radius) |
| `web/src/components/ui/button.tsx` | Button variants including gradient primary |
| `web/src/components/ui/badge.tsx` | Badge variants including success green |
| `web/src/components/ui/card.tsx` | Card component with new shadow/border |
| `web/src/components/shared/item-card.tsx` | Dashboard item card with price badges |
| `web/src/pages/landing/index.tsx` | Landing page with warm hero |
| `web/src/pages/dashboard/index.tsx` | Dashboard page background |
| `web/src/pages/auth/login.tsx` | Login page warm background |
| `web/src/pages/auth/register.tsx` | Register page warm background |
| `web/src/components/layout/header.tsx` | Navigation header |
| `web/src/components/layout/footer.tsx` | Footer links |

---

## Task 1: Update CSS Variables and Font Import

**Files:**
- Modify: `web/src/index.css`

- [ ] **Step 1: Update font import to include weight 800**

Replace line 1 with:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
```

- [ ] **Step 2: Update CSS variables for amber palette**

Replace lines 8-28 with:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 20 14% 10%;
  --card: 0 0% 100%;
  --card-foreground: 20 14% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 20 14% 10%;
  --primary: 38 92% 50%;
  --primary-foreground: 0 0% 100%;
  --primary-dark: 32 95% 44%;
  --secondary: 30 10% 96%;
  --secondary-foreground: 20 14% 10%;
  --muted: 30 10% 96%;
  --muted-foreground: 20 8% 45%;
  --accent: 38 92% 50%;
  --accent-foreground: 0 0% 100%;
  --success: 152 95% 30%;
  --success-foreground: 145 90% 89%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 20 6% 90%;
  --input: 20 6% 90%;
  --ring: 38 92% 50%;
  --radius: 0.75rem;
}
```

- [ ] **Step 3: Update dark mode variables**

Replace lines 31-50 with:
```css
.dark {
  --background: 20 14% 10%;
  --foreground: 60 10% 98%;
  --card: 20 10% 15%;
  --card-foreground: 60 10% 98%;
  --popover: 20 10% 15%;
  --popover-foreground: 60 10% 98%;
  --primary: 38 92% 50%;
  --primary-foreground: 20 14% 10%;
  --secondary: 20 10% 20%;
  --secondary-foreground: 60 10% 98%;
  --muted: 20 10% 20%;
  --muted-foreground: 20 6% 68%;
  --accent: 20 10% 20%;
  --accent-foreground: 60 10% 98%;
  --destructive: 0 62% 30%;
  --destructive-foreground: 0 0% 100%;
  --border: 20 10% 20%;
  --input: 20 10% 20%;
  --ring: 38 92% 50%;
}
```

- [ ] **Step 4: Add user-select utility and headline styles**

Add after line 63 (before closing `}`):
```css
  .select-none {
    user-select: none;
    -webkit-user-select: none;
  }

  h1, h2, h3 {
    user-select: none;
    -webkit-user-select: none;
    letter-spacing: -0.02em;
  }

  h1 {
    letter-spacing: -0.03em;
  }
```

- [ ] **Step 5: Verify CSS compiles**

Run: `cd web && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 6: Commit**

```bash
git add web/src/index.css
git commit -m "feat(web): update CSS variables to amber palette, add font weight 800"
```

---

## Task 2: Update Tailwind Config

**Files:**
- Modify: `web/tailwind.config.js`

- [ ] **Step 1: Add success color and shadows**

Replace the `theme.extend` section (lines 9-54) with:
```js
  theme: {
    extend: {
      fontFamily: {
        headline: ['Outfit', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          dark: 'hsl(var(--primary-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)',
        'glow': '0 4px 16px rgba(245,158,11,0.3)',
        'glow-lg': '0 6px 24px rgba(245,158,11,0.4)',
      },
    },
  },
```

- [ ] **Step 2: Verify config**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/tailwind.config.js
git commit -m "feat(web): add success color and card shadows to Tailwind config"
```

---

## Task 3: Update Button Component

**Files:**
- Modify: `web/src/components/ui/button.tsx`

- [ ] **Step 1: Add gradient primary variant**

Replace the `buttonVariants` definition (lines 7-34) with:
```tsx
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary to-primary-dark text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-100 active:shadow-none",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-border bg-background hover:bg-secondary hover:border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 gap-1.5 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

- [ ] **Step 2: Update function signature**

Replace the Button function (lines 36-55) with:
```tsx
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Verify component**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ui/button.tsx
git commit -m "feat(web): add gradient primary button with glow shadow"
```

---

## Task 4: Update Badge Component

**Files:**
- Modify: `web/src/components/ui/badge.tsx`

- [ ] **Step 1: Add success variant**

Replace the `badgeVariants` definition (lines 7-26) with:
```tsx
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 select-none [&_svg]:pointer-events-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-white",
        outline:
          "border-border text-foreground",
        success:
          "bg-success-foreground text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

- [ ] **Step 2: Verify component**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/components/ui/badge.tsx
git commit -m "feat(web): add success variant for price badges"
```

---

## Task 5: Update Card Component

**Files:**
- Modify: `web/src/components/ui/card.tsx`

- [ ] **Step 1: Update Card component styling**

Replace the Card function (lines 5-16) with:
```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-2xl border border-slate-100 bg-card text-card-foreground shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1 select-none",
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Verify component**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/components/ui/card.tsx
git commit -m "feat(web): update card with new shadow and hover effects"
```

---

## Task 6: Update Item Card Component

**Files:**
- Modify: `web/src/components/shared/item-card.tsx`

- [ ] **Step 1: Update ItemCard styling**

Replace the entire file with:
```tsx
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { Item } from '@/types'

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const trend = getTrend(item)

  return (
    <Link to={`/items/${item.id}`}>
      <Card className="overflow-hidden cursor-pointer">
        <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 relative">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl text-slate-300">📦</span>
            </div>
          )}
          {item.category && (
            <Badge className="absolute top-3 left-3" variant="secondary">
              {item.category}
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
            {item.name}
          </h3>

          <div className="flex items-center gap-3">
            {item.best_price !== null ? (
              <>
                <span className="text-xl font-bold text-success tabular-nums">
                  {formatPrice(item.best_price)}
                </span>
                {trend.direction === 'down' && (
                  <Badge variant="success" className="gap-1">
                    <ArrowDown className="w-3 h-3" />
                    {trend.percent}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-slate-400 italic">No price yet</span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            {item.best_store && <span>Best: {item.best_store}</span>}
            <span>{item.url_count} {item.url_count === 1 ? 'store' : 'stores'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function getTrend(item: Item): { direction: string; percent: string } {
  return {
    direction: 'stable',
    percent: '0%',
  }
}
```

- [ ] **Step 2: Verify component**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/components/shared/item-card.tsx
git commit -m "feat(web): update item card with green price badges"
```

---

## Task 7: Update Landing Page

**Files:**
- Modify: `web/src/pages/landing/index.tsx`

- [ ] **Step 1: Redesign landing page**

Replace the entire file with:
```tsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/layout/footer'
import { Store, Bell, LineChart, Sparkles, ArrowRight, Check } from 'lucide-react'

const features = [
  {
    icon: Store,
    title: 'Multi-Store Tracking',
    description: 'Compare prices across Amazon, Best Buy, Newegg, and more.',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get email and push alerts when prices drop.',
  },
  {
    icon: LineChart,
    title: 'Price History Charts',
    description: 'Visual 30-day price trends to time your purchase.',
  },
  {
    icon: Sparkles,
    title: 'Smart Detection',
    description: 'Auto-detect product details from pasted URL.',
  },
]

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['10 items', 'Email notifications', '24-hour checks'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: '/month',
    features: ['Unlimited items', 'Push notifications', '1-hour checks', 'Price alerts'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'API access', 'Team management'],
    cta: 'Contact Sales',
    popular: false,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-25 to-white">
      {/* Navigation */}
      <nav className="border-b border-amber-100">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
            PriceHawk
          </a>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 bg-amber-100 text-amber-800 border-0">
            Track smarter, save bigger
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
            Never miss a{' '}
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              price drop
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Track prices across Amazon, Best Buy, Newegg, and more.
            Get notified instantly when prices drop.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Start Tracking Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything you need to save money
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-none shadow-card">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? 'border-amber-400 shadow-glow' : ''}
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-slate-500 ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-amber-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start tracking prices today
          </h2>
          <p className="text-white/90 mb-8">
            Join thousands of smart shoppers saving with PriceHawk
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="gap-2 bg-white text-amber-600 hover:bg-slate-50">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Verify page**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/landing/index.tsx
git commit -m "feat(web): redesign landing page with warm amber theme"
```

---

## Task 8: Update Dashboard Page

**Files:**
- Modify: `web/src/pages/dashboard/index.tsx`

- [ ] **Step 1: Update dashboard background**

Update line 18 to add background styling:
```tsx
return (
  <div className="space-y-6 min-h-screen bg-gradient-to-b from-slate-50 to-white">
```

- [ ] **Step 2: Verify page**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/dashboard/index.tsx
git commit -m "feat(web): add warm background to dashboard"
```

---

## Task 9: Update Auth Pages

**Files:**
- Modify: `web/src/pages/auth/login.tsx`
- Modify: `web/src/pages/auth/register.tsx`

- [ ] **Step 1: Update login page background**

In `login.tsx`, update the Card component styling (around line 20). Find the Card component and add warm styling:
```tsx
<Card className="border-0 shadow-card">
```

- [ ] **Step 2: Update register page background**

In `register.tsx`, make the same change:
```tsx
<Card className="border-0 shadow-card">
```

- [ ] **Step 3: Verify pages**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/auth/login.tsx web/src/pages/auth/register.tsx
git commit -m "feat(web): update auth pages with card shadows"
```

---

## Task 10: Update Header Component

**Files:**
- Modify: `web/src/components/layout/header.tsx`

- [ ] **Step 1: Remove any emoji from logo, add user-select**

Find the logo link (around line 15) and ensure it's text-only with proper styling:
```tsx
<Link to="/dashboard" className="text-xl font-extrabold tracking-tight text-amber-600 select-none">
  PriceHawk
</Link>
```

- [ ] **Step 2: Verify component**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/components/layout/header.tsx
git commit -m "feat(web): update header logo styling"
```

---

## Task 11: Update Footer Component

**Files:**
- Modify: `web/src/components/layout/footer.tsx`

- [ ] **Step 1: Simplify footer styling**

Update the footer to have a clean white background with border:
```tsx
<footer className="border-t border-slate-100 bg-white">
```

And ensure the logo is text-only:
```tsx
<a href="/" className="text-lg font-extrabold tracking-tight text-amber-600">
  PriceHawk
</a>
```

- [ ] **Step 2: Verify component**

Run: `cd web && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add web/src/components/layout/footer.tsx
git commit -m "feat(web): update footer with clean styling"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Run full build**

Run: `cd web && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Start dev server to visually verify**

Run: `cd web && npm run dev`
Expected: Dev server starts on http://localhost:5173

- [ ] **Step 3: Visual verification checklist**

Open browser and verify:
1. Landing page has warm amber gradient background
2. Primary buttons have amber gradient with glow
3. Price badges are green with mint background
4. No emojis in logo or UI
5. Cards have subtle shadows and lift on hover
6. No text selection on buttons and headings

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(web): complete frontend redesign with amber theme"
```

---

## Summary

This plan transforms the PriceHawk web UI with:

1. **Warm amber color palette** replacing teal
2. **Gradient primary buttons** with glow effects
3. **Green success badges** for price/savings
4. **Updated typography** with weight 800 for headlines
5. **Card hover animations** with lift and shadow
6. **Text selection prevention** on interactive elements
7. **No emojis** — text logo only

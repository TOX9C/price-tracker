# PriceHawk Frontend Redesign Spec

**Date:** 2026-03-20
**Status:** Approved
**Replaces:** 2026-03-19-frontend-design.md

## Overview

Redesign the PriceHawk web application with a warm, premium aesthetic that feels distinctive and professional. This replaces the current teal-on-slate color scheme with an amber/gold palette on warm whites, creating a more approachable yet trustworthy feel.

## Design Direction

**Core aesthetic:** Warm personality + premium polish
- Approachable like a consumer deals app
- Trustworthy like a SaaS product
- Distinctive, not generic "AI generated" look

### Color Palette

| Role | Light Mode | Usage |
|------|------------|-------|
| Primary (accent) | `#f59e0b` → `#d97706` (amber gradient) | CTAs, highlights, brand moments |
| Primary solid | `#f59e0b` | Hover states, icons |
| Primary dark | `#d97706` | Active states |
| Background | `#ffffff` → `#fffbeb` (warm gradient) | Page backgrounds |
| Surface | `#ffffff` | Cards, modals |
| Surface muted | `#f5f5f4` | Hover states, placeholders |
| Text primary | `#1c1917` | Headlines, body text |
| Text secondary | `#78716c` | Descriptions, labels |
| Text muted | `#a8a29e` | Timestamps, hints |
| Border | `#e7e5e4` | Card borders, dividers |
| Success | `#059669` | Price drops, savings badges |
| Success background | `#dcfce7` | Badge backgrounds |
| Success text | `#059669` | Positive price indicators |

### Dark Mode (Future)

| Role | Dark Mode |
|------|-----------|
| Primary | `#f59e0b` (unchanged) |
| Background | `#1c1917` |
| Surface | `#292524` |
| Text primary | `#fafaf9` |
| Text secondary | `#a8a29e` |

(Note: Dark mode is out of scope for initial implementation but palette is defined)

### Typography

**Font family:** Retain Outfit (headlines) and Plus Jakarta Sans (body) from existing design — these work well.

**Modifications:**
- Headlines: Tighter letter-spacing (`-0.5px` to `-1px`), heavier weight (800)
- Body: Slightly larger base (16px → 18px for hero text)
- Prices: Tabular nums, semibold, colored green with background badge

**Scale:**
```
Hero: 48px / 800 / -1px tracking
H1: 36px / 800 / -0.5px
H2: 28px / 700
H3: 20px / 600
Body: 16px / 400
Small: 14px / 500
Badge: 11-13px / 600
```

### Shadows

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
--shadow-lg: 0 4px 16px rgba(245,158,11,0.3); /* Primary button glow */
```

### Border Radius

```css
--radius-sm: 6px;   /* Badges, small buttons */
--radius-md: 8px;   /* Buttons, inputs */
--radius-lg: 10px;  /* Large buttons */
--radius-xl: 12px;  /* Card internal elements */
--radius-2xl: 16px; /* Cards, modals */
```

## Components

### Buttons

**Primary (CTA):**
- Amber gradient background (`linear-gradient(135deg, #f59e0b, #d97706)`)
- White text, semibold
- `border-radius: 10px`
- Box shadow glow: `0 4px 16px rgba(245,158,11,0.3)`
- Hover: Intensify glow, slight scale (1.02)
- Active: Darker, no glow
- `user-select: none` to prevent text selection

**Secondary:**
- White background
- Dark text (`#1c1917`)
- Border: `1px solid #e7e5e4`
- Hover: Light gray background, border darkens

**Ghost:**
- Transparent background
- Text color matches context
- Hover: Subtle background tint

### Cards

Item cards in dashboard:
- White background
- `border-radius: 16px`
- Border: `1px solid #f5f5f4` (very subtle)
- Shadow: `0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)`
- Hover: Lift with increased shadow, slight scale
- `user-select: none` on entire card

**Price display:**
- Price in green: `#059669`, 18px, semibold, tabular-nums
- Savings badge: Mint background (`#dcfce7`), green text, pill shape
- Example: `$1,299` with badge `-18%`

### Hero Section

```
Background: linear-gradient(180deg, #fffbeb 0%, #fefce8 30%, #ffffff 100%)
```

- Warm cream fade from top to white
- Centered content
- Badge above headline: "Track smarter, save bigger" in amber/cream pill
- Headline: "Never miss a price drop" with "price drop" in amber gradient
- Two CTAs: Primary (amber gradient) + Secondary (white with border)

### Navigation

- Logo: "PriceHawk" text only, no emojis, 800 weight, tight tracking
- Nav items: Medium weight, stone color, hover darkens
- Right side: "Sign in" ghost + "Get Started" primary

### Footer

- Clean, minimal
- Links in subtle grid
- Copyright at bottom
- Background: white with top border

## Interactions & Animations

### Micro-interactions

1. **Button hover**: Scale 1.02, glow intensifies (150ms ease-out)
2. **Card hover**: Lift 4px, shadow increases (200ms ease-out)
3. **Price badge**: Subtle pulse on price drop (CSS keyframes)
4. **Loading skeleton**: Shimmer animation (existing pattern)

### Code Patterns

```css
/* Prevent text selection on interactive elements */
.button, .card, .nav-item, h1, h2 {
  user-select: none;
  -webkit-user-select: none;
}

/* Primary button */
.btn-primary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  font-weight: 600;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(245,158,11, 0.3);
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(245,158,11, 0.4);
}

/* Card hover */
.item-card {
  border-radius: 16px;
  border: 1px solid #f5f5f4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06);
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `web/src/index.css` | Update CSS variables, add new utility classes |
| `web/tailwind.config.js` | Update color palette, shadows, radius |
| `web/src/pages/landing/index.tsx` | Redesign hero, features, pricing |
| `web/src/pages/dashboard/index.tsx` | Update card layout styling |
| `web/src/components/shared/item-card.tsx` | New card design with amber/green badges |
| `web/src/components/ui/button.tsx` | Update button variants |
| `web/src/components/layout/header.tsx` | Simplified nav, text logo |
| `web/src/components/layout/footer.tsx` | Clean footer design |
| `web/src/pages/auth/login.tsx` | Warm auth pages |
| `web/src/pages/auth/register.tsx` | Warm auth pages |

## Out of Scope

- Dark mode (palette defined but not implemented)
- Mobile app (separate spec)
- New features beyond styling
- API changes

## Success Criteria

1. Landing page feels warm, premium, distinctive — not "AI generated"
2. No text selection on buttons and interactive elements
3. Price badges clearly communicate savings with green color
4. Consistent spacing, shadows, and border radius throughout
5. Smooth hover animations on cards and buttons

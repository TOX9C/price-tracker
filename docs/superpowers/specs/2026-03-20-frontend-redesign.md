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

**Note:** Existing `index.css` uses HSL format. Hex values below must be converted to HSL for CSS variables. Use a color converter.

| Role | Light Mode | HSL Equivalent | Usage |
|------|------------|----------------|-------|
| Primary (button gradient) | `linear-gradient(135deg, #f59e0b, #d97706)` | N/A (gradient) | CTAs, buttons |
| Primary solid | `#f59e0b` | `38 92% 50%` | Hover states, icons |
| Primary dark | `#d97706` | `32 95% 44%` | Active states |
| Background | `#ffffff` → `#fffbeb` (hero gradient) | `0 0% 100%` | Page backgrounds |
| Surface | `#ffffff` | `0 0% 100%` | Cards, modals |
| Surface muted | `#f5f5f4` | `30 10% 96%` | Hover states, placeholders |
| Text primary | `#1c1917` | `20 14% 10%` | Headlines, body text |
| Text secondary | `#78716c` | `20 8% 45%` | Descriptions, labels |
| Text muted | `#a8a29e` | `20 6% 68%` | Timestamps, hints |
| Border | `#e7e5e4` | `20 6% 90%` | Card borders, dividers |
| Success | `#059669` | `152 95% 30%` | Price drops, savings badges |
| Success background | `#dcfce7` | `145 90% 89%` | Badge backgrounds |

### Future Considerations: Dark Mode

| Role | Dark Mode | HSL Equivalent |
|------|-----------|----------------|
| Primary | `#f59e0b` | `38 92% 50%` |
| Background | `#1c1917` | `20 14% 10%` |
| Surface | `#292524` | `20 10% 15%` |
| Text primary | `#fafaf9` | `60 10% 98%` |
| Text secondary | `#a8a29e` | `20 6% 68%` |

(Note: Dark mode palette defined for future implementation; not in current scope)

### Typography

**Font family:** Retain Outfit (headlines) and Plus Jakarta Sans (body) from existing design — these work well.

**Font import update required:** Add weight 800 to Outfit import in `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
```

**Modifications:**
- Headlines: Tighter letter-spacing, heavier weight (800 for hero/H1)
- Body: Slightly larger base (16px → 18px for hero text)
- Prices: Tabular nums, semibold, colored green with background badge

**Scale:**
```
Hero: 48px / weight 800 / letter-spacing -1px
H1: 36px / weight 800 / letter-spacing -0.5px
H2: 28px / weight 700 / letter-spacing -0.25px
H3: 20px / weight 600 / letter-spacing 0
Body: 16px / weight 400 / letter-spacing 0
Small: 14px / weight 500 / letter-spacing 0
Badge: 11-13px / weight 600 / letter-spacing 0
```

### Shadows

Add to `tailwind.config.js` under `theme.extend.boxShadow`:

```js
boxShadow: {
  'sm': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  'md': '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
  'lg': '0 4px 16px rgba(245,158,11,0.3)', // Primary button glow
  'card': '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
  'card-hover': '0 4px 8px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)',
}
```

### Border Radius

Add to `tailwind.config.js` under `theme.extend.borderRadius`:

```js
borderRadius: {
  'sm': '6px',   // Badges, small buttons
  'md': '8px',   // Buttons, inputs (default)
  'lg': '10px',  // Large buttons
  'xl': '12px',  // Card internal elements
  '2xl': '16px', // Cards, modals
}
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
| `web/src/index.css` | Update font import (add weight 800), update CSS variables to amber palette |
| `web/tailwind.config.js` | Update colors, add shadows, add border radius |
| `web/src/pages/landing/index.tsx` | Redesign hero, features, pricing sections |
| `web/src/pages/dashboard/index.tsx` | Update card layout and background styling |
| `web/src/components/shared/item-card.tsx` | New card design with green price badges |
| `web/src/components/ui/button.tsx` | Add primary gradient variant, update styles |
| `web/src/components/ui/card.tsx` | Update default shadow and border styling |
| `web/src/components/ui/badge.tsx` | Add success variant with green/mint colors |
| `web/src/components/layout/header.tsx` | Simplified nav, text logo without emojis |
| `web/src/components/layout/footer.tsx` | Clean footer with minimal design |
| `web/src/pages/auth/login.tsx` | Warm background, updated button styles |
| `web/src/pages/auth/register.tsx` | Warm background, updated button styles |

## Out of Scope

- Dark mode (palette defined but not implemented)
- Mobile app (separate spec)
- New features beyond styling
- API changes

## Success Criteria

1. **Color accuracy**: Primary buttons use exact gradient `linear-gradient(135deg, #f59e0b, #d97706)`, success badges use `#059669` with `#dcfce7` background
2. **Text selection prevention**: All buttons, cards, nav items, and headlines have `user-select: none` (can be tested via Cypress/Playwright)
3. **Animation timing**: Hover animations use 150-200ms `ease-out` transitions (can be verified in DevTools)
4. **Font weight**: Outfit font imports weight 800 (verify network tab shows full font family)
5. **Visual consistency**: All cards use `border-radius: 16px`, all shadows match spec values
6. **No emojis**: Logo and all UI elements are text-only, no emoji characters

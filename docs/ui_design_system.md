# 🎨 ui_design_system.md — Design System & Visual Language
> **Floravia** — Premium UI Design, Motion, and Component Standards

---

## 1. Design Philosophy

Floravia's UI is built on four pillars:

1. **Organic Depth** — Layered glassmorphic surfaces that feel like dew on a leaf
2. **Bioluminescent Energy** — Glowing gradients that pulse with life
3. **Confident Negative Space** — Generous breathing room; nothing feels cluttered
4. **Motion as Meaning** — Every animation communicates something; no decoration for its own sake

> Design inspiration: **Linear** (precision + dark surfaces), **Framer** (motion + interactive delight), **Stripe** (trust + polish), **Apple** (restraint + craft), **Dribbble-era SaaS** (lush gradients + glassmorphism)

**NEVER produce**: flat white cards, default Tailwind blue accents, Bootstrap grid layouts, or any interface that looks like a CRUD dashboard.

---

## 2. Color System

### Primary Palette
```css
:root {
  /* Background layers */
  --bg-void:        #060a0f;   /* Deepest background — almost black-green */
  --bg-base:        #0a1018;   /* Page background */
  --bg-surface:     #0f1a24;   /* Card / panel base */
  --bg-elevated:    #162232;   /* Elevated modals, dropdowns */

  /* Brand greens — botanical gradient family */
  --green-950:      #011a0d;
  --green-900:      #022b16;
  --green-700:      #0a5c2f;
  --green-500:      #16a349;   /* Primary brand green */
  --green-400:      #22c55e;
  --green-300:      #4ade80;
  --green-glow:     #22c55e40; /* Glow shadow color */

  /* Teal — bioluminescent accent */
  --teal-500:       #14b8a6;
  --teal-400:       #2dd4bf;
  --teal-300:       #5eead4;
  --teal-glow:      #14b8a640;

  /* Amber — warm soil tones */
  --amber-600:      #d97706;
  --amber-400:      #fbbf24;

  /* Text */
  --text-primary:   #f0fdf4;   /* Near-white with green tint */
  --text-secondary: #86efac;   /* Muted green */
  --text-muted:     #4b7a5e;   /* Subtle hint text */
  --text-inverse:   #060a0f;

  /* Semantic */
  --success:        #22c55e;
  --warning:        #fbbf24;
  --error:          #f87171;
  --info:           #38bdf8;
}
```

### Gradient Definitions
```css
/* Hero / page-level gradients */
--gradient-hero:
  radial-gradient(ellipse at 20% 50%, #022b1640 0%, transparent 60%),
  radial-gradient(ellipse at 80% 20%, #0a5c2f30 0%, transparent 50%),
  radial-gradient(ellipse at 50% 100%, #14b8a620 0%, transparent 60%),
  linear-gradient(180deg, #060a0f 0%, #0a1018 100%);

/* Card gradients */
--gradient-card:
  linear-gradient(135deg, rgba(22,34,50,0.8) 0%, rgba(10,26,36,0.9) 100%);

--gradient-card-hover:
  linear-gradient(135deg, rgba(22,58,34,0.6) 0%, rgba(10,26,36,0.9) 100%);

/* CTA / accent gradient */
--gradient-cta:
  linear-gradient(135deg, #16a349 0%, #14b8a6 100%);

--gradient-cta-hover:
  linear-gradient(135deg, #22c55e 0%, #2dd4bf 100%);

/* Text gradient (for headings) */
--gradient-text:
  linear-gradient(135deg, #4ade80 0%, #2dd4bf 50%, #86efac 100%);

/* Glow effects */
--glow-green: 0 0 40px #22c55e30, 0 0 80px #22c55e15;
--glow-teal:  0 0 40px #14b8a630, 0 0 80px #14b8a615;
```

---

## 3. Typography

### Font Families
```css
/* Display / Hero headings */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
--font-display: 'Instrument Serif', Georgia, serif;

/* UI / Body — modern geometric sans */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
--font-ui: 'Geist', system-ui, sans-serif;

/* Monospace — for scientific names, data */
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');
--font-mono: 'Geist Mono', monospace;
```

### Type Scale
```css
/* Tailwind config extensions */
fontSize: {
  'display-2xl': ['4.5rem',  { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' }],
  'display-xl':  ['3.75rem', { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '400' }],
  'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.015em' }],
  'display-md':  ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
  'display-sm':  ['1.875rem',{ lineHeight: '1.3' }],
  'body-lg':     ['1.125rem',{ lineHeight: '1.75' }],
  'body-md':     ['1rem',    { lineHeight: '1.7' }],
  'body-sm':     ['0.875rem',{ lineHeight: '1.6' }],
  'label':       ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.08em', fontWeight: '600' }],
}
```

### Typography Rules
- **Hero headings**: `font-display` italic, gradient text fill
- **Section headings**: `font-ui` weight 600, `text-primary`
- **Scientific names**: `font-mono` italic, `text-secondary`
- **Body text**: `font-ui` weight 400, `text-secondary` at 0.85 opacity
- **Labels / caps**: `font-ui` weight 600, uppercase, letter-spacing wide, `text-muted`
- **NEVER use**: Inter, Roboto, Arial, system-ui as primary font

---

## 4. Glassmorphism Component System

### Glass Card (Base)
```css
.glass-card {
  background: rgba(15, 26, 36, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(74, 222, 128, 0.12);
  border-radius: 20px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.glass-card:hover {
  border-color: rgba(74, 222, 128, 0.25);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(34, 197, 94, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
```

### Glass Panel Variants
```typescript
// Tailwind class compositions
const glassVariants = {
  base:     "bg-[#0f1a24]/70 backdrop-blur-xl border border-green-400/10 rounded-2xl",
  elevated: "bg-[#162232]/80 backdrop-blur-2xl border border-green-400/15 rounded-2xl shadow-2xl",
  modal:    "bg-[#0a1018]/90 backdrop-blur-3xl border border-green-400/20 rounded-3xl",
  subtle:   "bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl",
  glow:     "bg-[#0f1a24]/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.12)]",
}
```

---

## 5. Framer Motion Animation System

### Animation Tokens
```typescript
// /lib/animations.ts

export const EASING = {
  smooth:   [0.25, 0.46, 0.45, 0.94],
  snappy:   [0.2, 0, 0, 1],
  spring:   { type: 'spring', stiffness: 300, damping: 30 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 20 },
  springGentle: { type: 'spring', stiffness: 100, damping: 20 },
}

export const DURATION = {
  instant:  0.1,
  fast:     0.2,
  normal:   0.35,
  slow:     0.6,
  verySlow: 1.0,
}

// Page entry animation
export const pageVariants = {
  initial:  { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate:  { opacity: 1, y: 0,  filter: 'blur(0px)',
              transition: { duration: 0.5, ease: EASING.smooth } },
  exit:     { opacity: 0, y: -12, filter: 'blur(4px)',
              transition: { duration: 0.3 } },
}

// Stagger container
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } }
}

// Card entrance
export const cardVariants = {
  initial:  { opacity: 0, y: 32, scale: 0.96 },
  animate:  { opacity: 1, y: 0,  scale: 1,
              transition: { duration: 0.5, ease: EASING.smooth } },
}

// Float animation (looping)
export const floatAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  }
}

// Glow pulse (looping)
export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(34,197,94,0.1)',
      '0 0 60px rgba(34,197,94,0.3)',
      '0 0 20px rgba(34,197,94,0.1)',
    ],
    transition: { duration: 3, repeat: Infinity }
  }
}

// Blur reveal on scroll
export const blurReveal = {
  initial:  { opacity: 0, filter: 'blur(12px)', y: 20 },
  whileInView: { opacity: 1, filter: 'blur(0px)', y: 0,
                 transition: { duration: 0.7, ease: EASING.smooth } },
  viewport: { once: true, margin: '-80px' }
}
```

### Hover Micro-interactions
```typescript
// Button hover
export const buttonHover = {
  whileHover: { scale: 1.03, transition: EASING.spring },
  whileTap:   { scale: 0.97 },
}

// Card hover with depth
export const cardHover = {
  whileHover: {
    y: -6,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.12)',
    transition: { duration: 0.3, ease: EASING.smooth }
  }
}

// Icon spin on hover
export const iconHover = {
  whileHover: { rotate: 15, scale: 1.1, transition: EASING.springBouncy }
}
```

---

## 6. Component Library

### PrimaryButton
```tsx
// Glowing gradient CTA button
<motion.button
  className="relative px-6 py-3 rounded-xl font-ui font-semibold text-sm text-[--text-inverse]
             bg-gradient-to-r from-green-500 to-teal-500 overflow-hidden
             shadow-[0_0_30px_rgba(34,197,94,0.3)]"
  whileHover={{ scale: 1.03, shadow: '0 0 50px rgba(34,197,94,0.5)' }}
  whileTap={{ scale: 0.97 }}
>
  {/* Shimmer effect overlay */}
  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
    whileHover={{ translateX: '200%', transition: { duration: 0.6 } }} />
  {children}
</motion.button>
```

### PlantIdentificationCard
```
┌─────────────────────────────────────────────┐
│  [Plant Photo — full bleed, rounded top]     │
│                                              │
│  ┌── Confidence Ring ──────────────────────┐│
│  │   Animated SVG arc: 94% match           ││
│  └─────────────────────────────────────────┘│
│                                              │
│  🌿 Monstera Deliciosa          [Save +]    │
│  *Monstera deliciosa*                        │
│                                              │
│  ████████████ Easy care                      │
│  💧 Every 7 days  ☀️ Bright indirect        │
│                                              │
│  [View Full Care Guide →]                    │
└─────────────────────────────────────────────┘
```

### ChatMessage Bubble
```
User:      Right-aligned, teal-tinted glass pill
Sage:      Left-aligned, dark glass with green-400 left border accent,
           animated token-by-token text reveal (typewriter)
System:    Centered, muted, italic, label style
Image:     Rounded 16px, gentle shadow, expand on click
```

### CareMetricBadge
```
┌────────────────────────┐
│  [Icon]  Water         │
│  Every 7 Days          │
│  ████████░░ (80%)      │
└────────────────────────┘
Glassmorphic, animated progress bar fills on mount
```

### HealthScoreRing
```tsx
// SVG animated donut chart — 0 to score on mount
// Color: 80–100 = green glow, 50–79 = amber, <50 = red
// Center: large number + "Health" label
```

---

## 7. Page Layout Templates

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar (240px, glass, fixed)   │  Main Content Area       │
│                                  │                          │
│  🌿 Floravia logo                │  Top bar: search +       │
│  ─────────────────               │  notifications + avatar  │
│  🏠 Dashboard                    │  ──────────────────────  │
│  🔍 Identify Plant               │                          │
│  🌱 My Garden                    │  [HERO SECTION]          │
│  💬 Ask Sage                     │  Gradient mesh bg        │
│  🩺 Diagnose                     │  Animated plant cards    │
│  ─────────────────               │  Stagger entrance        │
│  ⚙️  Settings                    │                          │
│  💎 Upgrade to Pro               │                          │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout
- Bottom tab bar (5 icons, glassmorphic)
- Full-screen camera overlay for identification
- Swipeable plant card stack in garden view

---

## 8. Iconography & Imagery

- **Icons**: Lucide React — consistent stroke width 1.5, never filled
- **Plant imagery**: Lush macro photography, always with subtle vignette overlay
- **Illustrations**: Minimal botanical line art in green-400, SVG animated
- **Avatars**: Rounded-full, 2px green-400 ring, subtle glow
- **Empty states**: Animated SVG plant growing from seed (Lottie or CSS)

---

## 9. Spacing & Radius System

```
spacing: 4px base unit
Radius:
  sm:    8px   (badges, chips)
  md:    12px  (buttons, inputs)
  lg:    16px  (cards)
  xl:    20px  (panels)
  2xl:   28px  (modals)
  full:  9999px (pills)
```

---

## 10. Dark Mode Only

This product is **dark mode only**. There is no light mode. The interface lives in the lush darkness of a botanical night garden. Do not implement a theme toggle. The brand depends on the dark, glowing aesthetic.

All Tailwind config should set: `darkMode: false` (dark is the only mode).

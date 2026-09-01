# Floravia Botanical Design System

> **Authoritative Design System Documentation & Reverse-Engineered Visual Language**  
> *Extracted from the live Floravia codebase (`/src/index.css`, `App.tsx`, `Sidebar.tsx`, `TopHeader.tsx`, `DashboardView.tsx`, `AuthModal.tsx`, `FertilizerCalculator.tsx`, `CareCalendar.tsx`, and associated components).*

---

## 1. Design System Overview

Floravia is an AI-powered botanical intelligence and garden care platform built with **React 19**, **Tailwind CSS v4** (`@tailwindcss/vite`), and **motion** (`motion/react`).

The application features a **deep botanical dark aesthetic** (codenamed *Deep Botanical Void* / *Emerald Cyber-Flora*). It uses ultra-dark green-tinted backgrounds (`#050b08`, `#08120d`, `#0b1812`), luminescent emerald and cyan accents (`#10b981`, `#22c55e`, `#06b6d4`), translucent frosted glass cards (`backdrop-blur-md` to `backdrop-blur-2xl`), glowing radial drop shadows (`shadow-glow-green`, `shadow-glow-teal`), and a dual serif-sans typography hierarchy pairing **Instrument Serif** for expressive editorial headers with **Plus Jakarta Sans** for dense, legible data grids and UI controls.

---

## 2. Design Principles

1. **Botanical Dark Atmosphere**: Surfaces are not neutral grays or absolute blacks (`#000000`). All dark neutrals carry a subtle 3–8% green/teal undertone (`#050b08`, `#08110c`, `#0d1a14`, `#0f1f18`) to establish an immersive living biosphere mood.
2. **Luminescent Bio-Accents**: High-contrast emerald (`#10b981`), spring green (`#22c55e`), mint (`#4ade80`), and cyan/teal (`#2dd4bf`, `#06b6d4`) serve as focal points for interactive telemetry, vitality meters, and primary actions.
3. **Layered Optical Depth & Frosted Glass**: Surface elevation is communicated via `backdrop-filter: blur(20px)`, thin translucent borders (`border-emerald-500/20` to `border-white/10`), inner 1px highlights (`inset 0 1px 0 rgba(255,255,255,0.04)`), and multi-stage ambient glow blurs.
4. **Data-Dense Botanical Telemetry**: Information is organized into categorized chips, metric rings, Sparkline graphs (Recharts), and structured cards with high-contrast text hierarchies.
5. **Fluid Micro-Interactions**: Hover lifts (`hover:-translate-y-0.5` or `hover:-translate-y-1`), tap scaling (`scale-[0.98]`), spring-based active tab indicator morphing (`layoutId`), and pulse indicators communicate live system state.

---

## 3. Design Tokens

### Colors

#### Theme Palette (Defined in `/src/index.css` under `@theme`)

| Token Name | Hex / Value | Code Reference | Semantic Role / Usage |
| :--- | :--- | :--- | :--- |
| `--color-void` | `#050b08` | `index.css:10` | App canvas base background (`bg-void`, `body`) |
| `--color-base` | `#08110c` | `index.css:11` | Root structural containers and inner view wrappers |
| `--color-sidebar` | `#09130e` | `index.css:12` | Sidebar background variant (`Sidebar.tsx` uses `#08120d`) |
| `--color-surface` | `#0d1a14` | `index.css:13` | Default card and panel background (`bg-surface`) |
| `--color-card` | `#0f1f18` | `index.css:14` | Elevated card container background |
| `--color-card-border` | `rgba(34, 197, 94, 0.12)` | `index.css:15` | Default subtle border for botanical cards |
| `--color-elevated` | `#13271e` | `index.css:16` | Modals, active states, and popovers |
| `--color-primary` | `#f2fbf5` | `index.css:35` | High-contrast body text, primary headings, active labels |
| `--color-secondary` | `#a7d7bc` | `index.css:36` | Subheadings, descriptions, secondary values |
| `--color-muted` | `#527a63` | `index.css:37` | Timestamps, metadata, inactive icons, placeholder hints |
| `--color-inverse` | `#050b08` | `index.css:38` | Text on primary bright buttons (`text-slate-950` / `text-void`) |

#### Emerald / Green Scale (`@theme` & Tailwind utility classes)

| Token Name | Hex / Class | Primary Usage in Codebase |
| :--- | :--- | :--- |
| `--color-green-950` | `#021a0d` / `bg-emerald-950` | Chip backgrounds, subtle active badges |
| `--color-green-900` | `#042916` / `bg-emerald-900` | Inset wells, button hover backdrops |
| `--color-green-800` | `#064024` / `border-emerald-800` | Card borders, divider lines |
| `--color-green-700` | `#0b5c33` / `border-emerald-700` | Interactive border hover states |
| `--color-green-600` | `#108549` | Deep progress fills, secondary accents |
| `--color-green-500` | `#10b981` / `bg-emerald-500` | **Primary Brand Color**: CTAs, active badges, high-vigor meters |
| `--color-green-400` | `#22c55e` / `text-emerald-400` | Icons, active labels, success indicators |
| `--color-green-300` | `#4ade80` / `text-emerald-300` | Gradients, highlighted metrics |

#### Functional & Semantic Accent Colors

| Purpose | Class / Hex Values | Codebase Usage Example |
| :--- | :--- | :--- |
| **Teal / Cyan (Hydration & AI)** | `#14b8a6`, `#2dd4bf`, `#06b6d4` (`text-cyan-400`, `bg-cyan-500`) | Moisture levels, humidity widgets, voice recording indicators, AI features |
| **Amber / Yellow (Warnings & Pro)** | `#d97706`, `#f59e0b`, `#fbbf24` (`text-amber-400`, `bg-amber-500/20`) | Pro Plan badges, moderate health warnings, fertilizer reminders |
| **Rose / Red (Alerts & Pathology)** | `#ef4444`, `#f43f5e` (`text-rose-400`, `bg-rose-950/60`, `border-rose-500/40`) | Disease detection, destructive actions, error banners, notification dot |
| **Purple / Violet (Community)** | `#a855f7`, `#c084fc` (`text-purple-400`, `bg-purple-500/10`) | Forum badges, community wisdom highlights |
| **Blue (Information & Guides)** | `#3b82f6`, `#60a5fa` (`text-blue-400`, `bg-blue-500/10`) | Care encyclopedia headers, external documentation links |

---

### Typography

#### Font Families

Imported via Google Fonts in `/src/index.css` (Line 1):
```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap');
```

| Token | Family Name | CSS Variable | Fallbacks | Primary Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Font** | `Instrument Serif` | `--font-display` | `Georgia, serif` | Hero headlines, plant species names, modal titles, section headers |
| **Body / UI Font** | `Plus Jakarta Sans` | `--font-sans`, `--font-ui` | `system-ui, sans-serif` | All buttons, body copy, navigation, metric labels, form inputs |
| **Monospace Font** | `Geist Mono` | `--font-mono` | `monospace` | Telemetry readouts, timers, EC/TDS measurements, coordinates |

#### Typographic Scale & Hierarchy

| Element / Style | Font Family | Size / Leading | Weight / Tracking | Example Classes |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title (H1)** | `Instrument Serif` | `text-3xl md:text-5xl` | `font-bold tracking-tight leading-tight` | `font-display text-white` |
| **Section Header (H2)** | `Instrument Serif` | `text-2xl md:text-3xl` | `font-bold tracking-wide` | `font-display text-white` |
| **Card Title (H3)** | `Instrument Serif` or `Plus Jakarta Sans` | `text-lg md:text-xl` | `font-bold tracking-wide` | `font-display font-bold text-primary` |
| **Subhead / Widget Title** | `Plus Jakarta Sans` | `text-sm md:text-base` | `font-bold text-slate-100` | `font-ui font-bold text-slate-200` |
| **Standard Body Text** | `Plus Jakarta Sans` | `text-xs md:text-sm` (`line-height: 1.6`) | `font-normal text-slate-300` | `text-slate-300 text-xs md:text-sm font-ui` |
| **Micro-Label / Overline** | `Plus Jakarta Sans` | `text-[9px]` to `text-[11px]` | `font-bold uppercase tracking-widest` | `text-[10px] uppercase tracking-widest font-black text-muted` |
| **Monospace Data** | `Geist Mono` | `text-xs md:text-sm` | `font-mono font-bold` | `font-mono text-cyan-300 font-bold` |

---

### Spacing & Grid System

- **Base Layout**: 
  - Standard App Shell: Fixed Sidebar (`w-64`, `sticky top-0 h-screen`) + Sticky Top Header (`h-16`) + Main Content Area (`flex-1 max-w-7xl mx-auto p-4 md:p-6 lg:p-8`).
  - View Containers: `max-w-5xl` (Care Guide, Calendar, Forum) or `max-w-6xl` (Dashboard, Plant Analysis, Garden).
- **Component Padding Scale**:
  - Compact Cards / Widgets: `p-3.5` to `p-4` (14px – 16px)
  - Standard Cards: `p-5` to `p-6` (20px – 24px)
  - Modals & Hero Panes: `p-6 md:p-8` (24px – 32px)
  - Section Vertical Spacing: `space-y-6 md:space-y-8`
- **Gap Scale**:
  - Button contents: `gap-1.5` to `gap-2`
  - Inline badges & chips: `gap-2` to `gap-3`
  - Card grids: `gap-4` to `gap-6` (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

---

### Borders, Radii & Shadows

#### Border Radii

| Radius Token | Computed Value | Recurring Implementation In Codebase |
| :--- | :--- | :--- |
| `rounded-lg` | `8px` | Inner dropdown menu items, compact action buttons |
| `rounded-xl` | `12px` | Form inputs, standard buttons, icon wrapper tiles |
| `rounded-2xl` | `16px` | Small cards, widgets, sub-sections, tabs container |
| `rounded-3xl` | `24px` | Major cards (`bg-[#08140e]`), modals, full feature modules |
| `rounded-[18px]` | `18px` | Global `.dashboard-card` and `.glass-card` classes (`index.css`) |
| `rounded-full` | `9999px` | Search bar, user avatars, pill badges, toggle switches |

#### Shadows & Ambient Glows

```css
/* Defined in src/index.css */
--shadow-glow-green: 0 0 35px rgba(34, 197, 94, 0.25), 0 0 70px rgba(34, 197, 94, 0.1);
--shadow-glow-teal: 0 0 35px rgba(20, 184, 166, 0.25), 0 0 70px rgba(20, 184, 166, 0.1);

/* Dashboard card elevation */
.dashboard-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}
.dashboard-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
}

/* Glass card elevation */
.glass-card {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.glass-card:hover {
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.08);
}
```

---

## 4. Components

### 1. Primary Buttons

- **Brand Primary Button (Emerald CTA)**:
  - **Classes**: `bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm py-2.5 md:py-3 px-4 md:px-5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2`
  - **Disabled**: `disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100`

- **Secondary / Ghost Button (Dark Surface with Emerald Border)**:
  - **Classes**: `bg-[#0e2118] hover:bg-[#132d21] border border-emerald-800/40 hover:border-emerald-600/50 text-emerald-300 hover:text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2`

- **Subtle Action / Icon Button**:
  - **Classes**: `p-2 rounded-xl bg-[#0d1c15] border border-emerald-900/40 text-slate-300 hover:text-white hover:border-emerald-700/50 hover:bg-emerald-950/40 transition-colors cursor-pointer`

### 2. Form Inputs & Selects

- **Standard Text Input / Textarea**:
  - **Container / Input**: `w-full bg-[#0d1a13] md:bg-[#050e09] border border-emerald-900/40 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all`
  - **With Icon**: `pl-10` with icon positioned `absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 w-4 h-4`

- **Select Dropdown**:
  - **Classes**: `w-full bg-[#0d1c15] border border-emerald-900/40 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer`

### 3. Cards & Containers

- **Standard Botanical Card (`.glass-card` or Custom `#08140e`)**:
  - **Classes**: `bg-[#08140e] border border-emerald-900/30 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-emerald-700/40`
  - **Highlight / Accent Line**: `border-l-4 border-l-emerald-500/50` or `border-l-amber-400`

- **Header / Banner Panel**:
  - **Classes**: `bg-[#0b1b13] border-b border-emerald-900/30 p-4 md:p-5 flex items-center justify-between`

### 4. Navigation Systems

- **Desktop Sidebar (`Sidebar.tsx`)**:
  - Width: `w-64`, Background: `#08120d`, Border: `border-r border-emerald-900/20`.
  - Active Nav Item: `bg-emerald-950/60 text-emerald-300 border border-emerald-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_20px_rgba(16,185,129,0.1)]`.
  - Inactive Nav Item: `text-slate-400 hover:text-emerald-100 hover:bg-emerald-950/20`.

- **Top Application Header (`TopHeader.tsx`)**:
  - Height: `h-16`, Background: `#070f0b/90 backdrop-blur-md`, Border: `border-b border-emerald-900/20`.
  - Search Bar: Pill-shaped `rounded-full` with embedded voice search mic (`Mic`) and waveform indicator.

- **Mobile Navigation Bar (`Header.tsx`)**:
  - Floating pill docked at bottom: `fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[60] bg-surface/80 border border-white/10 p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl`.

### 5. Modals & Dialogs

- **Backdrop**: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md`
- **Modal Card**:
  - **Classes**: `bg-[#0b1812] border border-emerald-500/30 rounded-3xl max-w-md md:max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden text-white`
  - **Radial Blur Accent**: `absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none`
  - **Close Button**: `absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-950/40 transition-colors`

### 6. Badges, Pills & Status Indicators

- **Category / Species Chip**: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-bold uppercase tracking-wider`
- **Curated / Star Badge**: `bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded`
- **Vitality / Health Score Pill**: High (>70%): `text-emerald-400 bg-emerald-500/10 border-emerald-500/30`; Moderate (40-70%): `text-amber-400 bg-amber-500/10 border-amber-500/30`; Low (<40%): `text-rose-400 bg-rose-500/10 border-rose-500/30`

---

## 5. Responsive System

The application is structured mobile-first with adaptive desktop-first density:

| Breakpoint | Width Value | UI Transformations in Codebase |
| :--- | :--- | :--- |
| **Mobile (`< 768px`)** | Default | Sidebar converts to slide-out drawer or bottom navigation bar (`fixed bottom-6`); TopHeader shows hamburger menu button (`Menu`); grids collapse to `grid-cols-1`; font sizes scale from `text-3xl` (headers) and `text-xs` (body). |
| **Tablet (`md: >= 768px`)** | `768px` | Sidebar expands to persistent column (`w-64`); grids shift to `grid-cols-2`; weather pills and location dropdowns expand. |
| **Desktop (`lg: >= 1024px`)** | `1024px` | Grids shift to `grid-cols-3` or `grid-cols-4` (e.g. Garden Spatial Grid, Shop); detailed data tables display secondary columns (scientific names, timestamps). |
| **Wide Screen (`xl: >= 1280px`)**| `1280px` | Content wrapper constrained to `max-w-6xl` or `max-w-7xl` with centering `mx-auto` to prevent excessive visual stretching. |

---

## 6. Interaction & Motion System

Powered by **motion** (`motion/react`):

### Standard Transition Presets

1. **Card Entrance Transition**:
   ```typescript
   initial={{ opacity: 0, y: 15, scale: 0.98 }}
   animate={{ opacity: 1, y: 0, scale: 1 }}
   transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
   ```
2. **Modal Spring In**:
   ```typescript
   initial={{ opacity: 0, scale: 0.95, y: 20 }}
   animate={{ opacity: 1, scale: 1, y: 0 }}
   exit={{ opacity: 0, scale: 0.95, y: 20 }}
   transition={{ type: 'spring', damping: 26, stiffness: 320 }}
   ```
3. **Tab Layout Morphing (`layoutId`)**:
   ```typescript
   <motion.div
     layoutId="headerActiveTab"
     className="absolute inset-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 -z-10"
     transition={{ type: 'spring', stiffness: 400, damping: 30 }}
   />
   ```
4. **Staggered Children**:
   ```typescript
   variants={{
     hidden: { opacity: 0 },
     show: { opacity: 1, transition: { staggerChildren: 0.1 } }
   }}
   ```

---

## 7. Iconography & Imagery

- **Icon Library**: Exclusively `lucide-react`.
- **Primary Botanical Icons**:
  - `Leaf`, `Sprout`, `Flower2` (Botanical entities & brand identity)
  - `Droplets`, `CloudRain`, `Waves` (Moisture, watering, misting)
  - `Sun`, `Thermometer`, `Cloud` (Photoperiod & atmospheric weather)
  - `Bug`, `Scissors`, `Activity`, `Stethoscope` (Pest control, pruning, pathology)
  - `FlaskConical`, `Calculator`, `Scale` (Nutrients, NPK fertilizers)
  - `Sparkles`, `BrainCircuit`, `Atom` (AI reasoning & Gemini vision)
- **Icon Sizing Scale**:
  - Inline badges & micro-actions: `w-3.5 h-3.5` or `w-4 h-4`
  - Menu navigation & section titles: `w-5 h-5`
  - Large feature hero indicators: `w-6 h-6` to `w-8 h-8`
- **Image Treatments**:
  - Rounded with subtle border: `rounded-2xl border border-emerald-500/20 object-cover`
  - User Avatars: `w-8 h-8 rounded-full border border-emerald-500/30 object-cover`

---

## 8. Accessibility & UI States

- **Interactive Cursor**: Explicitly enforced in `src/index.css` via `@layer base`:
  ```css
  button, [role="button"], a, input[type="submit"], input[type="button"], label {
    cursor: pointer;
  }
  ```
- **Focus Rings**: `focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30`
- **Loading Indicators**: `Loader2 className="w-4 h-4 animate-spin text-emerald-400"`
- **Color Contrast**: Body copy relies on high-contrast pale mint (`#f2fbf5` or `text-slate-200`) against `#050b08` canvas, maintaining WCAG AAA contrast ratio > 12:1.

---

## 9. Consistency Rules

When contributing new components to Floravia, adhere strictly to these rules:

1. **Always use Dark Botanical Backgrounds**: Containers must use `#08140e`, `#0b1812`, or `#0d1a14` rather than generic gray (`#1f2937`).
2. **Card Borders Must Use Emerald/Green Opacities**: Use `border border-emerald-900/30` or `border border-emerald-500/20`.
3. **Dual Font Pairing**: Use `font-display` (`Instrument Serif`) strictly for major section titles and plant common names; use `font-ui` (`Plus Jakarta Sans`) for controls, inputs, badges, and numeric data.
4. **Primary CTAs Must Use Black Text on Emerald**: `bg-emerald-500 text-slate-950 font-bold`.
5. **Interactive Controls Must Have Visible Pointer Feedback**: Include `cursor-pointer`, hover opacity/scale changes, and tap scale (`active:scale-[0.98]`).

---

## 10. Known Inconsistencies & Legacy Patterns

1. **Dual Header Systems**: The codebase contains both `Header.tsx` (a top navigation bar with bottom mobile navigation) and `Sidebar.tsx` + `TopHeader.tsx`. `App.tsx` primarily renders `Sidebar.tsx` and `TopHeader.tsx`, while `Header.tsx` represents an earlier layout variant.
2. **Color Utility Classes vs CSS Variables**: Some components utilize direct Tailwind colors (`bg-emerald-500`, `text-slate-300`), while others utilize custom theme variables (`bg-surface`, `text-primary`). Both render harmonious shades of green and off-white.
3. **Card Border Radii**: Standard card components vary between `rounded-2xl` (16px), `rounded-[18px]` (`.glass-card`), and `rounded-3xl` (24px).

---

## 11. Implementation References & Source Traceability

| Design Rule / Token | Implementation Value | Source File Reference | Confidence |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#050b08` (`--color-void`) | `/src/index.css:10,47` | **HIGH** |
| **Primary Typography** | `Instrument Serif` + `Plus Jakarta Sans` | `/src/index.css:1,5-7` | **HIGH** |
| **Brand CTA Color** | `bg-emerald-500 text-slate-950` | `Sidebar.tsx:126`, `AuthModal.tsx:421` | **HIGH** |
| **Glass Card Definition** | `rgba(13,26,20,0.85)` + `blur(20px)` | `/src/index.css:75-82` | **HIGH** |
| **Green Ambient Glow** | `0 0 35px rgba(34,197,94,0.25)` | `/src/index.css:40` | **HIGH** |
| **Sidebar Background** | `#08120d` | `Sidebar.tsx:66` | **HIGH** |
| **TopHeader Height** | `h-16` (`64px`) | `TopHeader.tsx:144` | **HIGH** |
| **Modal Animation** | Spring (`damping: 26, stiffness: 320`) | `AuthModal.tsx:303` | **HIGH** |
| **Scrollbar Styling** | Dark green track `#070d0a` + thumb `#142a1f` | `/src/index.css:112-125` | **HIGH** |

---

## 12. Design Tokens Quick Reference

```typescript
export const FLORAVIA_TOKENS = {
  colors: {
    canvas: '#050b08',
    surface: '#08140e',
    elevated: '#0b1812',
    primaryText: '#f2fbf5',
    secondaryText: '#a7d7bc',
    mutedText: '#527a63',
    brandEmerald: '#10b981',
    brandGreen: '#22c55e',
    hydrationCyan: '#06b6d4',
    warningAmber: '#f59e0b',
    dangerRose: '#ef4444',
  },
  fonts: {
    display: "'Instrument Serif', Georgia, serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
    mono: "'Geist Mono', monospace",
  },
  radii: {
    input: '0.75rem',     // rounded-xl (12px)
    cardSmall: '1rem',    // rounded-2xl (16px)
    cardLarge: '1.5rem',  // rounded-3xl (24px)
    pill: '9999px',       // rounded-full
  },
  shadows: {
    glowEmerald: '0 0 35px rgba(34, 197, 94, 0.25), 0 0 70px rgba(34, 197, 94, 0.1)',
    card: '0 4px 24px rgba(0, 0, 0, 0.4)',
  }
};
```

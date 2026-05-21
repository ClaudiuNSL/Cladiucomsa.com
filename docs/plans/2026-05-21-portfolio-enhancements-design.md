# Portfolio enhancements — wow factor pass

**Date:** 2026-05-21
**Author:** Claudiu Comsa + Claude
**Branch:** `feature/redesign-2026` (continues from existing redesign)
**Status:** Approved by user, ready for implementation planning
**Companion docs:** `2026-05-21-portfolio-redesign-design.md`, `2026-05-21-portfolio-redesign-plan.md`

---

## Context

The base redesign landed on `feature/redesign-2026` (24 of 25 original tasks completed, commits `b30645b` → `8a9b7d1`). When the user reviewed the result, they reported it as "too simple and empty" compared to the [mdx.so](https://mdx.so) reference site. Two screenshots provided (`6.png`, `8.png`) show mdx.so's actual hero: a **light theme** with a glowing 3D object that morphs between an organic cluster and a frosted glass cube.

The original design over-corrected toward minimal — stripped TypeWriter, MagneticButton, FloatingParticles, TextReveal, AuroraBackground, etc. — and ended up flat. This enhancements pass adds back the missing "wow" without the cluttered noise of the original.

## Goals

1. **Light theme** matching mdx.so palette
2. **3D hero centerpiece** with scroll-driven morph (the signature wow moment)
3. **Sophisticated micro-interactions** on buttons, logo, cursor
4. **Tasteful atmosphere** that feels alive without being noisy

## Non-goals

- **No identical copy of mdx.so.** Inspire, don't clone.
- **No warm orange glow.** The user explicitly chose cyan-only — the 3D internal light uses cyan, not mdx's amber.
- **No new font installs.** Stay on Geist (already bundled).
- **No structural section changes.** Keep the 4 sections from the base redesign (Hero → Services → Projects → Contact).
- **No new content.** Translations stay as-is.

---

## Design tokens — new palette

| Token | Old (dark) | New (light) | Use |
|---|---|---|---|
| `bg-base` | `#0A0A0B` | `#F5F5F7` | Page background |
| `bg-elev` | `#13131A` | `#FFFFFF` | Cards, elevated surfaces |
| `text-primary` | `#FFFFFF` | `#0A0A0B` | Headlines |
| `text-secondary` | `#A1A1AA` | `#52525B` | Body copy |
| `text-muted` | `#71717A` | `#71717A` | Captions (unchanged) |
| `accent` | `#06B6D4` | `#06B6D4` | CTAs, glow, accents (unchanged) |
| `accent-soft` | rgba cyan 0.12 | rgba cyan 0.08 | Hover states (lighter on light) |
| `border` | rgba white 0.08 | rgba black 0.06 | Card borders, dividers |
| `aura-purple` | `#6D28D9` | `#A78BFA` | Lighter lavender on light bg |

**Atmosphere** — `GradientOrbs` updated:
- Opacity drops from 8-12% to 3-5% on light bg
- Cyan + lavender tints
- Stays static-fixed behind content

---

## Components & changes

### 1. New: `<HeroScene3D />`

The signature 3D element. React Three Fiber + drei.

**Files:**
- `app/components/HeroScene3D.tsx` (new, client component)
- New deps: `three`, `@react-three/fiber`, `@react-three/drei`

**Behavior:**
- Right side of hero (~40% width on lg+, hidden on mobile)
- Three morph stages driven by `useScroll` from `@react-three/drei`:
  1. **Stage 0 (top of page)**: organic sphere with vertex displacement (Perlin/simplex noise) — "blob"
  2. **Stage 1 (~50% scroll into hero)**: DNA double-helix shape — two intertwined spirals
  3. **Stage 2 (~95% scroll into hero, before Services)**: rounded cube with frosted glass material
- Material: `MeshTransmissionMaterial` (frosted glass with refraction)
- Internal light: cyan `#06B6D4` point light, intensity 2-3
- Surrounding particles: ~80 small spheres orbiting (drei `<Sparkles />` or custom)
- Auto-rotates idle, faster on cursor proximity (subtle parallax)
- **Reduced motion**: static cube + glow, no morph, no rotation
- **Touch devices**: degraded mode (static still image fallback rendered server-side OR skip entirely)

**Performance budget:**
- Lazy-loaded (`next/dynamic` with `ssr: false`)
- Throttled to 60fps max
- Pause when off-viewport (intersection observer)
- Bundle impact: ~80kb gzip after tree-shaking (three + r3f core)

### 2. Modify: `<NavLogo />` → single C + name layout

**Files:**
- `app/components/NavLogo.tsx` (rewrite as SVG-based)
- Possibly `app/components/Navbar.tsx` (tweak layout)

**Behavior:**
- Renders **single C** (SVG path) + thin vertical separator + "Claudiu Comsa" wordmark
- The C is a custom SVG (32-40px) with cyan stroke/fill
- On click: **particle burst + scale bounce**
  - ~24 small cyan particles emit radially from center, fade out over 800ms with random spread
  - C itself scales 1 → 1.2 → 1, bounces back via spring
  - Implemented with framer-motion + small particle array
- On hover: subtle glow pulse around C
- Click navigates to `/` (existing behavior preserved)

### 3. New: `<FallingLettersButton />` component

**Files:**
- `app/components/FallingLettersButton.tsx` (new)
- Used in: Hero CTAs, Navbar CTA, ContactForm submit

**Behavior:**
- Receives `children` (string) — splits into letters wrapped in spans
- Idle: letters render normally
- On hover: each letter animates `y: -24 → 0` with stagger 30ms, opacity 0 → 1, ease `[0.22, 1, 0.36, 1]`, ~250ms each
- Re-runs on every fresh hover (with debounce so spam-hover doesn't break)
- Otherwise looks identical to a normal pill button
- Variant prop: `primary` (cyan fill) or `secondary` (outline)
- Includes focus ring (a11y)

### 4. New: `<CustomCursor />`

**Files:**
- `app/components/CustomCursor.tsx` (new, client component)

**Behavior:**
- Outer ring (24px) + inner dot (4px), both following mouse with spring physics
- Outer ring lags slightly (~50ms) for trailing feel
- On hover over interactive elements (`a`, `button`, `[role=button]`, custom `data-cursor=lg`): ring grows to 48px, opacity drops slightly, becomes filled cyan
- On hover over text inputs: ring morphs to thin vertical bar
- **Skipped entirely** on touch devices (`@media (hover: none)`)
- **Skipped entirely** under `prefers-reduced-motion: reduce`
- Native cursor hidden when custom is active

### 5. New: `<HeroTagChips />`

**Files:**
- `app/components/HeroTagChips.tsx` (new)

**Behavior:**
- Three chips below hero subtitle: "WEB · AI · INTERNAL APPS" (or RO equivalents from messages)
- Uppercase, tracking-wide, small (12px), thin border, accent-color on the active one
- Active chip cycles every 3s through the three (subtle color shift, not jump)
- Static if reduced motion is enabled

### 6. Modify: `<Hero />`

**Files:**
- `app/components/sections/Hero.tsx` (refactor)

**Changes:**
- Split title onto 2 lines: "Construim site-uri" / "și automatizări AI." — `<br>` between
- Reveal: each line slides up + fades in with 150ms stagger between lines (NOT per-word)
- Add `<HeroScene3D />` to the right (hidden on mobile, visible on `lg+`)
- Add `<HeroTagChips />` below subtitle, above CTAs
- CTAs become `<FallingLettersButton />` instances

### 7. Modify: all components for light theme

**Files:**
- `app/globals.css` (new tokens)
- `app/components/Navbar.tsx` (light bg variant, borders darker)
- `app/components/Footer.tsx` (light variant)
- `app/components/sections/Services.tsx` (text color flips)
- `app/components/sections/Projects.tsx` (text + chip color flips)
- `app/components/sections/Contact.tsx` (text + form color flips)
- `app/components/ServiceCard.tsx` (bg `bg-white` instead of `bg-white/[0.02]`, border `border-black/[0.06]`)
- `app/components/ProjectShowcase.tsx` (text colors flipped, tech chips on light)
- `app/components/ContactForm.tsx` (input bottom-border darker, text dark)
- `app/components/LanguageSwitcher.tsx` (dropdown bg becomes white with shadow)
- `app/components/GradientOrbs.tsx` (opacity + tint adjustments)
- `app/[locale]/layout.tsx` (no changes — bg from globals)

---

## Typography tuning

To get closer to mdx feel without a new font:
- Hero H1: Geist Bold (700), `tracking-tight` (`-0.04em`), sizes scale up — `text-5xl sm:text-6xl lg:text-7xl xl:text-[10rem]`
- Section H2s: Geist Bold (700), `tracking-tight`, max `text-6xl`
- Body: unchanged (Geist Regular 400, 18px)
- Eyebrows / chip text: uppercase, `tracking-[0.2em]`, 11px

---

## Migration approach

Continue on `feature/redesign-2026`. No new branch. Each enhancement is its own commit. After enhancements complete, resume original T23 (audit), T24 (push), T25 (PR).

## Open / out of scope

1. **Showreel video** (mdx has one) — out of scope, no video assets
2. **Service filters** (mdx has category toggle) — out of scope, only 3 services
3. **Loading screen with "Perfection takes a moment" microcopy** — out of scope, already dropped in base redesign
4. **Lottie animations** — out of scope, R3F covers the 3D need

## Approval

User confirmed full enhancements package on 2026-05-21 ("confirm" message). Ready for implementation plan.

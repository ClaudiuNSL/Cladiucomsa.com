# Portfolio redesign 2026 — design

**Date:** 2026-05-21
**Author:** Claudiu Comsa + Claude
**Branch:** `feature/redesign-2026` (branched off `feature/site-audit-fixes`)
**Status:** Approved by user, ready for implementation planning

---

## Context

Current portfolio (`claudiucomsa.com`) was identified as needing serious work on 2026-05-16 — 8 critique points around copy/audience mismatch, generic AI-sounding headlines, weak SSR, fake projects, etc. Since then, projects were replaced with real ones (Banciu Costin, Aurasjobs, Stereocad). The redesign now goes further: full visual + structural overhaul aimed at a premium, editorial "studio" feel, with bilingual (RO + EN) support.

Reference site selected by user: **[mdx.so](https://mdx.so/)** — dark editorial, big bold typography, asymmetric layouts, generous whitespace, subtle atmospheric blurs, minimal but premium motion vocabulary.

## Goals

1. **Premium, editorial feel** — site should look like a studio, not a junior portfolio
2. **Bilingual support** — RO + EN with proper i18n (routes, SEO, hreflang)
3. **Focused, concise** — 4 sections only, less scroll, every section earns its place
4. **Content in Romanian** primary, English secondary — fix the "RO SEO, EN copy" mismatch from prior critique
5. **Concrete services + real projects** — replace buzzwords with deliverables aligned to actual portfolio work
6. **No filler** — remove animations and components that add noise without value (TypeWriter, particles, magnetic buttons, single weak testimonial, etc.)

## Non-goals

- **No FreeCodeCamp exercises** — small learning projects don't fit a pro portfolio
- **No portrait/headshot** — site is brand-level, not personal
- **No testimonials section** — only one weak quote exists; section dropped until real ones come in
- **No tech stack logo grid** — clients don't read lists of React/TS/Next logos
- **No map embed** — Constanța location stated as text, no Google Maps iframe
- **No "About Me" section** — folded into a 1-2 line hero subtitle
- **No "My Goals" or fluff About copy** — eliminated

## Audience + positioning

- **Primary**: Romanian SMBs + agencies; Constanța / national reach
- **Secondary**: international remote clients (EN version exists for this)
- **Voice**: plural ("noi / we") to read as a studio rather than solo freelancer, even though it's a single operator. Personal name appears in About/Contact context, not in hero brand voice.

---

## Architecture

### Stack (kept)
- Next.js 15 (App Router) + TypeScript + Tailwind + framer-motion

### i18n (new)
- Library: **`next-intl` v3** (App Router native, mature, ICU message format)
- Routes: `/ro/...` (default) and `/en/...`
- Root `/`: redirect to user's preferred locale based on `Accept-Language` header, with cookie override
- Translation files: `messages/ro.json` + `messages/en.json` — all strings externalized, nothing hardcoded
- SEO per locale:
  - Separate `<title>`, `<meta description>`, OG tags per language
  - `hreflang` alternates between `/ro` and `/en` versions of each page
  - `sitemap.xml` lists both locale variants
  - `lang="ro"` / `lang="en"` set per route
- Language switcher: dropdown in Navbar (top-right), persists choice in `NEXT_LOCALE` cookie, preserves current route across switch (`/ro/projects` ↔ `/en/projects`)

### Migration approach
- Branch off current `feature/site-audit-fixes` (carries forward audit work: CSP, PWA manifest, focus-visible rings, sizes attributes)
- Build redesign in parallel on new branch — keep old `app/page.tsx` until cutover commit
- Vercel preview deploy on `feature/redesign-2026` for visual review before merge to main

---

## Visual direction

### Color tokens

| Token | Value | Use |
|---|---|---|
| `bg-base` | `#0A0A0B` | Page background (deeper than current slate-900) |
| `bg-elev` | `#13131A` | Card surfaces, elevated panels |
| `accent` | `#06B6D4` | CTAs, hover marks, micro-accents only |
| `accent-soft` | `rgba(6,182,212,0.12)` | Hover backgrounds, soft highlights |
| `aura-purple` | `#6D28D9` | Secondary orb tint (12% opacity max) |
| `text-primary` | `#FFFFFF` | Headlines |
| `text-secondary` | `#A1A1AA` | Body copy |
| `text-muted` | `#71717A` | Captions, tags, tech labels |
| `border` | `rgba(255,255,255,0.08)` | Subtle dividers, card borders |

**Banned**: cyan→blue gradient text on every heading (current overuse). Cyan stays as solid accent only.

### Atmosphere
- 2-3 large static gradient orbs (`GradientOrbs` component) — `position: fixed`, blur 200-300px, opacity 8-12%, mix of cyan + purple tints
- Replaces existing animated `AuroraBackground` (drop)

### Typography
- Single family: **Geist** (already bundled with Next.js, zero font-load cost)
- Headlines: Geist Bold, **96-128px desktop / 56-72px mobile**
- Body: Geist Regular, 18px
- Hierarchy from size + weight, never from font swap

### Layout
- Container max-width: **1400px** (up from 1152px)
- Lateral padding: 32px
- Hero: minimum 100vh
- Other sections: ~80vh minimum
- Section transitions: fade only — drop `section-glow-line` dividers

### Motion vocabulary
- **Allowed**: fade + translate-y reveal on scroll (stagger ≤100ms), thin scroll progress bar, hover lift on cards, subtle cursor-follow blur, image scale on project hover
- **Banned**: typewriter, per-word text reveal, magnetic buttons, floating particles, animated aurora background, springy bouncy curves

### Custom cursor (optional, behind `prefers-reduced-motion` guard)
- Small dot + outer ring that follows mouse
- Ring grows on hover over interactive elements
- Skipped entirely on touch devices and reduced-motion preference

---

## Sections

### 1. Hero

**Layout**: asymmetric, full-bleed. Title block left (60% width), right side intentionally near-empty — single thin vertical line or "Scroll" indicator bottom-right.

**Content (RO / EN)**:
- Eyebrow tag: `Web · AI · Automation` (or `Constanța → Worldwide`)
- H1 (Geist Bold 128px desktop):
  - RO: *Construim site-uri și automatizări AI care chiar livrează.*
  - EN: *We build websites and AI automations that actually deliver.*
- Sub-headline (24px):
  - RO: *Dashboard-uri, agenți AI, integrări. Pentru afaceri care vor mai mult decât un site de prezentare.*
  - EN: *Dashboards, AI agents, integrations. For businesses that want more than a brochure site.*
- CTAs:
  - Primary (cyan filled): `Vezi proiecte` / `See projects`
  - Secondary (outline): `Hai să vorbim` / `Let's talk`

**Motion**: H1 reveals with fade + translate-up, ~100ms stagger between large word groups (NOT per-letter). Sub-headline + CTAs fade in after, ~200ms delay.

**Removed from hero**: portrait image, TypeWriter eyebrow, floating particles, animated aurora.

### 2. Services

3 services (down from 4), each aligned to a real project for storytelling continuity.

| # | Service (RO) | Service (EN) | Aligned project |
|---|---|---|---|
| 01 | Site-uri web profesionale | Professional websites | Banciu Costin |
| 02 | Agenți AI & automatizări | AI agents & automations | Aurasjobs |
| 03 | Aplicații interne & dashboard-uri | Internal apps & dashboards | Stereocad |

**Card layout**: each service = 1/3 of row on desktop, full-width on mobile.

**Per card**:
- Large number `01` / `02` / `03` in corner (Geist Bold ~80px, low opacity)
- Service title (Geist Bold ~32px)
- 2-3 concrete sentences: what gets delivered, for whom, what outcome — never buzzwords
- "Vezi exemplu →" / "See example →" link, smooth-scrolls to corresponding project

**Removed**: 4th vague service ("UI/UX Design" or "Custom Solutions"), service icons (lucide icons replaced with the large `01/02/03` numerals).

### 3. Projects

3 projects kept: Banciu Costin, Aurasjobs, Stereocad.

**Layout**: each project = full-width section, NOT card grid. Alternates left-right between projects.
- Project 1: screenshot left (60%), details right (40%)
- Project 2: details left, screenshot right
- Project 3: screenshot left, details right

**Per project**:
- Title (Geist Bold ~48px)
- 2-3 sentence punch summary (problem solved, what it does, who it's for)
- 2-3 tech tags as small chips (e.g., `Next.js`, `OpenAI API`, `Magic Link Auth`)
- CTAs: `Live demo →` (cyan) + `Source →` (outline) where applicable

**Hover**: screenshot scales up ~2%, subtle cyan overlay appears on image, cursor turns into `→` arrow.

**Removed**: `ScrollScale` horizontal slide-in (too much movement), project icon fallback (all 3 projects have screenshots now).

### 4. Contact

**Layout**: 2 columns on desktop, stacked on mobile.

**Left column**:
- H2 (Geist Bold ~64px):
  - RO: *Hai să discutăm proiectul tău.*
  - EN: *Let's talk about your project.*
- Sub-text (18px):
  - RO: *Răspund în maxim 24 de ore lucrătoare. Constanța · Remote · Worldwide.*
  - EN: *I respond within 24 business hours. Constanța · Remote · Worldwide.*

**Right column**:
- Contact form (existing `ContactForm` component, redesigned styling — flat fields, no card chrome)
- Below form: contact links as plain text with underline-on-hover — no card panels:
  - Email: `claudiucomsa29@gmail.com` *(todo: switch to domain email after Namecheap setup)*
  - Telefon: `0761 880 406`
  - LinkedIn
  - GitHub

**Removed**: separate cards for Email / Phone / Location / Connect, Google Maps embed.

### Footer

Minimal: copyright line + 3 inline text links (GitHub, LinkedIn, Email) + duplicate language switcher (right side).

---

## Component inventory

### Drop completely
- `TypeWriter`
- `MagneticButton`
- `FloatingParticles`
- `TextReveal` (per-word)
- `AuroraBackground` (animated)
- `TestimonialsCarousel` + whole testimonials section
- `TechStack` (logo list)
- Possibly `ScrollScale` (TBD during implementation)

### Refactor + keep
- `Navbar` — add `LanguageSwitcher`, restyle to minimal
- `Footer` — strip to minimal
- `ScrollProgress` — thinner (1-2px), more discreet
- `AnimatedSection` — restrict to fade + translate-y only, no spring bounce
- `ContactForm` — flatten styling, drop card chrome
- `SpotlightCard` — optional, only for service cards (decide during impl)
- `TiltCard` — optional, decide during impl (lean: drop)

### New components
- `LanguageSwitcher` — dropdown in Navbar + Footer, cookie-backed, route-preserving
- `GradientOrbs` — fixed-position decorative blurs
- `CustomCursor` — dot + ring, with `prefers-reduced-motion` guard and touch-device skip
- `ServiceCard` — large numbered card with smooth-scroll link to project
- `ProjectShowcase` — full-width alternating left-right project layout

---

## Open items / todos out of scope

1. **Domain email setup** — Claudiu to configure Namecheap email forwarding for `claudiu@claudiucomsa.com` → Gmail. Site uses gmail placeholder until done.
2. **`banciucostin.ro` SEO repair** — separate work, separate repo. Should ideally be done before this redesign goes live since Banciu is the showcased "Professional Website" example.
3. **Real testimonial collection** — once a real client testimonial exists, consider re-adding a small testimonial block.
4. **Project case-study pages** (`/projects/[slug]`) — current site has `/projects` route. Decide during implementation whether each project gets a dedicated case-study sub-page or stays inline only.

---

## Approval

User confirmed all 7 design sections + component inventory on 2026-05-21. Ready for implementation plan (next: `writing-plans` skill).

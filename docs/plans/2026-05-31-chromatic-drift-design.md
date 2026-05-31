# Chromatic Drift — Design Document

**Date:** 2026-05-31
**Status:** Locked. Reference for implementation.
**Reference artifact:** `previews/chromatic-drift/index.html`
**Submission target:** Awwwards SOTD

---

## 1. Direction

Single-page portfolio scroll experience for Claudiu Comșa (web developer freelance, Constanța). Editorial-cinematic with WebGL background + 3D foreground accent + scroll-driven palette interpolation. Sober base, one WOW per section, professionally calibrated motion.

Aesthetic anchors: warm bej continuum, generous typography, custom cursor, magnetic CTAs, hidden artpiece nav.

## 2. Audience & goals

- ~50% recrutori tech (must register professional competence within 5s)
- ~50% clienți freelance (must communicate quality + reliability + price-resistance)
- Awwwards judges (must deliver a signature moment on first scroll)

**Single success metric:** does it submit to Awwwards SOTD without embarrassment?

## 3. Language

Romanian ONLY. No `/[locale]` segment. No i18n library.

## 4. Sitemap

```
/             Single-page scroll: hero → manifesto → projects header → P1..P5 → studio → story → footer
/work/[slug]  Per-project case study (linked from each project card via View Transitions API)
```

Case studies are scope for Phase 2.

## 5. Visual system

### 5.1 Palette — 4 scroll stops, interpolated continuously

| Stop | Section anchor | Base RGB | Accent RGB |
|------|----------------|----------|------------|
| 1 | Hero | `(0.96, 0.94, 0.89)` cream paper | `(0.65, 0.65, 0.67)` cool gray |
| 2 | Projects | `(0.91, 0.85, 0.74)` bej sand | `(0.42, 0.39, 0.34)` taupe |
| 3 | Studio / Story | `(0.88, 0.80, 0.66)` bej-portocaliu | `(0.78, 0.50, 0.30)` burnt orange |
| 4 | Footer | `(0.16, 0.14, 0.11)` warm charcoal | `(0.85, 0.70, 0.48)` gold cream |

The shader receives the two interpolated colors as uniforms `uBase` + `uAccent`. CSS vars `--fg`, `--fg-soft`, `--fg-line` mirror this; body adds `.fg-light` class when scroll progress > 0.82, flipping text to cream.

No cyan, no electric, no neon. Burnt orange + gold are the only "warm accents" allowed.

### 5.2 Typography

| Use | Font | Weight | Notes |
|-----|------|--------|-------|
| Display + body | Geist (variable, Google Fonts) | 300–700 | One family, weight contrast for emphasis |
| Meta / labels / monospace | Geist Mono | 500 | Eyebrows, captions, numbers, button labels |

No serif. No italic — emphasis = weight + `--fg-soft` color.

Sizes:
- Hero name: `clamp(60px, 14vw, 220px)`
- Section H2: `clamp(40px, 7vw, 110px)`
- Project titles: `clamp(40px, 5.5vw, 130px)`
- Body: `clamp(15px, 1.1vw, 19px)`
- Mono labels: `11px` with `letter-spacing: 0.25em` uppercase

### 5.3 Motion principles

- Smooth scroll via Lenis (`duration: 1.15`)
- All scroll-driven animation via GSAP ScrollTrigger with `scrub: 1` (not toggle-based)
- Easings: `expo.out` for entrances, `cubic-bezier(0.7, 0, 0.2, 1)` for interactions, `power2.inOut` for transitions
- No animation > 1.6s
- Reduced motion: must respect `prefers-reduced-motion` (Phase 1.5)

## 6. Component specs

### 6.1 Nav (hidden artpiece)

- Position: fixed top, `mix-blend-mode: difference`
- Left: empty until hero condense completes, then CC monogram (Geist 700, 22px) fades in
- Right: meta string `CONSTANȚA · 2026` + hamburger
- Hamburger → full-screen overlay menu, dark `#1c1a16` bg, cream text, 4 items in huge type (96–144px), 0.9s cubic-bezier reveal

### 6.2 Hero

Layout: full-viewport flex column, eyebrow → name → sub → bio + CTA + scroll hint

Animations:
1. **Letter cascade reveal** (1.9s delay after loader): each letter of "CLAUDIU COMȘA" rises from `y: 110%` with 0.04s stagger, expo.out
2. **Scroll condense** (pinned for +120%): middle letters (LAUDIU + OMȘA) translate horizontally toward the nearest C and collapse to `scaleX: 0.001 opacity: 0`. The whitespace closes. Then the wrap scales to 0.13 and translates to nav position. Wrap fades out at 0.92, nav CC fades in (`.nav-cc.show`)
3. Eyebrow + sub + bio + CTA + scroll-hint fade in at 2.6s, stagger 0.08

CTA: magnetic button "Vezi proiecte" → anchors to `#projects`.

### 6.3 Manifesto (intro)

Single huge editorial sentence. Letters cascade up on scroll-scrub (each `.char` translates `y: 120% → 0%`). Soft phrase rendered with `--fg-soft`.

### 6.4 Projects header

H2 "Lucrări selectate" with `<span class="soft">selectate</span>` (lighter weight + soft color). Meta strip `2024 — 2026 / 05`.

### 6.5 Project signature effects

| # | Project | Effect |
|---|---------|--------|
| 01 | Banciu Photo | Horizontal scroll pinned. 5 cards (1 intro + 4 image plates). On mobile: native horizontal scroll, no pin |
| 02 | Aurasjobs | Pinned 250vh. Main card zooms from `scale: 0.35 → 1`. 6 glass shards translate from offscreen `data-x/data-y` to position. Title fades in at 0.4 |
| 03 | Stereocad | Split-scroll: text column scrolls naturally on left; `position: sticky` on right pins a CSS 3D cube that rotates `rotateY: 720 rotateX: 180` across the section. Mobile: stacks to single column, cube becomes 70vh sticky |
| 04 | (confidential) | Letter-explode on title: each char gets random `y(80-220) rotate(±25) scale(0.6-1.4)` revealed via `from: 'random'` stagger, scrub: 1 |
| 05 | Atelier personal | CRT glitch: R/G/B layers separate (`x: ±12 / y: 6` on scrub), scanline drifts from `top: 30% → 95%`, hue-rotate keyframe burst on enter |

### 6.6 Studio

Left: H2 "Ce intră în mână". Right: 5-item list. Each `li` has top/bottom border, padding-left animates on hover (16px slide), idx number on the right.

### 6.7 Story (Despre)

2-column grid (1.2fr / 0.8fr). Mobile: single column.

**Left:** H2 + 3 paragraphs (RO copy locked, see preview).

**Right:** `<figure>` with portrait photo, treatment **b + c**:
- Aspect 4:5
- CSS filter `grayscale(0.35) contrast(1.05) brightness(0.95) sepia(0.06)`
- `mix-blend-mode: multiply` blends with bej shader background
- Initial state `clip-path: inset(100% 0 0 0)` (hidden from top)
- On scroll enter at 65% viewport: tween to `inset(0% 0 0 0)` over 1.6s expo.out (mask reveal from bottom to top)
- Internal parallax: image `yPercent: -9` scrub-tied to section, image height `110%` to allow movement without exposing background

Caption below: name + location, mono small caps.

Photo file lands at `previews/chromatic-drift/assets/claudiu.jpg` (and `public/story/claudiu.jpg` in the Next.js implementation). Until provided: placeholder div with gradient + text.

### 6.8 Footer

- H2 "Hai să construim ceva." (180px). "Hai să" rendered soft. Email is the underlined link.
- Two magnetic CTAs row: "Scrie-mi pe email" + "Stabilește un call · 15 minute · gratuit"
- 3-col grid: Contact / Social / Disponibilitate
- Footer bottom: copyright + "Built · Constanța"
- Section sits in stop-4 palette → body has `.fg-light` class active → text is cream

### 6.9 Magnetic button

```
border: 1px solid var(--fg)
border-radius: 100px
padding: 18px 30px
Geist Mono, 12px, 0.16em letter-spacing, uppercase, weight 500
::before pill that translates from y: 100% to 0 on hover (fill effect)
.btn-text holds two stacked labels (l1, l2): l1 translates up, l2 enters from below
arrow translates right 4px on hover
JS: cursor magnetic pull 0.35 strength, elastic.out return
```

### 6.10 Sound toggle

Bottom-right pill, glass-blurred. Currently UI-only (no audio). Phase 2 will wire ambient layer.

## 7. Tech stack (versions verified 2026-05-31 from GitHub releases)

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Framework | Next.js (App Router) | **16.2.6** | Latest stable. View Transitions API, PPR, RSC, Turbopack stable |
| Runtime | React | **19.2.x** | Latest stable. Server Components + Actions + use() hook |
| Language | TypeScript strict | latest | |
| Styling | Tailwind CSS + CSS vars | latest v4 | Tailwind v4 has CSS-first config + native CSS vars integration |
| 3D | three | **r184** | Latest. Use ES modules via `next/dynamic` to avoid SSR collisions |
| Animation | gsap + ScrollTrigger + SplitText | **3.15.0** | **GSAP is now 100% FREE since v3.13** (Webflow acquired GreenSock 2024) — SplitText / MorphSVG / ScrollSmoother / all bonus plugins included. Use SplitText for hero letter split + manifesto cascade |
| Smooth scroll | lenis | **1.3.23** | Required for predictable ScrollTrigger behavior. Latest API matches our preview code |
| Fonts | Geist + Geist Mono via `next/font/google` | latest | Self-hosted, no FOUT, automatic preload |

**Critical update from preview:** the v2 HTML preview used a custom letter-splitter for hero name + manifesto + P4 title because GSAP SplitText was historically paid. As of GSAP 3.13+ SplitText is **free**. Implementation will use the official `SplitText` plugin for better Unicode handling (Romanian diacritics ț/ș/ă/î/â), screen-reader-friendly aria-labels, automatic restoration, and resize-aware re-splitting.

NOT included: framer-motion (overkill alongside GSAP), @react-three/fiber (overhead for one icosahedron — keep raw three.js), MDX (no blog yet), drei (not needed without R3F).

## 8. Mobile parity

Hard requirement per `feedback_mobile_parity.md`. Per-section adaptations:

- Hero CC condense: same logic, smaller scale target, anchored to actual mobile nav CC position
- Shader: same shader, capped `setPixelRatio` at 1.5 on mobile, reduced noise complexity if `<768px`
- 3D icosahedron: hidden on mobile or `opacity: 0.35` only
- P1 horizontal scroll: replaced with native overflow-x scroll
- P2 pin: works but stage shrinks
- P3 split: stacks to single column, cube becomes a 70vh sticky element
- P4/P5: same animations, smaller type
- Story: stacks photo below text
- Custom cursor: hidden via `@media (hover: none)`, default cursor restored

## 9. Performance budget

- LCP < 2.5s on Constanța 4G
- Hero shader: < 16ms per frame at 60fps on 2020+ phones
- Total JS payload < 250KB gzipped (gsap + three are the main contributors — accept)
- Three.js: only icosahedron + plane = ~150 vertices total. Trivial.
- No FOUT — fonts via `next/font` with `display: swap`
- Image: portrait photo lazy + AVIF/WebP via `next/image`

## 10. Implementation phases

**Phase 0 — Pre-flight (manual, with user approval)**
- Push `main` to `origin/archive/v1-cinematic-blue` (backup)
- Decide scaffold strategy: in-place rewrite vs fresh Next.js project
- Create feature branch `feature/chromatic-drift-2026`

**Phase 1 — Foundation**
- Clean Next.js scaffold (remove Cinematic Blue Explorer components)
- Set up Geist fonts via `next/font`
- Theme provider with CSS vars + scroll-driven palette interpolation
- Lenis + ScrollTrigger global setup

**Phase 2 — Shared chrome**
- Nav (with CC slot + hamburger + overlay menu)
- Custom cursor component
- Scroll progress bar
- Transition flash overlay
- Sound toggle (UI)

**Phase 3 — Background scenes**
- WebGL shader background (Simplex + chromatic + grain)
- 3D foreground icosahedron scene
- Both wired to global scroll progress

**Phase 4 — Hero**
- Letter cascade reveal
- Scroll condense → CC migration to nav
- Magnetic CTA button component

**Phase 5 — Sections**
- Manifesto (letter cascade on scrub)
- Projects header
- P1-P5 (each its own signature scroll effect)
- Studio (list with hover)
- Story (with photo placeholder + b+c treatment)
- Footer (with magnetic CTAs)

**Phase 6 — Polish**
- Mobile pass on every section
- `prefers-reduced-motion` paths
- Lighthouse run, fix LCP/CLS
- Image optimization

**Phase 7 — Case studies (deferred)**
- `/work/[slug]` template
- View Transitions API for entry/exit

## 11. SEO

`<html lang="ro">` — single-language site, no `hreflang`, no `<link rel="alternate">`.

**Metadata (Next.js `generateMetadata`):**
- Title template: `Claudiu Comșa — Web Developer din Constanța`
- Open Graph: og:title, og:description, og:image (custom 1200x630 with CC monogram + cinematic background), og:type=website, og:locale=`ro_RO`
- Twitter Card: `summary_large_image`
- Canonical: `https://claudiucomsa.com/`
- Robots: `index, follow`
- Sitemap.xml + robots.txt via Next.js native handlers

**Structured data (JSON-LD):**
- `Person` schema with: name, jobTitle, address (Constanța, România), telephone `+40761880406`, email, sameAs (LinkedIn/GitHub URLs when provided), knowsAbout (web development, Next.js, React, animation, 3D), areaServed (Romania + remote worldwide)
- `WebSite` schema with SearchAction (if site search added later)
- `BreadcrumbList` on `/work/[slug]` pages

**Performance for SEO (Core Web Vitals targets):**
- LCP < 2.0s (font preload, shader async-mounted)
- INP < 200ms (no heavy main-thread work on interactions)
- CLS < 0.1 (font size set via `next/font` to avoid swap shift)

**Romanian content optimization:**
- All visible copy in RO with proper diacritics (ț ș ă î â)
- Meta description in RO (~155 chars): "Construiesc site-uri și experiențe digitale cinematice. Web developer freelance din Constanța. Disponibil pentru proiecte noi."
- Image alt text in RO
- URL slugs in RO where applicable (`/lucrari/banciu-photo` not `/work/banciu-photo`) — TBD with user

## 12. Open items

- Photo for Story — user will provide separately. Until then, placeholder div used.
- Email address — user will provide separately. Placeholder `hello@claudiucomsa.com` used until then.
- Social handles (LinkedIn, GitHub, others) — user will provide when implementing footer.
- Ambient sound asset — TBD if/when Phase 2 sound goes live.
- Exact case study count + which 5 land in P1-P5 — preview uses Banciu/Aurasjobs/Stereocad + 2 placeholder slots; user to confirm the last 2.
- Logo file (favicon, apple-touch-icon) — needs CC monogram exported.
- URL strategy for case studies — `/work/[slug]` vs `/lucrari/[slug]`.

**Known from user (locked):**
- Phone: `0761880406` (display + `tel:+40761880406` href)
- Location: Constanța, România
- Language: RO only

## 13. Non-goals

- Multilingual support (RO only forever)
- CMS integration — content is in code/MDX in repo
- Blog — not in this phase
- Dark mode toggle — palette already cycles light→dark via scroll
- Cookie banner — no tracking

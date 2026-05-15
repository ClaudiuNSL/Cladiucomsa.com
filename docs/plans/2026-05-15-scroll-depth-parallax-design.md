# Scroll Depth & Parallax — Design Doc

**Date:** 2026-05-15
**Status:** Approved
**Author:** Brainstorm session with Claudiu

## Goal

Transform the portfolio homepage from "fade-in once and sit still" into a page that visibly *lives* while the user scrolls. The visual target is **pronounced 3D depth via multi-layer parallax**, where the user feels they are moving a camera through layered scenery instead of scrolling a flat document.

## Why now

The page already has many one-shot entrance animations (`AnimatedSection`, `TextReveal`, `AnimatedCounter`, `TiltCard`, `SpotlightCard`, `TestimonialsCarousel`). The Aurora background and FloatingParticles are visually strong but constrained to the hero section — once the user scrolls past hero, the magic disappears and the page feels static. We want to extend that "alive" feeling end-to-end and add scroll-driven movement, not just on-enter animations.

## Architecture — three parallax layers

The page is conceptually decomposed into three depth layers that translate at different rates against scroll position:

| Layer | Speed vs scroll | Contents |
|---|---|---|
| Background | 0.3× | Aurora canvas (extended page-wide) + secondary nebula gradient |
| Mid | 0.6× | Floating particles (page-wide) + decorative glows between sections |
| Content | 1× | Text, cards, images (default flow) |

The speed differential creates parallax depth — distant elements appear to lag behind close ones, like the difference between a passing tree and a distant mountain.

## Behaviors

**1. Smooth scroll with inertia.** Add Lenis (~4kb gzipped). Scroll wheel deltas decay over a few hundred milliseconds, giving every scroll interaction the "premium app" feel. Disabled on mobile (native scroll is preferred) and when `prefers-reduced-motion` is set.

**2. Hero parallax & mouse-driven movement.** Profile image gains a reverse parallax (drifts upward as page scrolls down). The typewriter badge gains a subtle horizontal mouse-parallax (~6px max translation).

**3. Subtle camera tilt on `<main>`.** A perspective container with a tiny rotateX (0.5–1°) coupled to scroll position. Feels like the camera is tracking the user.

**4. 3D tilt entry on cards.** Service, About, and Contact cards enter the viewport with a 15–20° rotateY that aligns toward 0° as they reach center. On exit (top of viewport) they rotate the opposite direction.

**5. Scroll-driven project transforms.** Each project article continuously scales (0.85 → 1) and slides laterally (alternating left/right) for the entire duration it crosses the viewport — not just on entry.

**6. Scroll-bound stat counters.** Counter components already animate on enter; combine with a scale-bounce keyed to scroll progress so they feel reactive.

**7. Drawn-in section dividers.** The existing `section-glow-line` elements transition from `scaleX: 0` to `scaleX: 1` based on their scroll progress through the viewport.

**8. Testimonial drift.** The carousel gets a small horizontal drift (~20px) coupled to scroll position, in addition to existing auto-play.

## Components

**New**
- `LenisProvider` (client) — wraps the app, mounts Lenis, exposes a context for components that need the scroll instance. Skipped on mobile and when reduced motion is preferred.
- `ParallaxLayer` (client) — reusable wrapper that translates its children based on `useScroll` + `useTransform`. Takes a `speed` prop (e.g. 0.3, 0.6).
- `GlobalAtmosphere` (client) — fixed `position: fixed; inset: 0` wrapper that contains the page-wide aurora + secondary nebula + global particles. Renders behind `<main>` via z-index.
- `ScrollTilt3D` (client) — wraps a card and applies rotateY based on the card's distance from viewport center. Replaces or composes with the existing `TiltCard`.
- `ScrollScale` (client) — wraps a project article and applies continuous scale + translate keyed to its scroll progress.

**Modified**
- `AuroraBackground` — extracted into reusable form so it can render globally instead of only in hero.
- `FloatingParticles` — moved to global atmosphere.
- `app/page.tsx` — refactored to mount `<GlobalAtmosphere>` at the page root, wrap content in `<LenisProvider>`, wrap `<main>` in a perspective container, and replace cards/projects with `<ScrollTilt3D>` / `<ScrollScale>` wrappers.
- `app/layout.tsx` — possible site of `LenisProvider` mount (so it covers all pages, not just home).
- `app/globals.css` — `prefers-reduced-motion` rules to disable all transforms.

## Performance & accessibility

- All animations use `transform` + `opacity` only — no layout-affecting properties.
- `prefers-reduced-motion: reduce` → all parallax/tilt/smooth-scroll disabled; everything renders statically. The existing on-enter `AnimatedSection` transitions remain (those already respect the user's preference per their internal implementation; verify).
- Mobile (`< 768px` via `matchMedia`) → Lenis off, parallax speeds reduced ~50%, camera tilt off. Card 3D tilt remains but at half magnitude.
- Aurora canvas continues to use `requestAnimationFrame`; the global instance must not re-render the canvas when scroll fires — only its container's transform changes.

## Stack

- `framer-motion` v12 — already installed; provides `useScroll`, `useTransform`, `useMotionValue`, `useSpring`.
- `@studio-freight/lenis` (or its current name `lenis`) — new dependency for smooth scroll.

## Out of scope (YAGNI)

- Horizontal scroll for projects (rejected; user picked option C, not B).
- Pinned sections (rejected for the same reason).
- Depth-of-field blur on peripheral content (rejected — was in option 3, user chose option 2 intensity).
- Section-by-section aurora color shifts (user did not request).

## Approved decisions

- All 8 behaviors above.
- Lenis approved.
- Aurora color stays consistent across the page (no per-section color shifts).
- Intensity level: pronounced (option 2), not extreme (option 3).

## Open risks

- Lenis + Next.js App Router can have hydration quirks; the Provider must be `'use client'` and the Lenis instance must initialize after mount.
- The existing `AuroraBackground` uses canvas — moving it to `position: fixed` while other content scrolls over it requires careful z-index layering with `pointer-events: none` so it does not eat clicks.
- Camera tilt on `<main>` interacts with `position: sticky` elements (navbar). Verify nav still pins correctly when its ancestor has `transform`. (Transform creates a containing block, which breaks `position: fixed` for descendants — Navbar is fixed, so the perspective container must NOT be its ancestor, or Navbar must be moved up the tree.)

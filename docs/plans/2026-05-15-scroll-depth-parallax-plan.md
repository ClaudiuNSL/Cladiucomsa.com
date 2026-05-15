# Scroll Depth & Parallax Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the homepage feel "alive" during scroll via three parallax layers (background 0.3×, mid 0.6×, content 1×), Lenis smooth scroll, camera tilt on main, scroll-driven card transforms, and global atmosphere that extends aurora across the whole page.

**Architecture:** A `GlobalAtmosphere` (position: fixed) carries the aurora canvas + floating particles behind the entire page. A `LenisProvider` adds smooth scroll with mobile + reduced-motion fallbacks. Reusable primitives (`ParallaxLayer`, `ScrollTilt3D`, `ScrollScale`) wrap content and translate/scale/rotate based on scroll progress via framer-motion's `useScroll` + `useTransform`. All effects respect `prefers-reduced-motion` and degrade on mobile.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind, framer-motion v12 (already installed), Lenis (new).

**Verification approach:** No unit tests — UI work. Every task ends with a manual browser check on `npm run dev` (the user runs at http://localhost:3000) and a commit. The user is on Windows / bash shell.

**Important constraint — perspective + sticky/fixed:** A `transform`/`perspective` on `<main>` creates a containing block, which **breaks `position: fixed` for any descendants**. Navbar is `fixed`, so it must remain a SIBLING of the perspective-tilted main, not inside it. Same for `GlobalAtmosphere`, `BackToTop`, `CursorGlow`, etc. Plan tasks below honor this.

---

## Task 1: Install Lenis

**Files:**
- Modify: `package.json` (via npm)

**Step 1: Install**

```bash
npm install lenis
```

Expected: `lenis` added to `dependencies`. (As of 2026, the package is published as `lenis`, not `@studio-freight/lenis`.)

**Step 2: Verify**

```bash
npm list lenis
```

Expected: prints a single resolved version. No peer-dep warnings about React.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lenis for smooth scroll"
```

---

## Task 2: Build `LenisProvider`

**Files:**
- Create: `app/components/LenisProvider.tsx`

**Step 1: Implement**

Create the file with this exact content:

```tsx
// ==========================================
// COMPONENTA LENIS PROVIDER — Smooth scroll global
// Adaugă inerție și ușurare la scroll (vibe "premium app").
// Se dezactivează automat pe mobil (< 768px) și când utilizatorul
// are setat `prefers-reduced-motion: reduce`.
// ==========================================
'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Respectă preferința de "reduced motion" — pentru a11y
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Pe mobil, scroll-ul nativ e deja bun (și mai ușor pentru baterie)
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (reducedMotion || isMobile) return;

    const lenis = new Lenis({
      duration: 1.1, // Cât timp "alunecă" după un wheel tick (secunde)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing exponențial
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

**Step 2: Run dev server (if not already)**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000 with no compile error mentioning `lenis`.

**Step 3: Commit**

```bash
git add app/components/LenisProvider.tsx
git commit -m "feat: add LenisProvider with mobile + reduced-motion fallback"
```

---

## Task 3: Mount `LenisProvider` in root layout

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Add import**

In `app/layout.tsx`, after the existing component imports (around line 16, after `import PageTransition`), add:

```tsx
import LenisProvider from "./components/LenisProvider"; // Smooth scroll global cu inerție
```

**Step 2: Wrap `<PageTransition>` in `<LenisProvider>`**

Replace the existing `<PageTransition>{children}</PageTransition>` block (around lines 174-176) with:

```tsx
<LenisProvider>
  <PageTransition>
    {children}
  </PageTransition>
</LenisProvider>
```

**Step 3: Browser check**

Visit http://localhost:3000 and scroll with mouse wheel. Expected: scroll has a noticeable "glide" / decay (not instant). Navbar stays pinned at the top. No console errors.

If wheel scroll feels broken or navbar detaches: STOP, debug Lenis init.

**Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: enable Lenis smooth scroll site-wide"
```

---

## Task 4: Build `GlobalAtmosphere`

**Files:**
- Create: `app/components/GlobalAtmosphere.tsx`
- Modify: `app/components/AuroraBackground.tsx` (resize logic — see below)

**Step 1: Update `AuroraBackground` resize to support fixed-viewport**

In `app/components/AuroraBackground.tsx`, replace the `resize` function body (lines 25-32):

```tsx
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      // Dacă părintele e `position: fixed inset: 0`, offsetWidth/Height
      // sunt corecte. Dacă nu, folosim window ca fallback.
      w = parent.offsetWidth || window.innerWidth;
      h = parent.offsetHeight || window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
```

(This is a tiny defensive change so the canvas works whether mounted in a fixed full-viewport wrapper or a section.)

**Step 2: Create `GlobalAtmosphere`**

```tsx
// ==========================================
// COMPONENTA GLOBAL ATMOSPHERE — Stratul de fundal al întregii pagini
// Conține aurora + particule plutitoare, fixate pe viewport.
// Nu blochează click-urile (pointer-events: none).
// Părinți cu `transform` ar rupe fixed-positioning, deci acest component
// trebuie să fie un FRATE al lui <main>, nu un descendent.
// ==========================================
'use client';

import AuroraBackground from './AuroraBackground';
import FloatingParticles from './FloatingParticles';

export default function GlobalAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0, // În spatele conținutului (care va avea z-index >= 1)
        overflow: 'hidden',
      }}
    >
      {/* Stratul "background" — aurora — se mișcă cel mai lent (0.3x) */}
      <div data-parallax-layer="background" style={{ position: 'absolute', inset: 0 }}>
        <AuroraBackground />
      </div>

      {/* Stratul "mid" — particule — se mișcă mediu (0.6x) */}
      <div data-parallax-layer="mid" style={{ position: 'absolute', inset: 0 }}>
        <FloatingParticles />
      </div>
    </div>
  );
}
```

**Step 3: Browser check (preview before wiring up — should still build)**

Run: `npm run dev` if not already running. Expected: no compile errors. The file exists but is not yet mounted.

**Step 4: Commit**

```bash
git add app/components/GlobalAtmosphere.tsx app/components/AuroraBackground.tsx
git commit -m "feat: GlobalAtmosphere wrapper for page-wide aurora + particles"
```

---

## Task 5: Mount `GlobalAtmosphere` & remove hero-local aurora/particles

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add import**

In `app/page.tsx`, after the existing imports, add:

```tsx
import GlobalAtmosphere from './components/GlobalAtmosphere';
```

**Step 2: Remove the two existing imports that are now redundant in this file**

Delete these two import lines from `app/page.tsx`:

```tsx
import FloatingParticles from './components/FloatingParticles';
import AuroraBackground from './components/AuroraBackground';
```

(They're still imported transitively via `GlobalAtmosphere`.)

**Step 3: Mount `<GlobalAtmosphere />` at the top of the page root**

Inside the root `<div className="min-h-screen ...">` of `Home()`, **right after the opening div tag** (before the `<a href="#main-content">` skip link), add:

```tsx
<GlobalAtmosphere />
```

**Step 4: Remove `<AuroraBackground />` and `<FloatingParticles />` from the hero section**

Inside the `<section id="home">` block, delete these two lines:

```tsx
<AuroraBackground />
<FloatingParticles />
```

**Step 5: Ensure hero content sits above the atmosphere**

The hero's inner container already has `relative z-10`, which is sufficient. No change needed.

**Step 6: Browser check**

Visit http://localhost:3000. Expected:
- Aurora is visible behind the hero AND continues behind every other section as you scroll
- Particles drift up across the whole page, not just the hero
- Buttons and links remain clickable (atmosphere doesn't block input)
- No console errors

If aurora is invisible: check that `<GlobalAtmosphere />` is a child of the root `<div>` (not inside `<main>`), and that the root `<div>` doesn't have `overflow: hidden` clipping it.

**Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: extend aurora atmosphere across the whole homepage"
```

---

## Task 6: Build `ParallaxLayer` primitive & apply to atmosphere layers

**Files:**
- Create: `app/components/ParallaxLayer.tsx`
- Modify: `app/components/GlobalAtmosphere.tsx`

**Step 1: Create `ParallaxLayer`**

```tsx
// ==========================================
// COMPONENTA PARALLAX LAYER — Strat care se mișcă mai lent decât scroll-ul
// `speed` = viteza de mișcare relativ la scroll
//   1.0 = identic cu scroll-ul (default content layer)
//   0.5 = se mișcă pe jumătate (apare să "rămână în urmă")
//   0.3 = aproape staționar (vibe "munți la orizont")
// Se dezactivează la prefers-reduced-motion.
// ==========================================
'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface ParallaxLayerProps {
  speed: number; // ex: 0.3, 0.6
  children: React.ReactNode;
  className?: string;
}

export default function ParallaxLayer({ speed, children, className }: ParallaxLayerProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  // Translatează în direcția opusă scroll-ului, cu rata (1 - speed)
  // ex: speed 0.3 → conținutul "rămâne în urmă" cu 70% din scroll
  const y = useTransform(scrollY, (v) => v * (speed - 1));

  // Pe mobil reducem efectul la 50% (vezi design doc)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ y: isMobile ? useTransform(scrollY, (v) => v * (speed - 1) * 0.5) : y, willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}
```

⚠️ **NOTE — fix the hook order issue:** `useTransform` cannot be called conditionally in the style prop above. Replace the implementation with the correct version below (call both hooks unconditionally, pick at render):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface ParallaxLayerProps {
  speed: number;
  children: React.ReactNode;
  className?: string;
}

export default function ParallaxLayer({ speed, children, className }: ParallaxLayerProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const yDesktop = useTransform(scrollY, (v) => v * (speed - 1));
  const yMobile = useTransform(scrollY, (v) => v * (speed - 1) * 0.5);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{ y: isMobile ? yMobile : yDesktop, willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}
```

Use only the second version. Delete the first.

**Step 2: Wire ParallaxLayer into `GlobalAtmosphere`**

In `app/components/GlobalAtmosphere.tsx`, replace the two inner `<div data-parallax-layer>` wrappers with `<ParallaxLayer>`:

```tsx
'use client';

import AuroraBackground from './AuroraBackground';
import FloatingParticles from './FloatingParticles';
import ParallaxLayer from './ParallaxLayer';

export default function GlobalAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <ParallaxLayer speed={0.3} className="absolute inset-0">
        <AuroraBackground />
      </ParallaxLayer>

      <ParallaxLayer speed={0.6} className="absolute inset-0">
        <FloatingParticles />
      </ParallaxLayer>
    </div>
  );
}
```

**Step 3: Browser check**

Visit http://localhost:3000 and scroll slowly. Expected: aurora drifts very slowly downward relative to scroll (looks like it stays mostly in place). Particles drift at a noticeably faster rate than aurora but slower than the page content. The depth feels palpable.

**Step 4: Commit**

```bash
git add app/components/ParallaxLayer.tsx app/components/GlobalAtmosphere.tsx
git commit -m "feat: ParallaxLayer primitive + apply to global atmosphere"
```

---

## Task 7: Hero profile-image parallax & mouse-driven badge

**Files:**
- Modify: `app/page.tsx`
- Create: `app/components/HeroBadgeParallax.tsx`

**Step 1: Create `HeroBadgeParallax` (mouse parallax wrapper)**

```tsx
// ==========================================
// HERO BADGE PARALLAX — Se mișcă subtil pe orizontală cu mouse-ul
// Translație maximă: ±6px pe X, ±3px pe Y
// ==========================================
'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export default function HeroBadgeParallax({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 120, damping: 18 });
  const sy = useSpring(y, { stiffness: 120, damping: 18 });

  useEffect(() => {
    if (reduceMotion) return;
    const handler = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 12; // ±6px
      const ny = (e.clientY / window.innerHeight - 0.5) * 6; // ±3px
      x.set(nx);
      y.set(ny);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [reduceMotion, x, y]);

  if (reduceMotion) return <div ref={ref}>{children}</div>;

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-block' }}>
      {children}
    </motion.div>
  );
}
```

**Step 2: Wrap the hero badge**

In `app/page.tsx`, locate the typewriter badge (around lines 92-94):

```tsx
<span className="inline-block bg-[#D4AF37]/20 ...">
  <TypeWriter words={[...]} />
</span>
```

Add import at top of file:

```tsx
import HeroBadgeParallax from './components/HeroBadgeParallax';
```

Wrap the `<span>` in `<HeroBadgeParallax>`:

```tsx
<HeroBadgeParallax>
  <span className="inline-block bg-[#D4AF37]/20 ...">
    <TypeWriter words={[...]} />
  </span>
</HeroBadgeParallax>
```

**Step 3: Add reverse parallax to profile image**

The profile image is wrapped in `<AnimatedSection direction="right" delay={0.2}>` around line 149. We want the image to drift upward (~80px) as the user scrolls through the hero. Use a small inline parallax component.

Create `app/components/ProfileImageParallax.tsx`:

```tsx
// Profile image rises ~80px as user scrolls through hero
'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

export default function ProfileImageParallax({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -80]);

  if (reduceMotion) return <div ref={ref}>{children}</div>;

  return (
    <motion.div ref={ref} style={{ y, willChange: 'transform' }}>
      {children}
    </motion.div>
  );
}
```

In `app/page.tsx`, add the import and wrap the profile image's inner `<div className="relative">`:

```tsx
import ProfileImageParallax from './components/ProfileImageParallax';
```

```tsx
<AnimatedSection direction="right" delay={0.2}>
  <ProfileImageParallax>
    <div className="relative">
      ... existing image markup ...
    </div>
  </ProfileImageParallax>
</AnimatedSection>
```

**Step 4: Browser check**

- Move mouse around hero → badge translates a few pixels in opposite-of-mouse direction
- Scroll down through hero → profile image drifts upward at a different rate than text

**Step 5: Commit**

```bash
git add app/components/HeroBadgeParallax.tsx app/components/ProfileImageParallax.tsx app/page.tsx
git commit -m "feat: hero mouse parallax on badge + reverse parallax on profile image"
```

---

## Task 8: Camera tilt on `<main>` (perspective + rotateX from scroll)

**Files:**
- Create: `app/components/CameraTilt.tsx`
- Modify: `app/page.tsx`

**⚠️ Critical:** Wrapping `<main>` in a perspective container creates a containing block. `position: fixed` descendants would break. But Navbar is mounted in `app/page.tsx` BEFORE `<main>`, and `GlobalAtmosphere` is also outside `<main>`. So this is safe.

**Step 1: Create `CameraTilt`**

```tsx
// ==========================================
// CAMERA TILT — Înclinare subtilă a `<main>` legată de scroll
// rotateX maxim: 1 grad. Vibe "camera urmărește mișcarea".
// Pe mobil: dezactivat. Pe reduced-motion: dezactivat.
// ==========================================
'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

export default function CameraTilt({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // 0 → -0.5°, 0.5 → +0.5°, 1 → -0.5° (oscilează ușor pe parcursul paginii)
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [-0.5, 0.5, -0.5]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  if (reduceMotion || isMobile) return <>{children}</>;

  return (
    <motion.div style={{ perspective: 1600 }}>
      <motion.div style={{ rotateX, transformStyle: 'preserve-3d', willChange: 'transform' }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
```

**Step 2: Wrap `<main>` content**

In `app/page.tsx`, wrap the `<main id="main-content">...</main>` block in `<CameraTilt>`:

```tsx
import CameraTilt from './components/CameraTilt';

// ...

<CameraTilt>
  <main id="main-content">
    ... existing main content ...
  </main>
</CameraTilt>
```

**Step 3: Browser check**

- Scroll the page slowly. The page content should tilt almost imperceptibly. If the tilt is too strong or causes visible distortion: reduce range to `[-0.3, 0.3, -0.3]`.
- Verify navbar still sticks to top.
- Verify `BackToTop` button (bottom right) still works.

**Step 4: Commit**

```bash
git add app/components/CameraTilt.tsx app/page.tsx
git commit -m "feat: subtle camera tilt on main coupled to scroll"
```

---

## Task 9: Build `ScrollTilt3D` & apply to service / about / contact cards

**Files:**
- Create: `app/components/ScrollTilt3D.tsx`
- Modify: `app/page.tsx`

**Step 1: Create `ScrollTilt3D`**

```tsx
// ==========================================
// SCROLL TILT 3D — Card cu rotateY legat de poziția în viewport
// Când cardul e jos: rotit ~18° (privit dintr-o parte)
// La centrul ecranului: 0° (drept)
// La ieșire în sus: -18° (rotit în direcția opusă)
// ==========================================
'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

interface ScrollTilt3DProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right'; // De pe ce parte intră
  magnitude?: number; // Grade rotație (default 18)
}

export default function ScrollTilt3D({
  children,
  className,
  direction = 'right',
  magnitude = 18,
}: ScrollTilt3DProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const sign = direction === 'left' ? -1 : 1;
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [sign * magnitude, 0, -sign * magnitude]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);

  if (reduceMotion) return <div ref={ref} className={className}>{children}</div>;

  return (
    <div ref={ref} className={className} style={{ perspective: 1200 }}>
      <motion.div
        style={{ rotateY, opacity, transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

**Step 2: Wrap service cards**

In `app/page.tsx`, find the service cards loop (around line 263-276). Wrap each `<SpotlightCard>` in `<ScrollTilt3D>`:

```tsx
import ScrollTilt3D from './components/ScrollTilt3D';
```

```tsx
{[...].map((service, i) => (
  <AnimatedSection key={service.name} delay={i * 0.1}>
    <ScrollTilt3D direction={i % 2 === 0 ? 'left' : 'right'} magnitude={15}>
      <SpotlightCard className="...">
        ...
      </SpotlightCard>
    </ScrollTilt3D>
  </AnimatedSection>
))}
```

**Step 3: Wrap About-section cards**

In `app/page.tsx` (about section, around lines 187-210), wrap the two `<div className="bg-white/5 ...">` cards inside `<AnimatedSection>`:

```tsx
<AnimatedSection delay={0.1}>
  <ScrollTilt3D direction="left" magnitude={12}>
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8">
      <h3 ...>My Story</h3>
      ...
    </div>
  </ScrollTilt3D>
</AnimatedSection>

<AnimatedSection delay={0.2}>
  <ScrollTilt3D direction="left" magnitude={12}>
    <div className="bg-white/5 ...">
      <h3 ...>My Goals</h3>
      ...
    </div>
  </ScrollTilt3D>
</AnimatedSection>
```

**Step 4: Wrap Contact-section cards**

In `app/page.tsx` (contact section, lines ~490-525), wrap the Email, Phone, Location, Connect cards each in `<ScrollTilt3D direction="right" magnitude={12}>`. The map iframe card does NOT need the wrapper (avoid wrapping iframes — interaction issues).

**Step 5: Browser check**

Scroll through About, Services, Contact. Each card should:
- Appear rotated slightly (~12-15°) when first entering viewport from below
- Straighten to 0° as it crosses center
- Tilt the opposite direction as it exits the top
- Be a bit dimmer at the extremes

If tilting feels excessive: drop `magnitude` to 8-10. If cards "judder" during scroll: increase the `perspective` value (try 1800).

**Step 6: Commit**

```bash
git add app/components/ScrollTilt3D.tsx app/page.tsx
git commit -m "feat: scroll-driven 3D tilt on service, about, contact cards"
```

---

## Task 10: Build `ScrollScale` & apply to project articles

**Files:**
- Create: `app/components/ScrollScale.tsx`
- Modify: `app/page.tsx`

**Step 1: Create `ScrollScale`**

```tsx
// ==========================================
// SCROLL SCALE — Card care se scalează și alunecă lateral continuu
// pe măsură ce trece prin viewport. Folosit pentru proiecte.
// ==========================================
'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

interface ScrollScaleProps {
  children: React.ReactNode;
  fromX?: number; // Translația de start pe X (px)
  className?: string;
}

export default function ScrollScale({ children, fromX = -80, className }: ScrollScaleProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.92]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], [fromX, 0, -fromX * 0.4]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.7]);

  if (reduceMotion) return <div ref={ref} className={className}>{children}</div>;

  return (
    <motion.div ref={ref} className={className} style={{ scale, x, opacity, willChange: 'transform' }}>
      {children}
    </motion.div>
  );
}
```

**Step 2: Apply to project articles**

In `app/page.tsx`, the projects map (around line 340) wraps each project in `<AnimatedSection delay={i * 0.1}>`. Inside, wrap the `<article>` in `<ScrollScale>`:

```tsx
import ScrollScale from './components/ScrollScale';
```

```tsx
<AnimatedSection key={project.key} delay={i * 0.1}>
  <ScrollScale fromX={i % 2 === 0 ? -80 : 80}>
    <article className={`grid lg:grid-cols-2 gap-10 items-center ${...}`}>
      ...
    </article>
  </ScrollScale>
</AnimatedSection>
```

**Step 3: Browser check**

Scroll through the projects section. Each project should grow from ~85% to 100% scale and slide in from alternating sides as it passes through the viewport. Slight scale-down + opacity drop as it exits the top.

**Step 4: Commit**

```bash
git add app/components/ScrollScale.tsx app/page.tsx
git commit -m "feat: scroll-driven scale + slide on project articles"
```

---

## Task 11: Stat counter scroll-bounce

**Files:**
- Modify: `app/components/AnimatedCounter.tsx` OR `app/page.tsx` (wrap-only approach)

**Decision: wrap-only approach** — avoid modifying the counter component itself. Create a thin wrapper.

**Step 1: Create `CounterBounce`**

```tsx
// app/components/CounterBounce.tsx
// Adaugă un scale-bounce subtil pe scroll, pentru a întări counter-ul
'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

export default function CounterBounce({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.9, 1.08, 1, 0.95]);

  if (reduceMotion) return <div ref={ref}>{children}</div>;
  return <motion.div ref={ref} style={{ scale, display: 'inline-block', willChange: 'transform' }}>{children}</motion.div>;
}
```

**Step 2: Wrap the three hero counters and the two about-section counters**

In `app/page.tsx`, find each `<AnimatedCounter ... />` (5 total — 3 in hero stats, 2 in the About `Projects`/`Years` cards). Wrap each in `<CounterBounce>`:

```tsx
import CounterBounce from './components/CounterBounce';
```

```tsx
<div className="text-3xl font-bold text-gradient">
  <CounterBounce>
    <AnimatedCounter target={50} suffix="+" />
  </CounterBounce>
</div>
```

**Step 3: Browser check**

Scroll the stat numbers in and out of view. Expected: each number briefly scales up to ~108% as it enters, settles to 100% in the middle, and gently scales down to 95% as it exits.

**Step 4: Commit**

```bash
git add app/components/CounterBounce.tsx app/page.tsx
git commit -m "feat: scroll-bound bounce on stat counters"
```

---

## Task 12: Animated section-glow-line dividers

**Files:**
- Create: `app/components/GlowDivider.tsx`
- Modify: `app/page.tsx`

**Step 1: Inspect the current divider style**

The existing markup is:

```tsx
<div className="section-glow-line max-w-4xl mx-auto" />
```

The `section-glow-line` class is in `app/globals.css`. We don't change the CSS — we wrap the div so it scales from 0 to 1 in width as it crosses the viewport.

**Step 2: Create `GlowDivider`**

```tsx
// ==========================================
// GLOW DIVIDER — Linia decorativă care se "desenează" la scroll
// Înlocuiește <div className="section-glow-line max-w-4xl mx-auto" />
// ==========================================
'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

export default function GlowDivider() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduceMotion) {
    return <div ref={ref} className="section-glow-line max-w-4xl mx-auto" />;
  }

  return (
    <motion.div
      ref={ref}
      className="section-glow-line max-w-4xl mx-auto"
      style={{ scaleX, transformOrigin: 'center', willChange: 'transform' }}
    />
  );
}
```

**Step 3: Replace every divider in `app/page.tsx`**

Find all 5 occurrences of `<div className="section-glow-line max-w-4xl mx-auto" />` and replace them with `<GlowDivider />`. Add the import:

```tsx
import GlowDivider from './components/GlowDivider';
```

**Step 4: Browser check**

Scroll between sections. Each divider should "draw itself" from the center outward (scaleX: 0 → 1) as you approach it, fully drawn when it reaches viewport center.

**Step 5: Commit**

```bash
git add app/components/GlowDivider.tsx app/page.tsx
git commit -m "feat: section dividers draw in on scroll"
```

---

## Task 13: Testimonial drift on scroll

**Files:**
- Modify: `app/page.tsx`

**Step 1: Wrap the testimonials carousel**

The carousel already self-animates (auto-play). We add a small scroll-bound horizontal drift around it.

Reuse `ScrollScale` is not quite right (it scales and slides too much). Add a thin wrapper inline or create a `TestimonialDrift` component. Create:

```tsx
// app/components/TestimonialDrift.tsx
'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

export default function TestimonialDrift({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 0.5, 1], [-20, 0, 20]);

  if (reduceMotion) return <div ref={ref}>{children}</div>;
  return <motion.div ref={ref} style={{ x, willChange: 'transform' }}>{children}</motion.div>;
}
```

**Step 2: Apply**

In `app/page.tsx`, find the testimonials block:

```tsx
<AnimatedSection delay={0.1}>
  <TestimonialsCarousel />
</AnimatedSection>
```

Wrap:

```tsx
import TestimonialDrift from './components/TestimonialDrift';
```

```tsx
<AnimatedSection delay={0.1}>
  <TestimonialDrift>
    <TestimonialsCarousel />
  </TestimonialDrift>
</AnimatedSection>
```

**Step 3: Browser check**

Scroll through testimonials. The whole carousel should drift ~20px from left to right as you scroll past it, in addition to its auto-play behavior.

**Step 4: Commit**

```bash
git add app/components/TestimonialDrift.tsx app/page.tsx
git commit -m "feat: scroll-driven horizontal drift on testimonials"
```

---

## Task 14: Verify reduced-motion globally + final QA

**Files:**
- Read: `app/globals.css` (just verify there's a reduced-motion rule; add one if missing)

**Step 1: Check `globals.css` for reduced-motion rule**

```bash
grep -n "prefers-reduced-motion" app/globals.css
```

If no `@media (prefers-reduced-motion: reduce)` block exists, append one to `app/globals.css`:

```css
/* ── Reduced motion — dezactivează animațiile pentru utilizatori care preferă ── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

(Our framer-motion components already respect `useReducedMotion`, so they handle themselves. This CSS rule catches anything pure-CSS that we missed.)

**Step 2: Browser QA — desktop**

Run through this checklist at http://localhost:3000:

- [ ] Aurora visible behind every section (not just hero)
- [ ] Particles drift across the whole page
- [ ] Smooth scroll feels noticeably "premium" (wheel has decay)
- [ ] Hero badge moves a few pixels with mouse
- [ ] Profile image drifts up at a different rate than text
- [ ] Page tilts almost imperceptibly when you scroll
- [ ] Service cards rotate as they enter/exit viewport
- [ ] About-section "My Story" / "My Goals" cards rotate
- [ ] Project articles slide in from alternating sides + scale up
- [ ] Stat counters bounce on entry
- [ ] Section dividers draw in
- [ ] Testimonials drift horizontally with scroll
- [ ] Contact cards rotate on entry
- [ ] No console errors
- [ ] Navbar pinned at top throughout
- [ ] BackToTop button still works
- [ ] CursorGlow still tracks cursor

**Step 3: Browser QA — mobile (DevTools responsive mode, < 768px)**

- [ ] Lenis is OFF — native mobile scroll feels normal (no inertia layer over the native one)
- [ ] Parallax magnitude is reduced (~50%) but still visible
- [ ] Camera tilt is OFF
- [ ] Cards still have 3D tilt on entry (component does not gate this on mobile; check it doesn't feel excessive — if so, add a mobile-detect to `ScrollTilt3D` reducing `magnitude` to half)
- [ ] No horizontal scrollbar appears

**Step 4: Reduced-motion check**

In Chrome DevTools → "Rendering" panel → "Emulate CSS media feature prefers-reduced-motion: reduce". Reload. Expected:

- [ ] No smooth scroll
- [ ] Aurora & particles still render but parallax layers don't translate
- [ ] All scroll-driven transforms (tilt, scale, drift) freeze at their natural state
- [ ] Counters still animate to their targets (they're not gated on reduced-motion — that's a separate component concern, not in scope here)

**Step 5: Lighthouse score sanity check (optional but useful)**

```bash
npx lighthouse http://localhost:3000 --preset=desktop --view --quiet --chrome-flags="--headless"
```

Expected: Performance score doesn't drop more than ~5 points compared to current main. If it drops more, profile in DevTools Performance tab and identify the heaviest scroll handler (likely Lenis RAF or a ParallaxLayer if too many are stacked).

**Step 6: Commit any QA-driven fixes, then final commit**

If you adjusted magnitudes, perspective values, or added a reduced-motion CSS rule:

```bash
git add -A
git commit -m "polish: final calibration of scroll-driven effects"
```

---

## Notes for the executor

- **Order matters:** Don't skip Task 1 (install Lenis) or Task 8 (camera tilt) — they're foundational. The rest can be reordered if needed.
- **Common pitfall:** Wrapping `<main>` in a `transform`-bearing parent breaks any descendant `position: fixed`. The plan keeps Navbar / BackToTop / GlobalAtmosphere outside the CameraTilt subtree.
- **If Lenis fights with framer-motion's `useScroll`:** Lenis exposes a `scroll` event; if `useScroll` reports zero progress, we need to integrate Lenis with framer-motion's `ScrollProvider`. Test this in Task 6 — if `ParallaxLayer` doesn't move, the integration is broken.
- **DO NOT** introduce abstractions for repeated patterns yet (e.g. a generic `<ScrollMotion>`). Three similar components is fine; refactor only if a fourth shows up with the same shape.
- **Commit after each task** so any regression can be bisected easily.

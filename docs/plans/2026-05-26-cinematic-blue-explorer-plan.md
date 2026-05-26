# Cinematic Blue Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Re-skin the homepage to a "Cinematic Blue Explorer" identity — new full-bleed cave-image Hero with personal copy, an interactive Navbar (inline links + CTA + scroll progress), and a palette migration from monochrome white-on-black to ice-blue accents on near-navy.

**Architecture:** No new components. All work is repaint + Hero Section 1 rewrite + Navbar rewrite + i18n copy update. Tailwind v4 tokens live in `app/globals.css` via `@theme inline`. Fonts via `next/font/google` (add Fraunces). Image lives in `public/hero/`. EffectButton, Projects letter-reveal, Story, Contact, Footer structure are preserved.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, GSAP + ScrollTrigger, next-intl, next/font, next/image.

**Branch:** Continue on `feature/asteroid-shatter-effects` (design doc already committed there as `dc4f9f5`). Commit small + logical per task.

**Reference:**
- Design doc: `docs/plans/2026-05-26-cinematic-blue-explorer-design.md`
- Source image: `c:\Users\comsa\Desktop\ChatGPT Image May 26, 2026, 09_29_29 PM.png`

---

## Pre-flight

**Step 0.1: Save uncommitted Footer + tsconfig changes**

Working tree shows uncommitted `app/components/Footer.tsx` and `tsconfig.json`. Before starting, decide: keep, commit separately, or stash.

Run:
```bash
git status
git diff app/components/Footer.tsx
git diff tsconfig.json
```

If small/related to the redesign: leave them and they'll be included in repaint commits.
If unrelated: commit separately first OR stash.

**Step 0.2: Verify dev server boots clean**

Run: `npm run dev`
Open: `http://localhost:3000/ro`
Expected: site loads, current Hero with profile photo visible, no console errors.

Kill dev server before starting task 1 (we restart at the end).

---

## Task 1: Palette tokens + Fraunces font

**Files:**
- Modify: `app/globals.css:3-23`
- Modify: `app/layout.tsx:2,5-13,49-50`

**Step 1.1: Replace palette in `app/globals.css`**

Replace lines 3-23 with:

```css
:root {
  /* Cinematic Blue Explorer palette */
  --bg-deep: #07090f;
  --bg-base: #0a0d14;
  --bg-elev: #11151e;
  --text-primary: #ffffff;
  --text-soft: #cfe3ff;
  --text-mid: #9eb2c8;
  --text-quiet: #5a6678;
  --accent: #7aa7d9;
  --border-soft: rgba(207, 227, 255, 0.08);
  --border-hair: rgba(207, 227, 255, 0.04);
  /* Legacy aliases — kept so unmigrated files don't break mid-refactor */
  --border: var(--border-soft);
  --border-strong: rgba(207, 227, 255, 0.16);
  --text-secondary: var(--text-mid);
  --text-muted: var(--text-quiet);
}

@theme inline {
  --color-bg-deep: var(--bg-deep);
  --color-bg-base: var(--bg-base);
  --color-bg-elev: var(--bg-elev);
  --color-text-primary: var(--text-primary);
  --color-text-soft: var(--text-soft);
  --color-text-mid: var(--text-mid);
  --color-text-quiet: var(--text-quiet);
  --color-accent: var(--accent);
  --color-border-soft: var(--border-soft);
  --color-border-hair: var(--border-hair);
  /* Legacy aliases */
  --color-text-secondary: var(--text-mid);
  --color-text-muted: var(--text-quiet);
  --color-border: var(--border-soft);
  --color-border-strong: var(--border-strong);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-serif: var(--font-fraunces);
}
```

Update `body` rule:
```css
body {
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

**Step 1.2: Add Fraunces font in `app/layout.tsx`**

After `Geist_Mono` import on line 2, add:
```ts
import { Fraunces } from "next/font/google";
```

After `geistMono` const, add:
```ts
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500"],
});
```

Update body className on line 50:
```tsx
className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
```

Update `viewport.themeColor` to `#07090f` (both light and dark variants).

**Step 1.3: Add wordmark dot pulse keyframe to `app/globals.css`**

Append at end of file:
```css
/* Navbar wordmark dot — subtle live pulse */
@keyframes wordmark-pulse {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}
.wordmark-dot {
  animation: wordmark-pulse 3s ease-in-out infinite;
}
```

**Step 1.4: Verify build**

Run: `npm run build`
Expected: PASS, no TypeScript or Tailwind errors.

If `text-secondary` / `text-muted` aliases break, that means another file uses them — leave the aliases in place (already done).

**Step 1.5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat(palette): introduce Cinematic Blue Explorer tokens + Fraunces serif"
```

---

## Task 2: Hero image asset

**Files:**
- Create: `public/hero/cave-explorer.jpg`

**Step 2.1: Copy source PNG to public**

The source file is `c:\Users\comsa\Desktop\ChatGPT Image May 26, 2026, 09_29_29 PM.png`.

```bash
mkdir -p public/hero
cp "/c/Users/comsa/Desktop/ChatGPT Image May 26, 2026, 09_29_29 PM.png" public/hero/cave-explorer.jpg
```

(JPG extension is acceptable — Next.js Image handles MIME via content sniffing. If image quality looks off, swap to `.png` instead — Next.js will still serve it.)

**Step 2.2: Verify file present and size reasonable**

Run: `ls -la public/hero/`
Expected: `cave-explorer.jpg` present, size ideally < 800KB. If > 1.5MB, flag for manual compression but don't block.

**Step 2.3: Commit**

```bash
git add public/hero/cave-explorer.jpg
git commit -m "feat(hero): add cave-explorer background asset"
```

---

## Task 3: i18n RO copy

**Files:**
- Modify: `messages/ro.json`

**Step 3.1: Update `nav` block**

Replace the current `nav` object with:
```json
"nav": {
  "langSwitcherLabel": "Limba",
  "openMenu": "Meniu",
  "closeMenu": "Închide",
  "work": "Work",
  "about": "About",
  "contact": "Contact",
  "cta": "Hai să vorbim",
  "ctaHref": "#contact"
}
```

**Step 3.2: Update `cinematic.s1` block**

Replace `cinematic.s1` with:
```json
"s1": {
  "counter": "Intro",
  "eyebrow": "Full-Stack Web Developer · România",
  "titleLine1": "Sunt Claudiu Comșa.",
  "titleLine2Pre": "",
  "titleAccent": "Transform",
  "titleLine2Post": " ideile în proiecte digitale reale.",
  "body": "Te-ai făcut cunoscut local. Pasul următor e să fii vizibil online — cu un brand care funcționează la fel de bine în România și oriunde altundeva.",
  "services": [
    "Site-uri de prezentare",
    "Magazine online",
    "Automatizări",
    "Optimizări",
    "SEO & creștere online"
  ],
  "ctaPrimary": "Hai să vorbim",
  "ctaPrimaryHref": "#contact",
  "ctaSecondary": "Vezi proiecte",
  "ctaSecondaryHref": "#projects"
}
```

**Step 3.3: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/ro.json','utf8'))"`
Expected: no output (silent = valid). If error, fix syntax.

**Step 3.4: Commit (combine with task 4)**

Wait — combine with Task 4 (EN) into single commit.

---

## Task 4: i18n EN copy

**Files:**
- Modify: `messages/en.json`

**Step 4.1: Apply same structural changes as RO**

Update `nav`:
```json
"nav": {
  "langSwitcherLabel": "Language",
  "openMenu": "Menu",
  "closeMenu": "Close",
  "work": "Work",
  "about": "About",
  "contact": "Contact",
  "cta": "Let's talk",
  "ctaHref": "#contact"
}
```

Update `cinematic.s1`:
```json
"s1": {
  "counter": "Intro",
  "eyebrow": "Full-Stack Web Developer · Romania",
  "titleLine1": "I'm Claudiu Comșa.",
  "titleLine2Pre": "I ",
  "titleAccent": "turn",
  "titleLine2Post": " ideas into real digital products.",
  "body": "You've made a name locally. The next step is being visible online — with a brand that works as well in Romania as anywhere else.",
  "services": [
    "Websites",
    "E-commerce",
    "Automation",
    "Optimization",
    "SEO & Growth"
  ],
  "ctaPrimary": "Let's talk",
  "ctaPrimaryHref": "#contact",
  "ctaSecondary": "See projects",
  "ctaSecondaryHref": "#projects"
}
```

**Step 4.2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"`
Expected: silent. If error, fix.

**Step 4.3: Commit**

```bash
git add messages/ro.json messages/en.json
git commit -m "feat(i18n): new Hero copy + nav keys for Cinematic Blue redesign"
```

---

## Task 5: Navbar redesign

**Files:**
- Modify: `app/components/Navbar.tsx` (full rewrite)

**Step 5.1: Replace Navbar.tsx with new implementation**

Full file content:

```tsx
'use client';
// Navbar cinematic-blue: wordmark cu dot pulsand stanga, linkuri inline mijloc
// (doar desktop), LanguageSwitcher + CTA dreapta. Progress bar de scroll
// dedesubt (scaleX dupa pozitia in pagina). Mobile pastreaza hamburger overlay.
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (progressRef.current) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }
      rafId = 0;
    };
    const onScroll = () => {
      if (rafId === 0) rafId = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const navLinks = [
    { href: '#projects', label: t('work') },
    { href: '#story', label: t('about') },
    { href: '#contact', label: t('contact') },
  ];

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-[var(--border-soft)] bg-[var(--bg-deep)]/80 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1600px] items-center justify-between px-8 lg:px-12 transition-all duration-500 ${
            scrolled ? 'py-4' : 'py-6'
          }`}
        >
          {/* Wordmark stanga cu dot pulsand */}
          <Link
            href="/"
            aria-label="Claudiu Comsa — Home"
            className="group inline-flex items-baseline gap-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30 rounded"
          >
            <span className="wordmark-dot inline-block h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            Claudiu Comșa
          </Link>

          {/* Linkuri inline mijloc — DESKTOP only */}
          <ul className="hidden items-center gap-6 md:flex">
            {navLinks.map((item, i) => (
              <li key={item.href} className="flex items-center gap-6">
                <a
                  href={item.href}
                  className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--text-quiet)] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30 rounded"
                >
                  {item.label}
                </a>
                {i < navLinks.length - 1 && (
                  <span className="text-[var(--text-quiet)]/40" aria-hidden="true">·</span>
                )}
              </li>
            ))}
          </ul>

          {/* Dreapta: LanguageSwitcher + CTA + Mobile hamburger */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href={t('ctaHref')}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-[var(--text-soft)]/30 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white transition-all duration-300 hover:border-[var(--text-soft)]/60 hover:bg-[var(--text-soft)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30"
            >
              {t('cta')}
              <span aria-hidden="true">→</span>
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="cinematic-menu"
              className="md:hidden text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--text-mid)] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30 rounded"
            >
              {menuOpen ? t('closeMenu') : t('openMenu')}
            </button>
          </div>
        </div>

        {/* Progress bar scroll — 1px ice-blue, scaleX dupa scrollY */}
        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute bottom-0 left-0 block h-px w-full origin-left bg-[var(--accent)] transition-none"
          style={{ transform: 'scaleX(0)' }}
        />
      </nav>

      {menuOpen && (
        <div
          id="cinematic-menu"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg-deep)]/95 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <ul className="space-y-6 text-center" onClick={(e) => e.stopPropagation()}>
            {[
              { href: '#section-1', label: '01 — Intro' },
              { href: '#projects', label: '02 — Work' },
              { href: '#story', label: '03 — About' },
              { href: '#contact', label: '04 — Contact' },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-3xl font-semibold tracking-tight text-[var(--text-mid)] transition-colors hover:text-white sm:text-5xl"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
```

**Step 5.2: Verify build + visual**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`, open `http://localhost:3000/ro`.
Expected:
- Navbar sus cu wordmark stanga (dot pulse), 3 linkuri mijloc cu middot separators, LangSwitcher + CTA pill dreapta.
- La scroll, fundalul devine blur dark, padding scade.
- Progress bar de 1px ice-blue se umple de la stanga la dreapta pe masura ce scrollezi.

Kill dev server.

**Step 5.3: Commit**

```bash
git add app/components/Navbar.tsx
git commit -m "feat(navbar): inline links + CTA + scroll progress + wordmark pulse"
```

---

## Task 6: Hero rewrite — Section 1 with cave image

**Files:**
- Modify: `app/components/sections/Hero.tsx`

**Step 6.1: Rewrite Section 1 inside Hero.tsx**

Replace the Section 1 block (lines 59-130 in current file) with the new image-led Section 1. Sections 2 & 3 keep their structure but get repainted in Task 7.

Replace **lines 53-130** (from `return (` opening down to closing of Section 1 `</section>`) with:

```tsx
  return (
    <div ref={rootRef} data-cinematic-wrapper className="relative">
      {/* Side rails — fixed across all sections */}
      <SideRails />

      {/* Section 1 — Hero image-led */}
      <section
        id="section-1"
        data-cinematic-section
        aria-label="Section 1 — Intro"
        className="relative flex min-h-screen items-end overflow-hidden px-8 pb-24 pt-24 lg:items-end lg:px-16 lg:pb-20"
      >
        {/* Imagine fullbleed */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero/cave-explorer.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: 'center 35%' }}
            priority
          />
          {/* Layer 1: gradient stanga pentru lizibilitate text */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, var(--bg-deep) 0%, rgba(7,9,15,0.55) 35%, transparent 75%)',
            }}
          />
          {/* Layer 2: vignette jos */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, var(--bg-deep) 0%, transparent 35%)',
            }}
          />
          {/* Layer 3: grain noise overlay foarte subtil */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>

        <SectionCounter index={1} label={t('s1.counter')} />
        <PageCounter current={1} total={3} />

        {/* Continut — stanga-jos pe desktop, centru pe mobile */}
        <div className="relative mx-auto w-full max-w-2xl text-center lg:mx-0 lg:max-w-3xl lg:text-left">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-soft)]">
            {t('s1.eyebrow')}
          </p>
          <h1
            data-reveal
            className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:mt-8 lg:text-7xl xl:text-8xl"
          >
            <span className="block">{t('s1.titleLine1')}</span>
            <span className="mt-1 block">
              {t('s1.titleLine2Pre')}
              <span className="italic font-normal" style={{ fontFamily: 'var(--font-fraunces), serif' }}>
                {t('s1.titleAccent')}
              </span>
              {t('s1.titleLine2Post')}
            </span>
          </h1>
          <div data-reveal className="mx-auto mt-8 h-px w-24 bg-[var(--border-soft)] lg:mx-0 lg:mt-10" aria-hidden="true" />
          <p data-reveal className="mx-auto mt-6 max-w-xl text-base leading-[1.65] text-[var(--text-mid)] sm:text-lg lg:mx-0 lg:mt-8">
            {t('s1.body')}
          </p>
          <ul data-reveal className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-soft)] lg:mx-0 lg:justify-start">
            {(t.raw('s1.services') as string[]).map((svc, i, arr) => (
              <li key={svc} className="inline-flex items-center gap-3">
                <span>{svc}</span>
                {i < arr.length - 1 && <span aria-hidden="true" className="text-[var(--text-quiet)]/60">·</span>}
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <EffectButton
              text={t('s1.ctaPrimary')}
              href={t('s1.ctaPrimaryHref')}
              variant="primary"
              trailing="→"
            />
            <EffectButton
              text={t('s1.ctaSecondary')}
              href={t('s1.ctaSecondaryHref')}
              variant="secondary"
              trailing="→"
            />
          </div>
        </div>

        {/* Cue de scroll subtil, doar pe Section 1. */}
        <div
          data-reveal
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 lg:bottom-10"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--text-quiet)]">
            {t('scrollHint')}
          </span>
          <span className="block h-10 w-px overflow-hidden bg-[var(--border-soft)]">
            <span className="block h-4 w-px animate-[scroll-cue_2.4s_ease-in-out_infinite] bg-[var(--text-soft)]/70" />
          </span>
        </div>
      </section>
```

**Step 6.2: Verify Section 1 renders**

Run: `npm run dev`, open `http://localhost:3000/ro`.
Expected:
- Imaginea cu peștera fullbleed.
- Text overlay stânga-jos (desktop) / centru (mobile).
- H1 cu numele tău, cuvântul "Transform" în serif italic ușor distinct.
- Strip cu servicii separat de middots.
- 2 CTA-uri: primary alb + secondary border.
- Side rails apar pe lateral (vor primi repaint la Task 8.7).

Kill dev server.

**Step 6.3: Commit**

```bash
git add app/components/sections/Hero.tsx
git commit -m "feat(hero): full-bleed cave image + new H1/copy + services strip"
```

---

## Task 7: Repaint Hero Sections 2, 3 + SectionCounter + PageCounter + SideRails

**Files:**
- Modify: `app/components/sections/Hero.tsx`

**Step 7.1: Repaint Section 2**

In Section 2 (`<section id="section-2" ...>`), replace:
- `text-zinc-500` → `text-[var(--text-quiet)]` (eyebrow, subtitle)
- `text-zinc-400` → `text-[var(--text-mid)]` (body)
- `text-white` (on titles only) — KEEP as white.
- `bg-white/10` (divider) → `bg-[var(--border-soft)]`

**Step 7.2: Repaint Section 3** identical changes to Section 2.

**Step 7.3: Repaint helper components inside Hero.tsx**

In `SectionCounter`:
- `text-zinc-500` → `text-[var(--text-quiet)]`
- `text-white` (on dot bg and index span) — KEEP white.
- `bg-white` (dot) — KEEP white (focal indicator).
- `bg-white/20` (rule) → `bg-[var(--border-soft)]`
- `border-white/[0.08]` → `border-[var(--border-soft)]`

In `PageCounter`:
- `text-zinc-500` → `text-[var(--text-quiet)]`
- `text-white` (current) — KEEP white.
- `text-zinc-700` (total dimmed) → `text-[var(--text-quiet)]/40`

In `SideRails`:
- Both rails: `text-zinc-500` → `text-[var(--text-quiet)]`
- Dot separators `bg-white/20` → `bg-[var(--text-soft)]/20`

**Step 7.4: Verify**

`npm run dev`, navigate through 3 hero sections.
Expected: counters, page counters, side rails all in cool-blue tones, titles still bright white.

Kill dev server.

**Step 7.5: Commit**

```bash
git add app/components/sections/Hero.tsx
git commit -m "refactor(hero): repaint sections 2-3 and rails to ice-blue palette"
```

---

## Task 8: Repaint Story, Projects, Contact

**Files:**
- Modify: `app/components/sections/Story.tsx`
- Modify: `app/components/sections/Projects.tsx`
- Modify: `app/components/sections/Contact.tsx`

**Step 8.1: Read each file first**

Run for each file:
- `cat app/components/sections/Story.tsx` (or use Read tool)

Apply blanket replacements per file. **No structural changes** — only Tailwind utility classes for color/border.

**Step 8.2: Replacement map (applies to all 3 files)**

| Before | After |
|---|---|
| `bg-[#050505]` | `bg-[var(--bg-deep)]` |
| `bg-[#0a0a0a]` | `bg-[var(--bg-elev)]` |
| `text-zinc-400` | `text-[var(--text-mid)]` |
| `text-zinc-500` | `text-[var(--text-quiet)]` |
| `text-zinc-600` | `text-[var(--text-quiet)]/70` |
| `border-white/[0.06]` | `border-[var(--border-soft)]` |
| `border-white/[0.08]` | `border-[var(--border-soft)]` |
| `border-white/[0.10]` | `border-[var(--border-soft)]` |
| `bg-white/10` (as divider/border tint) | `bg-[var(--border-soft)]` |
| `bg-white/15` (as divider/border tint) | `bg-[var(--border-soft)]` |
| `bg-white/[0.025]` (watermark) | `bg-[var(--text-soft)]/[0.03]` — only if used as watermark text color |
| `text-white/[0.025]` (watermark) | `text-[var(--text-soft)]/[0.03]` |

**DO NOT touch:**
- `text-white` on focal headings (H1/H2/H3) — keep pure white.
- `bg-white` on EffectButton primary variant — keep pure white.
- `bg-white/[0.04]` hover states on EffectButton secondary — keep (already subtle, works on new palette).

**Step 8.3: Apply replacements in each file via Edit with `replace_all: true`**

For each utility class above present in the file, use Edit with the exact `Before` string and `replace_all: true`.

**Step 8.4: Verify**

`npm run build` after all 3 files updated.
Expected: PASS.

`npm run dev`, scroll through site. Story, Projects, Contact should look cohesive in ice-blue palette. Watermark numbers in Projects slightly more visible (intentional).

Kill dev server.

**Step 8.5: Commit**

```bash
git add app/components/sections/Story.tsx app/components/sections/Projects.tsx app/components/sections/Contact.tsx
git commit -m "refactor: repaint Story/Projects/Contact to ice-blue palette"
```

---

## Task 9: Repaint Footer

**Files:**
- Modify: `app/components/Footer.tsx`

**Step 9.1: Apply same replacement map as Task 8.2**

Specifically for current Footer.tsx (lines verified in design doc):
- `bg-[#050505]` → `bg-[var(--bg-deep)]`
- `border-white/[0.06]` → `border-[var(--border-soft)]`
- `text-zinc-600` → `text-[var(--text-quiet)]/70`
- `text-zinc-500` → `text-[var(--text-quiet)]`
- `hover:text-white` (on tech logos, social) — KEEP (focal hover).

**Step 9.2: Commit**

```bash
git add app/components/Footer.tsx
git commit -m "refactor(footer): repaint to ice-blue palette"
```

---

## Task 10: Repaint smaller components (sweep)

**Files (check each):**
- `app/components/EffectButton.tsx` (constant `SECONDARY` border)
- `app/components/AtmosphericGlow.tsx`
- `app/components/BackToTop.tsx`
- `app/components/MetricGrid.tsx`
- `app/components/SocialBlock.tsx`
- `app/components/ContactForm.tsx`
- `app/components/LanguageSwitcher.tsx`
- `app/[locale]/projects/[slug]/_components/CaseStudy.tsx`
- `app/[locale]/projects/page.tsx`
- `app/[locale]/services/page.tsx`

**Step 10.1: Grep for any remaining bright-white tints that should be ice-blue**

Run: `grep -rn "text-zinc-\(400\|500\|600\)\|bg-\[#050505\]\|border-white/\[0\.06\]\|bg-white/10" app/ --include="*.tsx"`

For each match, decide:
- Text secondary/tertiary → migrate.
- Border tint → migrate.
- Focal white (heading, primary CTA bg) → KEEP.
- Hover states `hover:text-white` → KEEP (focal hover).

**Step 10.2: Update EffectButton SECONDARY constant**

In `app/components/EffectButton.tsx` line 50:
```tsx
const SECONDARY = 'border border-[var(--text-soft)]/30 text-white hover:border-[var(--text-soft)]/60 hover:bg-[var(--text-soft)]/[0.06]';
```

Keep `PRIMARY` unchanged (white pill — focal CTA).

**Step 10.3: Verify build**

Run: `npm run build`
Expected: PASS.

**Step 10.4: Commit**

```bash
git add -A app/components app/[locale]
git commit -m "refactor: ice-blue repaint sweep across remaining components"
```

---

## Task 11: Final verification

**Step 11.1: Full build**

Run: `npm run build`
Expected: PASS, no warnings about missing classes or fonts.

**Step 11.2: Dev server visual check — both locales**

Run: `npm run dev`

Open `http://localhost:3000/ro`:
- [ ] Hero loads cu imagine peșteră fullbleed
- [ ] Eyebrow "FULL-STACK WEB DEVELOPER · ROMÂNIA"
- [ ] H1 "Sunt Claudiu Comșa. / *Transform* ideile..." cu "Transform" în serif italic
- [ ] Paragraf vizibil pe gradient
- [ ] Strip servicii cu middots
- [ ] 2 CTA-uri (alb + border)
- [ ] Side rails ice-blue
- [ ] Navbar: wordmark cu dot pulse, 3 linkuri inline, CTA dreapta, progress bar la scroll
- [ ] Scroll → Hero Section 2 → Section 3 → Story → Projects → Contact → Footer, fundal solid navy throughout
- [ ] Projects: letter-reveal pe titluri, watermark gigant, butoanele shatter funcționează
- [ ] Footer ice-blue

Open `http://localhost:3000/en`:
- [ ] Mirror complet în EN: "I'm Claudiu Comșa. I *turn* ideas..."
- [ ] Servicii: "WEBSITES · E-COMMERCE · ..." 
- [ ] CTA "LET'S TALK →"

**Step 11.3: Mobile responsive check**

In DevTools, set viewport to 375x812 (iPhone). Verify:
- [ ] Hero S1: text centrat, services strip wrap-uiește pe 2 rânduri OK, butoane stacked
- [ ] Navbar: linkurile inline ascunse, hamburger vizibil, CTA pill ascuns
- [ ] Side rails: încă vizibile dar nu blochează content (sunt pointer-events-none)
- [ ] Footer: tech logos centrate

**Step 11.4: Reduced motion check**

DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce"
Reload page.
Expected: animațiile Hero reveal nu rulează (text apare instant la opacity 1, vizibil de la load).

**Step 11.5: Console check**

Open DevTools console. Expected: no errors. Warnings about prefetch / image LCP are OK.

**Step 11.6: Final commit dacă rămân ajustări mărunte**

Dacă mai apar bug-uri vizuale mici (text suprapus, layout shift), fix on-the-spot și commit:
```bash
git add -A
git commit -m "fix: polish post-implementation verification"
```

**Step 11.7: Push branch**

(NU push automat fără confirmare user.)

Cere user-ului: "Vrei să fac push pe `feature/asteroid-shatter-effects` și să deschidem PR către main?"

---

## Notes / Edge cases

- **Image LCP:** imaginea hero e mare. Dacă Lighthouse plânge de LCP > 2.5s, poți cere user-ului să o comprime manual sau să convertim la `.webp` în loc de `.jpg`.
- **Branch existing changes:** `Footer.tsx` are unstaged diff. Aceea e probabil deja repaint-related — Task 9 va include diff-ul existent.
- **Fraunces fallback:** dacă fontul nu apare (network issue la build/install), `font-style: italic` standalone arată acceptabil pe Geist Sans. Nu blochează.
- **`text-secondary` / `text-muted` aliases:** lăsate în globals.css ca să nu spargem fișiere ne-migrate. La final, dacă vrem clean, putem grep și șterge alias-urile + sterge utilizările.

---

**Execution mode:** Subagent-driven în această sesiune (per user "i dai bataie"). Voi folosi `superpowers:subagent-driven-development`.

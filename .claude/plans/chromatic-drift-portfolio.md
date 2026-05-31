# Chromatic Drift Portfolio — Implementation Plan

## Context

Full in-place rewrite of the portfolio at `claudiucomsa.com` from "Cinematic Blue Explorer" (currently on `main`, backed up as tag `archive/v1-cinematic-blue`) to a new design system named "Chromatic Drift". Direction was approved by the user on a self-contained HTML mockup (`previews/chromatic-drift/index.html`, committed in `ca7618c`). Submission target: Awwwards Site of the Day. Branch: `feature/chromatic-drift-2026`.

Reference artifacts (read these first when implementing any task):
- Design doc: `docs/plans/2026-05-31-chromatic-drift-design.md`
- HTML mockup (visual + interaction spec of record): `previews/chromatic-drift/index.html`

The HTML mockup IS the spec. Where this plan and the mockup disagree, the mockup wins. EXCEPTIONS (mockup is wrong / outdated): see Task 6 (Lenis API), Task 11 (Three.js color space), Task 13/15/19 (SplitText hydration), Task 22 (Edge runtime).

## Scope

**In scope:**
- Delete all Cinematic Blue Explorer components, the `app/[locale]/` route tree, the i18n middleware (`proxy.ts`), and the i18n infrastructure.
- Strip `framer-motion`, `next-intl`, `react-icons`, `lucide-react` from `package.json`. Add `three@^0.184.0`. Bump `next` to `16.2.6`.
- Rebuild the root layout with Geist + Geist Mono via `next/font/google`, `html lang="ro"`, RO-only metadata.
- Implement the full single-page scroll experience: nav, hero with CC condense, manifesto, projects header + 5 project signature sections, studio, story (with photo placeholder), footer.
- Shared chrome: custom cursor, scroll progress bar, transition flash overlay, sound toggle (UI), magnetic button component.
- Two WebGL/3D scenes via raw `three`: fullscreen shader background (palette interpolation) and foreground icosahedron.
- Theme system: CSS vars `--fg`, `--fg-soft`, `--fg-line` driven by global scroll progress, `body.fg-light` class flip at progress > 0.82.
- SEO: Person JSON-LD with phone `+40761880406`, RO OG meta, sitemap, robots, manifest update, favicon from CC monogram.
- Mobile parity per design doc §8 (HARD requirement).
- `prefers-reduced-motion` paths.
- WebGL availability fallback + browser test matrix + Lighthouse CI config (Task 25).

**Out of scope:**
- Case studies pages at `/work/[slug]` or `/lucrari/[slug]` — DEFERRED to Phase 2.
- Real audio for the sound toggle — DEFERRED. Ship UI only.
- Production deploy / merge to `main` — user gates this explicitly after review.
- Pushing `archive/v1-cinematic-blue` tag to origin remote — user must approve separately.
- Real photo for Story section — placeholder div ships; user provides photo separately and we drop it in.
- Real email + social handles in footer — placeholders ship; user provides separately.
- The final 2 of 5 project signature sections use placeholder copy (project names + slugs unconfirmed) until user names them.

## Approach

**Strategy:** in-place rewrite on the existing Next.js scaffold. Keep `package.json` (modified), `next.config.ts` (simplified), `tsconfig.json`, PWA infrastructure (`manifest.ts`, `robots.ts`, `sitemap.ts`, `icon.tsx`), and `public/projects/*.jpg`. Demolish everything else under `app/components/`, `app/[locale]/`, `i18n/`, `messages/`, plus `proxy.ts`.

The HTML mockup at `previews/chromatic-drift/index.html` is a fully working prototype. The implementation strategy is **port-and-componentize**: each section/effect already has working code in the mockup; we extract it into React components, swap custom letter-splitters for GSAP `SplitText` (now free in 3.15+), and wire palette uniforms to a shared scroll context instead of inline DOM updates.

---

### Task 1: Demolition — remove all Cinematic Blue Explorer code

**Why:** Clean slate before rebuilding. Avoids merge conflicts during the rewrite and prevents accidental imports of old components.

**PRE-DELETE PORT STEP (do this first, before any `git rm`):**

The file `app/[locale]/_lib/jsonLd.ts` contains reusable Person JSON-LD patterns (schema.org shape, knowsAbout list, areaServed structure) that Task 22 needs as reference. Before deleting:
1. Open `app/[locale]/_lib/jsonLd.ts` and read it in full.
2. Copy its Person schema structure into a scratch note kept in the implementation brief (or paste into a temporary file at `.claude/scratch/jsonld-reference.md` for Task 22 to consult).
3. Only after the reference is captured, proceed with the deletions below.

**Files to delete:**

```
app/components/AtmosphericGlow.tsx
app/components/BackToTop.tsx
app/components/ContactForm.tsx
app/components/EffectButton.tsx
app/components/Footer.tsx
app/components/IntroAnimation.tsx
app/components/LanguageSwitcher.tsx
app/components/MetricGrid.tsx
app/components/Navbar.tsx
app/components/PageTransition.tsx
app/components/SocialBlock.tsx
app/components/sections/Hero.tsx
app/components/sections/Projects.tsx
app/components/sections/Story.tsx
app/components/sections/Contact.tsx
app/lib/intro-state.ts
```

> Alternative (recommended for symmetry with `app/[locale]/` deletion): `git rm -rf app/components/sections/` — wipes the whole directory regardless of any sibling `.module.css` / `.test.tsx` / etc. files. If using this approach, still run `git status` after to confirm no unexpected survivors. New section files in T13/T15-T21 recreate the directory under the same path.

```
proxy.ts                          (next-intl middleware — will break build after Task 2)
app/[locale]/                     (entire directory tree — recursive delete; see "app/[locale]/ deletion" subsection below)
i18n/                             (entire directory)
messages/                         (entire directory)
public/hero/cave-explorer.png
```

**`app/[locale]/` deletion — recursive, no per-file enumeration:**

The entire `app/[locale]/` directory tree is deleted as a unit. Per-file enumeration only adds risk (real files like `not-found.tsx`, `services/page.tsx`, `projects/page.tsx`, `projects/_data/` exist that prior enumerations missed) when the directory will be entirely removed anyway.

Single command:
```
git rm -rf "app/[locale]"
```

Bracket-quote note for Windows bash: ALWAYS double-quote the path (or escape brackets) so the shell does not glob-expand `[locale]`. Acceptable forms:
- Preferred: `git rm -rf "app/[locale]"`
- Alternative: `git rm -rf app/\[locale\]`

**AFTER the recursive delete, immediately run `git status`** and read the output to verify (a) the entire `app/[locale]/` subtree shows as deleted, and (b) nothing unexpected outside that tree was touched. If anything outside the tree appears, stop for user input.

Remember: do the PRE-DELETE PORT STEP for `app/[locale]/_lib/jsonLd.ts` BEFORE running the recursive `git rm`, otherwise the reference is gone.

**Files to KEEP (do not touch in this task):**
- `app/layout.tsx` — rewritten in Task 3, not deleted
- `app/page.tsx` — rewritten in Task 23, not deleted
- `app/manifest.ts`, `app/robots.ts`, `app/sitemap.ts`, `app/icon.tsx`, `app/opengraph-image.png` — touched in Task 22 (NOTE: `app/opengraph-image.png` is specifically `git rm`-ed in Task 22 step 7 to make room for the new dynamic `app/opengraph-image.tsx`; do not delete it here in Task 1)
- `app/globals.css` — rewritten in Task 4
- `app/components/LenisProvider.tsx` — updated in Task 6
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs` — adjusted in Task 2
- `public/logo-cc.jpg`
- `public/projects/banciu-preview.jpg`, `aurasjobs-preview.jpg`, `stereocad-preview.jpg`

**Changes:**
1. Perform the PRE-DELETE PORT STEP above for `app/[locale]/_lib/jsonLd.ts`.
2. `git rm` each path in the "Files to delete" list. For directories (`i18n/`, `messages/`, and especially `app/[locale]/`): `git rm -rf <dir>`. For `app/[locale]/` use the bracket-quoted form per the "app/[locale]/ deletion" subsection above (`git rm -rf "app/[locale]"`).
3. Run `git status` and visually confirm the deleted set matches expectations — the entire `app/[locale]/` subtree should appear as deleted, nothing outside should be touched. Stop for user input if anything looks off.
4. After deletion: `npm run build` will fail (expected — many import errors). Do NOT try to fix build yet; subsequent tasks resolve it.
5. Commit as `chore: demolish Cinematic Blue Explorer in preparation for Chromatic Drift rewrite`.

**Edge cases:**
- `app/layout.tsx` currently imports `LenisProvider` and `IntroAnimation`. Don't fix imports in this task — Task 3 rewrites layout from scratch.
- `proxy.ts` (root) imports from `next-intl/middleware` — confirmed via grep that 30 files reference next-intl total; `proxy.ts` is one of them and MUST be deleted in this task (otherwise Task 2's `npm uninstall next-intl` will leave a broken middleware that breaks the build).
- Verify no remaining references to deleted components via `grep -r "from '@/app/components/IntroAnimation'"` style checks before committing. Also grep for `from 'next-intl'` — should be zero hits after deletion. If any caller exists that this plan didn't anticipate, list it and stop for user input.

---

### Task 2: Dependency surgery + Next.js bump

**Why:** Lock the implementation toolchain to the design doc's verified versions. Remove libraries the new design doesn't use.

**Files:**
- `package.json` — modify dependencies
- `package-lock.json` — regenerated by npm
- `next.config.ts` — remove `next-intl` plugin wrapper

**Step order matters.** Edit config FIRST, then npm operations, otherwise npm will fail on the stale `next-intl/plugin` import resolution during postinstall typecheck.

**Changes (in this order):**

1. **Edit `next.config.ts` FIRST:**
   - Remove `import createNextIntlPlugin from 'next-intl/plugin'` line.
   - Remove the `const withNextIntl = createNextIntlPlugin(...)` line.
   - Remove the `withNextIntl(nextConfig)` wrap at export. Export `nextConfig` directly: `export default nextConfig`.
   - Remove `connect-src` Formspree entry from CSP (footer no longer uses Formspree).
   - Remove Fontshare/Satoshi entries from CSP (we no longer load Satoshi).
   - Remove `worker-src 'self' blob:` from CSP — DRACOLoader was removed in commit `b25d699` and Chromatic Drift has no GLTF loader, so no Web Worker is needed.
   - Rewrite the misleading comment about `unsafe-eval`. Replace with: `// 'unsafe-eval' required for Next.js dev HMR / webpack runtime. NOT for Three.js (shaders compile on the GPU, not via eval). If production deploy shows 'Refused to evaluate' errors, restore 'unsafe-eval' and investigate the root cause before shipping.`
   - Keep `'unsafe-eval'` for now (dev needs it); revisit at production hardening.

2. **Run uninstall (after the edit above):**
   ```bash
   npm uninstall framer-motion next-intl react-icons lucide-react
   ```

2a. **MANDATORY — Nuke `node_modules` + lockfile before the fresh install** to avoid the documented 30GB SWC allocation panic from incremental Next.js version changes via npm install. This is a known deterministic failure mode for this repo — see user memory `feedback_node_modules_corruption.md` (read it first if unfamiliar). After the config edit + uninstalls above:
   ```bash
   rm -rf node_modules package-lock.json
   ```
   Then run the install commands in step 3 fresh. Use `npm install` (NOT `npm ci`) since the lockfile is being regenerated from scratch.

3. **Run ONE combined install (deps + devDeps in two calls, but back-to-back) — from a clean state:**
   ```bash
   npm install next@16.2.6 react@19.2.3 react-dom@19.2.3 three@^0.184.0 eslint-config-next@16.2.6 -E
   npm install -D @types/three@^0.184.0
   ```
   Note: `eslint-config-next` is pinned to match Next (`package.json:28` currently has `16.1.3`; bump it in the same install to avoid the peer-dep warning loop).

4. **Verify `gsap/SplitText` resolves** (it ships in `gsap@3.15.0` which is already in `package.json:13`, but plan never verified it). Run:
   ```bash
   node -e "require('gsap/SplitText')"
   ```
   Should exit 0 with no output. If it errors, the gsap install is broken — reinstall.

5. **Build check:** `npm run build` — expect failures from Task 1 deletions; this task only verifies that the dep changes themselves don't introduce config errors. The `next.config.ts` should parse cleanly.

**Parallel paths:** None — this is a one-time setup task.

**Edge cases:**
- Tailwind v4 is already configured via `@tailwindcss/postcss`. Do NOT downgrade. v4 is CSS-first, so there is no `tailwind.config.{js,ts}` to update.
- Minimum gsap version is `^3.13.0` (when SplitText went free). Current `^3.15.0` satisfies this — no change needed, but document in `package.json` comment if convenient.

---

### Task 3: Rewrite root layout — fonts, lang, providers shell

**Why:** Provides the new font pipeline (Geist + Geist Mono), sets `html lang="ro"`, mounts the shared chrome (cursor, scroll progress, flash, nav, sound toggle, both canvas backgrounds) in a fixed position outside the page flow.

**Files:**
- `app/layout.tsx` (full rewrite)

**Changes:**
1. Import `Geist` and `Geist_Mono` from `next/font/google` with `variable: '--font-geist-sans'` and `variable: '--font-geist-mono'`, subsets `['latin', 'latin-ext']` (latin-ext required for Romanian diacritics ț ș ă î â), `display: 'swap'`. NOTE: variable name is `--font-geist-sans` (matching existing project convention), NOT `--font-geist`.
2. Set `<html lang="ro" className={`${geist.variable} ${geistMono.variable}`}>`.
3. Set `<body className="bg-[#f3eee4] text-[#1c1a16]">` (matches preview default).
4. Render in body, in this order:
   - `<ShaderBackground />` (Task 11, will be no-op stub until then)
   - `<IcosahedronScene />` (Task 12, stub until then)
   - `<div className="glass" />` (CSS-only blur layer, defined in Task 4)
   - `<TransitionFlash />` (Task 9, stub)
   - `<ScrollProgress />` (Task 9, stub)
   - `<Cursor />` (Task 7, stub)
   - `<SoundToggle />` (Task 10, stub)
   - `<Nav />` (Task 8, stub)
   - `<LenisProvider>` wraps `<ScrollPaletteProvider>` wraps `{children}` (Tasks 6 + 5)
5. Export `metadata` const stub with `title`, `description`, `metadataBase`. Full metadata + JSON-LD lands in Task 22.
6. Do not import any of the deleted components.

**Parallel paths:** None.

**Edge cases:**
- **Stub strategy for Tasks 5-12 components mounted in layout:** Create each as a stub so the build compiles. Two stub patterns:
  - **Provider components** (LenisProvider from T6, ScrollPaletteProvider from T5) MUST pass children through:
    ```tsx
    'use client';
    export default function X({ children }: { children: React.ReactNode }) {
      return <>{children}</>;
    }
    ```
  - **Non-provider components** (Cursor, Nav, ScrollProgress, TransitionFlash, SoundToggle, ShaderBackground, IcosahedronScene) can return null:
    ```tsx
    'use client';
    export default function X() { return null; }
    ```
  Each stub gets replaced by its real implementation in the corresponding later task. Stubs ensure the layout chain stays intact (no swallowed children) and the build compiles.

---

### Task 4: Global CSS — palette CSS vars, glass layer, transition flash keyframes, base reset

**Why:** Theme tokens that the rest of the system reads. Port the foundational CSS from the mockup `<style>` block into `app/globals.css`.

**Files:**
- `app/globals.css` (full rewrite)

**Changes:**
1. Start with `@import "tailwindcss";` (Tailwind v4 CSS-first directive).
2. Add `@theme inline` block to register Geist as the Tailwind font family token: `--font-sans: var(--font-geist-sans); --font-mono: var(--font-geist-mono);`. CRITICAL: the `inline` keyword is REQUIRED in Tailwind v4 — without it, Tailwind substitutes the literal `var(--font-geist-sans)` string at build time, which breaks resolution. The existing `app/globals.css:22` already uses `@theme inline { ... }` — preserve that pattern. Variable names MUST be `--font-geist-sans` and `--font-geist-mono` to match the existing project convention from Task 3.
3. Port from `previews/chromatic-drift/index.html` `<style>` block, lines ~10-160 (the `:root`, `body.fg-light`, reset, canvas layers, glass, transition-flash, loader, cursor, scroll progress sections). Adapt selectors to component names if needed but keep CSS var names identical.
4. Add `@layer base` reset that strips browser defaults.
5. Define `--easing: cubic-bezier(0.7, 0, 0.2, 1)` as a global token.
6. Verify Romanian diacritics render correctly with `-webkit-font-smoothing: antialiased`.
7. **FOUC prevention — hero sibling elements (NEW, addresses Round 3 Finding 1).** The Task 13 cascade tween at `delay: 2.6` animates the eyebrow, sub, bio, scroll-hint, and CTA siblings of `.hero-name`. Without a default-invisible CSS rule, these elements flash visible for 2.6 seconds before their tween starts. Add this rule (scoped to `.hero` to avoid leaking to global usage of these class names elsewhere):
   ```css
   .hero .eyebrow,
   .hero .hero-sub,
   .hero .hero-bio,
   .hero .scroll-hint,
   .hero .btn-wow {
     opacity: 0;
   }
   ```
   The `.hero-name` rule (`opacity: 0`) is already covered by Task 13 step 3 (Option A SplitText pattern) — preserve it. The nav and global `.btn-wow` are NOT scoped, so this rule only zeroes the hero CTA's first-paint opacity; nav buttons and footer CTAs are unaffected. Task 13 step 6 (cascade) must use `gsap.to(...)` (not `gsap.from`) so the CSS-default invisible state is the starting point — see Task 13 step 6 update.

**Parallel paths:** None.

**Edge cases:**
- Tailwind v4 supports CSS vars natively but the `@theme inline` block is the canonical way to surface them as Tailwind utilities. Tokens like `--color-fg` would become `bg-fg` / `text-fg` utility classes. Prefer raw CSS vars over Tailwind utilities for the palette since values are scroll-driven (changing utilities at runtime is awkward).

---

### Task 5: Scroll palette context + provider

**Why:** Single source of truth for scroll progress and current palette stop. The shader, the icosahedron, the body class flip, AND the Nav CC reveal all subscribe.

**Files:**
- `app/lib/scroll-palette.ts` (new) — palette stops constant, lerp helper, TypeScript types
- `app/lib/scroll-palette-context.tsx` (new) — React context + provider hook

**Changes:**

**LOCKED surface contract (addresses Round 3 Finding 2 — type contradiction between tuple palette and `THREE.Color.copy()` consumers).** The hook MUST return:
```ts
useScrollPalette(): {
  progressRef: MutableRefObject<number>,
  baseRef: MutableRefObject<THREE.Color>,
  accentRef: MutableRefObject<THREE.Color>,
  navCCVisible: boolean,
  setNavCCVisible: (v: boolean) => void,
}
```
The `baseRef.current` and `accentRef.current` ARE `THREE.Color` instances (not tuples). T11 line `uniforms.uBase.value.copy(baseRef.current)` and T12 material color mutation depend on `.copy()` being available on these refs. Tuples are pure data, used only inside `scroll-palette.ts` for testability and as the source values fed into `setRGB(...)` on the THREE.Color refs.

1. **`scroll-palette.ts` (pure data, NO three dependency)** exports:
   - `type PaletteStop = { base: [r, g, b]; accent: [r, g, b] }`
   - `PALETTE_STOPS: PaletteStop[]` — the 4 stops from design doc §5.1 (cream/cool-gray, sand/taupe, bej+orange/burnt-orange, charcoal/gold)
   - `lerpPalette(progress: number): PaletteStop` — smoothstep-interpolated current palette, returns a tuple-shape stop. **Returns plain `[r, g, b]` tuples, NOT THREE.Color instances** — keeps this file free of the `three` import so it's unit-testable in isolation and tree-shakable from any non-WebGL consumer.
   - `DARK_THRESHOLD = 0.82`
2. **`scroll-palette-context.tsx` (consumer of `scroll-palette.ts` + `three`)** exports:
   - **FIRST import line** (mandatory): `import '@/app/lib/three-init';` so `THREE.ColorManagement.enabled = false` is set BEFORE the `new THREE.Color()` calls below run. Then `import * as THREE from 'three';`. This module is added to the `three-init.ts` consumer list (Task 11 step 3a now documents three consumers: Task 5 context provider, Task 11 ShaderBackground, Task 12 IcosahedronScene).
   - `<ScrollPaletteProvider>` initializes the THREE.Color refs once at mount:
     ```ts
     const progressRef = useRef(0);
     const baseRef = useRef(new THREE.Color());
     const accentRef = useRef(new THREE.Color());
     const wasLightRef = useRef(false);
     ```
   - Sets up a `ScrollTrigger` on document body. On every update:
     ```ts
     progressRef.current = self.progress; // pure ref write, zero React re-renders
     const next = lerpPalette(self.progress); // returns { base: [r,g,b], accent: [r,g,b] }
     baseRef.current.setRGB(next.base[0], next.base[1], next.base[2]);
     accentRef.current.setRGB(next.accent[0], next.accent[1], next.accent[2]);
     ```
     `setRGB` mutates the existing THREE.Color in place (no allocation per frame) — consumers see fresh values via `baseRef.current.copy(...)` calls inside their RAF loops.
   - **Body class toggle**: still imperative `document.body.classList.toggle('fg-light', p > DARK_THRESHOLD)` — BUT guard with a "did we cross the threshold?" check (track previous side in `wasLightRef.current`). The toggle only fires when the boolean actually flips, not every frame.
   - State surface includes `navCCVisible: boolean` (default `false`) and setter `setNavCCVisible(v: boolean)` — this stays as `useState` because it changes exactly once (at hero condense end) and Nav legitimately needs to re-render to add the `.show` class. Replaces the brittle DOM `CustomEvent('hero:condensed')` handoff. Hero's condense timeline `onComplete` calls `setNavCCVisible(true)`.
   - `useScrollPalette()` returns the locked-contract shape above. The `*Ref`s (including `progressRef`) are `MutableRefObject<...>` so consumers (Three.js components, ScrollProgress bar, etc.) can mutate/read without re-rendering the React tree. **`progress` is NOT exposed as reactive state** — this is intentional, to prevent Nav (which consumes the same hook for `navCCVisible`) from re-rendering at 60fps.
   - **If a future component genuinely needs scroll-tied React state**, add a separate `useSubscribeProgress(callback: (p: number) => void)` hook that registers a callback into the provider's callback list (the ScrollTrigger update loop iterates the list each frame). No consumers right now — **DEFER** this hook until needed.
3. The provider goes INSIDE `LenisProvider` (Task 6 ships LenisProvider first; this task wraps inside it in `app/layout.tsx`). See "Implementation Order" — Task 6 runs before Task 5.
4. **`scroll-palette-context.tsx` is a client component** — first directive at the top of the file (before any import) MUST be `'use client'`. It owns React state (`useState` for `navCCVisible`) and refs (`useRef`) plus a `useEffect` for the ScrollTrigger lifecycle. See Task 23 step 1 (Global note on client component declaration).

**Parallel paths:** None.

**Edge cases:**
- **LOCKED design (Finding 1 Round 2 regression fix):** React MUST NOT re-render on every scroll frame. `progress` is exposed ONLY as a ref. Any component that subscribes to `useScrollPalette()` for `navCCVisible` (notably Nav from Task 8) would otherwise re-render at 60fps during scroll if `progress` were `useState`. Do not "helpfully" promote `progressRef` back to state without re-reading Finding 1.
- **LOCKED type contract (Round 3 Finding 2 fix):** `baseRef.current` and `accentRef.current` are `THREE.Color` instances, NOT `[r, g, b]` tuples. `lerpPalette()` returns tuples (pure data, testable, three-free); the provider feeds those tuple values into `THREE.Color.setRGB(...)` on the long-lived refs each frame. Downstream consumers (Tasks 11 + 12) call `.copy(baseRef.current)` on their material uniforms — this requires actual THREE.Color instances. Do not "simplify" the refs to tuples or you will break the T11/T12 implementation contract.
- **three-init.ts import order (Round 3 Finding 2 fix):** `scroll-palette-context.tsx` MUST import `@/app/lib/three-init` as its FIRST import (top of file, before any other three import) so `ColorManagement.enabled` is disabled BEFORE the initial `new THREE.Color()` calls run in the provider's `useRef(new THREE.Color())` initializers. Without this ordering, the very first ColorManagement state at construction time is the r155+ default (enabled), and the first frame's `setRGB` values go through sRGB→linear conversion — producing one off-palette frame before the consumers catch up.
- Three.js components (Tasks 11, 12) mutate `THREE.Color` objects via `baseRef.current.copy(...)`; no React tree involvement.
- ScrollProgress bar (Task 9) reads `progressRef.current` inside its own RAF loop and imperatively sets `style.width`, no re-render.
- `navCCVisible` is a React state on purpose — Nav re-render on the one-time flip is cheap and avoids the Strict Mode listener-timing race from the old custom-event handoff.
- Body class toggle: guard `wasLightRef.current !== nowLight` before calling `classList.toggle` — without the guard, the toggle runs (and triggers style recalculation) on every frame even though the class state is unchanged.
- SSR: `ScrollTrigger` must only initialize on client. Use `useEffect` + guard `typeof window !== 'undefined'`.

---

### Task 6: LenisProvider — update to current Lenis API + register with GSAP ticker

**Why:** Existing `LenisProvider.tsx` was built for older Lenis API. Update to `lenis@1.3.23` patterns and integrate with GSAP ScrollTrigger.

**Files:**
- `app/components/LenisProvider.tsx` (rewrite, keep file path)

**Changes:**
1. Import `Lenis` from `lenis` (NOT `@studio-freight/lenis` — package was renamed).
2. In a `useEffect`:
   ```ts
   const lenis = new Lenis({
     duration: 1.15,
     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
     smoothWheel: true,
     // NOTE: do NOT pass `smoothTouch` — it is the Lenis 1.0 API and was REMOVED in 1.3+.
     // Use `wheelMultiplier` and `touchMultiplier` instead if tuning is needed.
     // Existing project `LenisProvider.tsx:23-24` already does this — mirror it.
     wheelMultiplier: 1,
     touchMultiplier: 1.5,
   });
   lenis.on('scroll', ScrollTrigger.update);
   gsap.ticker.add((time) => lenis.raf(time * 1000));
   gsap.ticker.lagSmoothing(0);
   return () => { lenis.destroy(); gsap.ticker.remove(...); };
   ```
3. **CRITICAL: DO NOT port `smoothTouch: false` from the mockup (mockup line 1317).** That property no longer exists in Lenis 1.3.x and passing it produces a runtime warning at best, silent ignore at worst. The mockup was written against an older Lenis. This is one place where the mockup must NOT be ported verbatim — see Context exceptions list.
4. The `scrollTo` callback signature also changed in 1.3.x — verify Nav menu (Task 8) uses the current signature `lenis.scrollTo(target, { offset, duration, easing, onComplete })`. The `onComplete` is a third-argument option, not a positional callback.
5. Provide a context with `lenis` instance so the Nav menu (Task 8) can call `lenis.stop()` / `lenis.start()` and `lenis.scrollTo(el)`.
6. Export `useLenis()` hook.
7. **Own the final ScrollTrigger refresh hook (NEW, addresses Round 3 Finding 4).** In a second `useEffect` (separate from the Lenis lifecycle effect — keeps cleanup independent), run the deferred refresh sequence: `await document.fonts.ready` → `await requestAnimationFrame(...)` → `ScrollTrigger.refresh(true)`. Full code + rationale lives in Task 23 step 4 — that is the source of truth for the snippet; Task 6 simply hosts the implementation since it already wires the Lenis ↔ ScrollTrigger bridge. Co-locating keeps all ScrollTrigger plumbing in one provider. If LenisProvider grows past ~80 lines, extract this refresh effect into a separate `<ScrollOrchestrator />` per Task 23 step 4's "Alternative co-location" note.

**Parallel paths:** None.

**Edge cases:**
- Strict Mode in dev runs `useEffect` twice — make sure destroy is symmetric so we don't get double Lenis instances.
- The deferred ScrollTrigger refresh effect (step 7) must also be Strict Mode-safe. Use a `cancelled` flag captured by the cleanup function (shown in Task 23 step 4 snippet) so the second Strict Mode mount does not fire a duplicate `ScrollTrigger.refresh(true)` while the first is still pending.

---

### Task 7: Custom cursor component

**Why:** Awwwards-grade detail. Disabled on touch devices via CSS `@media (hover: none)` from Task 4.

**Files:**
- `app/components/Cursor.tsx` (new)

**Changes:**
1. Port from `previews/chromatic-drift/index.html` lines ~1180-1230 (the `mousemove` listener + trail RAF loop + hover class toggle for `a, button, .menu-btn, .sound-toggle`).
2. Use `useEffect` for listener wiring + RAF.
3. Render two divs: `.cursor` and `.cursor-trail` (styles defined in Task 4 globals.css).
4. Use `MutationObserver` or re-attach hover listeners on a debounced interval if new interactive elements are mounted dynamically — better: use event delegation on document with `e.target.closest('a, button, .magnetic')`.

**Parallel paths:** None.

**Edge cases:**
- During SSR no `document` — bail out early in `useEffect`.

---

### Task 8: Nav component — CC slot + hamburger + overlay menu

**Why:** Hidden artpiece navbar from design doc §6.1.

**Files:**
- `app/components/Nav.tsx` (new)

**Changes:**
1. Port nav structure from mockup lines ~990-1010 (header + nav-right + menu-btn).
2. Port menu overlay from mockup lines ~1014-1024 (overlay + items).
3. The CC slot is an empty `<span id="nav-cc" class="nav-cc">CC</span>`. Visibility is driven by `navCCVisible` from `useScrollPalette()` (Task 5) — when `true`, add the `.show` class (CSS sets opacity from 0 to 1). DO NOT use a `window.addEventListener('hero:condensed', ...)` DOM custom event handoff; React 19 Strict Mode + Lenis init timing makes the listener attachment race-prone.
   - **Nav consumes ONLY `navCCVisible` from the hook**, never `progressRef`. The provider deliberately exposes `progress` as a ref, not state, precisely so Nav does not re-render at 60fps during scroll (see Task 5 Finding 1 regression fix). Confirm during implementation that Nav's render does not destructure or read `progressRef` reactively.
4. Hamburger toggles overlay state via `useState`. On open: call `useLenis().stop()`. On close: `start()`. On menu item click: `e.preventDefault()` → close overlay → wait 700ms → `lenis.scrollTo(targetEl)` using the Lenis 1.3+ options-object signature (see Task 6 note).
5. Menu items (RO): Proiecte, Studio, Despre, Contact.

**Parallel paths:** None.

**Edge cases:**
- Overlay menu must capture pointer events when open (CSS `pointer-events: auto` only when `.open`).
- Close on Escape key.
- The CC `<span>` still has `id="nav-cc"` for the Hero condense animation's measurement target (`getBoundingClientRect`) — only the visibility toggle changes from custom event to React state.

---

### Task 9: Scroll progress bar + transition flash overlay

**Why:** Two thin shared chrome components driven by scroll events.

**Files:**
- `app/components/ScrollProgress.tsx` (new)
- `app/components/TransitionFlash.tsx` (new)

**Changes:**
1. **ScrollProgress** — fixed top bar 1px tall, mix-blend-mode difference. Reads `progressRef.current` from `useScrollPalette()` (Task 5) inside its own `requestAnimationFrame` loop and sets `style.width = (progressRef.current * 100) + '%'` imperatively (no re-render). DO NOT subscribe to reactive state — `progress` is NOT exposed as state in the provider (see Task 5 edge cases / Finding 1 regression fix).
2. **TransitionFlash** — fixed full-viewport div with class `.transition-flash`. Exposes an imperative `fireFlash()` method via a ref or a global event bus. Each section component (Tasks 15-21) creates a ScrollTrigger with `onEnter: fireFlash`. Animation is CSS keyframe `flashPulse` defined in Task 4.

**Parallel paths:** None.

**Edge cases:**
- TransitionFlash class toggle must reflow before re-adding — use `void el.offsetWidth` trick from preview.
- Avoid simultaneous flash overlapping by debouncing 0.3s.

---

### Task 10: Sound toggle (UI-only stub)

**Why:** Visual completeness for the Awwwards review pass. No audio yet (deferred).

**Files:**
- `app/components/SoundToggle.tsx` (new)

**Changes:**
1. Port mockup lines ~1027-1031 (button + sound bars + label).
2. `useState<boolean>` for on/off; toggling sets class + swaps label between "Sound off" and "Sound on".
3. Add a `// TODO Phase 2: wire ambient audio` comment.

**Parallel paths:** None.

**Edge cases:** None.

---

### Task 11: WebGL shader background — fullscreen palette-driven plane

**Why:** The signature visual. Continuously interpolates the current palette colors via Three.js fragment shader.

**Files:**
- `app/components/ShaderBackground.tsx` (new)
- `app/lib/shaders/chromatic-drift.frag.ts` (new) — exports the GLSL string
- `app/lib/shaders/chromatic-drift.vert.ts` (new) — trivial vertex shader
- `app/lib/three-init.ts` (new — shared Three.js global flag init, imported by both Task 11 and Task 12 BEFORE any three usage; see step 3a / Finding 9)

**Changes:**
1. Port shader code from mockup lines ~1313-1390 (vertex shader, fragment shader with Simplex 3D noise from Ashima Arts).
2. Component creates `THREE.WebGLRenderer({ canvas, alpha: false })`, `OrthographicCamera`, fullscreen `PlaneGeometry(2,2)` mesh with `ShaderMaterial`.
3. **Color space handling — mandatory.** The mockup uses Three.js r160 (line 1288), which defaulted to Linear output AND defaulted `THREE.ColorManagement.enabled = false`. Plan pins `three@^0.184.0` (r184), which (a) defaults to sRGB output, AND (b) defaults `THREE.ColorManagement.enabled = true` (changed in r155+). With BOTH defaults active, palette values like `new THREE.Color(0.96, 0.94, 0.89)` get sRGB→linear converted at upload AND linear→sRGB at output — a double conversion that yields visibly lighter/desaturated colors vs the mockup.

   Choose ONE of:
   - **Option A (DEFAULT — preserve mockup look exactly):** Set BOTH:
     - `THREE.ColorManagement.enabled = false` (disable automatic sRGB→linear at color construction)
     - `renderer.outputColorSpace = THREE.LinearSRGBColorSpace` (no linear→sRGB at output)
     - These two settings must travel together. They cancel each other into a "raw values flow straight through" pipeline matching r160 default behavior.
     - **`ColorManagement.enabled = false` MUST execute BEFORE any `new THREE.Color(...)` runs** — see step 3a below for the shared init module.
   - **Option B (modern correct):** Leave `THREE.ColorManagement.enabled = true` (the r155+ default) AND set `renderer.outputColorSpace = THREE.SRGBColorSpace` (also r184 default; explicit is fine). Apply `.convertSRGBToLinear()` to every palette color at construction OR pass colors in already-linear values. This is the future-proof path but requires re-tuning palette numbers to match the mockup.

   **The two options are mutually exclusive.** Do NOT combine `LinearSRGBColorSpace` output with `ColorManagement.enabled = true` (the original mistake — produces the desaturated double-conversion). Do NOT combine `SRGBColorSpace` output with `ColorManagement.enabled = false` (the inverse mistake — under-saturated).

   Document the chosen option in a comment at the top of the file. Default to Option A.

3a. **Shared three-init module (NEW — required for Option A; no-op for Option B).** Module-level side effects run once, regardless of which component mounts first, eliminating the race where the "first mount wins" sets `ColorManagement.enabled`. See Finding 9 / Task 11 + Task 12 cross-reference.

   File: `app/lib/three-init.ts`. Contents (Option A):
   ```ts
   // app/lib/three-init.ts
   // Side-effect-only module: runs once at first import, sets Three.js global flags.
   // Must be imported BEFORE any other `three` usage in Task 5 (ScrollPaletteProvider),
   // Task 11 (ShaderBackground), and Task 12 (IcosahedronScene).
   import * as THREE from 'three';
   THREE.ColorManagement.enabled = false;
   ```
   If Option B is chosen instead, make this file a no-op (empty side effect, or skip creating it). Document the chosen option in the file's leading comment.

   **Consumer list (three modules import this FIRST, before any other three usage):**
   1. `app/lib/scroll-palette-context.tsx` (Task 5) — calls `new THREE.Color()` in its `useRef` initializers.
   2. `app/components/ShaderBackground.tsx` (Task 11) — creates renderer, uniforms with THREE.Color.
   3. `app/components/IcosahedronScene.tsx` (Task 12) — creates renderer, materials with THREE.Color.

   In each of these three files, the FIRST import line must be:
   ```ts
   import '@/app/lib/three-init';
   ```
   (Before `import * as THREE from 'three'` or any other three usage.)
4. Uniforms: `uTime` (clock), `uScroll` (from context), `uResolution`, `uBase`, `uAccent`.
5. In RAF loop: `uniforms.uTime.value = clock.getElapsedTime(); uniforms.uBase.value.copy(baseRef.current); uniforms.uAccent.value.copy(accentRef.current); renderer.render(scene, camera);`
6. Window resize listener updates `setSize` + `uResolution`.
7. `setPixelRatio(Math.min(window.devicePixelRatio, 1.75))` desktop; `1.25` mobile.
8. Cleanup in `useEffect` return: dispose geometry, material, renderer.
9. **WebGL context loss handling**: listen for `webglcontextlost` on the canvas, call `e.preventDefault()`, and re-create renderer + uniforms on `webglcontextrestored`. Mirror this approach in Task 12.

**Verification gate (visual diff):** Open `previews/chromatic-drift/index.html` and the rendered Next.js component side-by-side in two browser windows. Hero background must look pixel-close to the mockup. If divergence is visible (more saturated, darker, color cast), revisit the color space choice in step 3.

**Parallel paths:** None.

**Edge cases:**
- Three.js is large (~600KB gzipped). Mount via `next/dynamic(..., { ssr: false })`.
- On `prefers-reduced-motion: reduce`: render once with `uScroll = 0`, then freeze (no RAF). Keeps the look but kills motion.
- WebGL availability: if `canvas.getContext('webgl2') || canvas.getContext('webgl')` returns null, do not throw — render a CSS gradient fallback (Task 25 sub-step 1 specifies the exact fallback behavior).

---

### Task 12: 3D foreground icosahedron scene

**Why:** Adds real 3D depth above the shader. Visible from manifesto through story.

**Files:**
- `app/components/IcosahedronScene.tsx` (new)

**Changes:**
1. Port from mockup lines ~1448-1490 (double wireframe IcosahedronGeometry, PerspectiveCamera, render loop).
2. Right-side fixed canvas: `position: fixed; right: 0; top: 0; width: 55vw; height: 100vh;`.
3. Subscribe to scroll progress: `canvas.style.opacity` interpolates 0 → 0.7 between progress 0.08 and 0.92 (use class toggle `.show` defined in CSS).
4. Material color mutates per-frame from `accentRef`.
5. Mount via `next/dynamic({ ssr: false })`.
6. **Apply the SAME color space treatment as Task 11 — Option A or Option B, must match.**
   - **FIRST import line in `IcosahedronScene.tsx` MUST be**: `import '@/app/lib/three-init';` (before `import * as THREE from 'three'` or any three usage). This guarantees `THREE.ColorManagement.enabled = false` is set exactly once at module load regardless of which canvas mounts first (Task 11 vs Task 12). See Finding 9 / Task 11 step 3a.
   - If Task 11 chose Option A: `renderer.outputColorSpace = THREE.LinearSRGBColorSpace` here too. ColorManagement is already disabled by the shared init module.
   - If Task 11 chose Option B: skip importing `three-init` (no-op file) OR keep the import as no-op; renderer keeps default sRGB output; apply `.convertSRGBToLinear()` to materials.
   - DO NOT mix options between Task 11 and Task 12 — the two scenes share one DOM and one ColorManagement global; mismatch produces inconsistent palettes between background and icosahedron.
7. **WebGL context loss handling**: mirror Task 11 — `webglcontextlost` with `e.preventDefault()`, recreate renderer on `webglcontextrestored`.
8. **WebGL availability**: if no WebGL, simply do not render the canvas (the icosahedron is decorative — the page survives without it). See Task 25 sub-step 1.

**Parallel paths:** None.

**Edge cases:**
- Mobile: hide entirely below 900px (CSS already handles via `@media (max-width: 900px) { .canvas-3d { display: none } }` — verify).
- `prefers-reduced-motion`: skip the continuous rotation; render one frame on scroll change only.

---

### Task 12b (RECOMMENDED — defer to Task 24 if it becomes a real problem): Consider single-renderer architecture

**Why:** The mockup creates two separate `new THREE.WebGLRenderer` instances (lines 1349 + 1490). iOS Safari limits ~4-8 WebGL contexts per page under memory pressure. Two heavy contexts on a page that may also embed maps/videos elsewhere later is risky.

**Recommendation:** Refactor to a single `WebGLRenderer` with two scenes (background fullscreen + foreground icosahedron), rendered via viewport + scissor (`renderer.setScissorTest(true); renderer.setScissor(x, y, w, h); renderer.setViewport(x, y, w, h); renderer.render(scene, camera);`) so the total context count is 1.

**Status:** Marked RECOMMENDED but NOT required for first ship. Build out Tasks 11 + 12 with separate renderers first. During Task 24 (mobile parity) test on actual iOS Safari. If context loss occurs or memory pressure is observable, implement Task 12b then.

---

### Task 13: Hero section — letter cascade reveal + scroll condense to CC

**Why:** The marquee moment. Letters of "CLAUDIU COMȘA" cascade in, then collapse on scroll into the nav CC slot.

**Files:**
- `app/components/sections/Hero.tsx` (new)
- `app/components/sections/Hero.module.css` (new, optional — for hero-specific styles that don't belong in globals)

**Changes:**
1. Structure per mockup lines ~1037-1075: eyebrow, name wrap, sub, bio, magnetic CTA, scroll hint.
2. Use GSAP `SplitText` plugin (free in 3.15+). **MUST register the plugin before use**:
   ```ts
   import { gsap } from 'gsap';
   import { SplitText } from 'gsap/SplitText';
   import { ScrollTrigger } from 'gsap/ScrollTrigger';
   gsap.registerPlugin(SplitText, ScrollTrigger);
   ```
3. **SSR hydration safety + FOUC prevention.** Naive approaches both fail:
   - Synchronous SplitText in `useEffect` → React 19 hydration mismatch warning (server text vs mutated DOM).
   - rAF-deferred SplitText alone → the SSR-rendered static `<h1>CLAUDIU COMȘA</h1>` is visible for 1.9s+ before the cascade starts (FOUC: user sees the unstyled headline, then the same headline animates in).

   Use **Option A (DEFAULT)**:
   - In CSS (Task 4 / Hero module): `.hero-name { opacity: 0; }` as the default state. SSR renders the static h1, but it is invisible from first paint.
   - In `useEffect` (client-only), wrap the SplitText call in `requestAnimationFrame` for hydration safety:
     ```ts
     useEffect(() => {
       const raf = requestAnimationFrame(() => {
         const wrapper = nameRef.current!;
         const split = new SplitText(wrapper, { type: 'chars', charsClass: 'ltr' });
         // The per-char spans start hidden via the cascade `gsap.from` below — so it's safe
         // to flip wrapper opacity to 1 BEFORE the cascade. The wrapper becomes visible,
         // but the chars inside are at opacity:0 / y:110% until the cascade tweens them in.
         wrapper.style.opacity = '1';
         gsap.from(split.chars, { y: '110%', opacity: 0, stagger: 0.04, ease: 'expo.out', duration: 1.2, delay: 1.9 });
       });
       return () => cancelAnimationFrame(raf);
     }, []);
     ```
   - Visible state transition: SSR static (invisible) → cascade-in. No FOUC of the static headline.

   **Option B (advanced, lockstep with SSR — implement only if Option A shows FOUC during QA):**
   - Server-side, pre-render the hero name as already-split per-char spans via a helper `splitNameSSR(name: string): JSX.Element[]` that emits `<span class="ltr">C</span><span class="ltr">L</span>...`. The static markup matches what SplitText would produce on the client.
   - On client mount, attach a GSAP timeline directly to the existing `.ltr` spans without DOM mutation. No hydration mismatch, no opacity gate needed.
   - Requires Romanian-aware codepoint splitting (use `[...name]` array spread, NOT `name.split('')` — see Finding 5 / Task 13 step 5 NFC assertion).

   Default to Option A. Document Option B as an enhancement.

   Reuse the same Option A pattern in Tasks 15 and 19 (any element using SplitText with a cascade-in starts at `opacity: 0` in CSS, then the effect flips wrapper opacity to 1 before triggering the chars-from tween).
4. Tag the two `C` chars: `split.chars.forEach((c, i) => { if (c.textContent === 'C') c.classList.add('ltr-c'); else if (c.textContent !== ' ') c.classList.add('ltr-mid'); });`.
5. **Romanian Ș verification gate** (also applies to Tasks 15 + 19). The string `CLAUDIU COMȘA` contains U+0218 (Ș, pre-composed s-comma-below). If any tool in the pipeline NFD-normalizes it, the char count splits incorrectly. After SplitText runs, assert in dev:
   ```ts
   const fullName = nameRef.current!.dataset.fullName ?? 'CLAUDIU COMȘA';
   const expectedCount = [...fullName].length; // codepoint count, not UTF-16
   console.assert(split.chars.length === expectedCount,
     `SplitText produced ${split.chars.length} chars, expected ${expectedCount}. NFC normalization may have been lost.`);
   ```
   Add a comment at the top of the file: `// Strings are NFC-normalized at compile time. Do not run this source through tools that re-normalize to NFD.`
6. **Cascade in** (1.9s delay after load): `gsap.from(split.chars, { y: '110%', opacity: 0, stagger: 0.04, ease: 'expo.out', duration: 1.2 })`.
6a. **Sibling cascade — FOUC-safe pattern (NEW, addresses Round 3 Finding 1).** The mockup uses `gsap.from('.eyebrow, .hero-sub, .hero-bio, .scroll-hint, .nav, .btn-wow', { opacity: 0, delay: 2.6, ... })`. Naively ported, the elements start visible (CSS default) and the tween only kicks in at 2.6s — producing a 2.6s FOUC where the eyebrow, sub, bio, scroll-hint, and hero CTA flash visible before the cascade.

   **Fix:** the Task 4 CSS rule (step 7 in Task 4) sets these hero-scoped elements to `opacity: 0` by default. Then change the tween from `gsap.from(...)` to `gsap.to(...)` so it animates FROM the CSS-default invisible state TO visible:
   ```ts
   // Targets MUST be hero-scoped so we don't fight the nav and footer rules.
   const els = heroRef.current!.querySelectorAll('.eyebrow, .hero-sub, .hero-bio, .scroll-hint, .btn-wow');
   // Belt-and-suspenders: explicitly set the starting state in JS too, in case the CSS
   // rule is missed (e.g., during partial component reuse). Idempotent with the CSS default.
   gsap.set(els, { opacity: 0, y: 14 });
   gsap.to(els, { opacity: 1, y: 0, delay: 2.6, stagger: 0.08, duration: 1, ease: 'power2.out' });
   ```
   The `.nav` is NOT included in the hero-scoped CSS rule (nav lives outside `.hero`) — if the mockup's nav-fade is desired, target the Nav element via its own ref or class and use the same `gsap.set` + `gsap.to` pattern there. Nav is rendered in layout, not Hero, so Hero shouldn't directly query `.nav` — leave nav fade-in as a Nav-component concern (or skip it; the Nav CC slot already has its own reveal logic via Task 5's `navCCVisible`).
7. **Scroll condense** — port the condense timeline from mockup lines ~1611-1672 verbatim, but read DOM measurements after fonts load (use `document.fonts.ready` promise).
8. **Nav CC handoff via React state, NOT DOM event.** On condense `onComplete`: `setNavCCVisible(true)` from `useScrollPalette()` (Task 5). DO NOT emit a `CustomEvent('hero:condensed')`.
9. CTA uses `<MagneticButton href="#projects" label="Vezi proiecte" />` from Task 14.

**Parallel paths:** None.

**Edge cases:**
- `document.fonts.ready` MUST resolve before measuring positions, otherwise the condense target position is wrong.
- Romanian `Ș` in "COMȘA" — SplitText handles Unicode correctly in 3.15. Verify the `Ș` char ends up classed `ltr-mid` not `ltr-c` AND the assertion in step 5 passes.
- Window resize while scrolled mid-condense: re-measure on ScrollTrigger refresh.
- **FOUC smoke test (mandatory).** Load `/` and watch the hero name from page-load through 2.0 seconds. The user must NEVER see the static unstyled headline before the cascade begins. Acceptable visual: cream/empty space → letters cascade in. Unacceptable: static "CLAUDIU COMȘA" flashes visible before the cascade. If unacceptable behavior observed, escalate to Option B (SSR-rendered pre-split spans) per step 3.
- **Sibling FOUC smoke test (mandatory, addresses Round 3 Finding 1).** Verify by hard-refreshing the page on a slow connection (DevTools Network throttling: "Slow 4G" or "Slow 3G") — the eyebrow, hero-sub, hero-bio, scroll-hint, and hero CTA (`.btn-wow` inside `.hero`) must NOT flash visible before their cascade entry at 2.6s. Acceptable: these elements remain blank until 2.6s, then fade up in stagger. Unacceptable: any of them visible at first paint, then re-fading in. If unacceptable behavior observed, the CSS rule from Task 4 step 7 is either missing or being overridden — check selector specificity and confirm the rule appears in the production-built CSS bundle.

---

### Task 14: MagneticButton component

**Why:** Reused 3 times (hero CTA + 2 footer CTAs).

**Files:**
- `app/components/MagneticButton.tsx` (new)

**Changes:**
1. Port styles from mockup lines ~334-380 (`.btn-wow` + `.btn-text` + hover/fill animation).
2. Props: `href: string | undefined`, `label: string`, `labelHover?: string` (defaults to `label`), `as?: 'a' | 'button'`, `onClick?`.
3. Two stacked label spans for the slide-up reveal.
4. `onMouseMove` handler applies magnetic pull via `gsap.to(el, { x: dx*0.35, y: dy*0.35 })`. `onMouseLeave`: returns with elastic ease.
5. Cursor effect: relies on Cursor component's hover detection via the `<a>` / `<button>` element.

**Parallel paths:** None.

**Edge cases:**
- Disable magnetic effect on touch (`@media (hover: none)`).
- When `href` starts with `#`, intercept click and use `useLenis().scrollTo()` for smooth scroll.

---

### Task 15: Manifesto section

**Why:** Single editorial sentence with letter cascade scrubbed to scroll.

**Files:**
- `app/components/sections/Manifesto.tsx` (new)

**Changes:**
1. Structure per mockup lines ~1085-1090.
2. Use `SplitText` for chars; tween `y: '0%'` from `'120%'` with `scrub: 0.8` from `top 70%` to `top 20%`. Register plugins as in Task 13.
3. **Reuse Task 13's Option A SplitText pattern**: target paragraph starts at `opacity: 0` in CSS; in `useEffect` wrap SplitText in `requestAnimationFrame` for hydration safety, then flip wrapper opacity to 1 before the scrub timeline runs (the per-char `y: 120%` initial state keeps the letters invisible until the scrub progresses them in). No FOUC of unstyled paragraph text. Alternatively, add `suppressHydrationWarning` to the target paragraph element if rAF deferral conflicts with the scrub timing — document choice.
4. **Reuse Task 13's Romanian char-count assertion** (NFC check) immediately after SplitText runs.
5. Soft-color span: `<span className="soft">orice efect ieftin</span>` — class defined in globals.
6. Section enter triggers `<TransitionFlash />`.

**Parallel paths:** None.

**Edge cases:**
- Romanian diacritics survive SplitText — confirmed in 3.15. The dev-only assertion from Task 13 guards against future regressions.

---

### Task 16: Projects header + Project 1 (Banciu) — horizontal scroll

**Why:** First project signature effect. Pinned horizontal scroll on desktop, native horizontal scroll on mobile.

**Files:**
- `app/components/sections/ProjectsHeader.tsx` (new)
- `app/components/sections/projects/P1Banciu.tsx` (new)
- `app/components/sections/projects/project-card.module.css` (new, shared per-project styles)
- `app/lib/projects-data.ts` (new) — locked metadata: title, slug, year, sub copy, image paths

**Changes:**
1. ProjectsHeader: ports mockup lines ~1094-1102.
2. P1Banciu: ports mockup lines ~1106-1132 + JS lines ~1717-1745 (matchMedia for desktop pin vs mobile native scroll).
3. Replace mockup placeholder gradient plates with `<Image src="/projects/banciu-preview.jpg" fill ... />` for the 4 image cards. Generate 4 distinct image slots even if asset is reused (note: only one Banciu preview exists — Phase 2 will add 3 more variants).

**Parallel paths:** Same `.p1` ScrollTrigger pattern is reused for any future horizontal-scroll section. Keep the matchMedia helper exportable.

**Edge cases:**
- `invalidateOnRefresh: true` is critical for pin sections — preview lines ~1735.
- If only 1 Banciu image exists, ship 4 variants using CSS filter shifts (`hue-rotate`, `brightness`) until real images are provided. Tag in data with `imagePlaceholder: true`.

---

### Task 17: Project 2 (Aurasjobs) — pinned zoom + glass shards

**Why:** Second signature effect.

**Files:**
- `app/components/sections/projects/P2Aurasjobs.tsx` (new)

**Changes:**
1. Port mockup lines ~1135-1150 (markup) + JS lines ~1750-1768 (timeline).
2. Use `<Image src="/projects/aurasjobs-preview.jpg" />` for the main card surface instead of the CSS gradient placeholder.
3. Shards positioned via inline style as in mockup (acceptable for prototype-grade WOW).

**Parallel paths:** None.

**Edge cases:**
- Pinning a 250vh section can trip on Lenis sometimes — `anticipatePin: 1` if jitter observed.

---

### Task 18: Project 3 (Stereocad) — split scroll + 3D cube

**Why:** Third signature.

**Files:**
- `app/components/sections/projects/P3Stereocad.tsx` (new)

**Changes:**
1. Port mockup lines ~1154-1180 (split layout + 6-face cube via `transform-style: preserve-3d` and per-face transforms).
2. Cube rotation via `gsap.to(cubeRef, { rotateY: 720, rotateX: 180, scrub: 1 })`.
3. Mobile: layout collapses to stacked (CSS already handles in globals from Task 4).

**Parallel paths:** None.

**Edge cases:**
- Sticky positioning inside grid can break in older Chromium — verify with current Edge/Chrome.
- **iOS Safari sticky-inside-preserve-3d bug (design-time gate).** iOS Safari has a documented bug: `position: sticky` fails when nested inside a `transform-style: preserve-3d` ancestor. P3 uses both (cube needs `preserve-3d`, layout uses sticky for the pin). Verify at design time that the sticky element (`.p3-pin` / the column wrapper) is NOT a descendant of the `preserve-3d` element. In the mockup structure: the sticky column wraps the cube, and `preserve-3d` is on the cube itself — sticky is the ancestor, preserve-3d is the descendant. This nesting direction is safe.
  - **If during implementation the cube ends up wrapping the sticky element** (the opposite direction), restructure so sticky and preserve-3d are siblings (or sticky is the outer ancestor), never sticky as descendant of preserve-3d.
  - **Smoke-test on real iOS Safari 17+ before declaring Task 18 done.** Open the section on an iPhone, scroll into and through P3 — the cube column must pin correctly while the right column scrolls. If pinning fails on iOS but works on desktop Chrome, this bug is the most likely cause. Restructure DOM before shipping.

---

### Task 19: Project 4 (letter explode) + Project 5 (CRT glitch)

**Why:** Final two signatures. P4 and P5 use placeholder copy until user names them.

**Files:**
- `app/components/sections/projects/P4Confidential.tsx` (new)
- `app/components/sections/projects/P5Atelier.tsx` (new)

**Changes:**

P4 and P5 are TWO DIFFERENT EFFECTS in one task. Do NOT cross-pollinate. The "Task 13 SplitText pattern" applies to P4 ONLY. P5 has NO text-splitting at all.

**Step 1 — P4 ONLY (letter explode title)**:
   - Port mockup lines ~1183-1192 (markup) + JS ~1796-1815 (timeline).
   - **Use GSAP SplitText for the title** — register plugins per Task 13 step 2.
   - **Apply ALL Task 13 patterns**:
     - Option A SplitText SSR/FOUC pattern (CSS `opacity: 0` default, rAF-wrapped SplitText in `useEffect`, flip wrapper opacity to 1 before the explode tween — see Task 13 step 3 / Finding 5).
     - Romanian NFC codepoint-count assertion in dev (see Task 13 step 5).
     - File header comment about NFC normalization (see Task 13 step 5).
   - Letter explode timeline: per-char `gsap.from` with randomized `x`/`y`/`rotation` arriving at zero.

**Step 2 — P5 ONLY (CRT glitch)**:
   - Port mockup lines ~1195-1206 (markup: 3 stacked colored text layers for RGB channel split + scanline div) + JS ~1818-1855 (RGB channel offset tween + scanline drift + hue-rotate keyframes on enter).
   - **NO SplitText.** The effect operates on whole-text DOM nodes (3 superimposed layers), not per-char.
   - **NO Romanian NFC concern.** The title is rendered as one unit per layer; no char-splitting tool is invoked, so codepoint normalization is a non-issue.
   - **NO rAF deferral / Option A opacity gate.** The markup is identical client and server (3 superimposed `<span>`s with the same text, plus a `<div class="scanline" />`); no DOM mutation occurs on mount, so there is no SSR hydration mismatch and no FOUC risk.
   - The trigger fires on `onEnter`; before enter the layers are aligned (no offset) and animate apart on enter.

**Parallel paths:** None. P4 and P5 do not share code.

**Edge cases:**
- Both use placeholder copy. Tag each with `// TODO Phase 2: replace with real project naming once user provides`.
- **Implementer note:** if you find yourself adding SplitText to P5 because P4 has it, STOP and re-read Step 2 — that's the exact mistake the substep delineation is designed to prevent.

---

### Task 20: Studio + Story sections

**Why:** Two content-heavy sections. Story houses the portrait photo slot.

**Files:**
- `app/components/sections/Studio.tsx` (new)
- `app/components/sections/Story.tsx` (new)
- `app/components/StoryPhoto.tsx` (new) — extracted because it has b+c treatment + reveal + parallax logic

**Changes:**
1. **Studio** — port mockup lines ~1210-1224. List reveal stagger via GSAP.
2. **Story** — port mockup lines ~1228-1264 layout (2-col grid).
3. **StoryPhoto** — accept `src?: string` prop. If undefined, render `.photo-placeholder` div per mockup lines ~1253-1255. If defined, render `<Image src={src} alt="Claudiu Comșa" fill style={photoFilterStyle} />`.
4. Mask reveal + parallax per mockup lines ~1880-1910 (clip-path tween + image yPercent scrub).
5. Default placeholder shows RO text: "Loc pentru fotografie · Trimite poza și o pun aici".

**Parallel paths:** None.

**Edge cases:**
- When real photo is added at `public/story/claudiu.jpg`, just pass `src="/story/claudiu.jpg"` from `Story.tsx` and remove the placeholder branch (no code change needed beyond passing the prop).
- `Image` component with `fill` requires the parent to be `position: relative` — handled by `.photo-mask` styles.

---

### Task 21: Footer with magnetic CTAs

**Why:** Final section. Lives in palette stop 4 (dark + gold).

**Files:**
- `app/components/sections/Footer.tsx` (new)

**Changes:**
1. Port mockup lines ~1268-1304.
2. Two `<MagneticButton>` instances: email + call.
3. Three-column grid with placeholders for Social handles (links currently `href="#"` — `// TODO: user provides handles`).
4. Phone link: `<a href="tel:+40761880406">0761 880 406</a>` (split for readability per memory `user_contact.md`).

**Parallel paths:** None.

**Edge cases:**
- Footer enters palette stop 4 → body.fg-light kicks in → buttons styles must flip readable colors (handled by CSS in Task 4 via `body.fg-light .btn-wow` selectors).

---

### Task 22: SEO — metadata, JSON-LD, sitemap, robots, manifest, favicon, OG image

**Why:** Awwwards judges + Google. Per design doc §11.

**Reference:** Use the scratch note captured during Task 1's PRE-DELETE PORT STEP (the ported shape of `app/[locale]/_lib/jsonLd.ts`) as the structural starting point for the Person JSON-LD here. Do not re-invent the schema.

**Files:**
- `app/layout.tsx` (extend `metadata` export from Task 3 stub)
- `app/lib/structured-data.ts` (new)
- `app/sitemap.ts` (update)
- `app/robots.ts` (update)
- `app/manifest.ts` (update palette colors)
- `app/icon.tsx` (rewrite to render CC monogram)
- `app/opengraph-image.tsx` (new — generated dynamically with `ImageResponse`)
- `public/humans.txt` (new, OPTIONAL — see step 8 / Finding 10)
- `public/.well-known/security.txt` (new, OPTIONAL — see step 8 / Finding 10)

**Changes:**
1. **`metadata`** in layout.tsx:
   ```ts
   export const metadata: Metadata = {
     metadataBase: new URL('https://claudiucomsa.com'),
     title: { default: 'Claudiu Comșa — Web Developer din Constanța', template: '%s · Claudiu Comșa' },
     description: 'Construiesc site-uri și experiențe digitale cinematice. Web developer freelance din Constanța. Disponibil pentru proiecte noi.',
     openGraph: {
       type: 'website', locale: 'ro_RO', siteName: 'Claudiu Comșa',
       url: 'https://claudiucomsa.com',
       title: 'Claudiu Comșa — Web Developer din Constanța',
       description: '...',
     },
     twitter: { card: 'summary_large_image' },
     alternates: { canonical: '/' },
     robots: { index: true, follow: true },
   };
   ```
2. **structured-data.ts** exports a `<PersonJsonLd />` React component that renders `<script type="application/ld+json">` with the Person schema from design doc §11 (name, jobTitle, address Constanța, telephone `+40761880406`, knowsAbout, areaServed). Use the ported reference shape from Task 1. Inject in layout body.
3. **`app/sitemap.ts`** — single entry for `/` with `lastModified: new Date()`, `changeFrequency: 'monthly'`, `priority: 1`.
4. **`app/robots.ts`** — allow all, point to sitemap.
5. **`app/manifest.ts`** — update `theme_color: '#f3eee4'`, `background_color: '#1c1a16'`, name + short_name + description in RO, icon path `/logo-cc.jpg`.
6. **`app/icon.tsx`** — use Next.js Edge runtime + `ImageResponse` to render a 32x32 CC monogram (text "CC" in Geist 700, dark on cream). **Add `export const runtime = 'edge'`** at top of file.
7. **`app/opengraph-image.tsx`** — new dynamic OG image.
   - **FIRST sub-step (mandatory):** `git rm app/opengraph-image.png` — remove the existing static OG image BEFORE adding the dynamic component. Both `opengraph-image.png` and `opengraph-image.tsx` in the same directory is undefined Next.js routing behavior; the static PNG likely wins and silently shadows the dynamic component.
   - Then create `app/opengraph-image.tsx`: `ImageResponse` (1200x630) with CC monogram + name + tagline against the cream palette. **Add `export const runtime = 'edge'`** at top of file.

8. **Optional craft additions (RECOMMENDED — ~5 min total, signals professionalism to Awwwards judges).** Skip if time-pressed; not blocking.
   - Create `public/humans.txt` with credits + tech stack notes (RO comments). Format:
     ```
     /* TEAM */
     Claudiu Comșa - Web developer - ro
     From: Constanța, Romania
     Contact: cristian.ceamatu@assist.ro

     /* SITE */
     Last update: <date>
     Language: Romanian
     Standards: HTML5, CSS3, ES2024
     Components: Next.js 16, React 19, Three.js, GSAP, Lenis
     ```
   - Create `public/.well-known/security.txt` with email contact + expiry. Format:
     ```
     Contact: mailto:cristian.ceamatu@assist.ro
     Expires: 2027-05-31T23:59:59.000Z
     Preferred-Languages: ro, en
     ```
   - Both files served as static assets — no Next.js routing involvement. Scope-flexible.

**Parallel paths:** None.

**Edge cases:**
- `ImageResponse` cannot use Geist via `next/font` directly — must inline a base64 font or use system fonts. Use a system fallback for the OG image (Helvetica) since the visual is for unfurls and consistency isn't critical.
- Edge runtime is required for `ImageResponse` performance + cost. Without `export const runtime = 'edge'`, Next.js may fall back to Node runtime and add cold-start latency.

---

### Task 23: Compose home page

**Why:** Final wiring. The `app/page.tsx` renders all sections in order.

**Files:**
- `app/page.tsx` (full rewrite)

**GLOBAL NOTE — Client component declaration (addresses Round 3 Finding 3).** Every component file under `app/components/` and `app/components/sections/` (including `app/components/sections/projects/`) MUST start with `'use client'` as the very first line, before any imports. All of them use `useEffect`, `useState`, `useRef`, or GSAP — all client-only APIs that crash at SSR time without the directive.

**Server components (no `'use client'` directive) are ONLY:**
- `app/page.tsx` (Task 23 — pure JSX composition, no hooks)
- `app/layout.tsx` (Task 3 — uses `next/font` which is server-side, no hooks)
- `app/lib/structured-data.ts` (Task 22 — `<PersonJsonLd />` renders inert `<script>` tag, no hooks)
- `app/icon.tsx`, `app/opengraph-image.tsx` (Task 22 — Edge runtime `ImageResponse` route handlers)
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts` (Task 22 — Next.js metadata route handlers)

**Lib files in `app/lib/`** are typically non-component pure modules (`scroll-palette.ts`, `three-init.ts`, shader strings, projects-data.ts) and do NOT need the directive. **`app/lib/scroll-palette-context.tsx` is the exception** — it owns React state + a `useEffect`, so it MUST start with `'use client'` (already noted in Task 5 step 4).

Apply this check during implementation: if a component file imports from `react` (hooks), `gsap`, `three`, or `lenis`, OR uses `useEffect/useState/useRef/useContext`, it is a client component and MUST declare so.

**Changes:**
1. Server component (no `'use client'`). All sections handle their own client wiring per the GLOBAL NOTE above.
2. Render order:
   ```tsx
   <main>
     <Hero />
     <Manifesto />
     <ProjectsHeader />
     <P1Banciu /> <P2Aurasjobs /> <P3Stereocad /> <P4Confidential /> <P5Atelier />
     <Studio />
     <Story />
     <Footer />
   </main>
   ```
3. Mount `<PersonJsonLd />` at top of layout body (Task 22).
4. **Final ScrollTrigger refresh after all sections mount (NEW, addresses Round 3 Finding 4).** Per-section pins (Tasks 16/17/18) register at component-mount time. With Next.js `next/dynamic` for Tasks 11/12, font swap timing via `display: 'swap'`, and async child rendering, pins can register against stale layout positions BEFORE downstream sections have laid out — causing pin trigger end positions to miss their intended scroll ranges.

   Implementation lives in `LenisProvider` (Task 6) — co-located with the existing `ScrollTrigger.update` wiring. The provider runs a one-time effect that:
   ```ts
   useEffect(() => {
     let cancelled = false;
     (async () => {
       await document.fonts.ready;             // (a) Geist swap complete
       await new Promise(r => requestAnimationFrame(r)); // (b) one paint tick after fonts settle
       if (cancelled) return;
       ScrollTrigger.refresh(true);            // (c) recalibrate all pin trigger end positions
     })();
     return () => { cancelled = true; };
   }, []);
   ```
   - The `await document.fonts.ready` waits for Geist + Geist Mono load to complete (layout shifts settle as glyph widths change).
   - The `requestAnimationFrame` tick lets next/dynamic-injected three.js canvases and any remaining hydration-time layout flushes complete.
   - `ScrollTrigger.refresh(true)` recomputes every registered trigger's start/end. The `true` arg forces a hard refresh that re-evaluates pin spacers.
   - **Historical precedent:** the previous "Cinematic Blue Explorer" site shipped commit `813adeb fix(intro): ScrollTrigger.refresh after dismiss so S2/S3/Story triggers recalibrate` as a retroactive fix for exactly this class of bug. Bake the refresh in at greenfield time instead of waiting for it to manifest.
   - **Alternative co-location:** if `LenisProvider` becomes cluttered, extract a separate `<ScrollOrchestrator />` component mounted in `app/layout.tsx` (sibling of `<LenisProvider>`'s children) that owns ONLY this refresh effect. Both placements work; defer to LenisProvider unless it grows unwieldy.

**Parallel paths:** None.

**Edge cases:**
- Verify no client-component import accidentally pulls a server-only API.

---

### Task 24: Mobile parity pass

**Why:** Hard requirement per memory `feedback_mobile_parity.md`. Most traffic is phone.

**Files:**
- Touch every section component to verify mobile behavior; usually adjusting CSS in globals or section module.

**Changes (verification matrix):**
1. **Hero condense** — measures correctly against the mobile nav CC position. Adjust scale target if hero font on mobile renders too small.
2. **Shader background** — `setPixelRatio(1.25)` on mobile, reduce noise complexity if `<768px` (lower `octaves` or `time` multiplier).
3. **Icosahedron** — hidden via CSS `display: none` on `<900px`.
4. **P1 horizontal** — `matchMedia('(max-width: 767px)')` swaps to native overflow-x scroll, removes pin.
5. **P3 split** — stacks to single column; cube becomes 70vh sticky (CSS handles).
6. **Custom cursor** — hidden via `@media (hover: none)`; default cursor restored.
7. **Magnetic buttons** — magnetic effect disabled on touch (skip pointer-move listener if `'ontouchstart' in window`).
8. **Story** — photo placeholder stacks below text.
9. **Sound toggle** — verify tap targets ≥44px.
10. **Run on actual device**: iPhone Safari + Android Chrome via DevTools remote inspection if local device available.
11. **Task 12b promotion test (CONCRETE — replaces prior vague "if memory pressure" trigger):**

    On a real iPhone 12 or older (or a BrowserStack equivalent — iPhone 12 minimum), with iOS Safari Web Inspector attached:
    - (a) Open Memory tab in Web Inspector. Scroll the page top-to-bottom 3 full cycles. **PROMOTE Task 12b if JS heap grows by more than 150MB across the 3 cycles** (steady-state leak indicator, not transient allocation).
    - (b) Watch the console for `webglcontextlost` events on either canvas during normal scrolling. **PROMOTE Task 12b if a `webglcontextlost` event fires on either canvas.**
    - (c) Tab-switching pressure test: open 2 other tabs in Safari (Maps, YouTube) to evict GPU memory, then return to the portfolio tab. **PROMOTE Task 12b if the shader background renders black OR the icosahedron freezes after returning.**

    If ANY of (a), (b), (c) triggers, implement Task 12b (single `WebGLRenderer` with scissor+viewport for the two scenes) BEFORE Task 25 ships. If all three pass, leave Tasks 11 + 12 with separate renderers as designed.

**Parallel paths:** None.

**Edge cases:**
- iOS Safari 100vh issue — use `100dvh` for hero min-height.
- iOS Safari `position: sticky` inside `transform-style: preserve-3d` parent fails sometimes — verify P3 still pins.

---

### Task 25: prefers-reduced-motion + WebGL fallback + Browser matrix + Lighthouse CI

**Why:** Accessibility, resilience, Core Web Vitals, and explicit cross-browser verification.

**Files:**
- `app/globals.css` (append `@media (prefers-reduced-motion: reduce)` block)
- `app/components/ShaderBackground.tsx` (add WebGL availability check + CSS fallback branch)
- `app/components/IcosahedronScene.tsx` (add WebGL availability check — skip mount if unavailable)
- `.lighthouserc.json` (new — Lighthouse CI budget config)
- Touch components that have motion to add JS-side checks

**Changes:**
1. **CSS:** zero out animation durations + disable `scroll-behavior: smooth` (Lenis already off in this mode).
2. **JS:** each component reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` once on mount. If true:
   - Skip Lenis init (use native scroll)
   - Skip cursor RAF (hide cursor entirely)
   - Skip icosahedron rotation (render single frame)
   - Skip shader RAF (single render)
   - Skip hero condense (just show nav CC immediately, full hero name remains static)
   - Skip transition flash
3. **NEW — WebGL availability fallback** (in `ShaderBackground.tsx` mount):
   ```ts
   const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
   if (!gl) {
     // No WebGL — render a CSS-only animated gradient div as fallback
     // The div still subscribes to scroll palette via plain RAF:
     //   div.style.background = `linear-gradient(135deg, rgb(${base.r*255},...), rgb(${accent.r*255},...))`;
     // Keeps the palette-shift visual intent without GPU.
     mountCssFallback();
     return;
   }
   ```
   For `IcosahedronScene.tsx`: same `gl` check; if null, simply return null (icosahedron is decorative, page survives without it).
4. **NEW — Browser test matrix (explicit checklist, must all pass before sign-off):**
   - [ ] Safari macOS latest — full page scroll, hero condense, shader, icosahedron, all project sections
   - [ ] Safari iOS 17+ — same, on real device if available; BrowserStack or comparable if not
   - [ ] Chrome desktop latest — same
   - [ ] Chrome Android latest — same, real device or DevTools remote inspection
   - [ ] Firefox desktop latest — smoke pass (not a release blocker, but log any breakage)
   Real iOS Safari is the highest priority because of WebGL context limits + sticky/preserve-3d quirks. BrowserStack or a real iPhone is preferred over the desktop Safari Responsive Design Mode.
5. **NEW — Lighthouse CI config.** Create `.lighthouserc.json`:
   ```json
   {
     "ci": {
       "collect": {
         "url": ["http://localhost:3000/"],
         "numberOfRuns": 3,
         "settings": { "preset": "desktop" }
       },
       "assert": {
         "assertions": {
           "categories:performance": ["error", { "minScore": 0.9, "aggregationMethod": "median" }],
           "categories:accessibility": ["error", { "minScore": 1.0 }],
           "categories:seo": ["error", { "minScore": 1.0 }],
           "categories:best-practices": ["warn", { "minScore": 0.95 }]
         }
       },
       "upload": { "target": "temporary-public-storage" }
     }
   }
   ```
   Add a mobile preset variant (separate file or override) with `minScore: 0.9` for Performance. Document running locally via `npx lhci autorun`. CI integration deferred.
6. **Optimize:** image sizes (run `sharp` on `/public/projects/*.jpg` → AVIF/WebP); preload Geist font; check LCP target = hero name SVG/text.

**Parallel paths:** None.

**Edge cases:**
- Geist font from `next/font` is preloaded by default. Verify in network tab.
- WebGL fallback must still respect `prefers-reduced-motion` (skip the palette-shift RAF in that case too).

---

### Task DEFERRED-1: Case studies `/work/[slug]` (or `/lucrari/[slug]`)

Per project case study pages with View Transitions API entry/exit. Decided after URL slug language is locked with user.

### Task DEFERRED-2: Real ambient audio

Wire `<audio>` element to sound toggle. Asset TBD.

### Task DEFERRED-3: Production deploy

Merge `feature/chromatic-drift-2026` to `main`, push to remote. User explicitly gates this — do NOT auto-merge or auto-push.

---

## Implementation Order

Strict order. Each task depends on the previous unless noted.

1. Task 1 — Demolition (standalone; includes `proxy.ts` deletion + JSON-LD reference port-step)
2. Task 2 — Dependencies (depends on 1: deleted imports gone before npm install runs cleanly). Sub-step order: edit `next.config.ts` FIRST, then uninstall, then ONE combined install, then verify `gsap/SplitText`.
3. Task 3 — Layout rewrite (depends on 2)
4. Task 4 — Global CSS (parallelizable with 3 but order in same commit)
5. **Task 6 — LenisProvider update (depends on 3) — RUN BEFORE Task 5** so the LenisProvider component exists for layout wrapping. (Swapped from previous order.)
6. **Task 5 — Scroll palette context (depends on 3, 4, 6) — provider goes INSIDE Task 6's `<LenisProvider>` in `app/layout.tsx`.** This task now also owns the `navCCVisible` shared state used by Hero → Nav handoff.
7. Tasks 7–10 — Shared chrome stubs filled (depend on 3, 4; can run in parallel)
8. Tasks 11, 12 — Background scenes (depend on 5). Decide on Task 12b deferral — default: defer to Task 24.
9. Task 14 — MagneticButton (no deps beyond 4) — implement BEFORE Task 13 since hero needs it
10. Task 13 — Hero (depends on 14, 5, 6). Uses rAF-deferred SplitText pattern + NFC Romanian assertion + `setNavCCVisible(true)` for CC handoff.
11. Task 15 — Manifesto (depends on 4, 5). Reuses Task 13's SplitText SSR pattern + NFC assertion.
12. Tasks 16–18 — Projects 1–3 (depend on 4, 5; can run in parallel)
13. Task 19 — Projects 4–5 (depends on 4, 5). Reuses Task 13's SplitText SSR pattern + NFC assertion in P4.
14. Task 20 — Studio + Story (depends on 4, 5)
15. Task 21 — Footer (depends on 14, 4)
16. Task 22 — SEO (depends on 3, 21 for phone in JSON-LD). Uses the Task 1 ported JSON-LD reference. Both `app/icon.tsx` and `app/opengraph-image.tsx` get `export const runtime = 'edge'`.
17. Task 23 — Compose home (depends on all sections)
18. Task 24 — Mobile parity (depends on 23). Re-decide on Task 12b based on real iOS Safari behavior.
19. Task 25 — Reduced motion + WebGL fallback + Browser matrix + Lighthouse CI (depends on 24)

**Suggested commit cadence:** one commit per task, except Tasks 7-10 (shared chrome) and Tasks 16-18 (projects 1-3) can each ship as one commit grouping their parallel components.

## Verification

After each task:
1. `npm run lint` — see broken-window rules below
2. `npm run build` — see broken-window rules below
3. `npm run dev` + manual smoke test of the affected section in browser

**Broken-window expectations:**
- Tasks 1 + 2: BOTH lint and build expected to FAIL on import-resolution errors (intentional — old imports gone, new ones not yet wired).
- Task 3: build passes ONLY IF stubs for Tasks 5-12 are created per the stub strategy above. Without stubs, layout imports non-existent modules.
- Tasks 4+: lint and build must pass after every task. If they don't, fix before proceeding.

Task-specific verification gates:
- **Task 2:** `node -e "require('gsap/SplitText')"` exits 0; `next.config.ts` parses without `next-intl/plugin` import.
- **Task 11:** **Visual side-by-side diff** — open `previews/chromatic-drift/index.html` and the new component in adjacent browser windows. Hero shader background must look pixel-close to the mockup. If divergence (more saturated / darker / color cast), revisit color-space handling.
- **Task 13 / 15 / 19:** Dev console.assert that `split.chars.length === [...fullName].length` (codepoint-aware). Failure means NFC normalization was lost in the build pipeline — investigate before proceeding.
- **Task 13:** No React 19 hydration mismatch warning in console on first load (rAF-deferred SplitText pattern verified).

After Task 23 (full assembly):
1. Full single-page scroll-through in Chrome — every section renders, every animation fires, no console errors
2. Same in Safari (WebKit quirks)
3. DevTools mobile emulation (iPhone 14 Pro + Pixel 7) — every Task 24 checklist item

After Task 25:
1. **Browser test matrix from Task 25 step 4** — all checkboxes ticked, especially real iOS Safari.
2. **Lighthouse CI run via `npx lhci autorun`** — assertions in `.lighthouserc.json` pass: Performance ≥ 90 mobile / ≥ 95 desktop, A11y = 100, SEO = 100, Best Practices ≥ 95.
3. **WebGL fallback verified** — disable WebGL in browser flags (Chrome `chrome://flags`, `#disable-webgl`) and confirm: shader background shows CSS gradient fallback with palette shift, icosahedron is hidden, page is otherwise fully functional.
4. `prefers-reduced-motion: reduce` system flag in DevTools — verify motion disabled
5. axe DevTools scan — zero violations

## Next Step

Plan hardened by `/plan-review-loop` across 3 review rounds + 2 stability passes. See Implementation Brief below. Ready for `/implement .claude/plans/chromatic-drift-portfolio.md`.

---

## Implementation Brief

> Auto-generated by /plan-review-loop after 3 review rounds + 2 stability passes (33 findings reviewed, 30 fixed in plan, 3 absorbed as advisory notes).
> Provides pre-gathered context so the implementation agent can execute without redundant codebase exploration.

### Repo facts (verified)
- Working dir: `C:\Users\comsa\claudiu-dev-portofoliu`
- Branch: `feature/chromatic-drift-2026` (off `main@9769f4f`)
- Local backup tag: `archive/v1-cinematic-blue` on `9769f4f` (NOT pushed to remote — user gates)
- Design doc: `docs/plans/2026-05-31-chromatic-drift-design.md`
- HTML mockup (spec of record): `previews/chromatic-drift/index.html` (1486 lines, committed `ca7618c`)

### Memory files implementer MUST consult
- `feedback_node_modules_corruption.md` — drives Task 2 step 2a (nuke node_modules)
- `feedback_branching_workflow.md` — already on right branch
- `feedback_mobile_parity.md` — HARD requirement, drives Task 24
- `feedback_site_language_ro_only.md` — RO only
- `feedback_color_palette.md` — 4-stop palette spec (updated 2026-05-31)
- `user_contact.md` — phone `0761880406` for footer + JSON-LD
- `project_new_site_2026_rebuild.md` — current state

### Current package.json (verified)
- `next: ^16.1.3` → bump `16.2.6` (T2)
- `react: ^19.2.3` → keep
- `gsap: ^3.15.0` → keep (free SplitText included)
- `lenis: ^1.3.23` → keep (deprecated `smoothTouch` already removed in existing LenisProvider)
- `tailwindcss: ^4` + `@tailwindcss/postcss: ^4` → keep (stable)
- UNINSTALL: `framer-motion@^12.38.0`, `next-intl@^4.12.0`, `react-icons@^5.6.0`, `lucide-react@^1.7.0`
- ADD: `three@^0.184.0`, `@types/three@^0.184.0` (dev), bump `eslint-config-next@16.2.6`

### Files to DELETE (T1 — all verified to exist)
- `proxy.ts` (imports `next-intl/middleware` line 1-2 — Critical, breaks build if missed)
- `app/components/AtmosphericGlow.tsx`, `BackToTop.tsx`, `ContactForm.tsx`, `EffectButton.tsx`, `Footer.tsx`, `IntroAnimation.tsx`, `LanguageSwitcher.tsx`, `MetricGrid.tsx`, `Navbar.tsx`, `PageTransition.tsx`, `SocialBlock.tsx`
- `app/components/sections/` (recursive — contains Hero/Projects/Story/Contact.tsx)
- `app/lib/intro-state.ts`
- `app/[locale]/` (recursive — contains layout.tsx, not-found.tsx, page.tsx, _lib/jsonLd.ts, services/page.tsx, projects/page.tsx, projects/_data/cases.ts, projects/[slug]/page.tsx, projects/[slug]/_components/CaseStudy.tsx)
- `i18n/` (recursive — routing.ts, request.ts, navigation.ts)
- `messages/` (recursive — translation JSON)
- `public/hero/cave-explorer.png`
- `app/opengraph-image.png` (deleted in T22 alongside dynamic .tsx creation)

Before deleting `app/[locale]/_lib/jsonLd.ts`: open + scratch-note the Person schema pattern (T22 will reference).

### Files to KEEP (touched but not deleted)
`app/layout.tsx` (rewrite T3), `app/page.tsx` (rewrite T23), `app/globals.css` (rewrite T4 — current uses `@theme inline` ✓), `app/manifest.ts` (T22), `app/robots.ts` (T22), `app/sitemap.ts` (T22), `app/icon.tsx` (T22), `app/components/LenisProvider.tsx` (T6), `next.config.ts` (T2), `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `public/logo-cc.jpg`, `public/projects/*.jpg`.

### Per-task implementation notes

**T1 — Demolition.** Use recursive deletes: `git rm -rf "app/[locale]"` (quote brackets on Windows bash) + `git rm -rf app/components/sections/` + `git rm -rf i18n/ messages/`. Then `git rm` top-level component files + `proxy.ts` + `public/hero/cave-explorer.png`. `git status` after. Build/lint expected to FAIL.

**T2 — Deps.** ORDER: (a) edit `next.config.ts` first — remove `next-intl/plugin` import + `withNextIntl` wrap, drop `worker-src 'self' blob:`, drop Formspree + Fontshare CSP entries. (b) `npm uninstall framer-motion next-intl react-icons lucide-react`. (c) `rm -rf node_modules package-lock.json` (avoids 30GB SWC panic per memory). (d) `npm install next@16.2.6 react@19.2.3 react-dom@19.2.3 three@^0.184.0 eslint-config-next@16.2.6 -E && npm install -D @types/three@^0.184.0`. (e) Verify `node -e "require('gsap/SplitText')"` exits 0. Build/lint still expected to FAIL.

**T3 — Layout.** Font vars: `--font-geist-sans` + `--font-geist-mono` (existing convention). Stub strategy: provider stubs (LenisProvider, ScrollPaletteProvider) must `return <>{children}</>`; non-provider stubs `return null`. Wrap order: `<LenisProvider><ScrollPaletteProvider>{children}</ScrollPaletteProvider></LenisProvider>`. After this task, build PASSES (if stubs created correctly).

**T5 — Scroll palette.** `scroll-palette.ts` exports tuples (pure data, no three). `scroll-palette-context.tsx` FIRST line: `import '@/app/lib/three-init';` THEN `import * as THREE from 'three'`. Refs: `useRef(new THREE.Color())`. Mutate via `.setRGB(...next.base)`. LOCKED return: `{ progressRef, baseRef, accentRef, navCCVisible, setNavCCVisible }`. NO `setProgress` per frame. Body class toggle guarded by threshold-cross check.

**T6 — Lenis.** Current file pattern (omits `smoothTouch`, uses `wheelMultiplier`/`touchMultiplier`) is correct — start from it. DO NOT port `smoothTouch: false` from mockup. Owns final `ScrollTrigger.refresh(true)` orchestrator after `document.fonts.ready` + rAF (Round 3 F4 — prevents pin misalignment).

**T11 — Shader.** `import '@/app/lib/three-init';` first. Color contract: `THREE.ColorManagement.enabled = false` (set in three-init) + `renderer.outputColorSpace = THREE.LinearSRGBColorSpace`. DO NOT also call `.convertSRGBToLinear()` on palette colors — Option A only. Visual diff gate: side-by-side with mockup. Listen for `webglcontextlost`/`webglcontextrestored`.

**T12 — Icosahedron.** Same color contract as T11. Same context-loss handling. Hide on `<900px` mobile via CSS.

**T13 — Hero.** FOUC strategy Option A: CSS defaults `.hero-name, .hero .eyebrow, .hero .hero-sub, .hero .hero-bio, .hero .scroll-hint, .hero .btn-wow { opacity: 0; }`. On mount: `gsap.registerPlugin(SplitText, ScrollTrigger)`, rAF-deferred SplitText, flip wrapper opacity to 1, THEN `gsap.to(els, { opacity: 1, y: 0, delay: 2.6, stagger: 0.08, ... })`. NFC assertion: `console.assert(split.chars.length === [...fullName].length)`. CC handoff via `setNavCCVisible(true)` from context (NOT DOM custom event).

**T15 + T19 (P4).** Reuse T13's rAF + NFC + FOUC patterns. T19 Step 2 (P5) does NOT need any of this — CRT glitch is markup-static.

**T16-18 — Projects.** P3 iOS check: `.p3-pin` (sticky) must NOT be a descendant of `preserve-3d` (cube wrapper). Verify layout assumption before iOS smoke test.

**T22 — SEO.** FIRST step: `git rm app/opengraph-image.png`. Both `app/icon.tsx` + new `app/opengraph-image.tsx` need `export const runtime = 'edge'`. PersonJsonLd uses phone `+40761880406`, address Constanța România. Optional craft adds: `public/humans.txt` + `public/.well-known/security.txt`.

**T23 — Compose.** **`'use client'` mandate:** every file under `app/components/` and `app/components/sections/` starts with `'use client'`. Server components ONLY: `app/page.tsx`, `app/layout.tsx`, `app/lib/structured-data.ts`, `app/icon.tsx`, `app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`. `scroll-palette-context.tsx` is the lone lib exception — needs `'use client'`.

**T24 — Mobile.** T12b promotion gate: iPhone 12 Safari Web Inspector Memory tab, scroll 3× top-to-bottom. Promote if heap >150MB OR `webglcontextlost` fires OR tab-eviction blackout.

**T25 — Reduced motion + Lighthouse + WebGL fallback.** WebGL availability check: if no `webgl2|webgl` context, fall back to CSS-only animated gradient div. `.lighthouserc.json` budgets enforced via `npx lhci autorun`.

### Cross-task invariants
- One commit per task minimum (group T7-10 + T16-19 only if justified).
- Commit format: `type(scope): short description` + `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- HTML mockup is visual spec of record — match pixel/animation-perfect.
- Mobile parity: NO "looks broken on phone" tolerated.
- NEVER push to remote without user approval.
- NEVER merge to `main` without explicit user gate.
- NEVER push archive tag without user approval.

### Review loop summary
- Round 1: 15 (1 Critical, 9 Important, 5 Advisory) — all fixed
- Round 2: 11 (2 Critical, 4 Important, 5 Advisory; 1 regression from R1 F7) — all fixed
- Round 3: 4 (0 Critical, 2 Important, 2 Advisory) — all fixed
- Stability 1: 3 (0 Critical, 1 Important, 2 Advisory) — all fixed
- Stability 2: 0 — STABLE

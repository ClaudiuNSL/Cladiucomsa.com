# Cinematic Blue Explorer — Redesign Hero & Navbar

**Data:** 2026-05-26
**Branch curent:** `feature/asteroid-shatter-effects` (creăm branch nou pentru implementare)
**Status:** Design lockat, gata pentru `writing-plans`

## Context

Site-ul actual e pe direcția cinematic monocrom dark (poză profil + 3D scene eliminat în commit `3dde316`). User vrea:

- Păstrăm modelul existent (3 secțiuni Hero stacked, side rails, counters, watermark giant pe Projects, EffectButton cu shatter, Story, Contact, Footer).
- Schimbăm paleta + Hero Section 1 + Navbar pentru un wow-effect.
- Hero nou inspirat dintr-o imagine de peșteră vastă cu siluetă explorator privind munți înzăpeziți (oferită de user) — paletă rece, albastru-gheață, navy profund.

Punct ancoră: copy-ul e personal, conversațional ("Sunt Claudiu Comșa..."), nu corporate.

## Direcție vizuală — "Cinematic Blue Explorer"

Negru aproape-navy ca bază, accent unic ice-blue / cool steel. Atmosfera: vast, contemplativ, "stă în pragul a ceva mare". Zero saturat, zero magenta/portocaliu — rămâne aproape monocrom dar cu un *hue family* rece.

## Tokens de culoare

```css
--bg-deep:      #07090f;   /* navy-aproape-negru, fundalul principal */
--bg-base:      #0a0d14;   /* gradient overlay peste imaginea Hero */
--bg-elev:      #11151e;   /* surfaces in sectiuni 2+ */
--text-primary: #ffffff;   /* H1/H2/H3 focal, primary CTA */
--text-soft:    #cfe3ff;   /* ice blue — eyebrow, strip servicii */
--text-mid:     #9eb2c8;   /* cool steel — paragraf */
--text-quiet:   #5a6678;   /* rails, labels mici, contoare secundare */
--accent:       #7aa7d9;   /* cool steel-blue — hover, indicators, progress bar */
--border-soft:  rgba(207, 227, 255, 0.08);
--border-hair:  rgba(207, 227, 255, 0.04);
```

Convențiune migrare: oriunde apare `text-white` pe text *secundar* → `text-[var(--text-soft)]`. Alb pur rămâne **doar** pe H1/H2/H3 focal și pe primary CTA. Toate `border-white/[0.06–0.08]` → `border-[var(--border-soft)]`. Toate `bg-[#050505]` → `bg-[var(--bg-deep)]`.

## Tipografie

- **Sans (UI + H1 bold):** Geist Sans / Inter (deja în stack).
- **Serif italic accent:** **Fraunces** (Google Fonts) — folosit *exclusiv* pe cuvântul-accent ("*Transform*", "*turn*"). Adăugăm la `app/layout.tsx` cu `next/font/google`.

Scale:
- H1: `text-5xl` mobile → `text-7xl` lg → `text-8xl` xl, `leading-[0.95]`, `tracking-[-0.04em]`.
- Eyebrow + strip servicii: `text-[10px]` uppercase, `tracking-[0.32em]`.
- Paragraf: `text-base` → `text-lg`, `leading-[1.65]`, `text-[var(--text-mid)]`.

## Copy lockat

### Hero Section 1 (RO)

**Eyebrow:** `FULL-STACK WEB DEVELOPER · ROMÂNIA`

**H1** (2 linii, sans bold + serif italic pe "Transform"):
> Sunt **Claudiu Comșa**.
> *Transform* ideile în proiecte digitale reale.

**Paragraf:**
> Te-ai făcut cunoscut local. Pasul următor e să fii vizibil online — cu un brand care funcționează la fel de bine în România și oriunde altundeva.

**Strip servicii** (all-caps, separat cu `·`):
> SITE-URI DE PREZENTARE · MAGAZINE ONLINE · AUTOMATIZĂRI · OPTIMIZĂRI · SEO & CREȘTERE ONLINE

**CTA pair:**
- Primary: `HAI SĂ VORBIM →` (link către `#contact` sau `/contact`)
- Secondary: `Vezi proiecte` (link către `#projects`)

### Hero Section 1 (EN)

**Eyebrow:** `FULL-STACK WEB DEVELOPER · ROMANIA`

**H1:**
> I'm **Claudiu Comșa**.
> I *turn* ideas into real digital products.

**Paragraf:**
> You've made a name locally. The next step is being visible online — with a brand that works as well in Romania as anywhere else.

**Strip servicii:**
> WEBSITES · E-COMMERCE · AUTOMATION · OPTIMIZATION · SEO & GROWTH

**CTA:** `LET'S TALK →` / `See projects`

## Hero Section 1 — compoziție

- Fundalul: imaginea oferită de user (`ChatGPT Image May 26, 2026, 09_29_29 PM.png`) — peșteră imensă, munți înzăpeziți, siluetă centrală. Salvată ca `/public/hero/cave-explorer.jpg` (asset pipeline: copiem PNG-ul, convertim la JPG comprimat ~80% pentru web).
- `next/image` cu `fill`, `priority`, `sizes="100vw"`, `object-cover`, `object-position: center 35%` (păstrăm silueta vizibilă).
- **Imaginea apare DOAR la Hero Section 1.** După aia, fundalul devine `var(--bg-deep)` solid prin restul site-ului.

Layer-uri suprapuse peste imagine (de jos în sus):
1. `bg-gradient-to-r from-[var(--bg-deep)] via-[var(--bg-deep)]/40 to-transparent` — lizibilitate text stânga.
2. `bg-gradient-to-t from-[var(--bg-deep)] via-transparent to-transparent` — vignette jos.
3. Grain noise SVG inline pattern, opacity 0.025, `mix-blend-mode: overlay` — textura cinematic.

Text overlay:
- Layout: stânga-jos pe desktop (`items-end justify-start`), centru pe mobile.
- Padding: `px-8 pb-32 lg:px-16 lg:pb-24`.
- Max-width: `max-w-2xl` (~640px).
- Ordine verticală: Eyebrow → H1 → divider 1px → Paragraf → Strip servicii → CTA pair.

Side rails:
- Stânga: `WEB · AI · CINEMATIC` (păstrat) sau cleanup la `SITES · AI · 3D`.
- Dreapta: `MENU · WORK · STUDIO · NETWORK` (păstrat).
- Culoare: `text-[var(--text-quiet)]`, separator dots `bg-[var(--text-soft)]/20`.

## Hero Sections 2 & 3 (Work + Studio)

Structura intactă. Doar:
- Background: `var(--bg-deep)` solid (fără imagine).
- Toate `text-white` secundare → `text-[var(--text-soft)]`.
- Toate `text-zinc-400` → `text-[var(--text-mid)]`.
- Toate `text-zinc-500` → `text-[var(--text-quiet)]`.
- `bg-white/10` divider → `bg-[var(--border-soft)]`.

## Navbar — redesign

```
[ • CLAUDIU COMȘA ]   [ WORK · ABOUT · CONTACT ]   [ RO|EN ]   [ HAI SĂ VORBIM → ]
══════ progress bar 1px ice-blue, scaleX după scroll ══════
```

Structură detaliată:

1. **Stânga (wordmark):**
   - Dot alb `h-1.5 w-1.5 rounded-full bg-white` cu pulse animation (CSS keyframes `pulse-soft`: opacity 0.6 → 1 → 0.6, 3s ease-in-out infinite).
   - Text `CLAUDIU COMȘA`, `text-[11px] uppercase tracking-[0.24em] text-white`.

2. **Mijloc (linkuri inline — DESKTOP only, ascuns pe mobile):**
   - 3 link-uri: `Work` → `#projects`, `About` → `#story`, `Contact` → `#contact`.
   - Style: `text-[11px] uppercase tracking-[0.24em] text-[var(--text-quiet)] hover:text-white transition-colors`.
   - Separator: middot `·` cu opacitate 0.4.

3. **Dreapta:**
   - `LanguageSwitcher` mic (păstrat cum e).
   - CTA `HAI SĂ VORBIM →` (i18n key `nav.cta`) — pill mic cu `border border-[var(--text-soft)]/30 text-white text-[10px] uppercase tracking-[0.24em] px-4 py-2 rounded-full`. Hover: `bg-[var(--text-soft)]/10 border-[var(--text-soft)]/60`.

4. **Progress bar scroll:**
   - Element separat `position: absolute; bottom: 0; left: 0; height: 1px; background: var(--accent); transform-origin: left; transform: scaleX(...)`.
   - JS: `scaleX = window.scrollY / (document.body.scrollHeight - window.innerHeight)` via `requestAnimationFrame` pe scroll.

5. **Pe scroll (`scrollY > 24`):**
   - Background `bg-[var(--bg-deep)]/80 backdrop-blur-xl border-b border-[var(--border-soft)]`.
   - Padding shrink `py-6 → py-4` (transition 500ms).

6. **Mobile:**
   - Linkurile mid se ascund (`hidden md:flex`).
   - Buton hamburger reapare (păstrăm overlay-ul fullscreen existent, dar repainted).

## Story / Projects / Contact / Footer

Structura intactă. Doar repaint:
- `bg-[#050505]` peste tot → `bg-[var(--bg-deep)]`.
- `text-white` non-focal → `text-[var(--text-soft)]`.
- `text-zinc-400/500/600` → `text-[var(--text-mid)] / text-[var(--text-quiet)] / text-[var(--text-quiet)]`.
- `border-white/[0.06-0.10]` → `border-[var(--border-soft)]`.
- Watermark numbers (Projects): `text-white/[0.025]` → `text-[var(--text-soft)]/[0.03]` (puțin mai vizibil pe blue dark).
- **EffectButton shatter** rămâne 100% identic — primary white, secondary border alb. Atrage atenția pe paleta rece. (Variant secondary border-ul devine `border-[var(--text-soft)]/25` opțional.)

## Motion language

Tot existing GSAP ScrollTrigger pattern rămâne. În plus:

- **Hero load (pe mount Section 1):**
  - Imagine: `opacity 0 → 1`, `scale 1.05 → 1`, duration `1.2s`, ease `expo.out`.
  - Eyebrow: fade-up `y: 16 → 0`, delay 0.2s, duration 0.8s.
  - H1 split per line: 2 linii cu mask reveal `clipPath: inset(0 0 100% 0) → inset(0)`, stagger 0.15s, duration 0.9s expo.out, delay 0.35s.
  - Paragraf → Strip → CTA pair: fade-up cascadat, stagger 0.1s, delay 0.85s.
  - Total: ~1.5s din mount până la full reveal.
- **Navbar wordmark dot pulse:** CSS animation independent (nu GSAP).
- **Navbar CTA hover:** Tailwind `transition-all duration-300` (border + bg).
- **Scroll progress bar:** event listener `scroll` cu `requestAnimationFrame` throttle.
- **prefers-reduced-motion:** dezactivează toate animațiile Hero load — totul apare instant la opacity 1.

## Asset pipeline

- Copiem `c:\Users\comsa\Desktop\ChatGPT Image May 26, 2026, 09_29_29 PM.png` în `public/hero/cave-explorer.jpg` (sau `.webp` dacă optimizăm).
- Generăm versiune comprimată ~80% calitate, dimensiune target sub 400KB pentru hero priority load.
- Adăugăm `next/font/google` pentru `Fraunces` în `app/layout.tsx`, exportăm CSS variable `--font-fraunces`, configurăm în `tailwind.config.ts` ca `font-serif`.

## i18n changes

`messages/ro.json` + `messages/en.json`:

- `cinematic.s1.eyebrow` → `FULL-STACK WEB DEVELOPER · ROMÂNIA` / `... ROMANIA`
- `cinematic.s1.title` → format Markdown-lite cu un placeholder pentru serif italic, sau două chei separate (`s1.titleLine1`, `s1.titleLine2WithAccent` + `s1.accentWord`).
- `cinematic.s1.body` → paragraful nou.
- `cinematic.s1.services` → array sau string separat cu `·` (RECOMANDARE: array, mai flexibil pentru render).
- `cinematic.s1.ctaPrimary` / `cinematic.s1.ctaSecondary` + href-uri.
- `nav.cta` → `HAI SĂ VORBIM` / `LET'S TALK`.
- `nav.links.work/about/contact` (noi).

## Out of scope (NU facem acum)

- Reconstrucție Story/Contact/Projects layouts.
- Re-themeing case studies pages (`/projects/[slug]`).
- Schimbare structură i18n routing.
- 3D scene return (a fost eliminat intenționat în `3dde316`).
- Schimbare typography stack (Geist Sans rămâne, doar adăugăm Fraunces).

## Acceptance criteria

- [ ] Hero Section 1 randează cu imaginea cave-explorer fullbleed, text overlay stânga-jos, lizibil pe ambele locale.
- [ ] Navbar are linkuri inline pe desktop, CTA dreapta, dot pulsează, progress bar la scroll, scrolled state cu blur.
- [ ] Toată paleta migrată — niciun `text-white` pe text secundar, niciun `bg-[#050505]` rămas.
- [ ] EffectButton shatter funcționează identic.
- [ ] Letter-reveal pe titluri Projects funcționează identic.
- [ ] Mobile: layout-ul tutror sectiunilor rămâne folosibil (hero Section 1 cu text centru, navbar cu hamburger, side rails ascunse / scaled).
- [ ] `prefers-reduced-motion`: toate animațiile Hero load se dezactivează.
- [ ] Lighthouse perf rămâne `> 85` mobile (imaginea hero comprimată sub 400KB).
- [ ] Build pass: `npm run build` fără erori TypeScript / ESLint.

## Branch & commit strategy

- Branch nou de la `main`: `feature/cinematic-blue-explorer` (nu construim peste `feature/asteroid-shatter-effects` care e o altă feature — păstrăm separat).
- Commit-uri mici, logice: tokens → font → assets → navbar → hero → repaint sections → motion polish.

---

**Next step:** invocăm `writing-plans` pentru a sparge design-ul în task-uri implementabile.

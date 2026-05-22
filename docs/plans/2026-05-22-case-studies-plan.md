# Case Studies Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship 3 case-study pages at `/[locale]/projects/[slug]` (6 SSG routes), a real `/projects` index, and matching nav/perf wiring.

**Architecture:** Server Components for routing + metadata, `next-intl` for copy, static `cases.ts` for non-translatable structural data. GSAP reveals match the existing `Story.tsx` pattern. No tests — this project has no test framework; verification is `npm run build` (TS + SSG) + `npm run lint` + manual browser smoke.

**Tech Stack:** Next.js 16 App Router (Turbopack), TypeScript strict, Tailwind v4, next-intl v4, GSAP ScrollTrigger, sharp (for image compression).

**Design ref:** `docs/plans/2026-05-22-case-studies-design.md`. Mockup at `mockup/case-study-preview.html` (delete in last task).

**Commit cadence:** Frequent. Each task ends in a commit unless explicitly grouped. All commits follow the existing `type(scope): subject` style.

---

### Task 1: Compress preview images PNG → JPEG

**Files:**
- Create: `public/projects/banciu-preview.jpg`, `aurasjobs-preview.jpg`, `stereocad-preview.jpg`
- Delete: `public/projects/banciu-preview.png`, `aurasjobs-preview.png`, `stereocad-preview.png`

**Step 1: Re-encode with sharp (mozjpeg q85)**

Run in bash:
```bash
node -e "
const sharp = require('sharp');
const files = ['banciu-preview', 'aurasjobs-preview', 'stereocad-preview'];
(async () => {
  for (const name of files) {
    await sharp(\`public/projects/\${name}.png\`)
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(\`public/projects/\${name}.jpg\`);
    const b = require('fs').statSync(\`public/projects/\${name}.png\`).size;
    const a = require('fs').statSync(\`public/projects/\${name}.jpg\`).size;
    console.log(name, (b/1024).toFixed(0)+'KB →', (a/1024).toFixed(0)+'KB');
  }
})();"
```

Expected: each file shrinks dramatically (banciu 2.5MB → ~200KB).

**Step 2: Visually verify the 3 JPEGs**

Use Read tool on each `.jpg` — confirm they render correctly (no banding, content intact).

**Step 3: Delete originals + commit**

```bash
rm public/projects/banciu-preview.png public/projects/aurasjobs-preview.png public/projects/stereocad-preview.png
git add public/projects/
git commit -m "perf(assets): preview images PNG → JPEG q85 (-90%)"
```

---

### Task 2: Make `CinematicScene3DLoader` path-aware

**Files:**
- Modify: `app/components/CinematicScene3DLoader.tsx`

**Step 1: Replace the component body**

```tsx
'use client';
// Wrapper client pentru CinematicScene3D. Renderizeaza scena 3D doar pe
// pagina home (/, /ro, /en) — case studies si alte rute interne nu au
// nevoie de 3D si platesc costul Draco worker degeaba.
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const CinematicScene3D = dynamic(
  () => import('@/app/components/CinematicScene3D'),
  { ssr: false, loading: () => null }
);

export default function CinematicScene3DLoader() {
  const pathname = usePathname();
  // Match exact: /, /ro, /en (cu sau fara trailing slash).
  const isHome = /^\/(ro|en)?\/?$/.test(pathname);
  if (!isHome) return null;
  return <CinematicScene3D />;
}
```

**Step 2: Run lint + build**

```bash
npm run lint && npm run build 2>&1 | tail -20
```

Expected: zero warnings, 13 routes generated, `/ro` and `/en` still SSG (`●`).

**Step 3: Commit**

```bash
git add app/components/CinematicScene3DLoader.tsx
git commit -m "perf(3d): load scene only on home routes"
```

---

### Task 3: Create static cases data file

**Files:**
- Create: `app/[locale]/projects/_data/cases.ts`

**Step 1: Write the data module**

```ts
// Date statice non-traductibile pentru case studies. Slug-ul e cheia pentru
// rutare /[locale]/projects/[slug]; key-ul mapeaza catre messages.projects.items.{key}.
export const CASES = [
  {
    slug: 'banciu-costin',
    key: 'banciuCostin',
    image: '/projects/banciu-preview.jpg',
    imageWidth: 1280,
    imageHeight: 800,
    live: 'https://banciucostin.ro',
    number: 'P01',
  },
  {
    slug: 'aurasjobs',
    key: 'aurasjobs',
    image: '/projects/aurasjobs-preview.jpg',
    imageWidth: 1280,
    imageHeight: 800,
    live: 'https://aurasjobs.com',
    number: 'P02',
  },
  {
    slug: 'stereocad',
    key: 'stereocad',
    image: '/projects/stereocad-preview.jpg',
    imageWidth: 1280,
    imageHeight: 800,
    live: 'https://stereocad.ro',
    number: 'P03',
  },
] as const;

export type CaseSlug = (typeof CASES)[number]['slug'];
export type CaseKey = (typeof CASES)[number]['key'];

export function getCase(slug: string) {
  return CASES.find((c) => c.slug === slug);
}

export function getNextCase(slug: string) {
  const idx = CASES.findIndex((c) => c.slug === slug);
  if (idx < 0) return CASES[0];
  return CASES[(idx + 1) % CASES.length];
}
```

**Step 2: Quick TS check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/[locale]/projects/_data/cases.ts
git commit -m "feat(cases): add static cases data module"
```

---

### Task 4: Extend messages with case content (both locales)

**Files:**
- Modify: `messages/ro.json`, `messages/en.json`

**Step 1: Add `projects.cases` block with content for all 3 projects**

In each locale file, add the following keys at the appropriate places. For each project under `projects.items.{key}`, append:
- `context`: `{ eyebrow, title, body }` — 2 paragraphs (use `\n\n` as paragraph separator in string)
- `approach`: same shape, 2 paragraphs
- `result`: `{ eyebrow, title, body, metrics: [{ value, label }, { value, label }] }` — 2 metrics

Plus new top-level `projects.*` keys:
- `caseCounter` (e.g. RO "Case", EN "Case")
- `viewCase` (RO "Citește case study", EN "Read case study")
- `backToIndex` (RO "Înapoi la portofoliu", EN "Back to portfolio")
- `nextCase` (RO "Următorul", EN "Next")
- `indexTitle` (RO "Proiecte selectate.", EN "Selected work.")
- `indexLead` (RO "Trei proiecte live — fiecare cu povestea în spate: ce nu funcționa, ce am construit, ce am livrat.", EN "Three live projects — each with the story behind it: what wasn't working, what we built, what we delivered.")

Content for each project follows the mockup metrics:
- **Banciu Costin** — metrics: `98/100 PageSpeed mobile`, `14 zile delivery`
- **Aurasjobs** — metrics: `−65% timp răspuns email`, `24/7 procesare candidați`
- **Stereocad** — metrics: `0 parole de gestionat`, `Real-time monitorizare etape`

Write the body copy in the same Comsa Claudiu voice (concrete, no fluff, declarative).

**Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/ro.json','utf8')); console.log('ro OK')"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('en OK')"
```

Expected: both `OK`.

**Step 3: Commit**

```bash
git add messages/ro.json messages/en.json
git commit -m "feat(i18n): case study content for 3 projects (RO+EN)"
```

---

### Task 5: Create `MetricGrid` component

**Files:**
- Create: `app/components/MetricGrid.tsx`

**Step 1: Write the component**

```tsx
// Grid 2 coloane pentru metrici per case study — numar mare + label scurt
// dedesubt, ancorat de o linie verticala 1px pe stanga.
type Metric = { value: string; label: string };

export default function MetricGrid({ metrics }: { metrics: readonly Metric[] }) {
  return (
    <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
      {metrics.map((m, i) => (
        <div key={i} data-reveal className="border-l border-white/10 pl-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
            {`Metric ${String(i + 1).padStart(2, '0')}`}
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-white lg:text-6xl">
            {m.value}
          </p>
          <p className="mt-3 text-sm text-zinc-400">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/MetricGrid.tsx
git commit -m "feat(metric-grid): reusable 2-col metric component"
```

---

### Task 6: Create the case study page component

**Files:**
- Create: `app/[locale]/projects/[slug]/_components/CaseStudy.tsx`

**Step 1: Write the client component** (uses translations + GSAP reveals)

Structure (per design doc): Hero → Cover → Context → Approach → Result+MetricGrid → Footer-case (back/next).

Translations consumed: `projects.items.{key}.title`, `.kicker`, `.body`, `.tech`, `.context.{eyebrow,title,body}`, `.approach.{...}`, `.result.{...}`, `.result.metrics[]`. Shared keys: `projects.caseCounter`, `viewLive`, `backToIndex`, `nextCase`.

Reveals: GSAP ScrollTrigger same pattern as `Story.tsx` (`y:36→0, opacity:0→1, ease:expo.out, stagger:0.1, start:'top 70%', toggleActions:'play none none reverse'`). Honor `prefers-reduced-motion`.

Use `next/image` for the cover with `priority`, `width`/`height` from `cases.ts`.

Use `next-intl/navigation` `Link` for `back to index` and `next case` links so locale prefix is preserved.

**Step 2: Lint + TS check**

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/[locale]/projects/[slug]/_components/CaseStudy.tsx
git commit -m "feat(case): CaseStudy component with GSAP reveals + i18n"
```

---

### Task 7: Add the `[slug]` route + metadata + SSG params

**Files:**
- Create: `app/[locale]/projects/[slug]/page.tsx`

**Step 1: Write the server component**

```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import CaseStudy from './_components/CaseStudy';
import { CASES, getCase } from '../_data/cases';

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const c of CASES) params.push({ locale, slug: c.slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getCase(slug);
  if (!c) return {};
  const t = await getTranslations({ locale, namespace: `projects.items.${c.key}` });
  const title = t('title');
  const description = t('body');
  return {
    title,
    description,
    openGraph: {
      url: `https://www.claudiucomsa.com/${locale}/projects/${slug}`,
      title: `${title} | Comsa Claudiu`,
      description,
      images: [{ url: c.image, width: c.imageWidth, height: c.imageHeight, alt: title }],
    },
    twitter: { card: 'summary_large_image', images: [c.image] },
    alternates: {
      canonical: `https://www.claudiucomsa.com/${locale}/projects/${slug}`,
      languages: {
        ro: `https://www.claudiucomsa.com/ro/projects/${slug}`,
        en: `https://www.claudiucomsa.com/en/projects/${slug}`,
        'x-default': `https://www.claudiucomsa.com/ro/projects/${slug}`,
      },
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const c = getCase(slug);
  if (!c) notFound();
  return (
    <>
      <Navbar />
      <main>
        <CaseStudy caseSlug={c.slug} />
      </main>
      <Footer />
    </>
  );
}
```

**Step 2: Build verification**

```bash
npm run build 2>&1 | tail -30
```

Expected: 6 new SSG routes listed (`/ro/projects/banciu-costin`, `/en/projects/banciu-costin`, ... etc.).

**Step 3: Commit**

```bash
git add app/[locale]/projects/[slug]/page.tsx
git commit -m "feat(case): /[locale]/projects/[slug] SSG route + metadata"
```

---

### Task 8: Rewrite `/projects` index page

**Files:**
- Modify: `app/[locale]/projects/page.tsx` (currently redirect → real page)

**Step 1: Replace with index server component**

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { CASES } from './_data/cases';

export default async function ProjectsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('projects');

  return (
    <>
      <Navbar />
      <main className="relative">
        <section className="relative px-8 pt-32 pb-16 lg:px-12">
          {/* Counter + lead — folosi acelasi pattern din Story.tsx */}
          {/* ... eyebrow, title=t('indexTitle'), line, lead=t('indexLead') ... */}
        </section>
        <section className="px-8 pb-24 lg:px-12">
          <ul className="mx-auto max-w-5xl divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {CASES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={{ pathname: '/projects/[slug]', params: { slug: c.slug } }}
                  className="group grid grid-cols-12 items-center gap-6 py-10 transition-colors hover:bg-white/[0.015]"
                >
                  <span className="col-span-1 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
                    {c.number}
                  </span>
                  <div className="col-span-7">
                    <h3 className="text-3xl font-semibold tracking-[-0.03em] text-white transition-transform duration-300 group-hover:translate-x-1 lg:text-4xl">
                      {t(`items.${c.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      {t(`items.${c.key}.kicker`)}
                    </p>
                  </div>
                  {/* tech chips col-span-3, ia tech split pe ` · ` */}
                  <span className="col-span-1 text-right text-xl text-zinc-600 transition-colors duration-300 group-hover:text-white">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

(Full implementation in this task should expand the index header into the same eyebrow/title/line pattern used in `Story.tsx`.)

**Step 2: Build verification**

```bash
npm run build 2>&1 | tail -25
```

Expected: `/[locale]/projects` listed as SSG.

**Step 3: Commit**

```bash
git add app/[locale]/projects/page.tsx
git commit -m "feat(projects): real /projects index (replaces redirect)"
```

---

### Task 9: Update homepage `Projects.tsx` + fix s2 CTA

**Files:**
- Modify: `app/components/sections/Projects.tsx` (add second CTA)
- Modify: `messages/ro.json`, `messages/en.json` (fix s2 ctaHref)

**Step 1: Add internal case-study CTA next to existing "Vezi live"**

In `Projects.tsx`, replace the single `<a>` block with a row of two:
- Primary: `<Link href={{ pathname: '/projects/[slug]', params: { slug: SLUG_FOR_KEY[projectKey] } }}>` with text `t('viewCase')` and arrow `→`
- Secondary: existing external `<a>` with `t('viewLive')` styled as border-only (less prominent)

Add a `SLUG_FOR_KEY` lookup at the top of the file mapping `projectKey` to the slug from `cases.ts` (or just import `CASES` and look up).

**Step 2: Repoint Hero s2 CTA in both locale files**

Change `cinematic.s2.ctaHref` from `"claudiucomsaa@gmail.com"` to `"/projects"` in both `ro.json` and `en.json`. Update the consuming code in `Hero.tsx` — it currently wraps in `mailto:${...}`. Change to use the value as-is, OR keep as-is and just pass `/projects`. Inspect `Hero.tsx:116` to confirm.

**Step 3: Build + commit**

```bash
npm run lint && npm run build 2>&1 | tail -15
git add app/components/sections/Projects.tsx app/components/sections/Hero.tsx messages/ro.json messages/en.json
git commit -m "feat(homepage): link to case studies + fix s2 CTA"
```

---

### Task 10: Extend `sitemap.ts` with case-study URLs

**Files:**
- Modify: `app/sitemap.ts`

**Step 1: Read existing sitemap, add 6 case study URLs**

For each `(locale, slug)` pair in `CASES`, push `{ url, lastModified, alternates: { languages: { ro: ..., en: ... } } }`. Also include the `/projects` index page (2 locales).

**Step 2: Build**

```bash
npm run build 2>&1 | tail -10
```

Verify `/sitemap.xml` is in the static output.

**Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(seo): case study URLs in sitemap"
```

---

### Task 11: Final smoke + delete mockup

**Step 1: Final build + lint**

```bash
npm run lint && npm run build 2>&1 | tail -30
```

Expected output:
- Zero warnings
- 13+ routes (original 13 + 6 case study × 2 locales + 2 index × 2 locales − accounting for existing/projects which is now a real page = 6 new SSG routes)
- All `/ro/projects/*` and `/en/projects/*` marked `●` (SSG)

**Step 2: Dev server smoke check**

Run dev server, open the following paths in browser, confirm visual correctness:
- `http://localhost:3000/ro/projects`
- `http://localhost:3000/ro/projects/banciu-costin`
- `http://localhost:3000/en/projects/aurasjobs`
- Homepage `/` — verify 3D scene still loads and case-study links appear in Projects section
- `/ro/projects/stereocad` → next-case link cycles to `banciu-costin`

If anything looks broken, stop and fix before continuing.

**Step 3: Delete the mockup file + commit**

```bash
rm mockup/case-study-preview.html
rmdir mockup
git add mockup/case-study-preview.html
git commit -m "chore: remove approved mockup (implementation landed)"
```

---

## Done state

- 6 SSG case-study pages live at `/[locale]/projects/[slug]`
- Real `/[locale]/projects` index page (replaces redirect)
- 3D scene only loads on home (perf win on case study + sub-pages)
- Preview images compressed (~10× smaller)
- Homepage links to both case study (internal) and live site (external)
- Sitemap + hreflang alternates extended
- Build clean, SSG preserved, zero warnings

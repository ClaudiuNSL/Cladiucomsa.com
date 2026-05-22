# Case Studies — Design Document

**Date:** 2026-05-22
**Branch:** `feature/redesign-2026`
**Status:** Approved (mockup validated by user)

## Goal

Transform the portfolio from a "looks nice" homepage into a "demonstrable" portfolio. Each of the three real projects (Banciu Costin, Aurasjobs, Stereocad) gets a dedicated case-study page that tells a *Context → Approach → Result* story with credible metrics.

Mockup approved: `mockup/case-study-preview.html` (delete after implementation).

## Scope

- 3 case study pages × 2 locales = **6 SSG routes** at `/[locale]/projects/[slug]`
- 1 index page rewrite at `/[locale]/projects` (currently a redirect)
- Conditional 3D scene loading (case-study pages do not load `CinematicScene3D`)
- Compressed preview images
- Sitemap, navigation, and homepage CTA wiring

## Routes

| Route | Type | Notes |
|---|---|---|
| `/[locale]/projects` | SSG | Index list — was a redirect, becomes a real page |
| `/[locale]/projects/[slug]` | SSG | One per slug × locale (6 total) |

Slugs: `banciu-costin`, `aurasjobs`, `stereocad`.

## Content model

### Static data — `app/[locale]/projects/_data/cases.ts`

Holds non-translatable structural info per slug:

```ts
export const CASES = [
  { slug: 'banciu-costin', key: 'banciuCostin', image: '/projects/banciu-preview.jpg', live: 'https://banciucostin.ro' },
  { slug: 'aurasjobs',     key: 'aurasjobs',    image: '/projects/aurasjobs-preview.jpg', live: 'https://aurasjobs.com' },
  { slug: 'stereocad',     key: 'stereocad',    image: '/projects/stereocad-preview.jpg', live: 'https://stereocad.ro' },
] as const;
```

### Translated copy — `messages/{ro,en}.json` extension

Under existing `projects.items.{key}`, add:

```jsonc
{
  "context":  { "eyebrow": "…", "title": "…", "body": "…(2 paragraphs)" },
  "approach": { "eyebrow": "…", "title": "…", "body": "…(2 paragraphs)" },
  "result":   { "eyebrow": "…", "title": "…", "body": "…", "metrics": [
                  { "value": "98/100", "label": "PageSpeed mobile — first paint < 1s" },
                  { "value": "14 zile", "label": "De la brief la lansare" }
                ] }
}
```

New top-level keys for shared UI:

```jsonc
"projects": {
  "indexTitle": "Proiecte selectate.",
  "indexLead":  "Trei proiecte live — fiecare cu povestea în spate: ce nu funcționa, ce am construit, ce am livrat.",
  "caseCounter": "Case",
  "viewLive": "Vezi live",   // already exists
  "viewCase": "Citește case study",
  "backToIndex": "Înapoi la portofoliu",
  "nextCase": "Următorul"
}
```

Content per project written by Claude (plausibility based on existing kicker/body — option 4 chosen by user).

## Page structure (case study)

Top-to-bottom sections, all left-aligned within `max-w-3xl`:

1. **Hero** — counter (`Case · P0X`) + eyebrow + huge title + kicker + stack chips + CTA "Vezi live ↗" with `banciucostin.ro` next to it
2. **Cover** — `<Image>` 16:10 rounded with subtle border, `priority`, fade-in on mount
3. **Context** — eyebrow/title/body 2 paragraphs
4. **Approach** — eyebrow/title/body 2 paragraphs
5. **Result** — eyebrow/title/body + 2-metric grid (border-l accent, big number + label)
6. **Footer-case** — `← Înapoi la portofoliu` (left) / `Următorul → P0Y` (right, cycles)

Visual language: identical to `Story.tsx` (counters, eyebrows, 24-wide accent lines, GSAP scroll reveals with `y:36 → 0, opacity:0 → 1, ease:'expo.out'`).

No 3D, no parallax, no letter-by-letter title reveal (those belong to the homepage Hero/Projects cinematic).

## Page structure (index)

- Hero block with counter, eyebrow, title, lead paragraph
- Row-based list of 3 cases with divider lines, hover translate-x + arrow color shift
- Each row: `P0X | Title (3xl) + Kicker | tech chips | → arrow`

Single-column, no images on index (rows stay scannable).

## Performance

- `CinematicScene3DLoader` reads `usePathname()`; renders the scene only on `/` or `/[locale]` (exact home match). Saves the Draco worker + 3D scene from booting on case studies.
- Preview PNGs in `public/projects/*.png` (banciu 2.5MB, aurasjobs 180KB, stereocad 272KB) re-encoded with sharp as JPEG q85 mozjpeg → target ~150–300KB total. Existing PNGs deleted.
- Use `next/image` with `priority` only on the cover of the open case study.

## Navigation wiring

- `Projects.tsx` (homepage) — each card already has a "Vezi live" button (external). Add a sibling "Citește case study →" pointing to `/projects/[slug]`. Both buttons in a row, "Citește" gets primary styling, "Vezi live" demoted to secondary border-only.
- Hero section 2 CTA (`messages.cinematic.s2.ctaHref` currently `claudiucomsaa@gmail.com` with text "Vezi proiectele") — repoint to `/projects` (the index page). This was a broken UX before.

## SEO

- Per-case `generateMetadata` with localized title (`{Title} | Comsa Claudiu`), description (case body excerpt), OG image (the cover screenshot).
- Sitemap extended: 6 new URLs + locale alternates.

## Files affected

**NEW (4):**
- `app/[locale]/projects/[slug]/page.tsx`
- `app/[locale]/projects/[slug]/_components/CaseStudy.tsx`
- `app/[locale]/projects/_data/cases.ts`
- `app/components/MetricGrid.tsx` (small, reusable)

**MODIFIED (8):**
- `app/[locale]/projects/page.tsx` (redirect → index)
- `app/components/sections/Projects.tsx` (add internal case study link)
- `app/components/CinematicScene3DLoader.tsx` (path-aware)
- `messages/ro.json`, `messages/en.json` (case content + new keys)
- `app/sitemap.ts` (new URLs)
- `messages/{ro,en}.json` hero s2 CTA href fix
- `public/projects/*.png` → `*.jpg` (3 files re-encoded)

**DELETE after implementation:**
- `mockup/case-study-preview.html`
- `public/projects/*.png` (old)

## Out of scope (YAGNI)

- Real testimonial inline (will land in feature B)
- Comments / share buttons
- Related projects sidebar
- Reading-time badge
- Dark/light theme toggle (site stays dark)

## Risks / decisions

- **Plausibility risk:** Metrics and copy are written by Claude based on the short existing descriptions. User accepted this (option 4). User should review and edit copy after first commit if numbers feel off.
- **Image quality:** JPEG q85 may show banding on dark gradients in screenshots; if so, bump to q90 or keep as PNG with palette.
- **`/projects` index was a redirect** — visitors who had bookmarked it will now land on a real page, not the homepage anchor. Net positive but a behavior change.

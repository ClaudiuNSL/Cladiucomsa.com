# Portfolio Redesign 2026 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild claudiucomsa.com as a premium, editorial, bilingual (RO + EN) studio-voice portfolio with 4 focused sections, fewer animated gimmicks, deeper black + cyan accent palette, and proper i18n routing.

**Architecture:** Branch off `feature/site-audit-fixes` on `feature/redesign-2026`. Build the new structure under `app/[locale]/` using `next-intl` v3 for routing and message lookup. Drop ~7 deprecated motion/decorative components and replace with 5 new ones. Keep the rebuild parallel with the old root `app/page.tsx` until cutover, so we never lose a working state. Companion design doc: `docs/plans/2026-05-21-portfolio-redesign-design.md`.

**Tech Stack:** Next.js 16.1.3 (App Router), React 19, TypeScript, Tailwind v4, framer-motion 12, `next-intl` v3 (new), Geist font (already configured), Vercel for deploy.

---

## Preflight assumptions

- **Working directory:** `C:/Users/comsa/claudiu-dev-portofoliu`
- **Current branch:** `feature/redesign-2026` (created earlier, design doc already committed at `01dd4fe`)
- **Old `app/page.tsx`, `app/projects/`, `app/services/` stay in place** until Phase 7 cutover. We build the new world under `app/[locale]/` and switch at the end.
- **Tests:** This is a marketing site — no unit tests planned. Verification per task = TypeScript build, lint, manual visual check via `npm run dev`. Final phase adds Lighthouse + Pa11y checks.
- **Commits:** one commit per task. Conventional commit prefixes (`feat:`, `refactor:`, `chore:`, `style:`, `docs:`).
- **Visual review:** push to GitHub after each phase so Vercel preview is available.

---

# Phase 1 — i18n foundation

### Task 1: Install `next-intl` and reorganize routes under `[locale]`

**Files:**
- Modify: `package.json` (add `next-intl`)
- Create: `i18n/routing.ts`
- Create: `i18n/request.ts`
- Create: `middleware.ts` (project root)
- Move: `app/page.tsx` → `app/[locale]/page.tsx`
- Move: `app/not-found.tsx` → `app/[locale]/not-found.tsx`
- Move: `app/projects/page.tsx` → `app/[locale]/projects/page.tsx`
- Move: `app/services/page.tsx` → `app/[locale]/services/page.tsx`
- Modify: `app/layout.tsx` → split into root `app/layout.tsx` (minimal) + `app/[locale]/layout.tsx` (with locale-aware metadata + `NextIntlClientProvider`)
- Create: `app/page.tsx` (root redirect-only — `redirect('/ro')`)

**Step 1: Install dependency**

```bash
npm install next-intl@^3
```

Expected: `next-intl` added to `package.json` dependencies.

**Step 2: Create `i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ro', 'en'] as const,
  defaultLocale: 'ro',
  localePrefix: 'always', // /ro/... and /en/..., no bare /
});

export type Locale = (typeof routing.locales)[number];
```

**Step 3: Create `i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as 'ro' | 'en')) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**Step 4: Create `middleware.ts` at project root**

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

**Step 5: Update `next.config.ts` to register the plugin**

Wrap the existing `nextConfig` export with `next-intl`'s plugin:

```ts
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const securityHeaders = [
  /* ... existing array unchanged ... */
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
```

**Step 6: Reorganize app/ folder**

```bash
mkdir app/[locale]
git mv app/page.tsx app/[locale]/page.tsx
git mv app/not-found.tsx app/[locale]/not-found.tsx
git mv app/projects app/[locale]/projects
git mv app/services app/[locale]/services
```

**Step 7: Create new minimal root `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/ro');
}
```

**Step 8: Split layouts**

New `app/layout.tsx` keeps only `<html>` shell + global styles (no locale):

```tsx
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.claudiucomsa.com'),
  verification: { google: 'NCEWDwd-7Vx7Yti0PoIW3v4Y0xJcdN4e52PlDvW3Ipw' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#06B6D4' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0B' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

New `app/[locale]/layout.tsx` handles locale-specific concerns:

```tsx
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import LoadingScreen from '@/app/components/LoadingScreen';
import BackToTop from '@/app/components/BackToTop';
import AccessibilityWidget from '@/app/components/AccessibilityWidget';
import PageTransition from '@/app/components/PageTransition';
import CursorGlow from '@/app/components/CursorGlow';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: { template: `%s | ${t('siteName')}`, default: t('defaultTitle') },
    description: t('description'),
    openGraph: {
      title: t('defaultTitle'),
      description: t('description'),
      url: `https://www.claudiucomsa.com/${locale}`,
      siteName: t('siteName'),
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      type: 'website',
      images: [{ url: '/logo-cc.png', width: 1024, height: 1024, alt: 'Comsa Claudiu — CC Logo' }],
    },
    twitter: { card: 'summary_large_image', images: ['/logo-cc.png'] },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.claudiucomsa.com/${locale}`,
      languages: {
        ro: 'https://www.claudiucomsa.com/ro',
        en: 'https://www.claudiucomsa.com/en',
        'x-default': 'https://www.claudiucomsa.com/ro',
      },
    },
    icons: { icon: '/icon', apple: '/logo-cc.png' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div lang={locale}>
        <LoadingScreen />
        <CursorGlow />
        <PageTransition>{children}</PageTransition>
        <BackToTop />
        <AccessibilityWidget />
      </div>
    </NextIntlClientProvider>
  );
}
```

NOTE: the existing root `<html>` had `lang="ro"`. Since we now split, the root `<html>` has no explicit `lang` (it inherits from the inner `<div lang={locale}>`). For best SSR semantics, instead patch `<html>` via `headers()` in middleware — but for simplicity v1, the inner wrapper is acceptable.

**Step 9: Update `tsconfig.json` if needed for `@/i18n/...` path alias**

Verify `compilerOptions.paths` has `"@/*": ["./*"]`. If missing, add it.

**Step 10: Verify build**

Run: `npm run build`
Expected: succeeds. May warn about missing `messages/ro.json` and `messages/en.json` — those are added in Task 2. If build fails for that reason only, accept it and move on.

**Step 11: Commit**

```bash
git add .
git commit -m "feat(i18n): scaffold next-intl with [locale] routing"
```

---

### Task 2: Create translation message files

**Files:**
- Create: `messages/ro.json`
- Create: `messages/en.json`

**Step 1: Write `messages/ro.json`**

Keys are organized by namespace, mirroring the section layout.

```json
{
  "meta": {
    "siteName": "Comsa Claudiu — Studio web & AI",
    "defaultTitle": "Comsa Claudiu — Site-uri și automatizări AI",
    "description": "Construim site-uri și automatizări AI pentru afaceri. Dashboard-uri, agenți AI, integrări. Constanța · România · Remote."
  },
  "nav": {
    "home": "Acasă",
    "services": "Servicii",
    "projects": "Proiecte",
    "contact": "Contact",
    "cta": "Hai să vorbim",
    "langSwitcherLabel": "Limba",
    "openMenu": "Deschide meniul",
    "closeMenu": "Închide meniul"
  },
  "hero": {
    "eyebrow": "Web · AI · Automation",
    "title": "Construim site-uri și automatizări AI care chiar livrează.",
    "subtitle": "Dashboard-uri, agenți AI, integrări. Pentru afaceri care vor mai mult decât un site de prezentare.",
    "ctaPrimary": "Vezi proiecte",
    "ctaSecondary": "Hai să vorbim",
    "scrollIndicator": "Scroll"
  },
  "services": {
    "sectionTitle": "Ce construim",
    "sectionSubtitle": "Trei direcții. Trei rezultate concrete.",
    "items": {
      "websites": {
        "number": "01",
        "title": "Site-uri web profesionale",
        "body": "Site-uri rapide, optimizate SEO, responsive. Pentru clienți care au nevoie de prezență digitală solidă — nu de încă un template.",
        "linkLabel": "Vezi exemplu"
      },
      "ai": {
        "number": "02",
        "title": "Agenți AI & automatizări",
        "body": "Procesare automată email, generare conținut, agenți care iau decizii. Integrăm OpenAI, Anthropic, Gemini — alegem ce se potrivește.",
        "linkLabel": "Vezi exemplu"
      },
      "internal": {
        "number": "03",
        "title": "Aplicații interne & dashboard-uri",
        "body": "Platforme interne care înlocuiesc ore de muncă manuală. Autentificare securizată, monitoring în timp real, export pe ce format ai nevoie.",
        "linkLabel": "Vezi exemplu"
      }
    }
  },
  "projects": {
    "sectionTitle": "Proiecte recente",
    "sectionSubtitle": "Lucruri pe care le-am livrat clienților reali.",
    "viewLive": "Vezi live",
    "viewSource": "Cod sursă",
    "items": {
      "banciuCostin": {
        "title": "Banciu Costin",
        "kicker": "Site web profesional",
        "body": "Prezență digitală pentru un specialist din domeniul juridic. Optimizat pentru performanță, SEO și conversie — vizitatorii devin solicitări de contact.",
        "tech": ["HTML5", "CSS3", "JavaScript", "SEO"]
      },
      "aurasjobs": {
        "title": "Aurasjobs",
        "kicker": "Agent AI pentru recrutare",
        "body": "Procesează automat email-urile candidaților, generează răspunsuri personalizate și gestionează fluxul propunere → aprobare → trimitere. Construit pentru o firmă de recrutare cruise ship.",
        "tech": ["Next.js", "TypeScript", "LLM Integration", "Email Automation"]
      },
      "stereocad": {
        "title": "Stereocad",
        "kicker": "Platformă automatizări cadastrale",
        "body": "Generează automat documente cadastrale pentru o firmă din domeniu. Autentificare passwordless cu magic link, monitorizare etape în timp real, fără parole.",
        "tech": ["Next.js", "TypeScript", "Magic Link Auth", "Document Generation"]
      }
    }
  },
  "contact": {
    "sectionTitle": "Hai să discutăm proiectul tău.",
    "sectionSubtitle": "Răspund în maxim 24 de ore lucrătoare. Constanța · Remote · Worldwide.",
    "formName": "Numele tău",
    "formEmail": "Email",
    "formMessage": "Spune-mi despre proiect",
    "formSubmit": "Trimite mesajul",
    "directContactLabel": "Sau direct:",
    "emailLabel": "Email",
    "phoneLabel": "Telefon",
    "linkedinLabel": "LinkedIn",
    "githubLabel": "GitHub"
  },
  "footer": {
    "rights": "Toate drepturile rezervate.",
    "builtWith": "Construit cu Next.js și grijă pentru detalii."
  }
}
```

**Step 2: Write `messages/en.json`** — mirror structure, English copy

```json
{
  "meta": {
    "siteName": "Comsa Claudiu — Web & AI Studio",
    "defaultTitle": "Comsa Claudiu — Websites & AI Automations",
    "description": "We build websites and AI automations for businesses. Dashboards, AI agents, integrations. Constanța · Romania · Remote."
  },
  "nav": {
    "home": "Home",
    "services": "Services",
    "projects": "Projects",
    "contact": "Contact",
    "cta": "Let's talk",
    "langSwitcherLabel": "Language",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  },
  "hero": {
    "eyebrow": "Web · AI · Automation",
    "title": "We build websites and AI automations that actually deliver.",
    "subtitle": "Dashboards, AI agents, integrations. For businesses that want more than a brochure site.",
    "ctaPrimary": "See projects",
    "ctaSecondary": "Let's talk",
    "scrollIndicator": "Scroll"
  },
  "services": {
    "sectionTitle": "What we build",
    "sectionSubtitle": "Three directions. Three concrete outcomes.",
    "items": {
      "websites": {
        "number": "01",
        "title": "Professional websites",
        "body": "Fast, SEO-optimized, responsive websites. For clients who need a real digital presence — not another template.",
        "linkLabel": "See example"
      },
      "ai": {
        "number": "02",
        "title": "AI agents & automations",
        "body": "Automated email processing, content generation, decision-making agents. We integrate OpenAI, Anthropic, Gemini — we pick what fits.",
        "linkLabel": "See example"
      },
      "internal": {
        "number": "03",
        "title": "Internal apps & dashboards",
        "body": "Internal platforms that replace hours of manual work. Secure auth, real-time monitoring, exports in any format you need.",
        "linkLabel": "See example"
      }
    }
  },
  "projects": {
    "sectionTitle": "Recent projects",
    "sectionSubtitle": "Things we've shipped for real clients.",
    "viewLive": "View live",
    "viewSource": "Source code",
    "items": {
      "banciuCostin": {
        "title": "Banciu Costin",
        "kicker": "Professional website",
        "body": "Digital presence for a legal industry specialist. Optimized for performance, SEO, and conversion — visitors become contact requests.",
        "tech": ["HTML5", "CSS3", "JavaScript", "SEO"]
      },
      "aurasjobs": {
        "title": "Aurasjobs",
        "kicker": "AI agent for recruitment",
        "body": "Processes candidate emails automatically, generates personalized responses, manages the proposal → approval → send flow. Built for a cruise ship recruitment firm.",
        "tech": ["Next.js", "TypeScript", "LLM Integration", "Email Automation"]
      },
      "stereocad": {
        "title": "Stereocad",
        "kicker": "Cadastral automation platform",
        "body": "Auto-generates cadastral documents for a specialist firm. Passwordless magic-link auth, real-time stage monitoring, no passwords to manage.",
        "tech": ["Next.js", "TypeScript", "Magic Link Auth", "Document Generation"]
      }
    }
  },
  "contact": {
    "sectionTitle": "Let's talk about your project.",
    "sectionSubtitle": "I respond within 24 business hours. Constanța · Remote · Worldwide.",
    "formName": "Your name",
    "formEmail": "Email",
    "formMessage": "Tell me about your project",
    "formSubmit": "Send message",
    "directContactLabel": "Or directly:",
    "emailLabel": "Email",
    "phoneLabel": "Phone",
    "linkedinLabel": "LinkedIn",
    "githubLabel": "GitHub"
  },
  "footer": {
    "rights": "All rights reserved.",
    "builtWith": "Built with Next.js and care for details."
  }
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: succeeds. Type errors from old `app/[locale]/page.tsx` (the moved file) are fine — we rewrite it in Phase 6.

**Step 4: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add RO + EN message files"
```

---

### Task 3: Update sitemap, robots, manifest, JSON-LD for i18n

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`
- Modify: `app/manifest.ts`
- Move structured data (JSON-LD) from `app/layout.tsx` into `app/[locale]/page.tsx` (we'll do this in Phase 6 — for now, just remove from root layout)

**Step 1: Update `app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.claudiucomsa.com';
  const locales = ['ro', 'en'] as const;
  const pages = ['', '/services', '/projects'];

  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: page === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}${page}`])
        ),
      },
    }))
  );
}
```

**Step 2: Verify `app/robots.ts` still allows everything**

If existing content is already permissive (allow all), leave as-is. Otherwise update to:

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://www.claudiucomsa.com/sitemap.xml',
  };
}
```

**Step 3: Verify `app/manifest.ts`**

The PWA manifest should not need locale-specific changes for v1. Leave as-is.

**Step 4: Run build + check**

```bash
npm run build
```

Expected: succeeds. Check `.next/server/app/sitemap.xml.body` exists and contains both `/ro/` and `/en/` URLs.

**Step 5: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat(seo): split sitemap per locale with hreflang alternates"
```

---

# Phase 2 — Design tokens & atmosphere

### Task 4: Update color tokens + global styles

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace `:root` and `@theme inline` with new tokens**

Replace lines 3-17 of `app/globals.css` with:

```css
:root {
  --bg-base: #0A0A0B;
  --bg-elev: #13131A;
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-muted: #71717A;
  --accent: #06B6D4;
  --accent-soft: rgba(6, 182, 212, 0.12);
  --aura-purple: #6D28D9;
  --border: rgba(255, 255, 255, 0.08);
}

@theme inline {
  --color-bg-base: var(--bg-base);
  --color-bg-elev: var(--bg-elev);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-aura-purple: var(--aura-purple);
  --color-border: var(--border);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-sans), system-ui, sans-serif;
}
```

**Step 2: Delete dead CSS** (no longer used)

Remove:
- `.hero-glow`, `.hero-glow-2` (replaced by GradientOrbs)
- `.text-gradient` (no more gradient headings)
- `.section-glow-line` (no separator lines)
- `.typewriter-cursor` (TypeWriter dropped)
- `.bg-grid-pattern` (unless used elsewhere — grep first)
- `.animate-float`, `.animation-delay-2000/4000` (FloatingParticles dropped)
- Keep `.animate-fade-in`, `.animate-slide-up`, `.animation-delay-200/400/600` (still used)
- Keep `.nav-logo*` rules (NavLogo survives)
- Keep `.a11y-*` rules (AccessibilityWidget survives)
- Keep `.sr-only:focus` (skip link)

Run a grep first to verify nothing else uses each rule before deleting:

```bash
grep -rn "text-gradient" app/ --include="*.tsx"
grep -rn "section-glow-line" app/ --include="*.tsx"
grep -rn "bg-grid-pattern" app/ --include="*.tsx"
```

**Step 3: Verify build + visual check**

```bash
npm run build
npm run dev
```

Expected: build succeeds. Open `http://localhost:3000/ro` — page may look broken (we haven't rewritten it yet), but no console errors.

**Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: new design tokens — deep black base, cyan accent, drop dead CSS"
```

---

### Task 5: Create `GradientOrbs` component

**Files:**
- Create: `app/components/GradientOrbs.tsx`

**Step 1: Implementation**

```tsx
// Orb-uri gradient atmosferice — fixed pe viewport, blur masiv, opacitate joasă
export default function GradientOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-[0.10] blur-[160px]"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-60 h-[700px] w-[700px] rounded-full opacity-[0.08] blur-[180px]"
        style={{ background: 'radial-gradient(circle, #6D28D9 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full opacity-[0.06] blur-[140px]"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
    </div>
  );
}
```

**Step 2: Wire into `app/[locale]/layout.tsx`**

Inside the `<NextIntlClientProvider>`, just before `<LoadingScreen />`:

```tsx
import GradientOrbs from '@/app/components/GradientOrbs';
// ...
<GradientOrbs />
```

**Step 3: Verify visual**

Run `npm run dev`, open `http://localhost:3000/ro`. Three soft blurred orbs visible behind content. Reduced motion preference doesn't disable them (they're static).

**Step 4: Commit**

```bash
git add app/components/GradientOrbs.tsx app/[locale]/layout.tsx
git commit -m "feat: add GradientOrbs atmospheric background component"
```

---

### Task 6: Add `Locale` types + locale-aware navigation utilities

**Files:**
- Create: `i18n/navigation.ts`

**Step 1: Use `next-intl`'s navigation helpers**

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add i18n/navigation.ts
git commit -m "feat(i18n): add locale-aware navigation helpers"
```

---

# Phase 3 — Drop deprecated components

### Task 7: Delete deprecated components

**Files (delete):**
- `app/components/TypeWriter.tsx`
- `app/components/MagneticButton.tsx`
- `app/components/FloatingParticles.tsx`
- `app/components/TextReveal.tsx`
- `app/components/AuroraBackground.tsx`
- `app/components/TestimonialsCarousel.tsx`
- `app/components/TechStack.tsx`
- `app/components/LoadingScreen.tsx` *(decision: drop — slows perceived load, adds nothing)*
- `app/components/CursorGlow.tsx` *(we'll add a leaner replacement in Task 12)*

**Step 1: Verify nothing else imports these (search first)**

```bash
for c in TypeWriter MagneticButton FloatingParticles TextReveal AuroraBackground TestimonialsCarousel TechStack LoadingScreen CursorGlow; do
  echo "=== $c ==="
  grep -rn "$c" app/ --include="*.tsx" --include="*.ts" | grep -v "app/components/$c.tsx"
done
```

Expected: only import lines in `app/[locale]/page.tsx` (the moved-but-not-yet-rewritten file) and `app/[locale]/layout.tsx`. Remove those imports + usages BEFORE deleting the files.

**Step 2: Strip imports from `app/[locale]/layout.tsx`**

Remove `LoadingScreen` + `CursorGlow` imports and their JSX usages. Leave the remaining structure intact.

**Step 3: Delete the component files**

```bash
git rm app/components/TypeWriter.tsx
git rm app/components/MagneticButton.tsx
git rm app/components/FloatingParticles.tsx
git rm app/components/TextReveal.tsx
git rm app/components/AuroraBackground.tsx
git rm app/components/TestimonialsCarousel.tsx
git rm app/components/TechStack.tsx
git rm app/components/LoadingScreen.tsx
git rm app/components/CursorGlow.tsx
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: succeeds. Any remaining import errors are in `app/[locale]/page.tsx` which we are about to rewrite — those are fine for now. If the build fails outright, leave the broken import temporarily as TODO and document in commit message.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: drop deprecated motion/decorative components"
```

---

# Phase 4 — New components

### Task 8: Build `LanguageSwitcher`

**Files:**
- Create: `app/components/LanguageSwitcher.tsx`

**Step 1: Implementation**

```tsx
'use client';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useState, useRef, useEffect } from 'react';
import { routing } from '@/i18n/routing';

const labels: Record<'ro' | 'en', string> = { ro: 'Română', en: 'English' };

export default function LanguageSwitcher() {
  const locale = useLocale() as 'ro' | 'en';
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const switchTo = (next: 'ro' | 'en') => {
    setOpen(false);
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('langSwitcherLabel')}
        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
      >
        {locale.toUpperCase()}
        <span aria-hidden="true" className="ml-1.5 opacity-60">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 min-w-[8rem] rounded-lg border border-white/10 bg-[#13131A] py-1 shadow-xl"
        >
          {routing.locales.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                role="option"
                aria-selected={locale === loc}
                onClick={() => switchTo(loc)}
                className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                  locale === loc ? 'text-[#06B6D4]' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {labels[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Step 2: Verify build + lint**

```bash
npm run build && npm run lint
```

**Step 3: Commit**

```bash
git add app/components/LanguageSwitcher.tsx
git commit -m "feat: add LanguageSwitcher dropdown"
```

---

### Task 9: Build `ServiceCard`

**Files:**
- Create: `app/components/ServiceCard.tsx`

**Step 1: Implementation**

```tsx
'use client';
import { motion } from 'framer-motion';

interface ServiceCardProps {
  number: string;
  title: string;
  body: string;
  linkLabel: string;
  href: string;
}

export default function ServiceCard({ number, title, body, linkLabel, href }: ServiceCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 transition-all hover:border-[#06B6D4]/30 hover:bg-white/[0.04]"
    >
      <div>
        <div className="mb-8 font-bold text-7xl leading-none text-white/[0.08] transition-colors group-hover:text-[#06B6D4]/30">
          {number}
        </div>
        <h3 className="mb-4 text-2xl font-bold text-white">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">{body}</p>
      </div>
      <a
        href={href}
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#06B6D4] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded"
      >
        {linkLabel}
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
      </a>
    </motion.article>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add app/components/ServiceCard.tsx
git commit -m "feat: add ServiceCard component"
```

---

### Task 10: Build `ProjectShowcase`

**Files:**
- Create: `app/components/ProjectShowcase.tsx`

**Step 1: Implementation**

```tsx
'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProjectShowcaseProps {
  title: string;
  kicker: string;
  body: string;
  tech: string[];
  image?: string;
  liveUrl?: string;
  sourceUrl?: string;
  viewLiveLabel: string;
  viewSourceLabel: string;
  reverse?: boolean;
}

export default function ProjectShowcase({
  title,
  kicker,
  body,
  tech,
  image,
  liveUrl,
  sourceUrl,
  viewLiveLabel,
  viewSourceLabel,
  reverse = false,
}: ProjectShowcaseProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`grid items-center gap-12 lg:grid-cols-12 ${reverse ? 'lg:[direction:rtl]' : ''}`}
    >
      <div className="lg:col-span-7 lg:[direction:ltr]">
        {image && (
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <Image
              src={image}
              alt={`${title} — preview`}
              width={1400}
              height={900}
              sizes="(max-width: 1024px) 92vw, 800px"
              className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#06B6D4]/0 via-transparent to-[#06B6D4]/0 transition-opacity duration-500 group-hover:from-[#06B6D4]/[0.06]" />
          </div>
        )}
      </div>
      <div className="lg:col-span-5 lg:[direction:ltr]">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-[#06B6D4]">{kicker}</p>
        <h3 className="mb-5 text-4xl font-bold text-white lg:text-5xl">{title}</h3>
        <p className="mb-6 text-lg leading-relaxed text-zinc-400">{body}</p>
        <ul className="mb-8 flex flex-wrap gap-2">
          {tech.map((t) => (
            <li
              key={t}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400"
            >
              {t}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#06B6D4] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0891B2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
            >
              {viewLiveLabel} <span aria-hidden="true">→</span>
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-medium text-zinc-200 transition-colors hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {viewSourceLabel}
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add app/components/ProjectShowcase.tsx
git commit -m "feat: add ProjectShowcase component"
```

---

# Phase 5 — Refactor surviving components

### Task 11: Refactor `Navbar`

**Files:**
- Modify: `app/components/Navbar.tsx`

**Step 1: Rewrite with locale-aware links + LanguageSwitcher + new minimal styling**

Replace the entire file:

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import NavLogo from './NavLogo';
import LanguageSwitcher from './LanguageSwitcher';

const sections = ['services', 'projects', 'contact'] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.08] bg-[#0A0A0B]/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 lg:px-8 py-4">
        <Link
          href="/"
          aria-label="Comsa Claudiu — Home"
          className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded-lg pr-2"
        >
          <NavLogo />
          <span className="hidden text-sm font-medium tracking-wide text-zinc-500 transition-colors group-hover:text-zinc-300 sm:block">
            Comsa Claudiu
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {sections.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded"
            >
              {t(s)}
            </a>
          ))}
          <LanguageSwitcher />
          <a
            href="https://wa.me/40761880406"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#06B6D4] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0891B2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
          >
            {t('cta')}
          </a>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            className="rounded-lg p-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('closeMenu') : t('openMenu')}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" role="menu" className="md:hidden border-t border-white/[0.08] bg-[#0A0A0B]/95 backdrop-blur-xl">
          <div className="space-y-1 px-6 py-4">
            {sections.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded px-2 py-3 text-base font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {t(s)}
              </a>
            ))}
            <a
              href="https://wa.me/40761880406"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full bg-[#06B6D4] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0891B2]"
            >
              {t('cta')}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
```

**Step 2: Verify build + visual**

```bash
npm run build && npm run dev
```

Open both `http://localhost:3000/ro` and `http://localhost:3000/en`, check that the language switcher toggles between them and preserves the path. Mobile menu opens/closes. Sections links scroll properly (won't yet — sections don't exist on the new page yet, that's Phase 6).

**Step 3: Commit**

```bash
git add app/components/Navbar.tsx
git commit -m "refactor(Navbar): minimal styling + LanguageSwitcher + i18n"
```

---

### Task 12: Refactor `Footer` to minimal version

**Files:**
- Modify: `app/components/Footer.tsx`

**Step 1: Rewrite**

```tsx
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="text-sm text-zinc-500">
          © {year} Comsa Claudiu. {t('rights')}
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <a href="https://github.com/ClaudiuNSL" target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/claudiu-comsa-72b552364/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
            LinkedIn
          </a>
          <a href="mailto:claudiucomsa29@gmail.com" className="text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
            Email
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add app/components/Footer.tsx
git commit -m "refactor(Footer): minimal three-link + locale switcher"
```

---

### Task 13: Refactor `ScrollProgress` to thinner version

**Files:**
- Modify: `app/components/ScrollProgress.tsx`

**Step 1: Read existing file first**

```bash
cat app/components/ScrollProgress.tsx
```

**Step 2: Reduce thickness to 1.5px, color = accent, no glow/shadow**

Change the height class from whatever it currently uses to `h-[1.5px]`. Drop any glow/shadow rules. Set background color to `bg-[#06B6D4]` (no gradient).

**Step 3: Verify visual + build**

```bash
npm run dev
```

Scroll on `/ro`, confirm a thin cyan bar tracks scroll progress.

**Step 4: Commit**

```bash
git add app/components/ScrollProgress.tsx
git commit -m "refactor(ScrollProgress): thinner, flat accent, no glow"
```

---

### Task 14: Refactor `AnimatedSection` to fade+translate only

**Files:**
- Modify: `app/components/AnimatedSection.tsx`

**Step 1: Read existing file first**

```bash
cat app/components/AnimatedSection.tsx
```

**Step 2: Strip any direction/spring/rotate variants — keep only `opacity 0→1` + `y: 24→0` over 0.6s with ease `[0.22, 1, 0.36, 1]`**

Final shape:

```tsx
'use client';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function AnimatedSection({ children, delay = 0, className }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

**Step 3: Build + lint**

```bash
npm run build && npm run lint
```

**Step 4: Commit**

```bash
git add app/components/AnimatedSection.tsx
git commit -m "refactor(AnimatedSection): only fade + translate-y"
```

---

### Task 15: Refactor `ContactForm` — flat styling

**Files:**
- Modify: `app/components/ContactForm.tsx`

**Step 1: Read existing implementation**

```bash
cat app/components/ContactForm.tsx
```

**Step 2: Update**

- Pull all visible strings via `useTranslations('contact')` keys: `formName`, `formEmail`, `formMessage`, `formSubmit`
- Drop card wrapper (`bg-white/5`, `backdrop-blur`, rounded card chrome)
- Use flat input style: transparent background, bottom-border only, focus = bottom-border becomes cyan
- Sample input class: `w-full bg-transparent border-b border-white/15 py-3 text-white placeholder-zinc-500 focus:border-[#06B6D4] focus:outline-none transition-colors`

**Step 3: Verify build + manual submit test**

```bash
npm run dev
```

Fill out and submit form, confirm Formspree still receives.

**Step 4: Commit**

```bash
git add app/components/ContactForm.tsx
git commit -m "refactor(ContactForm): flat styling, i18n strings"
```

---

# Phase 6 — Page rewrite

### Task 16: Build new `Hero` section component

**Files:**
- Create: `app/components/sections/Hero.tsx`

**Step 1: Create the section directory**

```bash
mkdir app/components/sections
```

**Step 2: Implementation**

```tsx
'use client';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('hero');
  return (
    <section id="home" aria-label="Introduction" className="relative flex min-h-screen items-center px-6 pt-24 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#06B6D4]"
        >
          {t('eyebrow')}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[18ch] text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          {t('title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 lg:text-xl"
        >
          {t('subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-wrap gap-4"
        >
          <a
            href="#projects"
            className="rounded-full bg-[#06B6D4] px-7 py-3.5 font-semibold text-white transition-colors hover:bg-[#0891B2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
          >
            {t('ctaPrimary')} <span aria-hidden="true">→</span>
          </a>
          <a
            href="#contact"
            className="rounded-full border border-white/15 px-7 py-3.5 font-medium text-zinc-200 transition-colors hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {t('ctaSecondary')}
          </a>
        </motion.div>
      </div>
      <div aria-hidden="true" className="absolute bottom-8 right-8 hidden flex-col items-center gap-3 text-xs uppercase tracking-widest text-zinc-600 lg:flex">
        <span>{t('scrollIndicator')}</span>
        <span className="h-12 w-px bg-gradient-to-b from-zinc-700 to-transparent" />
      </div>
    </section>
  );
}
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add app/components/sections/Hero.tsx
git commit -m "feat(sections): add new Hero"
```

---

### Task 17: Build new `Services` section

**Files:**
- Create: `app/components/sections/Services.tsx`

**Step 1: Implementation**

```tsx
import { useTranslations } from 'next-intl';
import ServiceCard from '../ServiceCard';

const items = [
  { key: 'websites', href: '#project-banciu' },
  { key: 'ai', href: '#project-aurasjobs' },
  { key: 'internal', href: '#project-stereocad' },
] as const;

export default function Services() {
  const t = useTranslations('services');
  return (
    <section id="services" aria-labelledby="services-heading" className="relative px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 max-w-2xl">
          <h2 id="services-heading" className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
            {t('sectionTitle')}
          </h2>
          <p className="mt-4 text-lg text-zinc-400">{t('sectionSubtitle')}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {items.map(({ key, href }) => (
            <ServiceCard
              key={key}
              number={t(`items.${key}.number`)}
              title={t(`items.${key}.title`)}
              body={t(`items.${key}.body`)}
              linkLabel={t(`items.${key}.linkLabel`)}
              href={href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add app/components/sections/Services.tsx
git commit -m "feat(sections): add new Services"
```

---

### Task 18: Build new `Projects` section

**Files:**
- Create: `app/components/sections/Projects.tsx`

**Step 1: Implementation**

```tsx
import { useTranslations } from 'next-intl';
import ProjectShowcase from '../ProjectShowcase';

const projects = [
  {
    key: 'banciuCostin',
    anchor: 'project-banciu',
    image: '/projects/banciu-preview.png',
    liveUrl: 'https://www.banciucostin.ro',
    sourceUrl: 'https://github.com/ClaudiuNSL',
  },
  {
    key: 'aurasjobs',
    anchor: 'project-aurasjobs',
    image: '/projects/aurasjobs-preview.png',
    liveUrl: 'https://aurasjobs-automations.vercel.app/',
    sourceUrl: 'https://github.com/cristianCeamatuAssist/aurasjobs-automations',
  },
  {
    key: 'stereocad',
    anchor: 'project-stereocad',
    image: '/projects/stereocad-preview.png',
    sourceUrl: 'https://github.com/cristianCeamatuAssist/stereocad-automations',
  },
] as const;

export default function Projects() {
  const t = useTranslations('projects');
  return (
    <section id="projects" aria-labelledby="projects-heading" className="relative px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 max-w-2xl">
          <h2 id="projects-heading" className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
            {t('sectionTitle')}
          </h2>
          <p className="mt-4 text-lg text-zinc-400">{t('sectionSubtitle')}</p>
        </div>
        <div className="space-y-32">
          {projects.map((p, i) => (
            <div key={p.key} id={p.anchor} className="scroll-mt-24">
              <ProjectShowcase
                title={t(`items.${p.key}.title`)}
                kicker={t(`items.${p.key}.kicker`)}
                body={t(`items.${p.key}.body`)}
                tech={t.raw(`items.${p.key}.tech`) as string[]}
                image={p.image}
                liveUrl={p.liveUrl}
                sourceUrl={p.sourceUrl}
                viewLiveLabel={t('viewLive')}
                viewSourceLabel={t('viewSource')}
                reverse={i % 2 === 1}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add app/components/sections/Projects.tsx
git commit -m "feat(sections): add new Projects"
```

---

### Task 19: Build new `Contact` section

**Files:**
- Create: `app/components/sections/Contact.tsx`

**Step 1: Implementation**

```tsx
import { useTranslations } from 'next-intl';
import ContactForm from '../ContactForm';

export default function Contact() {
  const t = useTranslations('contact');
  return (
    <section id="contact" aria-labelledby="contact-heading" className="relative px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 id="contact-heading" className="max-w-[14ch] text-4xl font-bold tracking-tight text-white lg:text-6xl">
              {t('sectionTitle')}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">{t('sectionSubtitle')}</p>
            <div className="mt-10 space-y-3 text-sm">
              <p className="text-zinc-500">{t('directContactLabel')}</p>
              <a href="mailto:claudiucomsa29@gmail.com" className="block text-zinc-200 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                claudiucomsa29@gmail.com
              </a>
              <a href="tel:+40761880406" className="block text-zinc-200 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                0761 880 406
              </a>
              <a href="https://www.linkedin.com/in/claudiu-comsa-72b552364/" target="_blank" rel="noopener noreferrer" className="block text-zinc-200 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                LinkedIn
              </a>
              <a href="https://github.com/ClaudiuNSL" target="_blank" rel="noopener noreferrer" className="block text-zinc-200 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                GitHub
              </a>
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add app/components/sections/Contact.tsx
git commit -m "feat(sections): add new Contact"
```

---

### Task 20: Rewrite `app/[locale]/page.tsx` to assemble new sections

**Files:**
- Rewrite: `app/[locale]/page.tsx`

**Step 1: Replace entire file**

```tsx
import { setRequestLocale } from 'next-intl/server';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import ScrollProgress from '@/app/components/ScrollProgress';
import Hero from '@/app/components/sections/Hero';
import Services from '@/app/components/sections/Services';
import Projects from '@/app/components/sections/Projects';
import Contact from '@/app/components/sections/Contact';
import type { Locale } from '@/i18n/routing';

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#06B6D4] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
```

**Step 2: Move structured data (JSON-LD) into this page, regenerated per-locale**

Add at the top of the returned JSX (before `<a href="#home"...`), build JSON-LD using `getTranslations` for service descriptions in the right language. Use 3 services aligned with new design (Websites, AI agents, Internal apps) — drop UI/UX Design from the schema.

**Step 3: Verify build + visual sweep**

```bash
npm run build && npm run dev
```

- `/ro` loads the new homepage in Romanian
- `/en` loads it in English
- Language switcher toggles between them, preserves scroll position best-effort
- All anchor links (`#services`, `#projects`, `#contact`, `#project-banciu` etc.) scroll correctly
- No console errors
- Reduced motion: tap "stop animations" in AccessibilityWidget, confirm motion stops

**Step 4: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat: assemble new homepage with 4 sections + bilingual JSON-LD"
```

---

# Phase 7 — Cleanup sub-routes + SEO polish

### Task 21: Update or simplify `/services` and `/projects` sub-pages

**Files:**
- Modify or remove: `app/[locale]/services/page.tsx`
- Modify or remove: `app/[locale]/projects/page.tsx`

**Step 1: Decide per-page**

For now, the new design fits everything on the homepage. The `/services` and `/projects` sub-pages from the old site duplicate content. **Decision: redirect both to homepage anchors.**

Replace each with:

```tsx
// app/[locale]/services/page.tsx
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export default async function ServicesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect({ href: '/#services', locale });
}
```

Same for `/projects`:

```tsx
// app/[locale]/projects/page.tsx
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  redirect({ href: '/#projects', locale });
}
```

**Step 2: Update sitemap to drop the dead routes (or keep as redirect targets)**

In `app/sitemap.ts`, since `/services` and `/projects` now just redirect to anchors, drop them from the sitemap (only homepage URL listed per locale). Anchors don't need to be in the sitemap — search engines handle them via on-page links.

```ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.claudiucomsa.com';
  const locales = ['ro', 'en'] as const;
  return locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 1,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}`])),
    },
  }));
}
```

**Step 3: Verify build**

```bash
npm run build
```

Confirm sitemap output contains only `/ro` and `/en` root entries with hreflang alternates.

**Step 4: Commit**

```bash
git add app/[locale]/services/page.tsx app/[locale]/projects/page.tsx app/sitemap.ts
git commit -m "refactor: redirect /services and /projects to homepage anchors"
```

---

### Task 22: Audit + clean up unused components

**Files:**
- Possibly remove: `app/components/SpotlightCard.tsx`, `app/components/TiltCard.tsx`, `app/components/ScrollScale.tsx`, `app/components/PageTransition.tsx`

**Step 1: Grep each for usage**

```bash
for c in SpotlightCard TiltCard ScrollScale PageTransition; do
  echo "=== $c ==="
  grep -rn "$c" app/ --include="*.tsx" --include="*.ts" | grep -v "app/components/$c.tsx"
done
```

**Step 2: Delete any component with zero references outside its own file**

For each unused: `git rm app/components/<Name>.tsx`.

**Step 3: Verify build + lint**

```bash
npm run build && npm run lint
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove unused components after redesign"
```

---

# Phase 8 — Final verification + deploy

### Task 23: Manual visual + accessibility audit

**Step 1: Dev server**

```bash
npm run dev
```

**Step 2: Walk through both locales**

Open `/ro` and `/en`, verify:
- Hero headline renders large, copy correct per locale
- Eyebrow + sub + 2 CTAs visible
- Language switcher visible top-right, toggles correctly, preserves scroll
- 3 service cards with numbers `01 / 02 / 03`, hover state activates
- "See example →" links scroll to correct project section
- 3 projects alternate left/right, images load, tech tags render, CTAs work
- Contact section: form submits to Formspree, direct contact links work
- Footer: 3 link group + language switcher + copyright
- Mobile (DevTools narrow viewport): nav collapses, mobile menu opens, language switcher accessible on mobile

**Step 3: A11y check**

In Chrome DevTools → Lighthouse → Accessibility:
- Run audit on `/ro`. Target: ≥95.
- Heading hierarchy: H1 only in Hero, H2 per section. Verify SSR (View Source → Ctrl-F H1) — H1 must be in SSR HTML.
- Reduced motion: macOS System Preferences → Accessibility → Display → Reduce Motion (or Chrome flag). All animations should be near-instant.
- Tab through entire page — every interactive element must show a visible focus ring.

**Step 4: Lighthouse Performance**

Target: Performance ≥90, Best Practices ≥95, SEO ≥95.
Common fixes if low: optimize image sizes, ensure `priority` only on the first image, defer non-critical JS.

**Step 5: No commit (verification only). Document any issues found.**

If issues, file follow-up tasks. If clean, proceed.

---

### Task 24: Push to GitHub and check Vercel preview

**Step 1: Push**

```bash
git push -u origin feature/redesign-2026
```

**Step 2: Open Vercel dashboard, wait for preview deploy**

URL format: `https://claudiu-dev-portofoliu-git-feature-redesign-2026-<...>.vercel.app`

**Step 3: Repeat manual visual sweep on preview URL**

Same checklist as Task 23, but on the production-built preview.

**Step 4: Share preview URL with stakeholders (just you, in this case) for sign-off**

No commit. This is the sign-off gate.

---

### Task 25: Merge to main

**Step 1: Create PR**

```bash
gh pr create --title "feat: portfolio redesign 2026 (RO + EN, studio voice)" --body "$(cat <<'EOF'
## Summary
- Bilingual (RO + EN) with proper i18n routing via next-intl
- Premium editorial direction: deeper black base, cyan accent only, big Geist headlines, asymmetric hero, alternating project showcases
- 4 sections only (Hero → Services → Projects → Contact); About / Testimonials / Tech Stack grid / Map dropped
- Dropped: TypeWriter, MagneticButton, FloatingParticles, TextReveal, AuroraBackground, TestimonialsCarousel, TechStack, LoadingScreen, CursorGlow
- Added: GradientOrbs, LanguageSwitcher, ServiceCard, ProjectShowcase + new Hero/Services/Projects/Contact section files
- /services and /projects sub-routes now redirect to homepage anchors

## Test plan
- [x] Build clean (`npm run build`)
- [x] Lint clean (`npm run lint`)
- [x] Both `/ro` and `/en` render correctly
- [x] Language switcher preserves route
- [x] All anchor links work
- [x] Lighthouse Accessibility ≥ 95
- [x] Lighthouse SEO ≥ 95
- [x] Mobile responsive
- [x] Reduced motion respected
- [x] Form submits to Formspree

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 2: Merge after self-review**

Use GitHub UI or:

```bash
gh pr merge --squash --delete-branch
```

**Step 3: Confirm deploy to production at claudiucomsa.com**

---

# Outstanding follow-ups (not in this plan)

1. **Domain email** — set up `claudiu@claudiucomsa.com` via Namecheap email forwarding. Update `mailto:` references throughout site once configured.
2. **banciucostin.ro SEO** — separate repo, separate work.
3. **Real testimonials** — collect 2-3 from real clients, re-add testimonials block.
4. **Per-project case-study pages** — if business case justifies it, build `/[locale]/projects/[slug]` deeper pages.
5. **CustomCursor enhancement** — currently dropped CursorGlow; if a refined cursor is wanted later, build a new `CustomCursor` component behind `prefers-reduced-motion` guard.
6. **CSP review** — verify CSP still allows `next-intl` runtime (no inline script issues from i18n).

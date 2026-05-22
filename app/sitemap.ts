import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { CASES } from '@/app/[locale]/projects/_data/cases';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.claudiucomsa.com';
  const locales = routing.locales;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Homepage per locale.
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}`])),
      },
    });
  }

  // /projects index per locale.
  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}/projects`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${baseUrl}/${l}/projects`])
        ),
      },
    });
  }

  // /projects/[slug] per (locale, case).
  for (const locale of locales) {
    for (const c of CASES) {
      entries.push({
        url: `${baseUrl}/${locale}/projects/${c.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${baseUrl}/${l}/projects/${c.slug}`])
          ),
        },
      });
    }
  }

  return entries;
}

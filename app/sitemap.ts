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

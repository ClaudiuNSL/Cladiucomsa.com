// JSON-LD @graph generat per-locale: Person, LocalBusiness și 3 Service-uri.
// Descrierile pentru servicii și business sunt trase din mesajele next-intl,
// deci /ro și /en emit fiecare un graf canonic propriu, în limba potrivită.
import type { Locale } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

export async function getJsonLd(locale: Locale) {
  const tServices = await getTranslations({ locale, namespace: 'services.items' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });
  const baseUrl = 'https://www.claudiucomsa.com';
  const localeUrl = `${baseUrl}/${locale}`;
  const personId = `${localeUrl}/#person`;
  const businessId = `${localeUrl}/#business`;
  const inLanguage = locale === 'ro' ? 'ro-RO' : 'en-US';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: 'Comsa Claudiu',
        jobTitle: 'Web Developer',
        url: localeUrl,
        email: 'claudiucomsa29@gmail.com',
        telephone: '+40761880406',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Constanța',
          addressCountry: 'Romania',
        },
        sameAs: [
          'https://github.com/ClaudiuNSL',
          'https://www.linkedin.com/in/claudiu-comsa-72b552364/',
        ],
        inLanguage,
      },
      {
        '@type': 'LocalBusiness',
        '@id': businessId,
        name: 'Comsa Claudiu',
        description: tMeta('description'),
        url: localeUrl,
        email: 'claudiucomsa29@gmail.com',
        telephone: '+40761880406',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Constanța',
          addressCountry: 'Romania',
        },
        sameAs: [
          'https://github.com/ClaudiuNSL',
          'https://www.linkedin.com/in/claudiu-comsa-72b552364/',
        ],
        inLanguage,
      },
      {
        '@type': 'Service',
        name: tServices('websites.title'),
        serviceType: 'Web Development',
        description: tServices('websites.body'),
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
      {
        '@type': 'Service',
        name: tServices('ai.title'),
        serviceType: 'AI Integration',
        description: tServices('ai.body'),
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
      {
        '@type': 'Service',
        name: tServices('internal.title'),
        serviceType: 'Internal Applications',
        description: tServices('internal.body'),
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
    ],
  };
}

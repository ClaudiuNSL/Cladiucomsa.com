// Locale-aware JSON-LD @graph: Person, LocalBusiness, and 4 Service entries.
// Task 20 will reduce Services to 3 with bilingual descriptions; for now we
// keep the original 4 entries from the pre-i18n root layout, with locale-aware
// @id and inLanguage so /ro and /en each emit their own canonical graph.
import type { Locale } from '@/i18n/routing';

export function getJsonLd(locale: Locale) {
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
        inLanguage,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Constanța',
          addressCountry: 'Romania',
        },
        sameAs: [
          'https://github.com/ClaudiuNSL',
          'https://www.linkedin.com/in/claudiu-comsa-72b552364/',
        ],
      },
      {
        '@type': 'LocalBusiness',
        '@id': businessId,
        name: 'Comsa Claudiu',
        description:
          'Web Developer & Freelancer specializat în creare site-uri și aplicații web moderne.',
        url: localeUrl,
        email: 'claudiucomsa29@gmail.com',
        telephone: '+40761880406',
        inLanguage,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Constanța',
          addressCountry: 'Romania',
        },
        sameAs: [
          'https://github.com/ClaudiuNSL',
          'https://www.linkedin.com/in/claudiu-comsa-72b552364/',
        ],
      },
      {
        '@type': 'Service',
        name: 'Web Development',
        serviceType: 'Web Development',
        description:
          'Site-uri și aplicații web moderne, responsive și optimizate (SEO, performanță). Construite cu React și Next.js.',
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
      {
        '@type': 'Service',
        name: 'AI Integration',
        serviceType: 'AI Integration',
        description:
          'Integrare AI în aplicații existente: chatbots, generare de conținut, agenți de email, automatizări inteligente.',
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
      {
        '@type': 'Service',
        name: 'Custom Solutions',
        serviceType: 'Custom Web Solutions',
        description:
          'Soluții web custom: dashboard-uri, sisteme de management, platforme interne și tool-uri pentru workflow-uri specifice.',
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
      {
        '@type': 'Service',
        name: 'UI/UX Design',
        serviceType: 'UI/UX Design',
        description:
          'Design de interfețe intuitive cu focus pe experiența utilizatorului, accesibilitate și consistență vizuală.',
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
    ],
  };
}

// JSON-LD @graph generat per-locale: Person, LocalBusiness și 3 Service-uri.
// Service-urile sunt hardcodate per-locale aici (independent de copy-ul cinematic),
// ca să rămână stabile pentru SEO chiar dacă textul homepage-ului se schimbă.
import type { Locale } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

type ServiceCopy = { title: string; description: string };

const SERVICES: Record<Locale, { websites: ServiceCopy; ai: ServiceCopy; internal: ServiceCopy }> = {
  ro: {
    websites: {
      title: 'Site-uri web profesionale',
      description:
        'Site-uri rapide, optimizate SEO, responsive. Pentru clienți care au nevoie de prezență digitală solidă — nu de încă un template.',
    },
    ai: {
      title: 'Agenți AI & automatizări',
      description:
        'Procesare automată email, generare conținut, agenți care iau decizii. Integrăm OpenAI, Anthropic, Gemini — alegem ce se potrivește.',
    },
    internal: {
      title: 'Aplicații interne & dashboard-uri',
      description:
        'Platforme interne care înlocuiesc ore de muncă manuală. Autentificare securizată, monitoring în timp real, export pe ce format ai nevoie.',
    },
  },
  en: {
    websites: {
      title: 'Professional websites',
      description:
        'Fast, SEO-optimized, responsive websites. For clients who need a real digital presence — not another template.',
    },
    ai: {
      title: 'AI agents & automations',
      description:
        'Automated email processing, content generation, decision-making agents. We integrate OpenAI, Anthropic, Gemini — we pick what fits.',
    },
    internal: {
      title: 'Internal apps & dashboards',
      description:
        'Internal platforms that replace hours of manual work. Secure auth, real-time monitoring, exports in any format you need.',
    },
  },
};

export async function getJsonLd(locale: Locale) {
  const tMeta = await getTranslations({ locale, namespace: 'meta' });
  const services = SERVICES[locale];
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
        name: services.websites.title,
        serviceType: 'Web Development',
        description: services.websites.description,
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
      {
        '@type': 'Service',
        name: services.ai.title,
        serviceType: 'AI Integration',
        description: services.ai.description,
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
      {
        '@type': 'Service',
        name: services.internal.title,
        serviceType: 'Internal Applications',
        description: services.internal.description,
        provider: { '@id': personId },
        areaServed: { '@type': 'Country', name: 'Romania' },
      },
    ],
  };
}

// Date statice non-traductibile pentru case studies. Slug-ul e cheia pentru
// rutare /[locale]/projects/[slug]; key-ul mapeaza catre messages.projects.items.{key}.
// Social: prezenta sociala a clientului (Instagram / Facebook / etc.) — afisata
// in SocialBlock ca "publicitate gratuita" pentru clientul existent.
export const CASES = [
  {
    slug: 'banciu-costin',
    key: 'banciuCostin',
    image: '/projects/banciu-preview.jpg',
    imageWidth: 1920,
    imageHeight: 947,
    live: 'https://banciucostin.ro',
    number: 'P01',
    displayName: 'Costin',
    social: {
      instagram: 'https://www.instagram.com/costin_banciu_photography/',
      facebook: 'https://www.facebook.com/profile.php?id=100010923931840',
    },
  },
  {
    slug: 'aurasjobs',
    key: 'aurasjobs',
    image: '/projects/aurasjobs-preview.jpg',
    imageWidth: 1920,
    imageHeight: 947,
    live: 'https://aurasjobs.com',
    number: 'P02',
    displayName: 'Aurasjobs',
    social: {},
  },
  {
    slug: 'stereocad',
    key: 'stereocad',
    image: '/projects/stereocad-preview.jpg',
    imageWidth: 1920,
    imageHeight: 947,
    live: 'https://stereocad.ro',
    number: 'P03',
    displayName: 'Stereocad',
    social: {},
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

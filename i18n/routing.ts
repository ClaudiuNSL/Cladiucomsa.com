import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ro', 'en'] as const,
  defaultLocale: 'ro',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

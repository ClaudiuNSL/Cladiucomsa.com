// Using next-intl v4 (not v3) because v3's peer dep caps at Next 15;
// this project runs Next 16. v4 API surface used here is compatible.
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ro', 'en'] as const,
  defaultLocale: 'ro',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

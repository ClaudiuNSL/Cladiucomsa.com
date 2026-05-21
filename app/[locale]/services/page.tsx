import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/#section-3', locale: locale as Locale });
}

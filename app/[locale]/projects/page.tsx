import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/#projects', locale: locale as Locale });
}

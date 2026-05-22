import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { routing, type Locale } from '@/i18n/routing';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import CaseStudy from './_components/CaseStudy';
import { CASES, getCase } from '../_data/cases';

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const c of CASES) params.push({ locale, slug: c.slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = getCase(slug);
  if (!c) return {};
  const t = await getTranslations({ locale, namespace: `projects.items.${c.key}` });
  const title = t('title');
  const description = t('body');
  return {
    title,
    description,
    openGraph: {
      url: `https://www.claudiucomsa.com/${locale}/projects/${slug}`,
      title: `${title} | Comsa Claudiu`,
      description,
      type: 'article',
      images: [
        { url: c.image, width: c.imageWidth, height: c.imageHeight, alt: title },
      ],
    },
    twitter: { card: 'summary_large_image', images: [c.image] },
    alternates: {
      canonical: `https://www.claudiucomsa.com/${locale}/projects/${slug}`,
      languages: {
        ro: `https://www.claudiucomsa.com/ro/projects/${slug}`,
        en: `https://www.claudiucomsa.com/en/projects/${slug}`,
        'x-default': `https://www.claudiucomsa.com/ro/projects/${slug}`,
      },
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const c = getCase(slug);
  if (!c) notFound();
  return (
    <>
      <Navbar />
      <main>
        <CaseStudy caseSlug={c.slug} />
      </main>
      <Footer />
    </>
  );
}

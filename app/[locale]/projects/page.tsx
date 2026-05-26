// Pagina index a portofoliului — listare row-based a celor 3 case studies.
// Inlocuieste redirect-ul vechi (care trimitea la /#section-2). Acum
// /projects e o destinatie reala, indexata, cu propriul metadata.
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { CASES } from './_data/cases';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects' });
  return {
    title: t('indexTitle'),
    description: t('indexLead'),
    openGraph: {
      url: `https://www.claudiucomsa.com/${locale}/projects`,
      title: `${t('indexTitle')} | Comsa Claudiu`,
      description: t('indexLead'),
    },
    alternates: {
      canonical: `https://www.claudiucomsa.com/${locale}/projects`,
      languages: {
        ro: 'https://www.claudiucomsa.com/ro/projects',
        en: 'https://www.claudiucomsa.com/en/projects',
        'x-default': 'https://www.claudiucomsa.com/ro/projects',
      },
    },
  };
}

export default async function ProjectsIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('projects');

  return (
    <>
      <Navbar />
      <main className="relative">
        {/* HEADER — counter + eyebrow + titlu + lead */}
        <section className="relative px-8 pt-32 pb-16 lg:px-12 lg:pt-40">
          <div className="absolute left-8 top-24 flex items-center gap-3 border-l border-[var(--border-soft)] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)] lg:left-12 lg:top-32">
            <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
            <span className="text-white">02</span>
            <span className="h-px w-8 bg-[var(--border-soft)]" aria-hidden="true" />
            <span>Projects · Index</span>
          </div>
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
              {t('eyebrow')}
            </p>
            <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              {t('indexTitle')}
            </h1>
            <div className="mt-10 h-px w-24 bg-[var(--border-soft)]" aria-hidden="true" />
            <p className="mt-8 max-w-2xl text-base leading-[1.6] text-[var(--text-mid)] lg:text-lg">
              {t('indexLead')}
            </p>
          </div>
        </section>

        {/* LISTA row-based */}
        <section className="px-8 pb-32 lg:px-12">
          <ul className="mx-auto max-w-5xl divide-y divide-[var(--border-soft)] border-y border-[var(--border-soft)]">
            {CASES.map((c) => {
              const tech = t(`items.${c.key}.tech`).split(' · ').slice(0, 2);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/projects/${c.slug}`}
                    className="group grid grid-cols-12 items-center gap-6 py-10 transition-colors hover:bg-white/[0.015]"
                  >
                    <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-quiet)]/70 lg:col-span-1">
                      {c.number}
                    </span>
                    <div className="col-span-7">
                      <h3 className="text-3xl font-semibold tracking-[-0.03em] text-white transition-transform duration-300 group-hover:translate-x-1 lg:text-4xl">
                        {t(`items.${c.key}.title`)}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--text-mid)]">
                        {t(`items.${c.key}.kicker`)}
                      </p>
                    </div>
                    <div className="col-span-2 hidden flex-wrap gap-1.5 lg:flex">
                      {tech.map((chip, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-[var(--border-soft)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-quiet)]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <span className="col-span-2 text-right text-xl text-[var(--text-quiet)]/70 transition-colors duration-300 group-hover:text-white lg:col-span-1">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}

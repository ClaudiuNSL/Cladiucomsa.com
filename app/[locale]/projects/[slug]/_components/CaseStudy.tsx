'use client';
// Pagina case study — Hero -> Cover -> Context -> Approach -> Result + Metrics
// -> Footer-case (back/next). Reveal-uri GSAP identice cu Story.tsx, no 3D,
// no parallax. Pattern vizual identic cu sectiunile cinematic dar singura
// coloana de citit, max-w-3xl, aliniat stanga.
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MetricGrid from '@/app/components/MetricGrid';
import SocialBlock, { type SocialLinks } from '@/app/components/SocialBlock';
import EffectButton from '@/app/components/EffectButton';
import { CASES, getNextCase, type CaseSlug } from '../../_data/cases';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type Metric = { value: string; label: string };

export default function CaseStudy({ caseSlug }: { caseSlug: CaseSlug }) {
  const t = useTranslations('projects');
  const rootRef = useRef<HTMLDivElement>(null);

  const current = CASES.find((c) => c.slug === caseSlug)!;
  const next = getNextCase(caseSlug);
  const itemKey = current.key;

  // Tech-ul vine ca string cu separator ` · ` — il spargem pentru chip-uri.
  const techChips = t(`items.${itemKey}.tech`).split(' · ');

  // Body-urile sectiunilor pot contine \n\n pentru paragrafe separate.
  const contextParas = t(`items.${itemKey}.context.body`).split('\n\n');
  const approachParas = t(`items.${itemKey}.approach.body`).split('\n\n');
  const resultBody = t(`items.${itemKey}.result.body`);
  const metrics = t.raw(`items.${itemKey}.result.metrics`) as Metric[];

  useEffect(() => {
    if (!rootRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const items = rootRef.current!.querySelectorAll('[data-reveal]');
      gsap.fromTo(
        items,
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [caseSlug]);

  return (
    <div ref={rootRef}>
      {/* HERO sectiune — counter + eyebrow + titlu mare + kicker + chips + CTA */}
      <section
        aria-label={`Case study — ${t(`items.${itemKey}.title`)}`}
        className="relative px-8 pt-32 pb-16 lg:px-12 lg:pt-40"
      >
        <SectionCounter index={1} label={`${t('case.counter')} · ${current.number}`} />
        <div className="mx-auto max-w-3xl">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
            {t('eyebrow')}
          </p>
          <h1
            data-reveal
            className="mt-8 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
          >
            {t(`items.${itemKey}.title`)}
          </h1>
          <p data-reveal className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-quiet)]">
            {t(`items.${itemKey}.kicker`)}
          </p>
          <div data-reveal className="mt-10 h-px w-24 bg-[var(--border-soft)]" aria-hidden="true" />
          <p data-reveal className="mt-8 max-w-2xl text-base leading-[1.6] text-[var(--text-mid)] lg:text-lg">
            {t(`items.${itemKey}.body`)}
          </p>

          <div data-reveal className="mt-10 flex flex-wrap gap-2">
            {techChips.map((tech, i) => (
              <span
                key={i}
                className="rounded-full border border-[var(--border-soft)] bg-white/[0.02] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-mid)]"
              >
                {tech}
              </span>
            ))}
          </div>

          <div data-reveal className="mt-12 flex flex-wrap items-center gap-6">
            <EffectButton text={t('viewLive')} href={current.live} variant="secondary" trailing="↗" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-quiet)]/70">
              {current.live.replace(/^https?:\/\//, '')}
            </span>
          </div>
        </div>
      </section>

      {/* COVER IMAGE — full-bleed-ish, rounded, subtle border */}
      <section className="px-8 pb-24 lg:px-12">
        <div data-reveal className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-zinc-900">
            <Image
              src={current.image}
              alt={t(`items.${itemKey}.title`)}
              width={current.imageWidth}
              height={current.imageHeight}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* CONTEXT sectiune */}
      <CaseSection
        index={2}
        counter={t('case.context.eyebrow')}
        eyebrow={t('case.context.eyebrow')}
        title={t('case.context.title')}
        paragraphs={contextParas}
      />

      {/* APPROACH sectiune */}
      <CaseSection
        index={3}
        counter={t('case.approach.eyebrow')}
        eyebrow={t('case.approach.eyebrow')}
        title={t('case.approach.title')}
        paragraphs={approachParas}
      />

      {/* RESULT sectiune + metrics */}
      <section className="relative border-t border-[var(--border-hair)] px-8 py-32 lg:px-12">
        <SectionCounter index={4} label={t('case.result.eyebrow')} />
        <div className="mx-auto max-w-3xl">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
            {t('case.result.eyebrow')}
          </p>
          <h2
            data-reveal
            className="mt-8 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-white lg:text-5xl"
          >
            {t('case.result.title')}
          </h2>
          <div data-reveal className="mt-10 h-px w-24 bg-[var(--border-soft)]" aria-hidden="true" />
          <p data-reveal className="mt-10 text-base leading-[1.7] text-[var(--text-mid)] lg:text-lg">
            {resultBody}
          </p>
          <MetricGrid metrics={metrics} />
        </div>
      </section>

      {/* SOCIAL block — publicitate gratuita pentru client, "wow" pentru viitori clienti */}
      <SocialBlock
        social={current.social as SocialLinks}
        displayName={current.displayName}
      />

      {/* FOOTER case — back / next */}
      <section className="border-t border-[var(--border-hair)] px-8 py-20 lg:px-12">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/projects"
            className="group flex flex-col gap-2 text-left hover:text-white"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-quiet)]/70">
              ← {t('backToIndex')}
            </span>
            <span className="text-sm text-[var(--text-mid)] transition-colors group-hover:text-white">
              {t('sectionTitle')}
            </span>
          </Link>
          <Link
            href={`/projects/${next.slug}`}
            className="group flex flex-col gap-2 text-right"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-quiet)]/70">
              {t('nextCase')} →
            </span>
            <span className="text-sm text-[var(--text-soft)] transition-colors group-hover:text-white">
              {next.number} · {t(`items.${next.key}.title`)}
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Counter principal de sectiune cu dot + index + divider + label,
// ancorat de o linie subtila pe stanga. Identic cu cele din Hero/Story.
function SectionCounter({ index, label }: { index: number; label: string }) {
  return (
    <div className="absolute left-8 top-24 flex items-center gap-3 border-l border-[var(--border-soft)] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)] lg:left-12 lg:top-32">
      <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
      <span className="text-white">{String(index).padStart(2, '0')}</span>
      <span className="h-px w-8 bg-[var(--border-soft)]" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

// O sectiune de case study — eyebrow + titlu + linie + paragrafe.
function CaseSection({
  index,
  counter,
  eyebrow,
  title,
  paragraphs,
}: {
  index: number;
  counter: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <section className="relative border-t border-[var(--border-hair)] px-8 py-32 lg:px-12">
      <SectionCounter index={index} label={counter} />
      <div className="mx-auto max-w-3xl">
        <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
          {eyebrow}
        </p>
        <h2
          data-reveal
          className="mt-8 text-4xl font-semibold leading-[1.1] tracking-[-0.03em] text-white lg:text-5xl"
        >
          {title}
        </h2>
        <div data-reveal className="mt-10 h-px w-24 bg-[var(--border-soft)]" aria-hidden="true" />
        <div className="mt-10 space-y-6">
          {paragraphs.map((p, i) => (
            <p key={i} data-reveal className="text-base leading-[1.7] text-[var(--text-mid)] lg:text-lg">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

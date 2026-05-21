'use client';
// Pagina cinematic: 3 sectiuni stacked peste scena 3D fixa.
// Side rails verticale + counters per sectiune.
// Animatii fade+slide-up via GSAP ScrollTrigger.
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero() {
  const t = useTranslations('cinematic');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('[data-cinematic-section]');
      sections.forEach((section) => {
        const items = section.querySelectorAll('[data-reveal]');
        gsap.fromTo(
          items,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {/* Side rails — fixed across all sections */}
      <SideRails />

      {/* Section 1 */}
      <section
        id="section-1"
        data-cinematic-section
        aria-label="Section 1 — Intro"
        className="relative flex min-h-screen items-end px-8 pb-24 pt-24 lg:items-center lg:px-12 lg:pb-12"
      >
        <SectionCounter index={1} label={t('s1.counter')} />
        <div className="max-w-xl lg:max-w-2xl">
          <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
            {t('s1.eyebrow')}
          </p>
          <h1 data-reveal className="mt-6 text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
            {t('s1.title')}
          </h1>
          <p data-reveal className="mt-8 max-w-md text-base leading-relaxed text-zinc-400 lg:text-lg">
            {t('s1.body')}
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section
        id="section-2"
        data-cinematic-section
        aria-label="Section 2 — Work"
        className="relative flex min-h-screen items-end px-8 pb-24 pt-24 lg:items-center lg:px-12 lg:pb-12"
      >
        <SectionCounter index={2} label={t('s2.counter')} />
        <div className="max-w-xl lg:max-w-2xl">
          <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
            {t('s2.eyebrow')}
          </p>
          <h2 data-reveal className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {t('s2.title')}
          </h2>
          <p data-reveal className="mt-8 max-w-md text-base leading-relaxed text-zinc-400 lg:text-lg">
            {t('s2.body')}
          </p>
          <div data-reveal className="mt-10">
            <a
              href={`mailto:${t('s2.ctaHref')}`}
              className="group inline-flex items-center gap-3 rounded-full border border-white/20 px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.03] hover:border-white/60 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {t('s2.cta')}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section
        id="section-3"
        data-cinematic-section
        aria-label="Section 3 — Studio"
        className="relative flex min-h-screen items-end px-8 pb-24 pt-24 lg:items-center lg:px-12 lg:pb-12"
      >
        <SectionCounter index={3} label={t('s3.counter')} />
        <div className="max-w-xl lg:max-w-2xl">
          <p data-reveal className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
            {t('s3.eyebrow')}
          </p>
          <h2 data-reveal className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {t('s3.title')}
          </h2>
          <p data-reveal className="mt-8 max-w-md text-base leading-relaxed text-zinc-400 lg:text-lg">
            {t('s3.body')}
          </p>
          <div data-reveal className="mt-10">
            <a
              href={t('s3.ctaHref')}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full border border-white/20 px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.03] hover:border-white/60 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {t('s3.cta')}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionCounter({ index, label }: { index: number; label: string }) {
  return (
    <div className="absolute left-8 top-24 lg:left-12 lg:top-32 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
      <span className="text-white">{String(index).padStart(2, '0')}</span>
      <span className="h-px w-8 bg-white/20" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function SideRails() {
  const tRails = useTranslations('cinematic.rails');
  return (
    <>
      {/* Left rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
      >
        <span
          className="block text-[10px] font-medium uppercase tracking-[0.5em] text-zinc-500"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Claudiu Comsa
        </span>
      </div>
      {/* Right rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:flex"
      >
        <ul className="flex flex-col gap-6 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
          <li>{tRails('menu')}</li>
          <li>{tRails('work')}</li>
          <li>{tRails('studio')}</li>
          <li>{tRails('network')}</li>
        </ul>
      </div>
    </>
  );
}

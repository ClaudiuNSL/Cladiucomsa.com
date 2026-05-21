'use client';
// Pagina cinematic: 3 sectiuni stacked peste scena 3D fixa.
// Side rails verticale + counters per sectiune + page counter "01 / 03".
// Animatii fade+slide-up via GSAP ScrollTrigger.
// Polish premium: tracking strans, whitespace marit, linii de 1px,
// dot indicators, scroll cue pe Section 1.
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
        <PageCounter current={1} total={3} />
        <div className="max-w-xl lg:max-w-2xl">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
            {t('s1.eyebrow')}
          </p>
          <h1 data-reveal className="mt-8 text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl xl:text-8xl">
            {t('s1.title')}
          </h1>
          <div data-reveal className="mt-12 h-px w-24 bg-white/10" aria-hidden="true" />
          <p data-reveal className="mt-8 max-w-md text-base leading-[1.6] tracking-tight text-zinc-400 lg:text-lg">
            {t('s1.body')}
          </p>
        </div>
        {/* Cue de scroll subtil, doar pe Section 1 si numai pe desktop. */}
        <div
          data-reveal
          className="absolute bottom-12 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500">
            {t('scrollHint')}
          </span>
          <span className="block h-10 w-px overflow-hidden bg-white/10">
            <span className="block h-4 w-px animate-[scroll-cue_2.4s_ease-in-out_infinite] bg-white/60" />
          </span>
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
        <PageCounter current={2} total={3} />
        <div className="max-w-xl lg:max-w-2xl">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
            {t('s2.eyebrow')}
          </p>
          <p data-reveal className="mt-3 text-sm tracking-tight text-zinc-500">
            {t('s2.subtitle')}
          </p>
          <h2 data-reveal className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {t('s2.title')}
          </h2>
          <div data-reveal className="mt-12 h-px w-24 bg-white/10" aria-hidden="true" />
          <p data-reveal className="mt-8 max-w-md text-base leading-[1.6] tracking-tight text-zinc-400 lg:text-lg">
            {t('s2.body')}
          </p>
          <div data-reveal className="mt-12">
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
        <PageCounter current={3} total={3} />
        <div className="max-w-xl lg:max-w-2xl">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
            {t('s3.eyebrow')}
          </p>
          <p data-reveal className="mt-3 text-sm tracking-tight text-zinc-500">
            {t('s3.subtitle')}
          </p>
          <h2 data-reveal className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            {t('s3.title')}
          </h2>
          <div data-reveal className="mt-12 h-px w-24 bg-white/10" aria-hidden="true" />
          <p data-reveal className="mt-8 max-w-md text-base leading-[1.6] tracking-tight text-zinc-400 lg:text-lg">
            {t('s3.body')}
          </p>
          <div data-reveal className="mt-12">
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

// Counter principal de sectiune cu dot + index + divider + label,
// ancorat de o linie subtila pe stanga.
function SectionCounter({ index, label }: { index: number; label: string }) {
  return (
    <div className="absolute left-8 top-24 lg:left-12 lg:top-32 flex items-center gap-3 border-l border-white/[0.08] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
      <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
      <span className="text-white">{String(index).padStart(2, '0')}</span>
      <span className="h-px w-8 bg-white/20" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

// Counter de pagina pe partea opusa: "01 / 03". Decorativ, simbolic.
function PageCounter({ current, total }: { current: number; total: number }) {
  return (
    <div className="absolute right-8 top-24 lg:right-12 lg:top-32 hidden text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500 lg:block">
      <span className="text-white">{String(current).padStart(2, '0')}</span>
      <span className="text-zinc-700"> / {String(total).padStart(2, '0')}</span>
    </div>
  );
}

// Side rails — text vertical pe stanga, navigatie verticala pe dreapta.
// Dots intre item-uri pe dreapta, linie verticala subtila sub wordmark.
function SideRails() {
  const tRails = useTranslations('cinematic.rails');
  return (
    <>
      {/* Left rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center lg:flex"
      >
        <span
          className="block text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Claudiu Comsa
        </span>
        <span className="mx-auto mt-4 block h-12 w-px bg-white/10" />
      </div>
      {/* Right rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 lg:flex"
      >
        <ul className="flex flex-col items-center gap-3 text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500">
          <li>{tRails('menu')}</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
          </li>
          <li>{tRails('work')}</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
          </li>
          <li>{tRails('studio')}</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
          </li>
          <li>{tRails('network')}</li>
        </ul>
      </div>
    </>
  );
}

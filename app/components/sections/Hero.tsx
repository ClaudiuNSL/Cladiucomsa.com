'use client';
// Pagina cinematic: 3 sectiuni stacked peste scena 3D fixa.
// Side rails verticale + counters per sectiune + page counter "01 / 03".
// Animatii fade+slide-up via GSAP ScrollTrigger.
// Polish premium: tracking strans, whitespace marit, linii de 1px,
// dot indicators, scroll cue pe Section 1.
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EffectButton from '@/app/components/EffectButton';

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
    <div ref={rootRef} data-cinematic-wrapper className="relative">
      {/* Side rails — fixed across all sections */}
      <SideRails />

      {/* Section 1 */}
      <section
        id="section-1"
        data-cinematic-section
        aria-label="Section 1 — Intro"
        className="relative flex min-h-screen items-end pb-32 pt-24 px-8 lg:items-center lg:px-12 lg:pb-12"
      >
        <SectionCounter index={1} label={t('s1.counter')} />
        <PageCounter current={1} total={3} />
        {/* Grid 2-col pe lg+: text stanga, poza dreapta. Pe mobile poza apare
            deasupra textului ca sa nu fie ascunsa. */}
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
          {/* Photo — ordinea: pe mobile sus, pe desktop dreapta. */}
          <div data-reveal className="relative order-1 shrink-0 lg:order-2">
            {/* Glow finut — radial soft alb in spate. Strat dublu pentru blana
                catifelata: inel apropiat (10% alb) + halo larg (4% alb). */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-16 -z-10 rounded-full"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 55%, rgba(255,255,255,0) 80%)',
              }}
            />
            <div className="relative h-[300px] w-[225px] overflow-hidden rounded-2xl border border-white/10 sm:h-[380px] sm:w-[285px] lg:h-[460px] lg:w-[345px] xl:h-[540px] xl:w-[405px]">
              <Image
                src="/profil.jpg"
                alt="Claudiu Comșa"
                fill
                sizes="(min-width: 1280px) 405px, (min-width: 1024px) 345px, (min-width: 640px) 285px, 225px"
                className="object-cover"
                priority
              />
              {/* Vignette interna foarte subtila ca poza sa nu pluteasca prea
                  ascutit pe fundalul intunecat. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)',
                }}
              />
            </div>
          </div>
          {/* Text */}
          <div className="order-2 w-full max-w-xl text-center lg:order-1 lg:max-w-2xl lg:text-left">
            {/* Eyebrow ascuns pe mobile — rail-ul vertical "WEB · AI · CINEMATIC" il inlocuieste. */}
            <p data-reveal className="hidden text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500 lg:block">
              {t('s1.eyebrow')}
            </p>
            <h1 data-reveal className="text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:mt-8 lg:text-7xl xl:text-8xl">
              {t('s1.title')}
            </h1>
            <div data-reveal className="mx-auto mt-8 h-px w-24 bg-white/10 lg:mx-0 lg:mt-12" aria-hidden="true" />
            <p data-reveal className="mx-auto mt-6 max-w-md text-sm leading-[1.6] tracking-tight text-zinc-400 sm:text-base lg:mx-0 lg:mt-8 lg:text-lg">
              {t('s1.body')}
            </p>
          </div>
        </div>
        {/* Cue de scroll subtil, doar pe Section 1. */}
        <div
          data-reveal
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 lg:bottom-12"
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
        className="relative flex min-h-screen items-end pb-24 pt-24 px-8 lg:items-center lg:px-12 lg:pb-12"
      >
        <SectionCounter index={2} label={t('s2.counter')} />
        <PageCounter current={2} total={3} />
        <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
            {t('s2.eyebrow')}
          </p>
          <p data-reveal className="mt-3 text-sm tracking-tight text-zinc-500">
            {t('s2.subtitle')}
          </p>
          <h2 data-reveal className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:mt-8 lg:text-6xl xl:text-7xl">
            {t('s2.title')}
          </h2>
          <div data-reveal className="mx-auto mt-8 h-px w-24 bg-white/10 lg:mx-0 lg:mt-12" aria-hidden="true" />
          <p data-reveal className="mx-auto mt-6 max-w-md text-sm leading-[1.6] tracking-tight text-zinc-400 sm:text-base lg:mx-0 lg:mt-8 lg:text-lg">
            {t('s2.body')}
          </p>
          <div data-reveal className="mt-10 flex justify-center lg:mt-12 lg:justify-start">
            <EffectButton text={t('s2.cta')} href={t('s2.ctaHref')} variant="secondary" trailing="→" />
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section
        id="section-3"
        data-cinematic-section
        aria-label="Section 3 — Studio"
        className="relative flex min-h-screen items-end pb-24 pt-24 px-8 lg:items-center lg:px-12 lg:pb-12"
      >
        <SectionCounter index={3} label={t('s3.counter')} />
        <PageCounter current={3} total={3} />
        <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
            {t('s3.eyebrow')}
          </p>
          <p data-reveal className="mt-3 text-sm tracking-tight text-zinc-500">
            {t('s3.subtitle')}
          </p>
          <h2 data-reveal className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:mt-8 lg:text-6xl xl:text-7xl">
            {t('s3.title')}
          </h2>
          <div data-reveal className="mx-auto mt-8 h-px w-24 bg-white/10 lg:mx-0 lg:mt-12" aria-hidden="true" />
          <p data-reveal className="mx-auto mt-6 max-w-md text-sm leading-[1.6] tracking-tight text-zinc-400 sm:text-base lg:mx-0 lg:mt-8 lg:text-lg">
            {t('s3.body')}
          </p>
          <div data-reveal className="mt-10 flex justify-center lg:mt-12 lg:justify-start">
            <EffectButton text={t('s3.cta')} href={t('s3.ctaHref')} variant="secondary" trailing="→" />
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
    <div className="absolute left-8 top-20 lg:left-12 lg:top-32 flex items-center gap-3 border-l border-white/[0.08] pl-4 text-[9px] font-medium uppercase tracking-[0.3em] text-zinc-500 lg:text-[10px]">
      <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
      <span className="text-white">{String(index).padStart(2, '0')}</span>
      <span className="h-px w-6 bg-white/20 lg:w-8" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

// Counter de pagina pe partea opusa: "01 / 03". Decorativ, simbolic.
// Vizibil si pe mobile — apare in coltul dreapta-sus (vezi referinta).
function PageCounter({ current, total }: { current: number; total: number }) {
  return (
    <div className="absolute right-8 top-20 lg:right-12 lg:top-32 text-[9px] font-medium uppercase tracking-[0.3em] text-zinc-500 lg:text-[10px]">
      <span className="text-white">{String(current).padStart(2, '0')}</span>
      <span className="text-zinc-700"> / {String(total).padStart(2, '0')}</span>
    </div>
  );
}

// Side rails — pe stanga eyebrow-ul "WEB · AI · CINEMATIC" stacat vertical,
// pe dreapta navigatia verticala. Vizibil si pe mobile (vezi referinta).
function SideRails() {
  const tRails = useTranslations('cinematic.rails');
  return (
    <>
      {/* Left rail — eyebrow brand stacat vertical, in loc de wordmark cu writing-mode. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-4 top-1/2 z-30 flex -translate-y-1/2 lg:left-6"
      >
        <ul className="flex flex-col items-center gap-3 text-[9px] font-medium uppercase tracking-[0.4em] text-zinc-500 lg:text-[10px]">
          <li>Web</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
          </li>
          <li>AI</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
          </li>
          <li>Cinematic</li>
        </ul>
      </div>
      {/* Right rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-4 top-1/2 z-30 flex -translate-y-1/2 lg:right-6"
      >
        <ul className="flex flex-col items-center gap-3 text-[9px] font-medium uppercase tracking-[0.4em] text-zinc-500 lg:text-[10px]">
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

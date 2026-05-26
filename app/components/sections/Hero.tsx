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

      {/* Section 1 — Hero image-led, fullbleed cu peisaj cinematic */}
      <section
        id="section-1"
        data-cinematic-section
        aria-label="Section 1 — Intro"
        className="relative flex min-h-screen items-end overflow-hidden px-8 pb-24 pt-24 lg:px-16 lg:pb-20"
      >
        {/* Imagine fullbleed + 3 layere overlay pentru lizibilitate */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero/cave-explorer.png"
            alt=""
            fill
            sizes="100vw"
            quality={80}
            className="object-cover"
            style={{ objectPosition: 'center 35%' }}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzA3MDkwZiIvPjwvc3ZnPg=="
            priority
          />
          {/* Layer 1: gradient stanga — face textul lizibil pe partea cu continut */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, var(--bg-deep) 0%, rgba(7,9,15,0.55) 35%, transparent 75%)',
            }}
          />
          {/* Layer 2: vignette jos — fade catre culoarea de base a paginii */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, var(--bg-deep) 0%, transparent 35%)',
            }}
          />
          {/* Layer 3: grain noise overlay subtil — textura cinematic */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>

        <SectionCounter index={1} label={t('s1.counter')} />
        <PageCounter current={1} total={3} />

        {/* Continut — stanga-jos pe desktop, centru pe mobile. Wrappat in max-w
            pentru aerisire si lizibilitate. */}
        <div className="relative mx-auto w-full max-w-2xl text-center lg:mx-0 lg:max-w-3xl lg:text-left">
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-soft)]">
            {t('s1.eyebrow')}
          </p>
          <h1
            data-reveal
            className="mt-6 text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:mt-8 lg:text-6xl xl:text-7xl"
          >
            <span className="block">{t('s1.titleLine1')}</span>
            <span className="mt-1 block">
              {t('s1.titleLine2Pre')}
              <span
                className="italic font-normal"
                style={{ fontFamily: 'var(--font-fraunces), serif' }}
              >
                {t('s1.titleAccent')}
              </span>
              {t('s1.titleLine2Post')}
            </span>
          </h1>
          <div data-reveal className="mx-auto mt-8 h-px w-24 bg-[var(--border-soft)] lg:mx-0 lg:mt-10" aria-hidden="true" />
          <p data-reveal className="mx-auto mt-6 max-w-xl text-base leading-[1.65] text-[var(--text-mid)] sm:text-lg lg:mx-0 lg:mt-8">
            {t('s1.body')}
          </p>
          {/* Strip de servicii — editorial, separat cu middot */}
          <ul
            data-reveal
            className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-soft)] lg:mx-0 lg:justify-start"
          >
            {(t.raw('s1.services') as string[]).map((svc, i, arr) => (
              <li key={svc} className="inline-flex items-center gap-3">
                <span>{svc}</span>
                {i < arr.length - 1 && (
                  <span aria-hidden="true" className="text-[var(--text-quiet)]/60">·</span>
                )}
              </li>
            ))}
          </ul>
          {/* CTA pair — primary alb focal + secondary border ice-blue */}
          <div data-reveal className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <EffectButton
              text={t('s1.ctaPrimary')}
              href={t('s1.ctaPrimaryHref')}
              variant="primary"
              trailing="→"
            />
            <EffectButton
              text={t('s1.ctaSecondary')}
              href={t('s1.ctaSecondaryHref')}
              variant="secondary"
              trailing="→"
            />
          </div>
        </div>

        {/* Cue de scroll subtil, doar pe Section 1. */}
        <div
          data-reveal
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 lg:bottom-10"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--text-quiet)]">
            {t('scrollHint')}
          </span>
          <span className="block h-10 w-px overflow-hidden bg-[var(--border-soft)]">
            <span className="block h-4 w-px animate-[scroll-cue_2.4s_ease-in-out_infinite] bg-[var(--text-soft)]/70" />
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
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
            {t('s2.eyebrow')}
          </p>
          <p data-reveal className="mt-3 text-sm tracking-tight text-[var(--text-quiet)]">
            {t('s2.subtitle')}
          </p>
          <h2 data-reveal className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:mt-8 lg:text-6xl xl:text-7xl">
            {t('s2.title')}
          </h2>
          <div data-reveal className="mx-auto mt-8 h-px w-24 bg-[var(--border-soft)] lg:mx-0 lg:mt-12" aria-hidden="true" />
          <p data-reveal className="mx-auto mt-6 max-w-md text-sm leading-[1.6] tracking-tight text-[var(--text-mid)] sm:text-base lg:mx-0 lg:mt-8 lg:text-lg">
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
          <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
            {t('s3.eyebrow')}
          </p>
          <p data-reveal className="mt-3 text-sm tracking-tight text-[var(--text-quiet)]">
            {t('s3.subtitle')}
          </p>
          <h2 data-reveal className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:mt-8 lg:text-6xl xl:text-7xl">
            {t('s3.title')}
          </h2>
          <div data-reveal className="mx-auto mt-8 h-px w-24 bg-[var(--border-soft)] lg:mx-0 lg:mt-12" aria-hidden="true" />
          <p data-reveal className="mx-auto mt-6 max-w-md text-sm leading-[1.6] tracking-tight text-[var(--text-mid)] sm:text-base lg:mx-0 lg:mt-8 lg:text-lg">
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
    <div className="absolute left-8 top-20 lg:left-12 lg:top-32 flex items-center gap-3 border-l border-[var(--border-soft)] pl-4 text-[9px] font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)] lg:text-[10px]">
      <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
      <span className="text-white">{String(index).padStart(2, '0')}</span>
      <span className="h-px w-6 bg-[var(--border-soft)] lg:w-8" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

// Counter de pagina pe partea opusa: "01 / 03". Decorativ, simbolic.
// Vizibil si pe mobile — apare in coltul dreapta-sus (vezi referinta).
function PageCounter({ current, total }: { current: number; total: number }) {
  return (
    <div className="absolute right-8 top-20 lg:right-12 lg:top-32 text-[9px] font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)] lg:text-[10px]">
      <span className="text-white">{String(current).padStart(2, '0')}</span>
      <span className="text-[var(--text-quiet)]/40"> / {String(total).padStart(2, '0')}</span>
    </div>
  );
}

// Side rails — pe stanga eyebrow-ul "WEB · AI · CINEMATIC" stacat vertical,
// pe dreapta navigatia verticala. Vizibil si pe mobile (vezi referinta).
function SideRails() {
  const tRails = useTranslations('cinematic.rails');
  return (
    <>
      {/* Right rail — vizibil doar pe desktop, pe mobile inghesuie continutul */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 lg:right-6 lg:flex"
      >
        <ul className="flex flex-col items-center gap-3 text-[9px] font-medium uppercase tracking-[0.4em] text-[var(--text-quiet)] lg:text-[10px]">
          <li>{tRails('menu')}</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-[var(--text-soft)]/30" aria-hidden="true" />
          </li>
          <li>{tRails('work')}</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-[var(--text-soft)]/30" aria-hidden="true" />
          </li>
          <li>{tRails('studio')}</li>
          <li>
            <span className="mx-auto block h-1 w-1 rounded-full bg-[var(--text-soft)]/30" aria-hidden="true" />
          </li>
          <li>{tRails('network')}</li>
        </ul>
      </div>
    </>
  );
}

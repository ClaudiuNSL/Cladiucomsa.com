'use client';
// Projects — 3 ecrane stacked, fiecare un proiect, layout-ul moseneste paternul Hero.
// Reveal fade+slide-up per sectiune via GSAP ScrollTrigger.
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PROJECT_KEYS = ['banciuCostin', 'aurasjobs', 'stereocad'] as const;
type ProjectKey = (typeof PROJECT_KEYS)[number];

export default function Projects() {
  const t = useTranslations('projects');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>('[data-project-section]');
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
    <div ref={rootRef}>
      {PROJECT_KEYS.map((key, idx) => (
        <ProjectScreen key={key} projectKey={key} idx={idx} t={t} />
      ))}
    </div>
  );
}

interface ProjectScreenProps {
  projectKey: ProjectKey;
  idx: number;
  t: ReturnType<typeof useTranslations>;
}

// Un ecran de proiect — eyebrow, numar, titlu mare, kicker, body, tech, CTA "View live".
function ProjectScreen({ projectKey, idx, t }: ProjectScreenProps) {
  const counterIndex = String(5 + idx).padStart(2, '0');
  return (
    <section
      data-project-section
      id={`project-${projectKey}`}
      aria-label={`Project — ${t(`items.${projectKey}.title`)}`}
      className="relative flex min-h-screen items-end px-8 pb-24 pt-24 lg:items-center lg:px-12 lg:pb-12"
    >
      <div className="absolute left-8 top-24 flex items-center gap-3 border-l border-white/[0.08] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500 lg:left-12 lg:top-32">
        <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
        <span className="text-white">{counterIndex}</span>
        <span className="h-px w-8 bg-white/20" aria-hidden="true" />
        <span>
          {t('counter')} · {t(`items.${projectKey}.number`)}
        </span>
      </div>
      <div className="max-w-xl lg:max-w-2xl">
        <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
          {t('eyebrow')} · {t(`items.${projectKey}.number`)}
        </p>
        <h3
          data-reveal
          className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl"
        >
          {t(`items.${projectKey}.title`)}
        </h3>
        <p data-reveal className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          {t(`items.${projectKey}.kicker`)}
        </p>
        <div data-reveal className="mt-12 h-px w-24 bg-white/10" aria-hidden="true" />
        <p data-reveal className="mt-8 max-w-xl text-base leading-[1.6] text-zinc-400 lg:text-lg">
          {t(`items.${projectKey}.body`)}
        </p>
        <p data-reveal className="mt-6 text-xs font-medium uppercase tracking-[0.25em] text-zinc-600">
          {t(`items.${projectKey}.tech`)}
        </p>
        <div data-reveal className="mt-10">
          <a
            href={t(`items.${projectKey}.href`)}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full border border-white/20 px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.03] hover:border-white/60 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {t('viewLive')}
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

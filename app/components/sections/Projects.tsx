'use client';
// Projects — 3 ecrane centrate vertical+orizontal, fiecare un proiect cu storytelling scroll-driven.
// Titlu cu letter-reveal stagger, watermark gigant cu numarul proiectului, scrub scale pe background.
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CASES } from '@/app/[locale]/projects/_data/cases';
import EffectButton from '@/app/components/EffectButton';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PROJECT_KEYS = ['banciuCostin', 'aurasjobs', 'stereocad'] as const;
type ProjectKey = (typeof PROJECT_KEYS)[number];

// Mapping projectKey -> slug pentru ruta /[locale]/projects/[slug].
const SLUG_FOR_KEY: Record<ProjectKey, string> = {
  banciuCostin: CASES.find((c) => c.key === 'banciuCostin')!.slug,
  aurasjobs: CASES.find((c) => c.key === 'aurasjobs')!.slug,
  stereocad: CASES.find((c) => c.key === 'stereocad')!.slug,
};

export default function Projects() {
  const t = useTranslations('projects');
  return (
    <div id="projects">
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

// Un ecran de proiect — centrat vertical+orizontal, cu watermark numar urias in spate.
// Titlul se reveleaza litera-cu-litera la scroll, restul fade-up standard.
function ProjectScreen({ projectKey, idx, t }: ProjectScreenProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const counterIndex = String(5 + idx).padStart(2, '0');
  const title = t(`items.${projectKey}.title`);
  const projectNumber = t(`items.${projectKey}.number`);

  useEffect(() => {
    if (!sectionRef.current) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      // Reveal fade-up pentru elementele standard
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

      // Letter-reveal pentru titlu — stagger pe fiecare caracter
      if (titleRef.current) {
        const letters = titleRef.current.querySelectorAll('[data-letter]');
        gsap.fromTo(
          letters,
          { y: 90, opacity: 0, rotateX: -45 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.1,
            stagger: 0.03,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              end: 'top 25%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Watermark scrub — scale + opacity legat de scroll
      const bgNumber = section.querySelector('[data-bg-number]');
      if (bgNumber) {
        gsap.fromTo(
          bgNumber,
          { scale: 0.92, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'top center',
              scrub: 0.8,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-project-section
      id={`project-${projectKey}`}
      aria-label={`Project — ${title}`}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-8 py-32 lg:px-12"
    >
      {/* Contor sectiune top-left */}
      <div className="absolute left-8 top-24 flex items-center gap-3 border-l border-[var(--border-soft)] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)] lg:left-12 lg:top-32">
        <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
        <span className="text-white">{counterIndex}</span>
        <span className="h-px w-8 bg-[var(--border-soft)]" aria-hidden="true" />
        <span>
          {t('counter')} · {projectNumber}
        </span>
      </div>

      {/* Watermark gigant cu numarul proiectului */}
      <span
        aria-hidden="true"
        data-bg-number
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
      >
        <span className="text-[16rem] font-bold leading-none tracking-tighter text-[var(--text-soft)]/[0.06] sm:text-[20rem] lg:text-[24rem] xl:text-[28rem]">
          {projectNumber}
        </span>
      </span>

      {/* Stack continut centrat */}
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
          {t('eyebrow')} · {projectNumber}
        </p>
        <h3
          ref={titleRef}
          aria-label={title}
          className="mt-8 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          {Array.from(title).map((ch, i) => (
            <span key={i} data-letter aria-hidden="true" className="inline-block">
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </h3>
        <p data-reveal className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-quiet)]">
          {t(`items.${projectKey}.kicker`)}
        </p>
        <div data-reveal className="mx-auto mt-12 h-px w-24 bg-[var(--border-soft)]" aria-hidden="true" />
        <p data-reveal className="mx-auto mt-10 max-w-xl text-base leading-[1.6] text-[var(--text-mid)] lg:text-lg">
          {t(`items.${projectKey}.body`)}
        </p>
        <p data-reveal className="mt-6 text-xs font-medium uppercase tracking-[0.28em] text-[var(--text-quiet)]/70">
          {t(`items.${projectKey}.tech`)}
        </p>
        <div data-reveal className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <EffectButton
            text={t('viewCase')}
            href={`/projects/${SLUG_FOR_KEY[projectKey]}`}
            variant="primary"
            trailing="→"
          />
          <EffectButton
            text={t('viewLive')}
            href={t(`items.${projectKey}.href`)}
            variant="secondary"
            trailing="↗"
          />
        </div>
      </div>
    </section>
  );
}

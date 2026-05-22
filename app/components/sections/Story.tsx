'use client';
// Sectiunea Story — o singura coloana cu titlu mare + 3 paragrafe.
// Pastreaza limbajul vizual al sectiunilor cinematic (eyebrow, titlu, linie accent).
// Reveal fade+slide-up via GSAP ScrollTrigger, identic cu Hero.
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Story() {
  const t = useTranslations('story');
  const rootRef = useRef<HTMLElement>(null);

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
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="story"
      aria-label="Story — about Claudiu"
      className="relative flex min-h-screen items-center px-8 pb-24 pt-24 lg:px-12 lg:pb-12"
    >
      <div className="absolute left-8 top-24 flex items-center gap-3 border-l border-white/[0.08] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500 lg:left-12 lg:top-32">
        <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
        <span className="text-white">04</span>
        <span className="h-px w-8 bg-white/20" aria-hidden="true" />
        <span>{t('counter')}</span>
      </div>
      <div className="max-w-xl lg:max-w-2xl">
        <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
          {t('eyebrow')}
        </p>
        <h2
          data-reveal
          className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl"
        >
          {t('title')}
        </h2>
        <div data-reveal className="mt-12 h-px w-24 bg-white/10" aria-hidden="true" />
        <div className="mt-8 space-y-6">
          <p data-reveal className="max-w-xl text-base leading-[1.6] text-zinc-400 lg:text-lg">
            {t('paragraph1')}
          </p>
          <p data-reveal className="max-w-xl text-base leading-[1.6] text-zinc-400 lg:text-lg">
            {t('paragraph2')}
          </p>
          <p data-reveal className="max-w-xl text-base leading-[1.6] text-zinc-400 lg:text-lg">
            {t('paragraph3')}
          </p>
        </div>
      </div>
    </section>
  );
}

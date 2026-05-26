'use client';
// Sectiunea Story — centrata cu letter cascade pe H2 (efect A) + divider scrub (efect C).
// Mirror structural cu Hero Section 2/3 ca sa pastreze limbajul vizual.
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

    const section = rootRef.current;

    const ctx = gsap.context(() => {
      const pre = section.querySelectorAll<HTMLElement>('[data-story-pre]');
      const post = section.querySelectorAll<HTMLElement>('[data-story-post]');
      const letters = section.querySelectorAll<HTMLElement>('[data-story-letter]');
      const divider = section.querySelector<HTMLElement>('[data-story-divider]');

      // Stare initiala — hide imediat, fade-in la trigger.
      if (pre.length > 0) gsap.set(pre, { opacity: 0, y: 24 });
      if (post.length > 0) gsap.set(post, { opacity: 0, y: 24 });
      if (letters.length > 0) gsap.set(letters, { opacity: 0, y: -70, rotateX: -90 });
      if (divider) gsap.set(divider, { scaleX: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          toggleActions: 'play none none reverse',
        },
      });
      if (pre.length > 0) {
        tl.to(pre, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'expo.out' });
      }
      if (letters.length > 0) {
        tl.to(
          letters,
          { y: 0, opacity: 1, rotateX: 0, duration: 0.9, stagger: 0.04, ease: 'expo.out' },
          '-=0.4'
        );
      }
      if (post.length > 0) {
        tl.to(
          post,
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'expo.out' },
          '-=0.2'
        );
      }

      // Scroll-scrubbed divider (efect C).
      if (divider) {
        gsap.to(divider, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.8,
          },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="story"
      aria-label="Story — about Claudiu"
      className="relative flex min-h-screen items-center px-8 pb-24 pt-24 lg:px-12"
    >
      {/* Counter top-left — pastrat ca semn vizual de sectiune */}
      <div className="absolute left-8 top-24 flex items-center gap-3 border-l border-[var(--border-soft)] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)] lg:left-12 lg:top-32">
        <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
        <span className="text-white">04</span>
        <span className="h-px w-8 bg-[var(--border-soft)]" aria-hidden="true" />
        <span>{t('counter')}</span>
      </div>

      <div className="mx-auto w-full max-w-3xl text-center">
        <p data-story-pre className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
          {t('eyebrow')}
        </p>
        {/* H2 cu letter cascade — fiecare cuvant incapsulat ca sa nu se sparga la wrap */}
        <h2
          aria-label={t('title')}
          className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          style={{ perspective: '800px' }}
        >
          {t('title').split(' ').map((word, wi, words) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, ci) => (
                <span
                  key={ci}
                  data-story-letter
                  aria-hidden="true"
                  className="inline-block"
                  style={{ transformOrigin: '50% 100%' }}
                >
                  {ch}
                </span>
              ))}
              {wi < words.length - 1 && (
                <span data-story-letter aria-hidden="true" className="inline-block">
                  {' '}
                </span>
              )}
            </span>
          ))}
        </h2>
        <div
          data-story-divider
          aria-hidden="true"
          className="mx-auto mt-10 h-px w-32 origin-center bg-[var(--text-soft)]/40 lg:mt-12"
        />
        <div className="mt-8 space-y-6">
          <p data-story-post className="mx-auto max-w-xl text-base leading-[1.6] text-[var(--text-mid)] lg:text-lg">
            {t('paragraph1')}
          </p>
          <p data-story-post className="mx-auto max-w-xl text-base leading-[1.6] text-[var(--text-mid)] lg:text-lg">
            {t('paragraph2')}
          </p>
          <p data-story-post className="mx-auto max-w-xl text-base leading-[1.6] text-[var(--text-mid)] lg:text-lg">
            {t('paragraph3')}
          </p>
        </div>
      </div>
    </section>
  );
}

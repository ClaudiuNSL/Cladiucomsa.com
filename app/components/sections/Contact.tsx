'use client';
// Sectiunea Contact — grid 2 coloane pe desktop: text+contact direct stanga, form dreapta.
// Reveal fade+slide-up via GSAP ScrollTrigger.
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ContactForm from '@/app/components/ContactForm';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Contact() {
  const t = useTranslations('contact');
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
      id="contact"
      aria-label="Contact"
      className="relative flex min-h-screen items-center px-8 pb-24 pt-24 lg:px-12 lg:pb-12"
    >
      <div className="absolute left-8 top-24 flex items-center gap-3 border-l border-white/[0.08] pl-4 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500 lg:left-12 lg:top-32">
        <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
        <span className="text-white">08</span>
        <span className="h-px w-8 bg-white/20" aria-hidden="true" />
        <span>{t('counter')}</span>
      </div>
      <div className="w-full max-w-5xl">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <p data-reveal className="text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
              {t('eyebrow')}
            </p>
            <h2
              data-reveal
              className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
            >
              {t('title')}
            </h2>
            <div data-reveal className="mt-12 h-px w-24 bg-white/10" aria-hidden="true" />
            <p data-reveal className="mt-8 max-w-md text-base leading-[1.6] text-zinc-400 lg:text-lg">
              {t('subtitle')}
            </p>
            <div data-reveal className="mt-10 space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
                {t('directLabel')}
              </p>
              <a
                href={`mailto:${t('emailValue')}`}
                className="block text-sm text-zinc-300 transition-colors hover:text-white"
              >
                {t('emailValue')}
              </a>
              <a
                href={`tel:${t('phoneValue').replace(/\s+/g, '')}`}
                className="block text-sm text-zinc-300 transition-colors hover:text-white"
              >
                {t('phoneValue')}
              </a>
            </div>
          </div>
          <div data-reveal className="lg:col-span-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

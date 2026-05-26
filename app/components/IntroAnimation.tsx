'use client';
// Intro animation — apare la prima incarcare a homepage-ului (per sesiune).
// Linie verticala ice-blue se deseneaza, "CLAUDIU COMSA" intra cu letter cascade,
// tagline fade-in, hold, apoi ecranul se sparge in 2 jumatati care aluneca
// vertical revelizand site-ul. Skipabil cu Escape sau click pe "skip".
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { completeIntro } from '@/app/lib/intro-state';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const SESSION_KEY = 'intro-seen-v1';

export default function IntroAnimation() {
  const t = useTranslations('cinematic.s1');
  const [active, setActive] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  // Decide la mount daca afisam intro-ul (client-only ca sa nu avem flash SSR).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem(SESSION_KEY);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduced) {
      sessionStorage.setItem(SESSION_KEY, '1');
      completeIntro();
      return;
    }
    // Setarea state-ului dupa o decizie client-only (sessionStorage + media query)
    // e exact use case-ul intentionat al useEffect. Lint rule react-hooks/set-state-in-effect
    // semnaleaza pattern-ul generic, dar aici e un mount-time check valid.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(true);
  }, []);

  // Ruleaza timeline-ul cand devine active.
  useEffect(() => {
    if (!active) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const finish = () => {
      sessionStorage.setItem(SESSION_KEY, '1');
      document.body.style.overflow = prevOverflow;
      completeIntro();
      setActive(false);
      // Forteaza ScrollTrigger sa recalibreze pozitiile dupa intro dismiss.
      // Restaurarea overflow + eliminarea DOM-ului intro pot modifica
      // dimensiunile viewportului (scrollbar appear), facand trigger-ele
      // pe S2/S3/Story sa fie offset. Double rAF — primul lasa React sa
      // flush DOM-ul, al doilea lasa browser-ul sa repaint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      });
    };

    const ctx = gsap.context(() => {
      const letters = nameRef.current?.querySelectorAll('[data-intro-letter]') ?? [];
      // Stare initiala — toate ascunse, line scalat la 0 pe Y.
      gsap.set([lineRef.current, taglineRef.current, skipRef.current], { opacity: 0 });
      gsap.set(lineRef.current, { scaleY: 0 });
      gsap.set(letters, { opacity: 0, y: 40, rotateX: -90 });

      const tl = gsap.timeline({
        onComplete: () => {
          const out = gsap.timeline({ onComplete: finish });
          out.to(contentRef.current, { opacity: 0, duration: 0.45, ease: 'expo.in' });
          out.to(
            topRef.current!,
            { yPercent: -100, duration: 0.95, ease: 'expo.inOut' },
            '-=0.1'
          );
          out.to(
            bottomRef.current!,
            { yPercent: 100, duration: 0.95, ease: 'expo.inOut' },
            '<'
          );
        },
      });

      // 1. Linia verticala se deseneaza de sus in jos.
      tl.to(lineRef.current, { opacity: 1, scaleY: 1, duration: 0.7, ease: 'expo.out' });
      // 2. Numele cade — fiecare litera cu rotateX si stagger.
      tl.to(
        letters,
        { opacity: 1, y: 0, rotateX: 0, duration: 0.7, stagger: 0.045, ease: 'expo.out' },
        '-=0.3'
      );
      // 3. Tagline + skip apare blând.
      tl.to(taglineRef.current, { opacity: 1, duration: 0.6, ease: 'expo.out' }, '-=0.2');
      tl.to(skipRef.current, { opacity: 1, duration: 0.4, ease: 'expo.out' }, '-=0.3');
      // 4. Hold ~0.6s ca utilizatorul sa absoarba.
      tl.to({}, { duration: 0.6 });
    });

    const skip = () => {
      ctx.kill();
      finish();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      ctx.revert();
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  if (!active) return null;

  const name = 'Claudiu Comșa';

  const handleSkipClick = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    document.body.style.overflow = '';
    completeIntro();
    setActive(false);
    // Acelasi refresh ca in finish() — vezi comentariul de acolo.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  };

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 z-[100]"
    >
      {/* Doua jumatati care aluneca apart la final */}
      <div
        ref={topRef}
        className="absolute inset-x-0 top-0 h-1/2 bg-[var(--bg-deep)]"
      />
      <div
        ref={bottomRef}
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[var(--bg-deep)]"
      />
      {/* Continut centrat — peste cele doua jumatati */}
      <div
        ref={contentRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-8"
      >
        {/* Linia verticala — ancora superioara a numelui */}
        <span
          ref={lineRef}
          aria-hidden="true"
          className="absolute left-1/2 top-[calc(50%-7.5rem)] block h-20 w-px -translate-x-1/2 origin-top bg-[var(--text-soft)]"
        />
        {/* Numele */}
        <h1
          ref={nameRef}
          aria-label={name}
          className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl xl:text-8xl"
          style={{ perspective: '800px' }}
        >
          {Array.from(name).map((ch, i) => (
            <span
              key={i}
              data-intro-letter
              aria-hidden="true"
              className="inline-block"
              style={{ transformOrigin: '50% 100%' }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </h1>
        {/* Tagline */}
        <p
          ref={taglineRef}
          className="mt-8 text-[10px] font-medium uppercase tracking-[0.4em] text-[var(--text-soft)] text-center"
        >
          {t('eyebrow')}
        </p>
        {/* Buton skip — jos-centru, discret */}
        <button
          ref={skipRef}
          type="button"
          onClick={handleSkipClick}
          className="absolute bottom-10 text-[9px] font-medium uppercase tracking-[0.4em] text-[var(--text-quiet)] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30 rounded px-2 py-1"
        >
          skip · esc
        </button>
      </div>
    </div>
  );
}

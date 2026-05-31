"use client";

// StoryPhoto — slot foto cu placeholder + mask reveal + parallax.
// Componentă extrasă din Story pentru că poartă logica completă a portretului:
//   - placeholder (până la livrarea pozei reale)
//   - clip-path tween de la inset(100% 0 0 0) la inset(0) la enter
//   - parallax intern (yPercent: -9, scrub) pe imagine/placeholder
//   - tratament b+w via CSS (vezi globals.css .photo-mask img/.photo-placeholder)
//
// Port din previews/chromatic-drift/index.html (markup linile 1221-1231,
// timeline linile 1950-1981). Refs separate pentru wrapper-ul de mask și
// elementul intern ca GSAP să targeteze independent reveal vs parallax.
//
// Swap real photo: pasează `src="/story/claudiu.jpg"` din Story.tsx.

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface StoryPhotoProps {
  src?: string;
}

export default function StoryPhoto({ src }: StoryPhotoProps) {
  const maskRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const maskEl = maskRef.current;
    const innerEl = innerRef.current;
    if (!maskEl || !innerEl) return;

    // Reduced motion: CSS-ul deja face clip-path: inset(0) și anulează transform.
    // Nu rulăm reveal/parallax — masca rămâne deschisă static.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let revealTrigger: ScrollTrigger | null = null;
    let parallaxTrigger: ScrollTrigger | null = null;
    const storyEl = maskEl.closest<HTMLElement>(".story") ?? maskEl;

    const raf = requestAnimationFrame(() => {
      // Mask reveal — clip-path tween la enter. Pe leave-back colapsează
      // înapoi pentru ca reveal-ul să se replay-eze la re-enter.
      revealTrigger = ScrollTrigger.create({
        trigger: storyEl,
        start: "top 65%",
        onEnter: () => {
          gsap.to(maskEl, {
            clipPath: "inset(0% 0 0 0)",
            duration: 1.6,
            ease: "expo.out",
          });
        },
        onLeaveBack: () => {
          gsap.to(maskEl, {
            clipPath: "inset(100% 0 0 0)",
            duration: 0.8,
            ease: "expo.in",
          });
        },
      });

      // Parallax intern — imaginea translatează mai lent decât containerul.
      const parallaxTween = gsap.to(innerEl, {
        yPercent: -9,
        ease: "none",
        scrollTrigger: {
          trigger: storyEl,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      parallaxTrigger = parallaxTween.scrollTrigger ?? null;
    });

    return () => {
      cancelAnimationFrame(raf);
      if (revealTrigger) revealTrigger.kill();
      if (parallaxTrigger) parallaxTrigger.kill();
    };
  }, []);

  return (
    <div className="photo-mask" ref={maskRef}>
      {src ? (
        <div className="photo-inner" ref={innerRef}>
          <Image
            src={src}
            alt="Claudiu Comșa"
            fill
            sizes="(max-width: 900px) 100vw, 40vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
      ) : (
        <div className="photo-placeholder" ref={innerRef}>
          <span>Loc pentru fotografie · Trimite poza și o pun aici</span>
        </div>
      )}
    </div>
  );
}

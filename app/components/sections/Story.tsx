"use client";

// Story — bio editorial cu portret.
// Port din previews/chromatic-drift/index.html (markup linile 1198-1233,
// timeline linile 1935-1948). 2-column layout (text + foto), titlu + 3
// paragrafe RO + caption mono. Reveal stagger pe h + paragrafe; portretul
// e izolat în StoryPhoto (mask reveal + parallax).
//
// Swap foto: pasează `src="/story/claudiu.jpg"` la <StoryPhoto />.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StoryPhoto from "@/app/components/StoryPhoto";
import { fireFlash } from "@/app/lib/flash-bus";

gsap.registerPlugin(ScrollTrigger);

export default function Story() {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootEl = rootRef.current;
    const headingEl = headingRef.current;
    const textEl = textRef.current;
    if (!rootEl || !headingEl || !textEl) return;

    // Reduced motion: nu rulăm reveal-ul stagger. Heading + paragrafe rămân la
    // defaults (vizibile). Flash-ul de tranziție e omis (mișcare = backdrop blur).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const paragraphs = textEl.querySelectorAll<HTMLParagraphElement>(".story-p");

    let hTrigger: ScrollTrigger | null = null;
    let pTrigger: ScrollTrigger | null = null;
    let flashTrigger: ScrollTrigger | null = null;

    const raf = requestAnimationFrame(() => {
      const hTween = gsap.from(headingEl, {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: rootEl,
          start: "top 70%",
        },
      });
      hTrigger = hTween.scrollTrigger ?? null;

      if (paragraphs.length > 0) {
        const pTween = gsap.from(paragraphs, {
          opacity: 0,
          y: 24,
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: rootEl,
            start: "top 60%",
          },
        });
        pTrigger = pTween.scrollTrigger ?? null;
      }

      // Flash de tranziție la intrarea în Story (consistent cu Manifesto).
      flashTrigger = ScrollTrigger.create({
        trigger: rootEl,
        start: "top 70%",
        onEnter: fireFlash,
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (hTrigger) hTrigger.kill();
      if (pTrigger) pTrigger.kill();
      if (flashTrigger) flashTrigger.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="story" id="story">
      <span className="section-tag">03 — Despre</span>
      <div className="story-layout">
        <div className="story-text" ref={textRef}>
          <h2 className="story-h" ref={headingRef}>
            Lucrez singur, dar nu izolat.{" "}
            <span className="soft">Constanța, mare, monitor, cafea rece.</span>
          </h2>
          <p className="story-p">
            Sunt Claudiu Comșa. Construiesc site-uri de aproape un deceniu — am
            început cu HTML static într-o cameră de cămin și am ajuns să livrez
            aplicații pentru clienți care nu se uită la preț, ci la timpul în
            care le rezolv problema.
          </p>
          <p className="story-p">
            Nu vând „soluții digitale”, vând site-uri care funcționează.
            Diferența e în detaliile pe care nu le scrie nimeni în brief —
            animația care nu obosește, font-ul care se încarcă înainte să-l
            observi, structura care suportă încă cinci pagini fără refactor.
          </p>
          <p className="story-p">
            Dacă citești asta pe un telefon, e pentru că am scris site-ul de la
            telefon spre desktop. Nu invers.
          </p>
        </div>
        <figure className="story-photo">
          <StoryPhoto src="/story/claudiu.png" />
          <figcaption className="photo-caption">
            <span>Claudiu Comșa</span>
            <span>Constanța · 2026</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

"use client";

// Strings are NFC-normalized at compile time. Do not run this source through tools that re-normalize to NFD.

// Manifesto section — frază editorială cu cascade letter scrub pe scroll.
// SplitText sparge fraza în chars; literele pornesc la y: 120% (invizibile sub
// linia de bază) și sunt scrub-uite în pe parcursul scroll-ului între top 70%
// și top 20%. Un al doilea ScrollTrigger declanșează TransitionFlash pe enter.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fireFlash } from "@/app/lib/flash-bus";

gsap.registerPlugin(SplitText, ScrollTrigger);

export default function Manifesto() {
  const rootRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootEl = rootRef.current;
    const wrapper = textRef.current;
    if (!rootEl || !wrapper) return;

    // Reduced motion: text vizibil static (CSS-ul restaurează opacity: 1 și
    // anulează translate-ul .ms-char), nu rulăm SplitText și nici flash.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrapper.style.opacity = "1";
      return;
    }

    let split: SplitText | null = null;
    let scrubTrigger: ScrollTrigger | null = null;
    let flashTrigger: ScrollTrigger | null = null;

    const raf = requestAnimationFrame(() => {
      // SplitText cascade — type: 'chars' iterează pe codepoints, deci NFC Ș
      // (U+0218) rămâne un singur char. NFD ar sparge-o în S + combining mark.
      split = new SplitText(wrapper, { type: "chars", charsClass: "ms-char" });

      // NFC codepoint-count assertion (dev-only). SplitText cu type: 'chars'
      // poate include sau nu spațiile ca chars; acceptăm ambele variante și
      // verificăm strict împotriva NFD-corruption.
      const fullText = wrapper.textContent ?? "";
      const codepointsAll = [...fullText].length;
      const codepointsNoWs = [...fullText.replace(/\s/g, "")].length;
      console.assert(
        split.chars.length === codepointsNoWs || split.chars.length === codepointsAll,
        `Manifesto SplitText produced ${split.chars.length} chars (expected ${codepointsNoWs} or ${codepointsAll}). NFC normalization may have been lost.`
      );

      // Reveal wrapper acum că per-char spans sunt injectate. Literele rămân
      // invizibile vizual fiindcă CSS-ul pune .ms-char la y: 120% (sub linia
      // de bază, ascuns de overflow-ul .ms-text-wrap).
      wrapper.style.opacity = "1";

      const scrubTl = gsap.from(split.chars, {
        y: "120%",
        stagger: 0.012,
        ease: "expo.out",
        scrollTrigger: {
          trigger: rootEl,
          start: "top 70%",
          end: "top 20%",
          scrub: 0.8,
        },
      });
      scrubTrigger = scrubTl.scrollTrigger ?? null;

      // Flash de tranziție la intrarea în secțiune (doar onEnter, nu și back).
      flashTrigger = ScrollTrigger.create({
        trigger: rootEl,
        start: "top 70%",
        onEnter: fireFlash,
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (scrubTrigger) {
        scrubTrigger.kill();
      }
      if (flashTrigger) {
        flashTrigger.kill();
      }
      if (split) {
        split.revert();
      }
    };
  }, []);

  return (
    <section ref={rootRef} className="manifesto intro" id="manifesto">
      <span className="section-tag">01 — Manifesto</span>
      <p className="ms-text intro-text" ref={textRef}>
        Site-urile nu trebuie să fie zgomotoase ca să fie memorabile. Liniștea
        bine făcută rămâne mai mult în cap decât{" "}
        <span className="soft">orice efect ieftin</span>.
      </p>
    </section>
  );
}

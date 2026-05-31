"use client";

// Strings are NFC-normalized at compile time. Do not run this source through tools that re-normalize to NFD.
// "COMȘA" contains U+0218 (Ș, pre-composed s-comma-below). NFD would split it as S + COMBINING COMMA BELOW.

// Hero section — cascadă litere "CLAUDIU COMȘA" + condense în nav CC pe scroll.
// SplitText sparge headline-ul în chars; .ltr-c marchează cele 2 C-uri, .ltr-mid
// restul literelor. Timeline-ul de scroll colapsează literele de mijloc spre cel
// mai apropiat C, apoi migrează perechea CC în slot-ul nav-cc (Task 8).
// Handoff-ul către Nav se face prin React state (setNavCCVisible), NU prin
// CustomEvent — vezi app/lib/scroll-palette-context.tsx.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollPalette } from "@/app/lib/scroll-palette-context";
import MagneticButton from "@/app/components/MagneticButton";

gsap.registerPlugin(SplitText, ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLHeadingElement | null>(null);
  const nameWrapRef = useRef<HTMLDivElement | null>(null);
  const { setNavCCVisible } = useScrollPalette();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wrapper = nameRef.current;
    const heroEl = heroRef.current;
    const heroNameWrap = nameWrapRef.current;
    if (!wrapper || !heroEl || !heroNameWrap) return;

    // Reduced motion: arătăm hero static + nav CC direct, fără cascade/condense.
    // CSS-ul deja restaurează opacity: 1 pentru toate elementele hero, deci nu
    // trebuie să tween-uim nimic; doar semnalăm Nav-ul că CC trebuie afișat.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setNavCCVisible(true);
      return;
    }

    let split: SplitText | null = null;
    let condenseTl: gsap.core.Timeline | null = null;
    let cancelled = false;

    const raf = requestAnimationFrame(() => {
      // SplitText cascade-in. NFC Romanian Ș: U+0218 is a single codepoint —
      // SplitText iterates by codepoint so chars.length should equal [...name].length.
      split = new SplitText(wrapper, { type: "chars", charsClass: "ltr" });

      split.chars.forEach((c) => {
        const el = c as HTMLElement;
        const t = el.textContent ?? "";
        if (t === "C") {
          el.classList.add("ltr-c");
        } else if (t === " " || t === " ") {
          // Spațiul rămâne ca .ltr + .ltr-space ca să-l putem colapsa pe scroll.
          el.classList.add("ltr-space");
        } else {
          el.classList.add("ltr-mid");
        }
      });

      // NFC Romanian Ș codepoint-count assertion (dev-only)
      const fullName = wrapper.dataset.fullName ?? "CLAUDIU COMȘA";
      const expectedCount = [...fullName].length;
      console.assert(
        split.chars.length === expectedCount,
        `SplitText produced ${split.chars.length} chars, expected ${expectedCount}. NFC normalization may have been lost.`
      );

      // Reveal wrapper now that chars are in place (CSS keeps it at opacity 0
      // until JS hydrates, preventing FOUC).
      wrapper.style.opacity = "1";

      // Initial reveal — letters drop in from below
      gsap.from(split.chars, {
        y: "110%",
        opacity: 0,
        stagger: 0.04,
        ease: "expo.out",
        duration: 1.2,
        delay: 1.9,
      });

      // Sibling cascade — gsap.to() not from(), because CSS-default invisible
      // state IS the start; we tween toward the final visible state.
      const siblings = heroEl.querySelectorAll<HTMLElement>(
        ".eyebrow, .hero-sub, .hero-bio, .scroll-hint, .btn-wow"
      );
      gsap.set(siblings, { opacity: 0, y: 14 });
      gsap.to(siblings, {
        opacity: 1,
        y: 0,
        delay: 2.6,
        stagger: 0.08,
        duration: 1,
        ease: "power2.out",
      });

      // Scroll condense timeline — măsurăm pozițiile DUPĂ ce s-au încărcat fonturile
      // ca să nu prindem un layout încă-nemăsurat. Re-măsurăm pe ScrollTrigger.refresh.
      const buildCondense = () => {
        const navCC = document.getElementById("nav-cc");
        if (!navCC) return; // Bail gracefully dacă Nav nu e încă montat.
        if (!split) return;

        // Kill previous timeline pe refresh ca să nu se acumuleze.
        if (condenseTl) {
          condenseTl.scrollTrigger?.kill();
          condenseTl.kill();
          condenseTl = null;
        }

        const mids = wrapper.querySelectorAll<HTMLElement>(".ltr-mid");
        const cs = wrapper.querySelectorAll<HTMLElement>(".ltr-c");
        const space = wrapper.querySelector<HTMLElement>(".ltr-space");

        if (cs.length < 2) return; // Defensive: nu putem condensa fără 2 C-uri.

        const allChars = Array.from(wrapper.querySelectorAll<HTMLElement>(".ltr"));
        const secondCIdx = allChars.indexOf(cs[1]);

        condenseTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroEl,
            start: "top top",
            end: "+=120%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
          onComplete: () => setNavCCVisible(true),
          onReverseComplete: () => setNavCCVisible(false),
        });

        // Phase A — middle letters collapse to the nearest C.
        // Literele înainte de al doilea C merg spre C1, restul spre C2.
        mids.forEach((mid) => {
          const idx = allChars.indexOf(mid);
          const targetC = idx < secondCIdx ? cs[0] : cs[1];
          const midRect = mid.getBoundingClientRect();
          const tgtRect = targetC.getBoundingClientRect();
          const dx = tgtRect.left - midRect.left;
          condenseTl!.to(
            mid,
            {
              x: dx,
              scaleX: 0.001,
              opacity: 0,
              duration: 0.4,
              ease: "power3.in",
            },
            0
          );
        });

        // Collapse the space gap
        if (space) {
          condenseTl.to(space, { width: 0, duration: 0.4, ease: "power3.in" }, 0);
        }

        // Phase B — CC pair scales down + migrates to top-left nav position
        condenseTl.to(
          heroNameWrap,
          {
            scale: 0.13,
            x: () => {
              const navRect = navCC.getBoundingClientRect();
              const wrapRect = heroNameWrap.getBoundingClientRect();
              return navRect.left - wrapRect.left;
            },
            y: () => {
              const navRect = navCC.getBoundingClientRect();
              const wrapRect = heroNameWrap.getBoundingClientRect();
              return navRect.top - wrapRect.top - 8;
            },
            ease: "power2.inOut",
            duration: 0.6,
          },
          0.35
        );

        // Fade out wrap-ul vechi — handoff-ul real către nav CC se face în
        // onComplete-ul timeline-ului via setNavCCVisible(true).
        condenseTl.to(heroNameWrap, { opacity: 0, duration: 0.1 }, 0.92);
      };

      // Așteptăm font-loading înainte de prima măsurare ca să nu prindem un
      // layout fără webfont (Geist) — literele își schimbă lățimea.
      // Re-măsurarea pe ScrollTrigger.refresh e asigurată prin
      // `invalidateOnRefresh: true` (function-based x/y se recalculează).
      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.ready.then(() => {
          if (cancelled) return;
          buildCondense();
          ScrollTrigger.refresh();
        });
      } else {
        buildCondense();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (condenseTl) {
        condenseTl.scrollTrigger?.kill();
        condenseTl.kill();
      }
      if (split) {
        split.revert();
      }
    };
  }, [setNavCCVisible]);

  return (
    <section ref={heroRef} className="hero" id="hero">
      <div className="hero-top">
        <div className="eyebrow">FREELANCE · DEVELOPER · CONSTANȚA</div>

        <div className="hero-name-wrap" ref={nameWrapRef}>
          <h1
            className="hero-name"
            ref={nameRef}
            aria-label="Claudiu Comșa"
            data-full-name="CLAUDIU COMȘA"
          >
            CLAUDIU COMȘA
          </h1>
        </div>

        <p className="hero-sub">
          Construiesc <span className="accent">experiențe web</span> care lasă urme.
        </p>
      </div>

      <div className="hero-bottom">
        <p className="hero-bio">
          Web developer independent. Lucrez la intersecția dintre cod curat și
          regie cinematică — interfețe care nu doar funcționează, ci se țin minte.
        </p>
        <MagneticButton href="#projects" label="Vezi proiecte" />
        <div className="scroll-hint">
          <span>Scroll</span>
          <span className="line-down"></span>
        </div>
      </div>
    </section>
  );
}

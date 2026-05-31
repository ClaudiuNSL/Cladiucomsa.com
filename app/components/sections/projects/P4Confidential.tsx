"use client";

// Strings are NFC-normalized at compile time. Do not run this source through tools that re-normalize to NFD.

// P4 Confidențial — letter explode title pe enter.
//
// Port din previews/chromatic-drift/index.html (markup ~liniile 1159-1167,
// timeline ~liniile 1843-1884). Titlul (.p4-title) este spart per-char cu
// GSAP SplitText; fiecare literă pleacă din offset random (x/y/rotation/scale)
// și converge spre 0 pe scrub între `top 80%` și `top 30%`.
//
// Pattern Task 13 (SplitText SSR/FOUC) — Option A:
//   1. CSS pune .p4-title la opacity 0 by default (FOUC guard).
//   2. SplitText rulează în rAF în useEffect (după primul paint).
//   3. Wrapper-ul e flip-uit la opacity 1 ÎNAINTE de tween-ul de explode.
//
// NFC codepoint-count assertion (dev-only): Ț (U+021A) și ă (U+0103) sunt
// codepoints pre-composed; NFD le-ar sparge în T/a + combining mark și ar
// face SplitText să producă mai multe chars decât [...text].length.
//
// TODO Phase 2: replace with real project naming once user provides.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fireFlash } from "@/app/lib/flash-bus";

gsap.registerPlugin(SplitText, ScrollTrigger);

export default function P4Confidential() {
  const rootRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootEl = rootRef.current;
    const titleEl = titleRef.current;
    if (!rootEl || !titleEl) return;

    // Reduced motion: titlu static, CSS-ul restaurează .p4-title opacity: 1 și
    // anulează transform-urile per-char. Skip SplitText + explode + flash.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      titleEl.style.opacity = "1";
      return;
    }

    let split: SplitText | null = null;
    let explodeTrigger: ScrollTrigger | null = null;
    let flashTrigger: ScrollTrigger | null = null;

    const raf = requestAnimationFrame(() => {
      // SplitText cu type: 'chars' iterează pe codepoints; NFC Ț/ă rămân
      // un singur char fiecare. NFD ar produce mai multe chars decât textul.
      split = new SplitText(titleEl, { type: "chars", charsClass: "char" });

      // NFC codepoint-count assertion (dev-only). Filtrăm whitespace pentru
      // că SplitText poate să nu includă spațiile ca chars discrete.
      const fullText = titleEl.textContent ?? "";
      const codepointsAll = [...fullText].length;
      const codepointsNoWs = [...fullText.replace(/\s/g, "")].length;
      console.assert(
        split.chars.length === codepointsNoWs ||
          split.chars.length === codepointsAll,
        `P4 SplitText produced ${split.chars.length} chars (expected ${codepointsNoWs} or ${codepointsAll}). NFC normalization may have been lost.`
      );

      // Flip-uim wrapper-ul la vizibil ACUM (CSS-ul îl ține la opacity 0 ca să
      // nu vedem flash-ul textului raw înainte ca SplitText să injecteze chars).
      titleEl.style.opacity = "1";

      // Letter explode — per-char tween cu randomizare pe x/y/rotation/scale,
      // converge spre 0 pe scrub. Function-based values folosesc gsap.utils.random()
      // pentru seed-uri stabile per refresh.
      const explodeTween = gsap.from(split.chars, {
        scrollTrigger: {
          trigger: rootEl,
          start: "top 80%",
          end: "top 30%",
          scrub: 1,
          invalidateOnRefresh: true,
        },
        x: () => gsap.utils.random(-180, 180),
        y: () => gsap.utils.random(80, 220),
        rotation: () => gsap.utils.random(-25, 25),
        scale: () => gsap.utils.random(0.6, 1.4),
        opacity: 0,
        stagger: { each: 0.018, from: "random" },
        ease: "power2.out",
      });
      explodeTrigger = explodeTween.scrollTrigger ?? null;

      // Flash de tranziție o singură dată, la intrarea în secțiune.
      flashTrigger = ScrollTrigger.create({
        trigger: rootEl,
        start: "top 70%",
        onEnter: fireFlash,
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (explodeTrigger) {
        explodeTrigger.kill();
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
    <section ref={rootRef} className="p4" id="p4-confidential">
      <span className="p4-num">04 / Proiect confidențial</span>
      {/* TODO Phase 2: replace with real project naming once user provides. */}
      <h3 className="p4-title" ref={titleRef} id="p4-title">
        Identitate <span className="soft">tăcută</span>.
      </h3>
      <div className="p4-after">
        <p>
          Brief sub NDA: o platformă internă pentru o echipă de produs.
          Tipografie ca structură, nu ca decor.
        </p>
        <p>
          Sistem de design construit pe variabile, animații care se opresc unde
          trebuie, copy editat letter-by-letter pentru un singur ton.
        </p>
      </div>
    </section>
  );
}

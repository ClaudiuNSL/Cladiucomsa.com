"use client";

// P5 Atelier — CRT glitch effect cu RGB channel split + scanline.
//
// Port din previews/chromatic-drift/index.html (markup ~liniile 1170-1181,
// CSS ~liniile 707-757, timeline ~liniile 1886-1923). Stage-ul (.p5-stage)
// suprapune 4 layere (base + r/g/b) cu mix-blend-mode: screen; pe scrub,
// layerele r/b derivează pe x (RGB channel split), g derivează pe y, iar
// scanline-ul migrează vertical. Pe enter, hue-rotate keyframes simulează
// un glitch CRT scurt.
//
// Markup-ul este identic client și server (3 colored layers + base + scanline +
// tag) — fără DOM mutation pe mount, deci fără FOUC și fără SplitText.
// Hidratarea matches perfect; nicio nevoie de Option A opacity gate.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fireFlash } from "@/app/lib/flash-bus";

gsap.registerPlugin(ScrollTrigger);

export default function P5Atelier() {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scanlineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootEl = rootRef.current;
    const stageEl = stageRef.current;
    const scanlineEl = scanlineRef.current;
    if (!rootEl || !stageEl || !scanlineEl) return;

    // Reduced motion: CSS already neutralizes the visual effect (.layer transform: none).
    // Skip GSAP scrubs + glitch + scanline + flash so no RAF cycles run.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const triggers: ScrollTrigger[] = [];

    const layerR = stageEl.querySelector<HTMLElement>(".layer.r");
    const layerG = stageEl.querySelector<HTMLElement>(".layer.g");
    const layerB = stageEl.querySelector<HTMLElement>(".layer.b");

    // RGB channel offset — layerele R și B derivează pe x în direcții opuse,
    // G derivează pe y; toate scrub-uite pe durata secțiunii.
    if (layerR) {
      const t = gsap.to(layerR, {
        x: -12,
        scrollTrigger: {
          trigger: rootEl,
          start: "top 70%",
          end: "bottom top",
          scrub: 1,
        },
      });
      if (t.scrollTrigger) triggers.push(t.scrollTrigger);
    }
    if (layerB) {
      const t = gsap.to(layerB, {
        x: 12,
        scrollTrigger: {
          trigger: rootEl,
          start: "top 70%",
          end: "bottom top",
          scrub: 1,
        },
      });
      if (t.scrollTrigger) triggers.push(t.scrollTrigger);
    }
    if (layerG) {
      const t = gsap.to(layerG, {
        y: 6,
        scrollTrigger: {
          trigger: rootEl,
          start: "top 70%",
          end: "bottom top",
          scrub: 1,
        },
      });
      if (t.scrollTrigger) triggers.push(t.scrollTrigger);
    }

    // Glitch CRT pe enter — hue-rotate keyframes scurte.
    const glitchTrigger = ScrollTrigger.create({
      trigger: stageEl,
      start: "top 60%",
      onEnter: () => {
        gsap.fromTo(
          stageEl,
          { filter: "hue-rotate(0deg) contrast(1) brightness(1)" },
          {
            keyframes: [
              {
                filter:
                  "hue-rotate(120deg) contrast(1.4) brightness(1.2)",
                duration: 0.04,
              },
              {
                filter:
                  "hue-rotate(-60deg) contrast(0.8) brightness(0.8)",
                duration: 0.04,
              },
              {
                filter:
                  "hue-rotate(240deg) contrast(1.2) brightness(1.1)",
                duration: 0.04,
              },
              {
                filter: "hue-rotate(0deg) contrast(1) brightness(1)",
                duration: 0.06,
              },
            ],
          }
        );
      },
    });
    triggers.push(glitchTrigger);

    // Scanline drift — top: 30% → 95% pe scrub pe toată secțiunea.
    const scanlineTween = gsap.to(scanlineEl, {
      top: "95%",
      ease: "none",
      scrollTrigger: {
        trigger: rootEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });
    if (scanlineTween.scrollTrigger) triggers.push(scanlineTween.scrollTrigger);

    // Flash de tranziție o singură dată, la intrarea în secțiune.
    const flashTrigger = ScrollTrigger.create({
      trigger: rootEl,
      start: "top 70%",
      onEnter: fireFlash,
    });
    triggers.push(flashTrigger);

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={rootRef} className="p5" id="p5-atelier">
      <span className="p5-num">05 / Atelier personal</span>
      {/* TODO Phase 2: replace with real project naming once user provides. */}
      <h3 className="p5-title">
        Experimente <span className="soft">la marginea</span> ecranului.
      </h3>
      <div className="p5-stage" id="p5-stage" ref={stageRef}>
        <div className="layer base" />
        <div className="layer r" />
        <div className="layer g" />
        <div className="layer b" />
        <div className="scanline" id="scanline" ref={scanlineRef} />
        <div className="stage-tag">CRT · Shader · 2026</div>
      </div>
    </section>
  );
}

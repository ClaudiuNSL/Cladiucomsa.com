"use client";

// P2 Aurasjobs — pinned zoom + glass shards.
//
// A doua secțiune signature din suita de 5 proiecte. Pin pe .p2-pin pe
// durata a 250vh; pe scrub:
//   1. Card-ul principal (#p2-main) crește de la scale 0.35 → 1 cu opacitate
//      crescândă; conține Image fill (next/image) cu /projects/aurasjobs-preview.jpg.
//   2. Shards-urile floating (.p2-shard) glisează din pozițiile lor data-x/data-y
//      spre poziția finală (translate 0,0) — efect de "asamblare" a glass.
//   3. Titlul (.p2-title) face fade-in la 40% din timeline.
//
// `anticipatePin: 1` previne jitter-ul Lenis pe pin-handoff.
// `invalidateOnRefresh: true` re-calculează start/end pe resize.
// Un singur flash (fireFlash) la prima intrare în secțiune — onEnter, fără back.

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fireFlash } from "@/app/lib/flash-bus";

gsap.registerPlugin(ScrollTrigger);

type Shard = {
  width: number;
  height: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  transform?: string;
  dataX: number;
  dataY: number;
};

// Pozițiile exacte din mockup (lines 1118-1123) — prototype-grade WOW,
// inline style acceptabil pentru această fază.
const SHARDS: readonly Shard[] = [
  { width: 220, height: 140, top: "18%", left: "12%", dataX: -360, dataY: -120 },
  { width: 160, height: 100, top: "60%", left: "8%", dataX: -280, dataY: 160 },
  { width: 180, height: 120, top: "22%", right: "14%", dataX: 320, dataY: -100 },
  { width: 200, height: 130, top: "64%", right: "10%", dataX: 340, dataY: 180 },
  {
    width: 140,
    height: 90,
    top: "8%",
    left: "50%",
    transform: "translateX(-50%)",
    dataX: 0,
    dataY: -220,
  },
  {
    width: 160,
    height: 100,
    bottom: "6%",
    left: "50%",
    transform: "translateX(-50%)",
    dataX: 0,
    dataY: 220,
  },
];

export default function P2Aurasjobs() {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootEl = rootRef.current;
    const stageEl = stageRef.current;
    const mainEl = mainRef.current;
    const titleEl = titleRef.current;
    const pinEl = pinRef.current;
    if (!rootEl || !stageEl || !mainEl || !titleEl || !pinEl) return;

    // Reduced motion: CSS already neutralizes visuals (.p2-main/.p2-shard/.p2-title
    // forced to opacity 1, transform none). Skip the pin timeline so we don't trap
    // the user in 250vh of pinned dead scroll.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timeline: gsap.core.Timeline | null = null;
    let flashTrigger: ScrollTrigger | null = null;

    const raf = requestAnimationFrame(() => {
      const shards = stageEl.querySelectorAll<HTMLElement>(".p2-shard");

      timeline = gsap.timeline({
        scrollTrigger: {
          trigger: rootEl,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: pinEl,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.from(
        mainEl,
        { scale: 0.35, opacity: 0, ease: "power2.out" },
        0
      );
      timeline.from(
        shards,
        {
          x: (_i, el) => Number((el as HTMLElement).dataset.x ?? "0"),
          y: (_i, el) => Number((el as HTMLElement).dataset.y ?? "0"),
          opacity: 0,
          stagger: 0.06,
          ease: "power2.out",
        },
        0
      );
      timeline.from(
        titleEl,
        { opacity: 0, y: 20, ease: "power1.out" },
        0.4
      );

      // Flash de tranziție o singură dată, la intrarea în secțiune.
      flashTrigger = ScrollTrigger.create({
        trigger: rootEl,
        start: "top 70%",
        onEnter: fireFlash,
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (timeline) {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      }
      if (flashTrigger) {
        flashTrigger.kill();
      }
    };
  }, []);

  return (
    <section ref={rootRef} className="p2" id="p2-aurasjobs">
      <div className="p2-pin" ref={pinRef}>
        <div className="p2-stage" ref={stageRef}>
          {SHARDS.map((s, i) => (
            <div
              key={i}
              className="p2-shard"
              data-x={s.dataX}
              data-y={s.dataY}
              style={{
                width: `${s.width}px`,
                height: `${s.height}px`,
                top: s.top,
                bottom: s.bottom,
                left: s.left,
                right: s.right,
                transform: s.transform,
              }}
            />
          ))}
          <div className="p2-main" ref={mainRef}>
            <Image
              src="/projects/aurasjobs-preview.jpg"
              alt="Aurasjobs preview"
              fill
              sizes="(max-width: 768px) 100vw, 70vw"
            />
          </div>
        </div>
        <div className="p2-title" ref={titleRef}>
          <div className="p2-num">02 / Aurasjobs</div>
          <div className="p2-name">
            Recrutare, <span className="soft">fără frecvenț.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

// P1 Banciu Costin Photography — prima secțiune signature de proiect: scroll
// orizontal cu pin pe desktop, overflow-x nativ pe mobil. Port din mockup:
//   - markup: liniile 1085-1112 (.p1 + .p1-track + .p1-card x 5)
//   - JS: liniile 1782-1804 (ScrollTrigger.matchMedia split desktop/mobile)
//
// Patru cadre reale din proiectul Banciu Costin Photography: login (hero cu
// particule + serif), dashboard admin, gestionarea celor 194 de fotografii pe
// 9 categorii, și formularul de contact public.
//
// next/image cu `fill` cere parent `position: relative` — .p1-img îl are deja
// în CSS-ul portat.

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fireFlash } from "@/app/lib/flash-bus";

gsap.registerPlugin(ScrollTrigger);

type Card = {
  src: string;
  caption: string;
  year: string;
};

const CARDS: readonly Card[] = [
  { src: "/projects/banciu-login.png", caption: "S01 · Acces · particle hero", year: "2026" },
  { src: "/projects/banciu-dashboard.png", caption: "S02 · Dashboard admin", year: "2026" },
  { src: "/projects/banciu-imagini.png", caption: "S03 · 194 cadre · 9 categorii", year: "2026" },
  { src: "/projects/banciu-contact.png", caption: "S04 · Contact public", year: "2026" },
];

export default function P1Banciu() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sectionEl = sectionRef.current;
    const trackEl = trackRef.current;
    if (!sectionEl || !trackEl) return;

    // Reduced motion: skip pin/scrub; force mobile-like behavior (native horizontal
    // scroll + auto section height) and attach only the flash trigger.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      trackEl.style.overflowX = "auto";
      sectionEl.style.height = "auto";
      sectionEl.style.overflowX = "hidden";

      const flashTrigger = ScrollTrigger.create({
        trigger: sectionEl,
        start: "top 70%",
        onEnter: fireFlash,
        onEnterBack: fireFlash,
      });

      return () => {
        trackEl.style.overflowX = "";
        sectionEl.style.height = "";
        sectionEl.style.overflowX = "";
        flashTrigger.kill();
      };
    }

    // matchMedia split: pe desktop pin + scroll orizontal scrub-uit; pe mobil
    // overflow-x: auto cu scroll nativ (mai natural pe touch).
    // ScrollTrigger.matchMedia returnează un context care se cleanup-ează la revert().
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const tween = gsap.to(trackEl, {
        x: () => -(trackEl.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: sectionEl,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => "+=" + (trackEl.scrollWidth - window.innerWidth),
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    mm.add("(max-width: 767px)", () => {
      // Pe mobil eliberăm înălțimea fixă și activăm scroll-ul orizontal nativ.
      trackEl.style.overflowX = "auto";
      sectionEl.style.height = "auto";
      sectionEl.style.overflowX = "hidden";

      return () => {
        trackEl.style.overflowX = "";
        sectionEl.style.height = "";
        sectionEl.style.overflowX = "";
      };
    });

    // Flash de tranziție la intrarea în secțiune.
    const flashTrigger = ScrollTrigger.create({
      trigger: sectionEl,
      start: "top 70%",
      onEnter: fireFlash,
      onEnterBack: fireFlash,
    });

    return () => {
      mm.revert();
      flashTrigger.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="p1">
      <div className="p1-track" ref={trackRef}>
        <div className="p1-card">
          <div className="p1-intro">
            <span className="p1-num">01 / Banciu Costin Photography</span>
            <h3 className="p1-title">
              194 de cadre, <span className="soft">gestionate dintr-un singur loc.</span>
            </h3>
            <p className="p1-sub">
              Site complet pentru un fotograf din Constanța — public-facing +
              admin panel custom. 9 categorii editabile (de la nuntă la
              profesional), hero slider, video showreel, evenimente și pachete.
              Ce se schimbă în realitate, se schimbă și în site, fără cod.
            </p>
          </div>
        </div>

        {CARDS.map((card, idx) => (
          <div className="p1-card" key={card.src}>
            <div className="p1-img">
              <Image
                src={card.src}
                alt={`Banciu Costin Photography — ${card.caption}`}
                fill
                sizes="(min-width: 768px) 90vw, 100vw"
                style={{ objectFit: "cover" }}
                priority={idx === 0}
              />
            </div>
            <div className="p1-caption">
              <span>{card.caption}</span>
              <span>{card.year}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

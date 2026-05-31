"use client";

// Studio — listă servicii cu stagger reveal.
// Port din previews/chromatic-drift/index.html (liniile 1183-1196 markup,
// linile 1925-1933 timeline). 5 servicii listate cu index monospace pe
// dreapta; reveal stagger pe scroll, fără flash, fără SplitText — doar
// y/opacity. ScrollTrigger se atașează pe wrapper-ul section.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SERVICES: ReadonlyArray<{ label: string; idx: string }> = [
  { label: "Site-uri pe măsură", idx: "01" },
  { label: "Identitate digitală", idx: "02" },
  { label: "Animații & interacțiuni", idx: "03" },
  { label: "Performanță & SEO tehnic", idx: "04" },
  { label: "Mentenanță continuă", idx: "05" },
];

export default function Studio() {
  const rootRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootEl = rootRef.current;
    const listEl = listRef.current;
    if (!rootEl || !listEl) return;

    const items = listEl.querySelectorAll<HTMLLIElement>("li");
    if (items.length === 0) return;

    let trigger: ScrollTrigger | null = null;

    const raf = requestAnimationFrame(() => {
      const tween = gsap.from(items, {
        y: 24,
        opacity: 0,
        stagger: 0.08,
        ease: "power2.out",
        duration: 0.7,
        scrollTrigger: {
          trigger: rootEl,
          start: "top 70%",
        },
      });
      trigger = tween.scrollTrigger ?? null;
    });

    return () => {
      cancelAnimationFrame(raf);
      if (trigger) {
        trigger.kill();
      }
    };
  }, []);

  return (
    <section ref={rootRef} className="studio" id="studio">
      <span className="section-tag">02 — Studio</span>
      <div className="studio-grid">
        <h2 className="studio-title">
          Ce intră <span className="soft">în mână</span>.
        </h2>
        <ul className="studio-list" ref={listRef}>
          {SERVICES.map((service) => (
            <li key={service.idx}>
              <span>{service.label}</span>
              <span className="idx">{service.idx}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

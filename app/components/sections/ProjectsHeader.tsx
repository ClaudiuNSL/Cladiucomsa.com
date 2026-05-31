"use client";

// ProjectsHeader — antetul secțiunii de proiecte (port din mockup, liniile
// 1074-1083). Fade-in simplu pe ScrollTrigger când intră în viewport; nu are
// animație complexă, doar marchează intrarea în "Lucrări selectate".
// `id="projects"` este target-ul pentru link-ul "Vezi proiecte" din Hero.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS } from "@/app/lib/projects-data";

gsap.registerPlugin(ScrollTrigger);

export default function ProjectsHeader() {
  const rootRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const headerEl = headerRef.current;
    const rootEl = rootRef.current;
    if (!headerEl || !rootEl) return;

    const tween = gsap.from(headerEl, {
      opacity: 0,
      y: 24,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: rootEl,
        start: "top 80%",
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  // Numărul de proiecte e calculat din register-ul locked — single source of truth.
  const count = PROJECTS.length.toString().padStart(2, "0");

  return (
    <section ref={rootRef} id="projects">
      <div className="projects-header" ref={headerRef}>
        <h2 className="projects-title">
          Lucrări <span className="soft">selectate</span>
        </h2>
        <div className="projects-meta">
          <span>2024 — 2026</span>
          <span>{count}</span>
        </div>
      </div>
    </section>
  );
}

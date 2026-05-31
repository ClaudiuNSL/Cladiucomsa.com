"use client";

// Footer — contact + social + fine print, palette stop 4 (dark + gold).
// Port din previews/chromatic-drift/index.html (markup liniile 1235-1283,
// stiluri liniile 877-931). Titlu mare „Hai să construim ceva.", două CTA
// magnetice (email + telefon), apoi grid 3 coloane: contact / social /
// disponibilitate, și o bară mono cu copyright. Reveal subtil pe titlu +
// CTA-uri + grid; fireFlash la enter, ca celelalte secțiuni. Toate culorile
// sunt prin var(--fg)/var(--fg-soft)/var(--fg-line) ca palette stop 4
// (body.fg-light, ~progress 0.82) să le flip-uiască automat în auriu.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "@/app/components/MagneticButton";
import { fireFlash } from "@/app/lib/flash-bus";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const rootRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const ctaRowRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rootEl = rootRef.current;
    const headingEl = headingRef.current;
    const ctaEl = ctaRowRef.current;
    const gridEl = gridRef.current;
    if (!rootEl || !headingEl || !ctaEl || !gridEl) return;

    let hTrigger: ScrollTrigger | null = null;
    let ctaTrigger: ScrollTrigger | null = null;
    let gridTrigger: ScrollTrigger | null = null;
    let flashTrigger: ScrollTrigger | null = null;

    const raf = requestAnimationFrame(() => {
      const hTween = gsap.from(headingEl, {
        opacity: 0,
        y: 32,
        duration: 1.0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: rootEl,
          start: "top 75%",
        },
      });
      hTrigger = hTween.scrollTrigger ?? null;

      const ctaTween = gsap.from(ctaEl, {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.1,
        scrollTrigger: {
          trigger: rootEl,
          start: "top 70%",
        },
      });
      ctaTrigger = ctaTween.scrollTrigger ?? null;

      const gridCols = gridEl.querySelectorAll<HTMLDivElement>(".footer-col");
      if (gridCols.length > 0) {
        const gridTween = gsap.from(gridCols, {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: gridEl,
            start: "top 85%",
          },
        });
        gridTrigger = gridTween.scrollTrigger ?? null;
      }

      flashTrigger = ScrollTrigger.create({
        trigger: rootEl,
        start: "top 70%",
        onEnter: fireFlash,
        onEnterBack: fireFlash,
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (hTrigger) hTrigger.kill();
      if (ctaTrigger) ctaTrigger.kill();
      if (gridTrigger) gridTrigger.kill();
      if (flashTrigger) flashTrigger.kill();
    };
  }, []);

  return (
    <footer ref={rootRef} className="footer" id="footer">
      <h2 className="footer-h" ref={headingRef}>
        <span className="soft">Hai să</span>
        <br />
        construim
        <br />
        <a href="mailto:claudiucomsa29@gmail.com">ceva.</a>
      </h2>

      <div className="footer-cta-row" ref={ctaRowRef}>
        <MagneticButton
          href="mailto:claudiucomsa29@gmail.com"
          label="Trimite un email"
          labelHover="claudiucomsa29@gmail.com"
        />
        <MagneticButton
          href="tel:+40761880406"
          label="Sună 0761 880 406"
          labelHover="Răspund în 24h"
        />
      </div>

      <div className="footer-grid" ref={gridRef}>
        <div className="footer-col">
          <h4>Contact</h4>
          <a href="mailto:claudiucomsa29@gmail.com">
            claudiucomsa29@gmail.com
          </a>
          <a href="tel:+40761880406" className="mono">
            0761 880 406
          </a>
          <span>Constanța · România</span>
        </div>
        <div className="footer-col">
          <h4>Social</h4>
          <span>În curând</span>
        </div>
        <div className="footer-col">
          <h4>Disponibilitate</h4>
          <span>Proiecte noi · Q3 2026</span>
          <span>Răspund în 24h</span>
          <span>RO</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Claudiu Comșa</span>
        <span>Built · Constanța</span>
      </div>
    </footer>
  );
}

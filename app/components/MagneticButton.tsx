"use client";

// MagneticButton — buton refolosibil cu efect magnetic (GSAP) + slide-up reveal.
// Folosit la hero CTA (T13) și 2x footer CTA (T21).
// - Pe touch / fără hover real, dezactivăm pull-ul magnetic.
// - href care începe cu "#": preventDefault + Lenis.scrollTo (dacă există).
// - Folosește clasele .btn-wow / .btn-text / .l1 / .l2 / .magnetic din globals.css.

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useLenis } from "@/app/components/LenisProvider";

type MagneticButtonProps = {
  href?: string;
  label: string;
  labelHover?: string;
  as?: "a" | "button";
  onClick?: (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => void;
  className?: string;
};

export default function MagneticButton({
  href,
  label,
  labelHover,
  as,
  onClick,
  className,
}: MagneticButtonProps) {
  const elRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const lenis = useLenis();

  // Detectăm device-uri fără hover real (touch). Refuzăm să atașăm pull-ul magnetic.
  const isHoverCapable = useCallback(() => {
    if (typeof window === "undefined") return false;
    if ("ontouchstart" in window) return false;
    return window.matchMedia("(hover: hover)").matches;
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (!isHoverCapable()) return;

    const onMove: EventListener = (e) => {
      const me = e as MouseEvent;
      const r = el.getBoundingClientRect();
      const dx = (me.clientX - r.left - r.width / 2) * 0.35;
      const dy = (me.clientY - r.top - r.height / 2) * 0.35;
      gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: "power2.out" });
    };

    const onLeave: EventListener = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(el);
    };
  }, [isHoverCapable]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      // Pentru ancore in-page, interceptăm doar dacă Lenis e disponibil.
      // Dacă Lenis e null (prefers-reduced-motion), lăsăm ancora nativă să sară.
      if (href && href.startsWith("#") && lenis) {
        e.preventDefault();
        lenis.scrollTo(href, { offset: 0, duration: 1.2 });
      }
      onClick?.(e);
    },
    [href, lenis, onClick]
  );

  const rootClassName = `btn-wow magnetic${className ? ` ${className}` : ""}`;
  const renderAs: "a" | "button" = as ?? (href ? "a" : "button");
  const hoverLabel = labelHover ?? label;

  const inner = (
    <>
      <span className="btn-text">
        <span className="l1">{label}</span>
        <span className="l2" aria-hidden="true">
          {hoverLabel}
        </span>
      </span>
      <span className="btn-arrow" aria-hidden="true">
        →
      </span>
    </>
  );

  if (renderAs === "a") {
    return (
      <a
        ref={(node) => {
          elRef.current = node;
        }}
        href={href ?? "#"}
        className={rootClassName}
        onClick={handleClick}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      ref={(node) => {
        elRef.current = node;
      }}
      type="button"
      className={rootClassName}
      onClick={handleClick}
    >
      {inner}
    </button>
  );
}

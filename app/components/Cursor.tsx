"use client";

import { useEffect, useRef } from "react";

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    // Reduced motion: ascundem ambele elemente (cursor + trail) și nu atașăm
    // listenerii. Browser-ul va folosi pointerul nativ — body păstrează
    // cursor: none, dar ascunderea cursor-ului custom face ca pointerul real
    // să fie singurul vizibil pe device-uri cu hover.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      cursor.style.display = "none";
      trail.style.display = "none";
      document.body.style.cursor = "auto";
      return;
    }

    let cx = 0;
    let cy = 0;
    let tx = 0;
    let ty = 0;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;

      const target = e.target instanceof Element ? e.target : null;
      const interactive = target?.closest("a, button, .magnetic");
      if (interactive) {
        cursor.classList.add("hover");
      } else {
        cursor.classList.remove("hover");
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        cursor.classList.remove("hover");
      }
    };

    const trailLoop = () => {
      tx += (cx - tx) * 0.12;
      ty += (cy - ty) * 0.12;
      trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(trailLoop);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseout", handleMouseOut);
    rafId = requestAnimationFrame(trailLoop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="cursor" />
      <div ref={trailRef} className="cursor-trail" />
    </>
  );
}

"use client";

// Bara de progres scroll — 1px sus, mix-blend-mode: difference.
// Citește progressRef (ref, NU state) din ScrollPaletteContext într-un RAF propriu
// și setează width imperativ → zero re-renderuri React per frame.
import { useEffect, useRef } from "react";
import { useScrollPalette } from "@/app/lib/scroll-palette-context";

export default function ScrollProgress() {
  const elRef = useRef<HTMLDivElement | null>(null);
  const { progressRef } = useScrollPalette();

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let rafId = 0;
    const tick = () => {
      el.style.width = progressRef.current * 100 + "%";
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [progressRef]);

  return <div ref={elRef} className="scroll-progress" aria-hidden="true" />;
}

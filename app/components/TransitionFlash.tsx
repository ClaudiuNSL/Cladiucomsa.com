"use client";

// Overlay flash între secțiuni — ascultă `chromatic:flash` pe window,
// reaplică clasa .fire după reflow forțat pentru re-trigger imediat al animației.
// Debounce 300ms ca trecerile rapide de secțiuni să nu stack-uiască flash-uri.
import { useEffect, useRef } from "react";
import { FLASH_EVENT } from "@/app/lib/flash-bus";

const DEBOUNCE_MS = 300;

export default function TransitionFlash() {
  const elRef = useRef<HTMLDivElement | null>(null);
  const lastFiredRef = useRef(0);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    // Reduced motion: flash-ul e un puls de blur fullscreen — skip total.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const handleFlash = () => {
      const now = performance.now();
      if (now - lastFiredRef.current < DEBOUNCE_MS) return;
      lastFiredRef.current = now;

      el.classList.remove("fire");
      // Reflow forțat — fără asta browserul ar batch-ui remove+add și animația nu ar reporni.
      void el.offsetWidth;
      el.classList.add("fire");
    };

    window.addEventListener(FLASH_EVENT, handleFlash);
    return () => {
      window.removeEventListener(FLASH_EVENT, handleFlash);
    };
  }, []);

  return <div ref={elRef} className="transition-flash" aria-hidden="true" />;
}

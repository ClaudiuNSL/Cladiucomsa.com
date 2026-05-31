"use client";

// Nav — header cu slot CC + hamburger și overlay fullscreen meniu.
// CC devine vizibil când Hero condense semnalează prin navCCVisible (Task 13).
// Click pe menu item: închide overlay → 700ms delay → Lenis.scrollTo target.

import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollPalette } from "@/app/lib/scroll-palette-context";
import { useLenis } from "@/app/components/LenisProvider";

type MenuItem = { label: string; target: string };

const MENU_ITEMS: ReadonlyArray<MenuItem> = [
  { label: "Proiecte", target: "#projects" },
  { label: "Studio", target: "#studio" },
  { label: "Despre", target: "#story" },
  { label: "Contact", target: "#footer" },
];

export default function Nav() {
  const { navCCVisible } = useScrollPalette();
  const lenis = useLenis();
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLElement | null>(null);

  // Forțăm explicit reset display după ce transition-ul de close termină.
  // Belt-and-suspenders: dacă CSS-ul nu prinde visibility:hidden corect
  // (Lenis interference, mix-blend-mode etc.), JS-ul îl ascunde direct.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    if (open) {
      el.style.display = "";
      return;
    }
    const t = window.setTimeout(() => {
      // Re-check: dacă între timp s-a redeschis, nu-l ascundem
      if (overlayRef.current && !overlayRef.current.classList.contains("open")) {
        overlayRef.current.style.display = "none";
      }
    }, 900);
    return () => window.clearTimeout(t);
  }, [open]);

  // Lock/unlock Lenis în funcție de starea overlay-ului
  useEffect(() => {
    if (!lenis) return;
    if (open) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [open, lenis]);

  // Escape închide overlay-ul (listener activ doar când e deschis)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onMenuClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
      if (!lenis) {
        // Reduced-motion / Lenis-not-ready: close overlay and let native anchor jump.
        setOpen(false);
        return;
      }
      e.preventDefault();
      setOpen(false);
      // Lăsăm overlay-ul să se închidă vizual înainte de scroll
      window.setTimeout(() => {
        const el = document.querySelector<HTMLElement>(target);
        if (!el) return;
        lenis.scrollTo(el, { offset: 0, duration: 1.2 });
      }, 700);
    },
    [lenis]
  );

  return (
    <>
      <header className="nav">
        <a
          href="#hero"
          aria-label="Acasă"
          onClick={(e) => {
            if (!lenis) {
              // Reduced-motion / Lenis-not-ready: close overlay (if open) and let the
              // native anchor handle the jump.
              if (open) setOpen(false);
              return;
            }
            e.preventDefault();
            const wasOpen = open;
            if (wasOpen) setOpen(false);
            window.setTimeout(
              () => {
                lenis.scrollTo(0, { duration: 1.2 });
              },
              wasOpen ? 700 : 0
            );
          }}
        >
          <span id="nav-cc" className={`nav-cc${navCCVisible ? " show" : ""}`}>
            CC
          </span>
        </a>
        <div className="nav-right">
          <span className="nav-meta hide-mobile">CONSTANȚA · 2026</span>
          <button
            type="button"
            className={`menu-btn${open ? " open" : ""}`}
            id="menu-btn"
            aria-label="Meniu"
            aria-expanded={open}
            aria-controls="menu-overlay"
            onClick={() => setOpen((v) => !v)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <nav
        ref={overlayRef}
        className={`menu-overlay${open ? " open" : ""}`}
        id="menu-overlay"
        aria-hidden={!open}
      >
        <ul className="menu-items">
          {MENU_ITEMS.map((item) => (
            <li key={item.target}>
              <a
                href={item.target}
                onClick={(e) => onMenuClick(e, item.target)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

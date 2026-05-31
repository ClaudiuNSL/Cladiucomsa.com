"use client";

// MUST be the first import — disables THREE.ColorManagement before any Color
// constructor runs (see app/lib/three-init.ts).
import "@/app/lib/three-init";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { DARK_THRESHOLD, lerpPalette } from "./scroll-palette";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// LOCKED surface contract (plan Round 3 F2):
// - progressRef: mutated 60fps, NEVER setState — prevents Nav re-render churn
// - baseRef/accentRef: THREE.Color refs mutated via .setRGB() per frame
// - navCCVisible: reactive state, flips once when hero condense completes
type ScrollPaletteValue = {
  progressRef: MutableRefObject<number>;
  baseRef: MutableRefObject<THREE.Color>;
  accentRef: MutableRefObject<THREE.Color>;
  navCCVisible: boolean;
  setNavCCVisible: (v: boolean) => void;
};

const ScrollPaletteContext = createContext<ScrollPaletteValue | null>(null);

export function ScrollPaletteProvider({ children }: { children: ReactNode }) {
  const progressRef = useRef(0);
  const baseRef = useRef(new THREE.Color());
  const accentRef = useRef(new THREE.Color());
  const wasLightRef = useRef(false);
  const [navCCVisible, setNavCCVisible] = useState(false);

  // Seed initial palette (stop 0) before first scroll fires
  useEffect(() => {
    const initial = lerpPalette(0);
    baseRef.current.setRGB(initial.base[0], initial.base[1], initial.base[2]);
    accentRef.current.setRGB(initial.accent[0], initial.accent[1], initial.accent[2]);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        progressRef.current = p;

        const next = lerpPalette(p);
        baseRef.current.setRGB(next.base[0], next.base[1], next.base[2]);
        accentRef.current.setRGB(next.accent[0], next.accent[1], next.accent[2]);

        // Body class toggle: only fire on threshold cross, not every frame
        const nowLight = p > DARK_THRESHOLD;
        if (wasLightRef.current !== nowLight) {
          wasLightRef.current = nowLight;
          document.body.classList.toggle("fg-light", nowLight);
        }

        // Scrolled class — flips once after first scroll, no per-frame churn
        if (p > 0.04 && !document.body.classList.contains("scrolled")) {
          document.body.classList.add("scrolled");
        } else if (p <= 0.04 && document.body.classList.contains("scrolled")) {
          document.body.classList.remove("scrolled");
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const value = useMemo<ScrollPaletteValue>(
    () => ({ progressRef, baseRef, accentRef, navCCVisible, setNavCCVisible }),
    [navCCVisible]
  );

  return (
    <ScrollPaletteContext.Provider value={value}>{children}</ScrollPaletteContext.Provider>
  );
}

export function useScrollPalette(): ScrollPaletteValue {
  const ctx = useContext(ScrollPaletteContext);
  if (!ctx) {
    throw new Error("useScrollPalette must be used inside <ScrollPaletteProvider>");
  }
  return ctx;
}

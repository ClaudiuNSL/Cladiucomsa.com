// Pure data — no three.js dependency. Importable from server components if needed.

export type PaletteStop = {
  base: [number, number, number];
  accent: [number, number, number];
};

// 4 stops, interpolated continuously on full-page scroll progress.
// Hero (cream/cool-gray) → Projects (sand/taupe) → Studio/Story (bej+orange) → Footer (charcoal/gold).
export const PALETTE_STOPS: readonly PaletteStop[] = [
  { base: [0.96, 0.94, 0.89], accent: [0.65, 0.65, 0.67] },
  { base: [0.91, 0.85, 0.74], accent: [0.42, 0.39, 0.34] },
  { base: [0.88, 0.8, 0.66], accent: [0.78, 0.5, 0.3] },
  { base: [0.16, 0.14, 0.11], accent: [0.85, 0.7, 0.48] },
];

// Body.fg-light class flips when scroll progress crosses this threshold
// (entering the dark final stop where text must invert to cream).
// Trebuie să rămână aproape de 1.0 — Story (stop 2, bej+orange) cere text închis;
// doar Footer (stop 3, charcoal+gold) are background efectiv întunecat.
export const DARK_THRESHOLD = 0.93;

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPalette(progress: number): PaletteStop {
  const clamped = Math.max(0, Math.min(1, progress));
  const segments = PALETTE_STOPS.length - 1;
  const seg = Math.min(Math.floor(clamped * segments), segments - 1);
  const local = clamped * segments - seg;
  const t = smoothstep(local);
  const a = PALETTE_STOPS[seg];
  const b = PALETTE_STOPS[seg + 1];
  return {
    base: [
      lerp(a.base[0], b.base[0], t),
      lerp(a.base[1], b.base[1], t),
      lerp(a.base[2], b.base[2], t),
    ],
    accent: [
      lerp(a.accent[0], b.accent[0], t),
      lerp(a.accent[1], b.accent[1], t),
      lerp(a.accent[2], b.accent[2], t),
    ],
  };
}

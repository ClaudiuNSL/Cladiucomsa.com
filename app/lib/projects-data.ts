// Project metadata — locked register for the 5 signature sections (Task 16+).
// Cele 3 confirmate au imagini reale în /public/projects/; ultimele 2 rămân
// `null` până când userul livrează preview-urile în Phase 2 (TODO).
// Copy-ul (titlu, subtitlu, an) este aliniat cu mockup-ul Chromatic Drift —
// orice update vizual trebuie sincronizat cu previews/chromatic-drift/index.html.

export type ProjectMeta = {
  slug: string;
  title: string;
  sub: string;
  year: string;
  image: string | null;
  imagePlaceholder?: "filter-shift" | "tbd";
};

export const PROJECTS: readonly ProjectMeta[] = [
  {
    slug: "banciu",
    title: "Banciu Costin Photography",
    sub: "Foto / Site + Admin",
    year: "2026",
    image: "/projects/banciu-login.png",
  },
  {
    slug: "aurasjobs",
    title: "Aurasjobs",
    sub: "Recrutare / Web",
    year: "2024",
    image: "/projects/aurasjobs-preview.jpg",
  },
  {
    slug: "stereocad",
    title: "Stereocad",
    sub: "CAD / Industrial",
    year: "2024",
    image: "/projects/stereocad-preview.jpg",
  },
  {
    slug: "confidential",
    title: "Proiect confidențial",
    sub: "Identitate / NDA",
    year: "2025",
    image: null,
    imagePlaceholder: "tbd",
  },
  {
    slug: "atelier",
    title: "Atelier personal",
    sub: "Experiment / Shader",
    year: "2025",
    image: null,
    imagePlaceholder: "tbd",
  },
] as const;

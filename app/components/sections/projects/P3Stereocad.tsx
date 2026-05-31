"use client";

// P3 Stereocad — split scroll + 3D cube.
// Port din previews/chromatic-drift/index.html (liniile ~1133-1157 markup,
// 595-665 CSS, 1828-1841 JS). Layout split: coloana stângă cu copy editorial
// + coloana dreaptă cu un cub CSS 3D care se rotește pe scroll.
//
// CRITICAL iOS Safari: elementul sticky (.p3-pin) este ANCESTORUL elementului
// cu `transform-style: preserve-3d` (.p3-cube). Această direcție de nesting
// este SIGURĂ pe iOS Safari — direcția inversă (preserve-3d wrappers sticky
// descendant) rupe position: sticky. NU inversa ordinea fără a verifica iOS.
//
// Cubul rotește rotateY: 720, rotateX: 180 pe scrub între `top top` și
// `bottom top` (per task spec — mockup folosea `bottom bottom`, dar specul
// taskului cere `bottom top` pentru un range mai compact).

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function P3Stereocad() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cubeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const section = sectionRef.current;
    const cube = cubeRef.current;
    if (!section || !cube) return;

    const tween = gsap.to(cube, {
      rotateY: 720,
      rotateX: 180,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="p3">
      {/* Coloana stângă — copy editorial, scroll normal (non-sticky). */}
      <div className="p3-left">
        <span className="num">03 / Stereocad</span>
        <h3>
          Plan, <span className="soft">volum</span>, decizie.
        </h3>
        <div className="blurbs">
          <p>
            Un atelier de proiectare care lucra cu zeci de fișiere 3D pe lună.
            Le-am construit o vitrină în care fiecare proiect respiră.
          </p>
          <p>
            Componente reutilizabile, structură care suportă creșterea, viteză
            care nu cere scuze pe 4G.
          </p>
          <p>
            Site-ul nu este un catalog. Este un proces vizualizat — de la primul
            render până la livrare.
          </p>
          <p>
            Două luni de muncă, o pagină pe care arhitecții o țin deschisă în
            timpul ședințelor.
          </p>
        </div>
      </div>

      {/* Coloana dreaptă — .p3-pin (sticky) este ANCESTOR al .p3-cube
          (preserve-3d). Această nesting direction este iOS-Safari-safe. */}
      <div className="p3-right">
        <div className="p3-pin">
          <div className="p3-cube" ref={cubeRef}>
            {/* Față 1 (front) — imagine reală Stereocad. */}
            <div className="face f1 face-image">
              <Image
                src="/projects/stereocad-preview.jpg"
                alt="Stereocad — render proiect"
                fill
                sizes="(max-width: 767px) 240px, 30vw"
                style={{ objectFit: "cover" }}
              />
              <span className="face-label">Render</span>
            </div>
            <div className="face f2">Plan</div>
            <div className="face f3">Detaliu</div>
            <div className="face f4">Volum</div>
            <div className="face f5">Material</div>
            <div className="face f6">Livrare</div>
          </div>
        </div>
      </div>
    </section>
  );
}

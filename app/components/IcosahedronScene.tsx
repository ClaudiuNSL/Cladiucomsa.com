"use client";

// MUST be the first import — disables THREE.ColorManagement before any Color
// constructor runs (see app/lib/three-init.ts). Locked Option A color-space
// contract: outputColorSpace = LinearSRGBColorSpace, NO convertSRGBToLinear()
// on materials. Matches Task 11 ShaderBackground.
import "@/app/lib/three-init";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useScrollPalette } from "../lib/scroll-palette-context";

// Scenă 3D foreground — două icosaedre wireframe imbricate, rotate continuu,
// culoare driven de accentRef (paleta scroll). Decorativă: dacă WebGL lipsește
// sau contextul se pierde, pagina supraviețuiește fără canvas.
export default function IcosahedronScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { progressRef, accentRef } = useScrollPalette();

  useEffect(() => {
    if (!canvasRef.current) return;
    // Captured non-null local — TS-narrowed pentru closures interioare
    const canvas: HTMLCanvasElement = canvasRef.current;

    // WebGL availability check — icosaedrul e decorativ, dacă lipsește ieșim
    const probe = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!probe) return;

    // Reduced motion: oprim rotația continuă, randăm doar la schimbare scroll
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

    let rafId = 0;
    let lastProgress = -1;
    let showing = false;

    // Resurse care trebuie disposed la unmount sau la context-loss
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let outer: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshBasicMaterial> | null = null;
    let inner: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshBasicMaterial> | null = null;

    function buildScene() {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      // Locked color-space contract (Option A) — matches ShaderBackground (T11)
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 4;

      // Icosaedru exterior — wireframe principal, opacitate 0.65
      outer = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.3, 1),
        new THREE.MeshBasicMaterial({
          color: 0x2a2520,
          wireframe: true,
          transparent: true,
          opacity: 0.65,
        })
      );
      // Icosaedru interior — wireframe secundar, opacitate 0.4
      inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.85, 0),
        new THREE.MeshBasicMaterial({
          color: 0x5a4a36,
          wireframe: true,
          transparent: true,
          opacity: 0.4,
        })
      );
      scene.add(outer, inner);
      resize();
    }

    function resize() {
      if (!renderer || !camera) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function render() {
      if (!renderer || !scene || !camera || !outer || !inner) return;
      const accent = accentRef.current;
      // Mockup: outer = accent * 0.6, inner = accent * 0.9 (păstrăm dual-tone)
      outer.material.color.copy(accent).multiplyScalar(0.6);
      inner.material.color.copy(accent).multiplyScalar(0.9);
      renderer.render(scene, camera);
    }

    function tick() {
      const p = progressRef.current;

      // Visible doar în hero + manifesto (până la ProjectsHeader ~0.13). După
      // primele secțiuni iese complet din scenă — altfel acoperă imaginile de
      // proiecte și textul Studio. CSS-ul are tranziție 1s pe opacity, deci
      // fade-out e neted la 0.13.
      const shouldShow = p > 0.02 && p < 0.13;
      if (shouldShow !== showing) {
        showing = shouldShow;
        canvas.classList.toggle("show", shouldShow);
      }

      if (reducedMotion) {
        // Randăm doar dacă scroll-ul s-a mutat
        if (p !== lastProgress) {
          lastProgress = p;
          render();
        }
      } else {
        // Rotații continue — outer înainte, inner invers, ca în mockup
        if (outer && inner) {
          outer.rotation.x += 0.002;
          outer.rotation.y += 0.0014;
          inner.rotation.x -= 0.003;
          inner.rotation.y -= 0.0022;
        }
        render();
      }

      rafId = requestAnimationFrame(tick);
    }

    function disposeScene() {
      if (outer) {
        outer.geometry.dispose();
        outer.material.dispose();
      }
      if (inner) {
        inner.geometry.dispose();
        inner.material.dispose();
      }
      if (renderer) {
        renderer.dispose();
      }
      outer = null;
      inner = null;
      scene = null;
      camera = null;
      renderer = null;
    }

    function onContextLost(e: Event) {
      e.preventDefault();
      cancelAnimationFrame(rafId);
      // Renderer-ul nu mai e utilizabil; aruncăm contextul, reconstruim la restored
      disposeScene();
    }

    function onContextRestored() {
      buildScene();
      lastProgress = -1; // forțează un render la următorul tick (reduced motion)
      rafId = requestAnimationFrame(tick);
    }

    function onResize() {
      resize();
    }

    buildScene();
    canvas.addEventListener("webglcontextlost", onContextLost as EventListener, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored as EventListener, false);
    window.addEventListener("resize", onResize);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("webglcontextlost", onContextLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onContextRestored as EventListener);
      window.removeEventListener("resize", onResize);
      disposeScene();
      // Curățăm clasa, în caz că rămâne din ultimul tick
      canvas.classList.remove("show");
    };
  }, [accentRef, progressRef]);

  return <canvas ref={canvasRef} className="canvas-3d" aria-hidden="true" />;
}

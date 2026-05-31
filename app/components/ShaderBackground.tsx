"use client";

// Task 11 — Fullscreen WebGL shader background (Chromatic Drift signature visual).
// Continuously interpolates palette colors (uBase/uAccent) via Three.js fragment shader.
//
// Color-space contract (Option A — locked, see app/lib/three-init.ts):
//   - ColorManagement disabled globally (three-init imported FIRST).
//   - renderer.outputColorSpace = LinearSRGBColorSpace.
//   - Palette refs are written via .setRGB() in linear space; NO .convertSRGBToLinear().
//
// SSR safety: 'use client' + all THREE/window access inside useEffect.
// Direct import from server-component layout.tsx is fine.

import "@/app/lib/three-init";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useScrollPalette } from "@/app/lib/scroll-palette-context";
import { PALETTE_STOPS } from "@/app/lib/scroll-palette";
import { vertexShader } from "@/app/lib/shaders/chromatic-drift.vert";
import { fragmentShader } from "@/app/lib/shaders/chromatic-drift.frag";

type Uniforms = {
  uTime: { value: number };
  uScroll: { value: number };
  uResolution: { value: THREE.Vector2 };
  uBase: { value: THREE.Color };
  uAccent: { value: THREE.Color };
};

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { progressRef, baseRef, accentRef } = useScrollPalette();
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL availability check — render fallback gradient instead of throwing
    const probe = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!probe) {
      queueMicrotask(() => setWebglFailed(true));
      return;
    }
    // Release the probe context so Three.js can claim the canvas cleanly.
    const loseExt = probe.getExtension("WEBGL_lose_context");
    if (loseExt) loseExt.loseContext();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const pixelRatioCap = isMobile ? 1.25 : 1.75;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms: Uniforms = {
      uTime: { value: 0 },
      uScroll: { value: progressRef.current },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uBase: { value: baseRef.current.clone() },
      uAccent: { value: accentRef.current.clone() },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    let renderer: THREE.WebGLRenderer | null = null;
    const clock = new THREE.Clock();
    let rafId: number | null = null;

    const createRenderer = () => {
      const r = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
      });
      r.outputColorSpace = THREE.LinearSRGBColorSpace;
      r.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
      r.setSize(window.innerWidth, window.innerHeight, false);
      return r;
    };

    const renderFrame = () => {
      if (!renderer) return;
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uScroll.value = progressRef.current;
      uniforms.uBase.value.copy(baseRef.current);
      uniforms.uAccent.value.copy(accentRef.current);
      renderer.render(scene, camera);
    };

    const loop = () => {
      renderFrame();
      rafId = window.requestAnimationFrame(loop);
    };

    try {
      renderer = createRenderer();
    } catch {
      queueMicrotask(() => setWebglFailed(true));
      geometry.dispose();
      material.dispose();
      return;
    }

    // Initial render — single frame is enough for reduced-motion users.
    renderFrame();
    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(loop);
    }

    // Resize handler — update renderer size + uResolution uniform.
    const handleResize = () => {
      if (!renderer) return;
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      // For reduced-motion, re-render once so resize is reflected.
      if (prefersReducedMotion) renderFrame();
    };
    window.addEventListener("resize", handleResize);

    // WebGL context loss/restore — preventDefault and re-create renderer.
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
    const handleContextRestored = () => {
      // Renderer's GL resources are gone; dispose and rebuild.
      if (renderer) {
        renderer.dispose();
        renderer = null;
      }
      try {
        renderer = createRenderer();
      } catch {
        setWebglFailed(true);
        return;
      }
      // uResolution may have changed during the lost period.
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      renderFrame();
      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(loop);
      }
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      geometry.dispose();
      material.dispose();
      if (renderer) renderer.dispose();
    };
    // Refs are stable identities; intentionally exclude from deps so the effect
    // runs once on mount and not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (webglFailed) {
    // Fallback gradient using palette stop 0 (cream + cool-gray).
    const [br, bg, bb] = PALETTE_STOPS[0].base;
    const [ar, ag, ab] = PALETTE_STOPS[0].accent;
    const to255 = (v: number) => Math.round(v * 255);
    const baseCss = `rgb(${to255(br)}, ${to255(bg)}, ${to255(bb)})`;
    const accentCss = `rgb(${to255(ar)}, ${to255(ag)}, ${to255(ab)})`;
    return (
      <div
        className="canvas-bg"
        style={{
          background: `linear-gradient(135deg, ${baseCss} 0%, ${accentCss} 100%)`,
        }}
        aria-hidden="true"
      />
    );
  }

  return <canvas ref={canvasRef} className="canvas-bg" aria-hidden="true" />;
}

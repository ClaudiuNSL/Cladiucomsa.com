'use client';
// Scena 3D cinematica fixata in spatele continutului paginii.
// Secventa: asteroid solid -> emissive intensifies + energy pulse -> explozie
// in 300 fragmente -> float liber -> atragere catre litere "CC" -> bloc solid.
// Toata animatia e condusa de progresul de scroll prin GSAP ScrollTrigger.
// Vibe mdx.so: dark, minimal, rim-lights subtile, bloom subtil, vignette.
// Iluminare cinematica in 3 puncte (key + blue rim + fill) + glow point
// in spatele obiectului. Rotatii continue conduse prin GSAP.
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Float,
  Sparkles,
  Stars,
  useGLTF,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, Suspense, type RefObject } from 'react';

// Hook intern: detecteaza viewport sub Tailwind lg (1024px). Pe mobile,
// reducem costul scenei 3D — fara post-processing, fara particule decorative,
// DPR=1, fara umbre. useSyncExternalStore e pattern-ul React 19 corect pentru
// media queries (evita lint react-hooks/set-state-in-effect).
const MOBILE_QUERY = '(max-width: 1023px)';

function useIsMobile() {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const mq = window.matchMedia(MOBILE_QUERY);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const getSnapshot = () =>
    typeof window === 'undefined' ? false : window.matchMedia(MOBILE_QUERY).matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Ref shared intre componenta-parinte si meshes — citit la fiecare frame.
type ProgressRef = { current: number };
// Pozitia mouse-ului normalizata in [-1, 1] pe fiecare axa.
type MouseRef = { current: { x: number; y: number } };

// Pregateste geometria asteroidului din modelul Bennu NASA OSIRIS-REx OLA
// (incarcat ca .glb compressed Draco din /public/models/bennu.glb).
// - Scaleaza modelul la radius ~1.2 ca sa pastreze compozitia scenei
// - Genereaza UV-uri sferice (NASA OLA n-are UV-uri, sunt doar laser data)
// - Adauga uv2 pentru AO map sampling
function prepareBennuGeometry(source: THREE.BufferGeometry) {
  const geo = source.clone();

  // Calculeaza bbox-ul pentru a scala la radius ~1.2.
  geo.computeBoundingBox();
  const bbox = geo.boundingBox!;
  const extent = Math.max(
    bbox.max.x - bbox.min.x,
    bbox.max.y - bbox.min.y,
    bbox.max.z - bbox.min.z
  );
  // Target extent ~2.4 (radius 1.2). Bennu raw extent ~0.57.
  const targetExtent = 2.4;
  const scale = targetExtent / extent;
  geo.scale(scale, scale, scale);

  // Centreaza geometria la origin.
  geo.computeBoundingBox();
  const center = geo.boundingBox!.getCenter(new THREE.Vector3());
  geo.translate(-center.x, -center.y, -center.z);

  // Generam UV-uri sferice — projectie equirectangular pe baza directiei
  // de la origin. Permite ca texturile noastre (diffuse/normal/AO/emissive)
  // sa fie aplicate pe model.
  const positions = geo.attributes.position as THREE.BufferAttribute;
  const uvs = new Float32Array(positions.count * 2);
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i).normalize();
    const u = Math.atan2(v.x, v.z) / (2 * Math.PI) + 0.5;
    const t = Math.asin(THREE.MathUtils.clamp(v.y, -1, 1)) / Math.PI + 0.5;
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = t;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  // uv2 pentru AO map sampling.
  geo.setAttribute('uv2', new THREE.BufferAttribute(uvs.slice(), 2));

  // Recompute normals daca lipsesc.
  if (!geo.attributes.normal) geo.computeVertexNormals();

  return geo;
}

// Genereaza 6 texturi PBR pentru asteroid:
//  1. diffuseMap (1K canvas): Voronoi cells + cratere pictate la 3 scari +
//     vene minerale + dust subtil. Gama foarte intunecata (gri 20-90).
//  2. normalMap (1K canvas): multi-scale height + Sobel filter.
//  3. roughnessMap (1K canvas): variatie organica, foarte non-lucios (>0.8).
//  4. aoMap (1K canvas): white base + radial dark patches pe crevices,
//     citit prin uv2 channel (setat pe geometrie).
//  5. displacementMap (1K canvas): noise organic, scale mic in material.
//  6. emissiveMap (1K data texture): pattern crack-uri subtili — pastrat
//     din implementarea anterioara pentru efectul de lumina interioara.
// Total ~66MB GPU memory. Generarea la mount costa 1-3s pe thread principal
// (Suspense fallback={null} acopera asta).
function buildAsteroidSurfaceMaps() {
  if (typeof document === 'undefined') return null;
  const size = 1024; // 1K pentru diffuse/normal/roughness/AO (deferat in useEffect)
  const noise2D = createNoise2D();

  // === DIFFUSE/ALBEDO MAP (1K canvas) ===
  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = size;
  diffuseCanvas.height = size;
  const diffuseCtx = diffuseCanvas.getContext('2d')!;

  diffuseCtx.fillStyle = '#121417';
  diffuseCtx.fillRect(0, 0, size, size);

  // Generam culoarea per pixel din noise multi-octava — variatie organica
  // de tip "grain". Centrata pe #121417 (RGB 18,20,23) — antracit cu tenta rece.
  const imageData = diffuseCtx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // 3 octave noise pentru variatie de luminozitate
      const n1 = noise2D(x * 0.015 + 1000, y * 0.015 + 1000) * 0.5 + 0.5;
      const n2 = noise2D(x * 0.04 + 2000, y * 0.04 + 2000) * 0.5 + 0.5;
      const n3 = noise2D(x * 0.12 + 3000, y * 0.12 + 3000) * 0.5 + 0.5;
      // Grain boundaries — pe zero crossings ale noise-ului
      const grainEdge = Math.abs(noise2D(x * 0.025 + 4000, y * 0.025 + 4000));
      const edgeDarken = grainEdge < 0.05 ? (1 - grainEdge / 0.05) * 0.25 : 0;
      // Variatie ±10 in jurul bazei #121417. Range clamp 8-34.
      const variation = n1 * 8 + n2 * 4 + n3 * 2 + Math.random() * 2 - 1;
      const base = 14 + variation;
      const lit = Math.max(8, Math.min(34, base * (1 - edgeDarken)));
      // Tenta rece subtila — R<G<B pentru antracit cu subton albastru.
      data[idx] = Math.max(4, lit - 3);
      data[idx + 1] = Math.max(6, lit - 1);
      data[idx + 2] = lit + 2;
      data[idx + 3] = 255;
    }
  }
  diffuseCtx.putImageData(imageData, 0, 0);

  // Cratere mari pictate — 80x, cu rim highlight.
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 150 + 30;
    const craterGradient = diffuseCtx.createRadialGradient(x, y, 0, x, y, radius);
    craterGradient.addColorStop(0, 'rgba(15, 15, 17, 0.8)');
    craterGradient.addColorStop(0.6, 'rgba(22, 22, 25, 0.5)');
    craterGradient.addColorStop(0.85, 'rgba(30, 30, 33, 0.3)');
    craterGradient.addColorStop(1, 'rgba(40, 40, 43, 0)');
    diffuseCtx.fillStyle = craterGradient;
    diffuseCtx.beginPath();
    diffuseCtx.arc(x, y, radius, 0, Math.PI * 2);
    diffuseCtx.fill();

    const rimGradient = diffuseCtx.createRadialGradient(x, y, radius * 0.7, x, y, radius * 1.1);
    // Rim-uri cratere mai inchise — anterior RGB(70-80) saturau suprafata
    // si o transformau in alb pe lighting. Acum RGB(28-38) — usor mai luminat
    // ca baza #121417 dar nu mai pop.
    rimGradient.addColorStop(0, 'rgba(38, 38, 42, 0)');
    rimGradient.addColorStop(0.5, 'rgba(32, 32, 36, 0.25)');
    rimGradient.addColorStop(1, 'rgba(28, 28, 32, 0)');
    diffuseCtx.fillStyle = rimGradient;
    diffuseCtx.beginPath();
    diffuseCtx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
    diffuseCtx.fill();
  }

  // Cratere medii — 200x.
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 50 + 10;
    const gradient = diffuseCtx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(18, 18, 20, 0.7)');
    gradient.addColorStop(0.7, 'rgba(28, 28, 30, 0.4)');
    gradient.addColorStop(1, 'rgba(38, 38, 40, 0)');
    diffuseCtx.fillStyle = gradient;
    diffuseCtx.beginPath();
    diffuseCtx.arc(x, y, radius, 0, Math.PI * 2);
    diffuseCtx.fill();
  }

  // Micro cratere si pits — 500x.
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 12 + 2;
    const gradient = diffuseCtx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(12, 12, 14, 0.6)');
    gradient.addColorStop(1, 'rgba(25, 25, 27, 0)');
    diffuseCtx.fillStyle = gradient;
    diffuseCtx.beginPath();
    diffuseCtx.arc(x, y, radius, 0, Math.PI * 2);
    diffuseCtx.fill();
  }

  // Vene minerale lighter — 60x.
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 40 + 8;
    const gradient = diffuseCtx.createRadialGradient(x, y, 0, x, y, radius);
    // Vene minerale — mai luminate decat baza #121417 dar nu prea pop.
    gradient.addColorStop(0, 'rgba(48, 50, 56, 0.4)');
    gradient.addColorStop(0.5, 'rgba(38, 40, 46, 0.2)');
    gradient.addColorStop(1, 'rgba(30, 32, 38, 0)');
    diffuseCtx.fillStyle = gradient;
    diffuseCtx.beginPath();
    diffuseCtx.arc(x, y, radius, 0, Math.PI * 2);
    diffuseCtx.fill();
  }

  // Dust accumulation pe crevices — patches subtile rotite aleatoriu.
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const width = Math.random() * 100 + 30;
    const height = Math.random() * 60 + 20;
    const rotation = Math.random() * Math.PI;
    diffuseCtx.save();
    diffuseCtx.translate(x, y);
    diffuseCtx.rotate(rotation);
    const dustGradient = diffuseCtx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) / 2);
    dustGradient.addColorStop(0, 'rgba(20, 20, 22, 0.3)');
    dustGradient.addColorStop(1, 'rgba(30, 30, 32, 0)');
    diffuseCtx.fillStyle = dustGradient;
    diffuseCtx.beginPath();
    diffuseCtx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    diffuseCtx.fill();
    diffuseCtx.restore();
  }

  const diffuseMap = new THREE.CanvasTexture(diffuseCanvas);
  diffuseMap.wrapS = THREE.RepeatWrapping;
  diffuseMap.wrapT = THREE.RepeatWrapping;
  diffuseMap.anisotropy = 16;
  diffuseMap.colorSpace = THREE.SRGBColorSpace;

  // === NORMAL MAP (1K canvas) ===
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d')!;

  const normalImageData = normalCtx.getImageData(0, 0, size, size);
  const normalData = normalImageData.data;

  const getHeight = (px: number, py: number) => {
    const h1 = noise2D(px * 0.006 + 500, py * 0.006 + 500);
    const h2 = noise2D(px * 0.018 + 800, py * 0.018 + 800);
    const h3 = noise2D(px * 0.05 + 1200, py * 0.05 + 1200);
    const h4 = noise2D(px * 0.12 + 1600, py * 0.12 + 1600);
    return h1 * 0.35 + h2 * 0.3 + h3 * 0.2 + h4 * 0.15;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const strength = 2.0;
      const heightL = getHeight(x - 1, y);
      const heightR = getHeight(x + 1, y);
      const heightU = getHeight(x, y - 1);
      const heightD = getHeight(x, y + 1);
      const dx = (heightL - heightR) * strength;
      const dy = (heightU - heightD) * strength;
      normalData[idx] = Math.floor((dx * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.floor((dy * 0.5 + 0.5) * 255);
      normalData[idx + 2] = 255;
      normalData[idx + 3] = 255;
    }
  }
  normalCtx.putImageData(normalImageData, 0, 0);
  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = 16;
  normalMap.colorSpace = THREE.NoColorSpace;

  // === ROUGHNESS MAP (1K canvas) ===
  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = size;
  roughnessCanvas.height = size;
  const roughnessCtx = roughnessCanvas.getContext('2d')!;

  const roughImageData = roughnessCtx.getImageData(0, 0, size, size);
  const roughData = roughImageData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n1 = noise2D(x * 0.008 + 3000, y * 0.008 + 3000) * 0.5 + 0.5;
      const n2 = noise2D(x * 0.03 + 4000, y * 0.03 + 4000) * 0.5 + 0.5;
      const roughness = 210 + (n1 * 0.6 + n2 * 0.4) * 40 + Math.random() * 5;
      roughData[idx] = roughness;
      roughData[idx + 1] = roughness;
      roughData[idx + 2] = roughness;
      roughData[idx + 3] = 255;
    }
  }
  roughnessCtx.putImageData(roughImageData, 0, 0);
  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  // === AMBIENT OCCLUSION MAP (1K canvas) ===
  const aoCanvas = document.createElement('canvas');
  aoCanvas.width = size;
  aoCanvas.height = size;
  const aoCtx = aoCanvas.getContext('2d')!;
  aoCtx.fillStyle = '#ffffff';
  aoCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 100 + 25;
    const gradient = aoCtx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    aoCtx.fillStyle = gradient;
    aoCtx.beginPath();
    aoCtx.arc(x, y, radius, 0, Math.PI * 2);
    aoCtx.fill();
  }
  const aoMap = new THREE.CanvasTexture(aoCanvas);
  aoMap.wrapS = THREE.RepeatWrapping;
  aoMap.wrapT = THREE.RepeatWrapping;
  aoMap.colorSpace = THREE.NoColorSpace;

  // === DISPLACEMENT MAP (1K canvas) ===
  const dispSize = 1024;
  const dispCanvas = document.createElement('canvas');
  dispCanvas.width = dispSize;
  dispCanvas.height = dispSize;
  const dispCtx = dispCanvas.getContext('2d')!;
  const dispImageData = dispCtx.getImageData(0, 0, dispSize, dispSize);
  const dispData = dispImageData.data;
  for (let y = 0; y < dispSize; y++) {
    for (let x = 0; x < dispSize; x++) {
      const idx = (y * dispSize + x) * 4;
      const n = (
        noise2D(x * 0.008 + 5000, y * 0.008 + 5000) * 0.45 +
        noise2D(x * 0.025 + 6000, y * 0.025 + 6000) * 0.35 +
        noise2D(x * 0.07 + 7000, y * 0.07 + 7000) * 0.2
      ) * 0.5 + 0.5;
      const value = n * 255;
      dispData[idx] = value;
      dispData[idx + 1] = value;
      dispData[idx + 2] = value;
      dispData[idx + 3] = 255;
    }
  }
  dispCtx.putImageData(dispImageData, 0, 0);
  const displacementMap = new THREE.CanvasTexture(dispCanvas);
  displacementMap.wrapS = THREE.RepeatWrapping;
  displacementMap.wrapT = THREE.RepeatWrapping;
  displacementMap.colorSpace = THREE.NoColorSpace;

  // === EMISSIVE CRACK MAP (1K data texture) — pastrat din R9 ===
  // Pattern crack-uri subtile: linii subtiri ramificate care emit lumina rece
  // ca o fisura prin care iese lumina din interior. Culoare rece desaturata.
  const emSize = 1024;
  const emissiveData = new Uint8Array(emSize * emSize * 4);
  for (let y = 0; y < emSize; y++) {
    for (let x = 0; x < emSize; x++) {
      const i = y * emSize + x;
      const u = (x / emSize) * 4;
      const w = (y / emSize) * 4;
      const n1 = noise2D(u, w);
      const n2 = noise2D(u * 3.1, w * 3.1) * 0.4;
      const crackVal = Math.abs(n1 + n2);
      const crack = crackVal < 0.06 ? 1 - crackVal / 0.06 : 0;
      const breakup = (noise2D(u * 0.5, w * 0.5) + 1) * 0.5;
      const intensity = Math.pow(crack * breakup, 1.4);
      // Culoare crack-uri #4A5A70 = RGB(74, 90, 112) — oțel oxidat rece.
      emissiveData[i * 4] = Math.floor(intensity * 74);
      emissiveData[i * 4 + 1] = Math.floor(intensity * 90);
      emissiveData[i * 4 + 2] = Math.floor(intensity * 112);
      emissiveData[i * 4 + 3] = 255;
    }
  }
  const emissiveMap = new THREE.DataTexture(emissiveData, emSize, emSize, THREE.RGBAFormat);
  emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.needsUpdate = true;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { diffuseMap, normalMap, roughnessMap, aoMap, displacementMap, emissiveMap };
}

// Rotatii aleatoare per-piesa — axa de rotatie normalizata + viteza.
// Folosit de ExplosionDebris (sistemul de 25 pietre mari rocky).
// Helper extras la nivel de modul pentru ca lint-ul react-hooks/purity
// blocheaza Math.random() apelat direct in body de useMemo.
function buildFragmentRotations(count: number) {
  const rotations: { axis: THREE.Vector3; speed: number }[] = [];
  for (let i = 0; i < count; i++) {
    rotations.push({
      axis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
      // Rotatii mult mai chaotice — fragmentele se tumble haotic ca o explozie
      // reala. Range marit 4x fata de original.
      speed: 1.5 + Math.random() * 5.0,
    });
  }
  return rotations;
}

// Pentru ExplosionDebris — puncte de origine random pe suprafata asteroidului
// (sfera radius 1.2) + tinte fly-out radiale (5-8 unitati).
function buildDebrisOrigins(count: number) {
  const origins: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    const r = 1.2;
    origins.push(new THREE.Vector3(
      r * Math.sin(theta) * Math.cos(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(theta)
    ));
  }
  return origins;
}

function buildDebrisTargets(origins: THREE.Vector3[]) {
  return origins.map((o) => {
    const dir = o.clone().normalize();
    const dist = 5.0 + Math.random() * 3.0; // 5-8 zboara departe
    return dir.multiplyScalar(dist).add(new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    ));
  });
}

function buildDebrisScales(count: number) {
  const scales: number[] = [];
  for (let i = 0; i < count; i++) {
    scales.push(0.40 + Math.random() * 0.35); // 0.40-0.75, mari si vizibile
  }
  return scales;
}

// Pre-rolled per-piece "splitAt" timestamps pentru sub-shatter — 0.55-1.05s
// post-impact. Scos ca helper functie (in afara componentei) ca sa nu trigger-
// uim react-hooks/purity la apel inline pe Math.random.
function buildDebrisSplitAt(count: number) {
  const splitAt: number[] = [];
  for (let i = 0; i < count; i++) {
    splitAt.push(0.55 + Math.random() * 0.5);
  }
  return splitAt;
}

// Genereaza pozitii pentru belt-ul orbital de debris in jurul asteroidului.
// 8 chunks distribuiti pe o orbita circulara cu jitter random pe distanta
// + height. Scale individual marit ca sa fie clar vizibile (0.20-0.40).
function buildBeltDebris(count: number) {
  const items: {
    chunkIndex: number;
    position: [number, number, number];
    scale: number;
    rotation: [number, number, number];
  }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
    const distance = 2.6 + Math.random() * 1.4;
    const yOff = (Math.random() - 0.5) * 0.9;
    items.push({
      chunkIndex: i, // mapat % 24 in render ca sa wrap-uiasca pe geometriile disponibile
      position: [Math.cos(angle) * distance, yOff, Math.sin(angle) * distance],
      scale: 0.22 + Math.random() * 0.20,
      rotation: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ],
    });
  }
  return items;
}

const DEBRIS_COUNT = 25; // bucati mari rocky pentru momentul exploziei

// Fallback geometric pentru debris-ul mare daca asset-ul asteroid_belt n-a
// apucat sa se incarce inca. Module-level pentru stabilitate referentiala
// in JSX args (re-render-ul nu trebuie sa instantieze geometrie noua).
const debrisFallbackGeometry = new THREE.IcosahedronGeometry(1, 0);

// Sparks — puncte emisive portocalii care explodeaza din centru la impact.
// Mai putine pe mobile pentru perf (30 vs 80 instances + per-frame update).
const SPARK_COUNT_DESKTOP = 80;
const SPARK_COUNT_MOBILE = 30;

// Dust trails — line segments care urmaresc debris-ul. TRAIL_LEN puncte pe
// trail, history-based — fiecare frame shift-am toate punctele cu unul si
// pushim noua pozitie in slot 0.
const TRAIL_LEN_DESKTOP = 10;
const TRAIL_LEN_MOBILE = 5;

// Sub-shatter — bucati mai mici care se desprind din debris-ul principal
// mid-flight, intre 0.55 si 1.05s dupa impact. 70% chance per debris,
// 6 sub-pieces per split.
const SUB_DEBRIS_COUNT_DESKTOP = 60;
const SUB_DEBRIS_COUNT_MOBILE = 30;

interface MorphMeshesProps {
  progressRef: ProgressRef;
  mouseRef: MouseRef;
  reduced: boolean;
  isMobile: boolean;
  flashRef?: RefObject<HTMLDivElement | null>;
  // Ref catre BloomEffect (postprocessing). Folosit pentru intensity spike
  // la momentul impactului + damp inapoi la baseline. Tip `any` pentru ca
  // wrapper-ul `<Bloom>` din @react-three/postprocessing nu expune Bloom
  // ref typing publicly — instanta din .current este BloomEffect care are
  // intensity setter/getter.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bloomRef?: RefObject<any>;
}

function MorphMeshes({ progressRef, mouseRef, reduced, isMobile, flashRef, bloomRef }: MorphMeshesProps) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const asteroidMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Halo extern pre-impact — sfera aditiva portocalie in jurul asteroidului
  // care pulsează în window-ul p ∈ [0.16, 0.22]. Plus point light co-locat.
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloLightRef = useRef<THREE.PointLight>(null);

  // Tracking progres anterior — folosit pentru detecția trecerii peste pragul
  // 0.22 (declanșatorul efectelor de impact: flash, shake, sparks etc).
  const lastProgressRef = useRef(0);
  // Timestamp capturat la momentul impactului — folosit pentru camera shake
  // time-decayed (500ms). null când nu suntem post-impact.
  const shatterTimeRef = useRef<number | null>(null);

  // Pulse ring + fragments.
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);
  // Dust shockwave + dust particles fine.
  const dustRef = useRef<THREE.Mesh>(null);
  const dustMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const dustParticlesRef = useRef<THREE.Group>(null);
  // Modelul Bennu NASA OSIRIS-REx (.glb compressed Draco, 419KB).
  // useGLTF suspends until ready — Suspense-ul din parent acopera asteptarea.
  // NU folosim try/catch fiindca useGLTF arunca un Promise pe Suspense (mecanism
  // intern React), iar try/catch ar bloca suspendarea legitima.
  const gltf = useGLTF('/models/bennu.glb', '/draco/');

  // Asteroid belt — 24 forme reale de roci de la Sketchfab (CC-BY,
  // gianlucadistefano1998). Folosit pentru fragmente reale in loc de
  // primitive icosa/octa/tetra/dodeca, plus pentru debris-ul orbital.
  // Draco-compressed (47MB raw -> 4.5MB).
  const beltGltf = useGLTF('/models/asteroid_belt.glb', '/draco/');

  // Extragem cele 24 geometrii din belt, fiecare normalizata la unit size
  // (extent max = 1) si centrata in origin. Asa le putem instantia la orice
  // scale fara sa ne batem cu transformarile originale Sketchfab.
  const chunkGeometries = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    beltGltf.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const geo = (obj.geometry as THREE.BufferGeometry).clone();
        geo.computeBoundingBox();
        const bbox = geo.boundingBox!;
        const extent = Math.max(
          bbox.max.x - bbox.min.x,
          bbox.max.y - bbox.min.y,
          bbox.max.z - bbox.min.z
        ) || 1;
        const s = 1 / extent;
        geo.scale(s, s, s);
        geo.computeBoundingBox();
        const center = geo.boundingBox!.getCenter(new THREE.Vector3());
        geo.translate(-center.x, -center.y, -center.z);
        if (!geo.attributes.normal) geo.computeVertexNormals();
        geos.push(geo);
      }
    });
    return geos;
  }, [beltGltf]);

  // Geometria procesata: scalata + UV-uri sferice generate + centrata.
  const asteroidGeometry = useMemo(() => {
    let source: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !source) {
        source = obj.geometry as THREE.BufferGeometry;
      }
    });
    if (!source) {
      return new THREE.IcosahedronGeometry(1.2, 6);
    }
    return prepareBennuGeometry(source);
  }, [gltf]);
  // Texturi procedurale pentru asteroid — deferate cu setTimeout ca sa nu
  // blocheze first paint. Pana sunt gata, materialul foloseste fallback gri.
  const [surfaceMaps, setSurfaceMaps] = useState<ReturnType<typeof buildAsteroidSurfaceMaps>>(null);

  useEffect(() => {
    // Defer generation cu setTimeout — first paint apare imediat, texturile
    // pop-pează când sunt gata (1-2s mai târziu).
    const timer = setTimeout(() => {
      setSurfaceMaps(buildAsteroidSurfaceMaps());
    }, 16); // 1 frame delay — lasă timpul pentru first paint
    return () => clearTimeout(timer);
  }, []);

  // Date pentru ExplosionDebris — bucatile mari rocky care apar la momentul
  // exploziei.
  // Per-piece: splitAt (timestamp post-impact pentru sub-shatter), didSplit
  // (flag oneshot), prevPos (pentru derivare velocity intre frame-uri),
  // scaleMul (multiplier per-piece — devine 0.55 dupa split).
  // useRef cu lazy init — valorile sunt mutate in useFrame, deci NU pot fi
  // returnate dintr-un useMemo (regula react-hooks/immutability le marcheaza
  // ca imutabile). Math.random() in init e impur, deci e si motiv suplimentar
  // pentru a iesi din useMemo.
  type DebrisData = {
    origins: THREE.Vector3[];
    targets: THREE.Vector3[];
    rotations: { axis: THREE.Vector3; speed: number }[];
    scales: number[];
    splitAt: number[];
    didSplit: boolean[];
    prevPos: THREE.Vector3[];
    scaleMul: number[];
  };
  const debrisDataRef = useRef<DebrisData | null>(null);
  if (debrisDataRef.current === null) {
    const origins = buildDebrisOrigins(DEBRIS_COUNT);
    const targets = buildDebrisTargets(origins);
    const rotations = buildFragmentRotations(DEBRIS_COUNT);
    const scales = buildDebrisScales(DEBRIS_COUNT);
    const splitAt = buildDebrisSplitAt(DEBRIS_COUNT);
    const didSplit = Array.from({ length: DEBRIS_COUNT }, () => false);
    const prevPos = Array.from({ length: DEBRIS_COUNT }, () => new THREE.Vector3());
    const scaleMul = Array.from({ length: DEBRIS_COUNT }, () => 1);
    debrisDataRef.current = { origins, targets, rotations, scales, splitAt, didSplit, prevPos, scaleMul };
  }
  const debrisData = debrisDataRef.current;
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const debrisMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // === SPARKS — 80 (30 mobile) puncte emisive portocalii ===
  // Spawn la impact (p>=0.22), zboara radial cu drag, lifetime 0.6-1.4s,
  // scale flicker. Instance count = 0 initial; setam la sparkCount la spawn,
  // resetam la 0 pe scroll-back. Material MeshBasic (nu primesc lumina,
  // sunt deja "emisive" prin culoare + bloom).
  const sparkCount = isMobile ? SPARK_COUNT_MOBILE : SPARK_COUNT_DESKTOP;
  const sparksRef = useRef<THREE.InstancedMesh>(null);
  // useRef cu lazy init — sparkData e mutat in useFrame (life, vel, pos etc.),
  // deci nu poate veni dintr-un hook care returneaza valori imutabile.
  type SparkDatum = {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
    alive: boolean;
  };
  const sparkDataRef = useRef<SparkDatum[] | null>(null);
  if (sparkDataRef.current === null) {
    sparkDataRef.current = Array.from({ length: sparkCount }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      alive: false,
    }));
  }
  const sparkData = sparkDataRef.current;
  // === DUST TRAILS — line segments urmarind fiecare bucata de debris ===
  // Folosim LineSegments cu vertex colors si AdditiveBlending. Avem
  // DEBRIS_COUNT (25) trails × trailLen pozitii fiecare. Per frame:
  //   1. Shift history-ul (slot j ia valoarea din slot j-1).
  //   2. Push pozitia curenta a debris-ului in slot 0.
  //   3. Generam line segments: pentru fiecare pereche (j, j+1) de puncte,
  //      doua entry-uri in buffer (start + end). Total = trailLen-1 segmente
  //      per debris = (trailLen-1)*2 pozitii. Folosim drawRange ca sa
  //      lasam buffer-ul cu trailLen-1 segmente per debris (forma fix).
  const trailLen = isMobile ? TRAIL_LEN_MOBILE : TRAIL_LEN_DESKTOP;
  const trailObjRef = useRef<THREE.LineSegments>(null);
  // trailBuffers e consumat in JSX (bufferAttribute primeste array/count) si
  // mutat in useFrame (positions/colors typed arrays + history vectorii).
  // Pastrat in useMemo pentru ca JSX-ul are nevoie de buffer-ul stabil; muta-
  // rile pe typed array sunt safe in practica (referinta e aceeasi, Three.js
  // citeste din acelasi buffer GPU) si sunt eligibile la eslint-disable pe
  // linia respectiva.
  const trailBuffers = useMemo(() => {
    // Fiecare segment are 2 puncte (start+end), deci (trailLen-1) segmente
    // per debris -> (trailLen-1)*2 vertici per debris.
    const segsPerDebris = trailLen - 1;
    const vertsPerDebris = segsPerDebris * 2;
    const totalVerts = DEBRIS_COUNT * vertsPerDebris;
    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const history = Array.from({ length: DEBRIS_COUNT }, () =>
      Array.from({ length: trailLen }, () => new THREE.Vector3())
    );
    return { positions, colors, history, segsPerDebris };
  }, [trailLen]);

  // === SUB-SHATTER — 60 (30 mobile) icosahedroane mici care apar cand un
  // debris se sparge mid-flight. spawnSubDebris primeste pozitia + viteza
  // parintelui, plaseaza 6 bucati cu velocity = parentVel*0.5 + dir*magnitude. ===
  const subDebrisCount = isMobile ? SUB_DEBRIS_COUNT_MOBILE : SUB_DEBRIS_COUNT_DESKTOP;
  const subDebrisRef = useRef<THREE.InstancedMesh>(null);
  // useRef cu lazy init — subData e mutat in useFrame (life, pos, quat etc.),
  // deci nu poate veni dintr-un hook care returneaza valori imutabile.
  type SubDatum = {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
    alive: boolean;
    quat: THREE.Quaternion;
    rotAxis: THREE.Vector3;
    rotSpeed: number;
  };
  const subDataRef = useRef<SubDatum[] | null>(null);
  if (subDataRef.current === null) {
    subDataRef.current = Array.from({ length: subDebrisCount }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 2,
      alive: false,
      quat: new THREE.Quaternion(),
      rotAxis: new THREE.Vector3(),
      rotSpeed: 0,
    }));
  }
  const subData = subDataRef.current;
  const spawnSubDebris = useCallback(
    (originPos: THREE.Vector3, originVel: THREE.Vector3) => {
      let placed = 0;
      for (let i = 0; i < subDebrisCount && placed < 6; i++) {
        const s = subData[i];
        if (s.alive) continue;
        // Directie random uniforma + magnitudine 1.8-3.4.
        const dir = new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize();
        s.pos.copy(originPos);
        s.vel
          .copy(originVel)
          .multiplyScalar(0.5)
          .add(dir.multiplyScalar(1.8 + Math.random() * 1.6));
        s.life = 0;
        s.maxLife = 1.2 + Math.random() * 0.8;
        s.rotAxis
          .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
          .normalize();
        s.rotSpeed = 3 + Math.random() * 6;
        s.quat.identity();
        s.alive = true;
        placed++;
      }
      if (subDebrisRef.current) subDebrisRef.current.count = subDebrisCount;
    },
    [subDebrisCount, subData]
  );

  const spawnSparks = useCallback(() => {
    for (let i = 0; i < sparkCount; i++) {
      const s = sparkData[i];
      // Direcție random uniformă pe sferă.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      s.pos
        .set(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        )
        .multiplyScalar(0.9 + Math.random() * 0.4);
      // Viteza radiala 4-12 unit/s + jitter lateral pentru variatie.
      s.vel.copy(s.pos).normalize().multiplyScalar(4 + Math.random() * 8);
      s.vel.x += (Math.random() - 0.5) * 1.5;
      s.vel.y += (Math.random() - 0.5) * 1.5;
      s.life = 0;
      s.maxLife = 0.6 + Math.random() * 0.8;
      s.alive = true;
    }
    if (sparksRef.current) sparksRef.current.count = sparkCount;
  }, [sparkCount, sparkData]);

  // Obiect dummy reutilizat in useFrame pentru a calcula matricea per-instanta.
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Cleanup geometrii custom + texturi la unmount.
  useEffect(() => {
    return () => {
      asteroidGeometry.dispose();
      // Toate cele 24 chunk-uri folosite de BeltDebris + debris-ul mare rocky.
      chunkGeometries.forEach((g) => g.dispose());
      if (surfaceMaps) {
        surfaceMaps.diffuseMap.dispose();
        surfaceMaps.normalMap.dispose();
        surfaceMaps.roughnessMap.dispose();
        surfaceMaps.aoMap.dispose();
        surfaceMaps.displacementMap.dispose();
        surfaceMaps.emissiveMap.dispose();
      }
    };
  }, [asteroidGeometry, chunkGeometries, surfaceMaps]);

  // Initial: ascundem sparks (count=0) — vor fi popped on impact.
  useEffect(() => {
    if (sparksRef.current) sparksRef.current.count = 0;
    if (subDebrisRef.current) subDebrisRef.current.count = 0;
  }, []);

  // Rotatie continua pe asteroid — viata vizuala constanta.
  // Tween inrolat intr-un context scoped pentru cleanup automat.
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      if (asteroidRef.current) {
        gsap.to(asteroidRef.current.rotation, {
          y: '+=6.28',
          duration: 30,
          repeat: -1,
          ease: 'none',
        });
      }
    });
    return () => ctx.revert();
  }, [reduced]);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const t = state.clock.elapsedTime;
    const camera = state.camera;

    // === Detecție trecere prag impact (p crosses 0.22 forward) ===
    // Declanșează flash overlay DOM + capturează timestamp pentru camera shake.
    // Comparăm cu valoarea anterioară a lui p ca să prindem doar tranziția
    // forward → impact, nu fiecare frame.
    const lastP = lastProgressRef.current;
    if (lastP < 0.22 && p >= 0.22) {
      flashRef?.current?.animate(
        [{ opacity: 0.95 }, { opacity: 0 }],
        { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
      shatterTimeRef.current = performance.now();
      // Bloom spike — sare de la baseline 0.55 la 2.4 instant, apoi damping
      // lin inapoi la 0.55 prin THREE.MathUtils.damp mai jos. Pe mobile nu
      // exista postprocesare deci bloomRef.current va fi null si nu facem nimic.
      if (bloomRef?.current) bloomRef.current.intensity = 2.4;
      // Spawn 80 sparks (30 mobile) la centrul asteroidului.
      spawnSparks();
      // Reset per-debris state pentru sub-shatter — daca user-ul a oscilat
      // sub/peste prag inainte, scapam de flag-uri ramase.
      for (let i = 0; i < DEBRIS_COUNT; i++) {
        debrisData.didSplit[i] = false;
        debrisData.scaleMul[i] = 1;
        debrisData.prevPos[i].copy(debrisData.origins[i]);
      }
    }
    // Reset detect — dacă user-ul scrollează înapoi sub prag, anulăm shake.
    if (lastP >= 0.22 && p < 0.22) {
      shatterTimeRef.current = null;
      // Reset sparks — count=0 ascunde meshul; alive=false opreste update.
      sparkData.forEach((s) => {
        s.alive = false;
      });
      if (sparksRef.current) sparksRef.current.count = 0;
      // Reset trail history — toate slotturile inapoi la (0,0,0) ca sa nu
      // ramana segmente "stuck" intre frame-uri cand revii la shatter.
      trailBuffers.history.forEach((hist) => {
        hist.forEach((v) => v.set(0, 0, 0));
      });
      if (trailObjRef.current) trailObjRef.current.visible = false;
      // Reset sub-shatter — toate sub-debris dead, didSplit/scaleMul reset.
      subData.forEach((s) => {
        s.alive = false;
      });
      if (subDebrisRef.current) subDebrisRef.current.count = 0;
      for (let i = 0; i < DEBRIS_COUNT; i++) {
        debrisData.didSplit[i] = false;
        debrisData.scaleMul[i] = 1;
        debrisData.prevPos[i].set(0, 0, 0);
      }
    }
    lastProgressRef.current = p;

    // === STAGE 0-1: Asteroid solid -> emissive intensifies -> fade out ===
    const asteroidAlpha = THREE.MathUtils.clamp(1 - (p - 0.22) / 0.1, 0, 1);
    if (asteroidMatRef.current) {
      asteroidMatRef.current.opacity = asteroidAlpha;
      // Emissive base + scroll-driven intensification + idle pulse.
      // Gate: doar daca emissiveMap exista — altfel ar emite alb pe toata
      // suprafata (cutout luminos).
      if (!reduced && asteroidMatRef.current.emissiveMap) {
        // Emissive intensity redus — anterior 0.45+1.5 boost satura asteroidul.
        const baseIntensity = 0.25 + Math.sin(t * 0.8) * 0.08;
        // Boost emissive moderat catre momentul exploziei (p=0.22).
        const explosionBoost = p < 0.22 ? Math.pow(p / 0.22, 3) * 0.7 : 0;
        asteroidMatRef.current.emissiveIntensity = baseIntensity + explosionBoost;
      }
    }
    if (asteroidRef.current) {
      asteroidRef.current.visible = asteroidAlpha > 0.01;
    }

    // === STAGE 0.13-0.28: Energy pulse expanding ring ===
    if (pulseRef.current && pulseMatRef.current) {
      if (p > 0.13 && p < 0.28) {
        const pulseT = THREE.MathUtils.clamp((p - 0.13) / 0.15, 0, 1);
        const scale = THREE.MathUtils.lerp(0.5, 5.5, pulseT);
        pulseRef.current.scale.setScalar(scale);
        pulseMatRef.current.opacity = (1 - pulseT) * 0.9;
        pulseRef.current.visible = true;
        // Rotatie subtila pe pulse pentru senzatie organica.
        if (!reduced) {
          pulseRef.current.rotation.x = t * 0.3;
          pulseRef.current.rotation.z = t * 0.2;
        }
      } else {
        pulseRef.current.visible = false;
      }
    }

    // === STAGE 0.20-0.34: Dust shockwave — sfera semi-transparenta in expansiune ===
    if (dustRef.current && dustMatRef.current) {
      if (p > 0.20 && p < 0.34) {
        const dustT = THREE.MathUtils.clamp((p - 0.20) / 0.14, 0, 1);
        // Shockwave subtil — scale 4.5 max, opacity 0.18 max. Doar sugereaza
        // unda de soc, nu blocheaza vizualizarea fragmentelor.
        const scale = THREE.MathUtils.lerp(0.5, 4.5, Math.pow(dustT, 0.5));
        dustRef.current.scale.setScalar(scale);
        dustMatRef.current.opacity = (1 - Math.pow(dustT, 1.5)) * 0.18;
        dustRef.current.visible = true;
      } else {
        dustRef.current.visible = false;
      }
    }

    // === STAGE 0.18-0.75: Dust particles fine in volumul exploziei ===
    if (dustParticlesRef.current) {
      dustParticlesRef.current.visible = p > 0.18 && p < 0.75;
    }

    // === STAGE 0.20-0.55: ExplosionDebris (pietre mari rocky, dark) ===
    if (debrisRef.current && debrisMatRef.current) {
      const debrisActive = p >= 0.20 && p <= 0.55;
      debrisRef.current.visible = debrisActive;
      if (debrisActive) {
        const { origins, targets, rotations, scales, splitAt, didSplit, prevPos, scaleMul } = debrisData;
        // Fade-in la inceput, fade-out la final.
        let opacity = 1;
        if (p < 0.24) opacity = (p - 0.20) / 0.04;
        else if (p > 0.45) opacity = 1 - (p - 0.45) / 0.10;
        debrisMatRef.current.opacity = THREE.MathUtils.clamp(opacity, 0, 1);

        // Pozitie: origin (suprafata asteroid) -> target (5-8 unit afara).
        // Local progress: 0.20-0.42 = expansiunea principala (power4.out).
        const expandT = THREE.MathUtils.clamp((p - 0.20) / 0.22, 0, 1);
        const eased = 1 - Math.pow(1 - expandT, 4);

        // Pre-calculam tShatter o data, folosit la check de split.
        const tShatter =
          shatterTimeRef.current !== null
            ? (performance.now() - shatterTimeRef.current) / 1000
            : 0;
        // Vector reutilizat pentru derivare velocity din prevPos.
        const velTmp = new THREE.Vector3();

        for (let i = 0; i < DEBRIS_COUNT; i++) {
          const origin = origins[i];
          const target = targets[i];
          const rot = rotations[i];
          const scale = scales[i];

          dummy.position.set(
            THREE.MathUtils.lerp(origin.x, target.x, eased),
            THREE.MathUtils.lerp(origin.y, target.y, eased),
            THREE.MathUtils.lerp(origin.z, target.z, eased)
          );
          if (!reduced) {
            const angle = t * rot.speed * 1.2;
            dummy.rotation.set(
              rot.axis.x * angle,
              rot.axis.y * angle,
              rot.axis.z * angle
            );
          } else {
            dummy.rotation.set(0, 0, 0);
          }
          // Aplicam scaleMul (devine 0.55 dupa ce debris-ul s-a sub-spart).
          dummy.scale.setScalar(scale * scaleMul[i]);
          dummy.updateMatrix();
          debrisRef.current.setMatrixAt(i, dummy.matrix);

          // Check sub-shatter — daca am trecut pragul splitAt si 70% prob,
          // derivam velocity din pozitia precedenta si spawnam 6 sub-pieces.
          // Doar daca avem deja un shatterTime activ (trigger trecut) si
          // prevPos a fost initializat (delta > 0 ca sa evitam div by zero).
          if (
            !didSplit[i] &&
            shatterTimeRef.current !== null &&
            tShatter > splitAt[i] &&
            delta > 0 &&
            Math.random() < 0.7
          ) {
            didSplit[i] = true;
            // Velocity = (currentPos - prevPos) / delta.
            velTmp.subVectors(dummy.position, prevPos[i]).divideScalar(delta);
            spawnSubDebris(dummy.position, velTmp);
            // Parintele se micsoreaza in restul fly-out-ului.
            scaleMul[i] = 0.55;
          }
          // Update prevPos pentru frame-ul urmator.
          prevPos[i].copy(dummy.position);

          // Push pozitia curenta in trail history pentru bucata i.
          const hist = trailBuffers.history[i];
          for (let j = hist.length - 1; j > 0; j--) hist[j].copy(hist[j - 1]);
          hist[0].copy(dummy.position);
        }
        debrisRef.current.instanceMatrix.needsUpdate = true;

        // Rebuild line-segments buffer: 2 vertici per segment, vertex colors
        // cu fade pe lungimea trail-ului si fade global pe timp scurs de la shatter.
        const tShatterTrail =
          shatterTimeRef.current !== null
            ? (performance.now() - shatterTimeRef.current) / 1000
            : 0;
        const trailFade = Math.max(0, 1 - tShatterTrail * 0.5);
        const segs = trailBuffers.segsPerDebris;
        // Scriem direct in Float32Array-urile din trailBuffers (positions/colors)
        // — same-buffer mutation pentru bufferAttribute-ul GPU. Three.js
        // citeste din acelasi pointer; alocarea unui buffer nou ar invalida
        // referinta din JSX. react-hooks/immutability nu permite asta pe
        // valori de useMemo, dar e safe aici (lifecycle owned, no React state).
        /* eslint-disable react-hooks/immutability */
        for (let i = 0; i < DEBRIS_COUNT; i++) {
          const hist = trailBuffers.history[i];
          for (let j = 0; j < segs; j++) {
            // Segment j conecteaza punctul j cu j+1.
            const baseIdx = (i * segs + j) * 2 * 3;
            // Start point (slot j) — alpha mai mare aproape de debris.
            trailBuffers.positions[baseIdx] = hist[j].x;
            trailBuffers.positions[baseIdx + 1] = hist[j].y;
            trailBuffers.positions[baseIdx + 2] = hist[j].z;
            // End point (slot j+1) — mai vechi -> alpha mai mic.
            trailBuffers.positions[baseIdx + 3] = hist[j + 1].x;
            trailBuffers.positions[baseIdx + 4] = hist[j + 1].y;
            trailBuffers.positions[baseIdx + 5] = hist[j + 1].z;
            // Alpha per slot: (1 - slot/trailLen) * 0.85 * trailFade
            const aStart = (1 - j / trailLen) * 0.85 * trailFade;
            const aEnd = (1 - (j + 1) / trailLen) * 0.85 * trailFade;
            trailBuffers.colors[baseIdx] = 0.55 * aStart;
            trailBuffers.colors[baseIdx + 1] = 0.5 * aStart;
            trailBuffers.colors[baseIdx + 2] = 0.45 * aStart;
            trailBuffers.colors[baseIdx + 3] = 0.55 * aEnd;
            trailBuffers.colors[baseIdx + 4] = 0.5 * aEnd;
            trailBuffers.colors[baseIdx + 5] = 0.45 * aEnd;
          }
        }
        /* eslint-enable react-hooks/immutability */
        const trailGeom = trailObjRef.current?.geometry as
          | THREE.BufferGeometry
          | undefined;
        if (trailGeom) {
          (trailGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
          (trailGeom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        }
        if (trailObjRef.current) trailObjRef.current.visible = true;
      } else if (trailObjRef.current) {
        trailObjRef.current.visible = false;
      }
    }

    // === SUB-SHATTER update ===
    // Sub-pieces independenti — life-based decay, rotatie via quaternion.
    // Doar daca avem shatterTime activ (post-trigger).
    const subMesh = subDebrisRef.current;
    if (subMesh && shatterTimeRef.current !== null) {
      const subDummy = new THREE.Object3D();
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      for (let i = 0; i < subDebrisCount; i++) {
        const s = subData[i];
        if (!s.alive) {
          m.makeScale(0, 0, 0);
          subMesh.setMatrixAt(i, m);
          continue;
        }
        s.life += delta;
        if (s.life >= s.maxLife) {
          s.alive = false;
          m.makeScale(0, 0, 0);
          subMesh.setMatrixAt(i, m);
          continue;
        }
        // Decay exponential pe velocity — sub-pieces incetinesc.
        const decay = Math.exp(-s.life * 0.8);
        s.pos.addScaledVector(s.vel, decay * delta);
        // Rotatie pe axa proprie.
        q.setFromAxisAngle(s.rotAxis, s.rotSpeed * delta);
        s.quat.multiplyQuaternions(q, s.quat);
        const fade = 1 - s.life / s.maxLife;
        const sc = 0.7 * Math.pow(fade, 0.6);
        subDummy.position.copy(s.pos);
        subDummy.quaternion.copy(s.quat);
        subDummy.scale.setScalar(sc);
        subDummy.updateMatrix();
        subMesh.setMatrixAt(i, subDummy.matrix);
      }
      subMesh.instanceMatrix.needsUpdate = true;
    }

    // === Camera dolly noua ===
    // 0.0-0.22: z=5, slight orbit
    // 0.22-0.32: z pulls back to 6.5 to see explosion
    // 0.32-0.78: z stable at 6.5
    // 0.78-1.0: z zooms in to 4.5 to see CC
    let targetZ = 5;
    if (p < 0.22) targetZ = 5;
    else if (p < 0.32) targetZ = THREE.MathUtils.lerp(5, 6.5, (p - 0.22) / 0.10);
    else if (p < 0.78) targetZ = 6.5;
    else targetZ = THREE.MathUtils.lerp(6.5, 4.5, (p - 0.78) / 0.22);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 1.5);

    // Mouse parallax pe X/Y combinat cu drift subtil scroll.
    const mouseX = reduced ? 0 : mouseRef.current.x * 0.35;
    const mouseY = reduced ? 0 : mouseRef.current.y * -0.22;
    const scrollY = (p - 0.5) * -0.3;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouseX, delta * 1.2);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, scrollY + mouseY, delta * 1.5);

    // === Camera shake post-impact ===
    // 500ms decay quadratic — offset random aplicat peste lerp-ul existent.
    // Se vede tremor la impact, apoi dispare lin. Se adună pe poziția deja
    // calculată, lookAt-ul de mai jos păstrează ținta pe centru.
    if (shatterTimeRef.current !== null) {
      const elapsed = (performance.now() - shatterTimeRef.current) / 1000;
      if (elapsed < 0.5) {
        const decay = (1 - elapsed / 0.5) ** 2;
        camera.position.x += (Math.random() * 2 - 1) * 0.08 * decay;
        camera.position.y += (Math.random() * 2 - 1) * 0.08 * decay;
        camera.position.z += (Math.random() * 2 - 1) * 0.032 * decay;
      }
    }

    camera.lookAt(0, 0, 0);

    // === SPARKS update ===
    // Doar daca am deja un shatterTime activ (i.e. dupa trigger).
    const sparks = sparksRef.current;
    if (sparks && shatterTimeRef.current !== null) {
      const sparkDummy = new THREE.Object3D();
      const m = new THREE.Matrix4();
      for (let i = 0; i < sparkCount; i++) {
        const s = sparkData[i];
        if (!s.alive) {
          m.makeScale(0, 0, 0);
          sparks.setMatrixAt(i, m);
          continue;
        }
        s.life += delta;
        if (s.life >= s.maxLife) {
          s.alive = false;
          m.makeScale(0, 0, 0);
          sparks.setMatrixAt(i, m);
          continue;
        }
        // Decay exponential pe miscare — sparkul incetineste rapid in primele
        // 100ms, apoi aproape stationar.
        const decay = Math.exp(-s.life * 1.6);
        s.pos.addScaledVector(s.vel, decay * delta);
        s.vel.multiplyScalar(0.985);
        const fade = 1 - s.life / s.maxLife;
        // Scale flicker — sinusoida rapida * fade. Sin*0.4 da impresia de
        // lumini intermitente (sparks reale "tremura" pe ecran).
        const scl =
          (0.5 + fade * 0.8) *
          (0.6 + Math.sin(state.clock.elapsedTime * 60 + i) * 0.4);
        sparkDummy.position.copy(s.pos);
        sparkDummy.scale.setScalar(scl);
        sparkDummy.rotation.set(0, 0, 0);
        sparkDummy.updateMatrix();
        sparks.setMatrixAt(i, sparkDummy.matrix);
      }
      sparks.instanceMatrix.needsUpdate = true;
    }

    // === Halo extern pre-impact ===
    // Sferă aditivă portocalie + point light co-locat. Pulsează în
    // window-ul p ∈ [0.16, 0.22] crescând până la momentul shatter.
    const halo = haloRef.current;
    const haloMat = haloMatRef.current;
    const haloLight = haloLightRef.current;
    if (halo && haloMat && haloLight) {
      if (p >= 0.16 && p < 0.22) {
        const hp = (p - 0.16) / 0.06;
        const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 12);
        haloMat.opacity = hp * (0.4 + pulse * 0.15);
        haloLight.intensity = hp * (1.5 + pulse * 0.5);
        halo.scale.setScalar(1 + hp * 0.06);
        halo.visible = true;
      } else {
        halo.visible = false;
        haloMat.opacity = 0;
        haloLight.intensity = 0;
      }
    }

    // === Bloom intensity damp recovery ===
    // Dupa spike-ul de la 0.55 -> 2.4 in blocul de trigger, lasam THREE.MathUtils.damp
    // sa il aduca incet inapoi la 0.55. Rate 1.8 -> ~0.8s pana revine ~vizibil la baseline.
    if (bloomRef?.current) {
      bloomRef.current.intensity = THREE.MathUtils.damp(
        bloomRef.current.intensity,
        0.55,
        1.8,
        delta
      );
    }
  });

  // Float-ul aplica miscare idle "vie"; cu reduced motion dezactivam complet.
  const asteroidFloat = reduced
    ? { speed: 0, rot: 0, pos: 0 }
    : { speed: 1.0, rot: 0.4, pos: 0.55 };

  return (
    <>
      {/* BELT DEBRIS — chunks 3D reale (Sketchfab CC-BY) orbitand in jurul
          asteroidului principal. Vizibil pana la inceputul exploziei (p<0.18). */}
      <BeltDebris geometries={chunkGeometries} progressRef={progressRef} reduced={reduced} />

      {/* ASTEROID — masiv, neregulat, mat, debris in jur. */}
      <Float
        speed={asteroidFloat.speed}
        rotationIntensity={asteroidFloat.rot}
        floatIntensity={asteroidFloat.pos}
      >
        <group>
          <mesh ref={asteroidRef} geometry={asteroidGeometry} castShadow receiveShadow>
            {/* Material simplu — geometria Bennu NASA OLA contine deja toate
                cratereele si ridge-urile reale, deci nu mai e nevoie de texturi
                pictate. Doar color + roughness + metalness. Asta evita complet
                problema cu textura care satura suprafata in alb. */}
            <meshStandardMaterial
              ref={asteroidMatRef}
              color="#0a0a0a"
              roughness={0.9}
              metalness={0.1}
              transparent
              opacity={1}
            />
          </mesh>
          {!reduced && !isMobile && (
            <Sparkles count={40} scale={3.5} size={1.4} speed={0.25} color="#aaaaaa" />
          )}
        </group>
      </Float>

      {/* HALO EXTERN PRE-IMPACT — sferă aditivă portocalie în jurul asteroidului
          + point light co-locat. Pulsează în window-ul p ∈ [0.16, 0.22]. */}
      <mesh ref={haloRef} visible={false}>
        <sphereGeometry args={[1.32, 32, 32]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color="#ff6a2a"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={haloLightRef}
        position={[0, 0, 0]}
        intensity={0}
        distance={4}
        decay={2}
        color="#ff6a2a"
      />

      {/* ENERGY PULSE — torus care se expandeaza din asteroid si fade out. */}
      <mesh ref={pulseRef} scale={0.01}>
        <torusGeometry args={[1, 0.04, 16, 64]} />
        <meshBasicMaterial
          ref={pulseMatRef}
          color="#8aa0c8"
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>

      {/* DUST SHOCKWAVE — sfera semi-transparenta care se expandeaza la momentul exploziei. */}
      <mesh ref={dustRef} scale={0.01}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          ref={dustMatRef}
          color="#3a3530"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* DUST PARTICLES FINE — dezactivate. Cele 200 sparkles dense obscurau
          vederea fragmentelor reale. Pastram doar fragmentele rocky + shockwave
          subtil pentru un look mai curat. */}
      <group ref={dustParticlesRef} />


      {/* EXPLOSION DEBRIS — 25 pietre MARI rocky cu material like asteroidul
          (color #0a0a0a, roughness 0.9, metalness 0.1). Vizibile doar in
          fereastra exploziei 0.20-0.55, apoi fade-out. Geometria reutilizata
          e chunk-ul mare din asteroid_belt[8]. */}
      <instancedMesh
        ref={debrisRef}
        args={[chunkGeometries[8] || debrisFallbackGeometry, undefined, DEBRIS_COUNT]}
        castShadow
      >
        <meshStandardMaterial
          ref={debrisMatRef}
          color="#0a0a0a"
          roughness={0.9}
          metalness={0.1}
          transparent
          opacity={1}
        />
      </instancedMesh>

      {/* SPARKS — 80 (30 mobile) puncte mici emisive portocalii care explodeaza
          din centru la impact. MeshBasicMaterial nu primeste lumina; culoarea
          calda + bloom creeaza streaks vizuale. Instance count=0 initial,
          setat la sparkCount in spawnSparks() la trigger. */}
      <instancedMesh ref={sparksRef} args={[undefined, undefined, sparkCount]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial color="#ffaa55" transparent toneMapped={false} />
      </instancedMesh>

      {/* SUB-SHATTER — InstancedMesh de icosahedroane mici care apar cand
          un debris se sparge mid-flight. Material identic cu debris-ul
          principal (color #0a0a0a, roughness 0.9, metalness 0.1) — declarat
          separat ca sa nu atingem materialul asteroidului. */}
      <instancedMesh
        ref={subDebrisRef}
        args={[undefined, undefined, subDebrisCount]}
        castShadow
      >
        <icosahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.1} />
      </instancedMesh>

      {/* DUST TRAILS — line segments aditive cu vertex colors care urmaresc
          fiecare bucata de debris. Construite dinamic in useFrame din
          trailBuffers.history. Visible=false initial, true cand debris e activ. */}
      <lineSegments ref={trailObjRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailBuffers.positions, 3]}
            count={trailBuffers.positions.length / 3}
            array={trailBuffers.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[trailBuffers.colors, 3]}
            count={trailBuffers.colors.length / 3}
            array={trailBuffers.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </>
  );
}

// Preload Bennu GLB la nivel de modul — porneste cat mai devreme.
useGLTF.preload('/models/bennu.glb', '/draco/');
// Preload asteroid belt (24 forme reale Sketchfab CC-BY, Draco-compressed).
useGLTF.preload('/models/asteroid_belt.glb', '/draco/');
// BeltDebris — chunks reale orbiteaza in jurul asteroidului principal,
// dau senzatie de "asteroid in mijlocul unui camp de roci".
// Fade-out cand asteroidul incepe sa se sparga (p > 0.18) ca scena
// sa nu fie ocupata in timpul exploziei.
interface BeltDebrisProps {
  geometries: THREE.BufferGeometry[];
  progressRef: ProgressRef;
  reduced: boolean;
}

function BeltDebris({ geometries, progressRef, reduced }: BeltDebrisProps) {
  const groupRef = useRef<THREE.Group>(null);
  // 8 chunks distribuiti pe orbita.
  const items = useMemo(() => buildBeltDebris(8), []);

  useFrame((state, delta) => {
    const p = progressRef.current;
    // Fade-out incepand cu inceputul exploziei.
    const alpha = THREE.MathUtils.clamp(1 - (p - 0.18) / 0.06, 0, 1);
    if (groupRef.current) {
      groupRef.current.visible = alpha > 0.01;
      if (!reduced) {
        // Rotatie lenta a intregului belt + scale pulsing subtil pe fiecare child.
        groupRef.current.rotation.y += delta * 0.04;
      }
    }
  });

  if (geometries.length === 0) return null;

  return (
    <group ref={groupRef}>
      {items.map((d, i) => (
        <mesh
          key={i}
          geometry={geometries[d.chunkIndex % geometries.length]}
          position={d.position}
          scale={d.scale}
          rotation={d.rotation}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

export default function CinematicScene3D() {
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const progressRef = useRef<number>(0);
  // Pozitia mouse-ului normalizata in [-1, 1]. Citita per-frame in MorphMeshes.
  const mouseRef = useRef({ x: 0, y: 0 });
  // Ref catre flash overlay DOM — declansat la momentul impactului (p=0.22).
  const flashRef = useRef<HTMLDivElement | null>(null);
  // Ref catre BloomEffect — intensity face spike la 2.4 in trigger, damp inapoi
  // la 0.55. Tipul concret e BloomEffect din `postprocessing`; folosim `any`
  // pentru ca wrapper-ul `<Bloom>` din @react-three/postprocessing nu expune
  // typing public iar instanta atribuita via R3F ref e BloomEffect.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bloomRef = useRef<any>(null);

  // ScrollTrigger urmareste DOAR wrapper-ul cinematic (primele 3 sectiuni).
  // Asa progresul 0->1 se face fix in secventa explozie + CC, iar dupa
  // ce utilizatorul trece de Section 3, progressRef ramane la 1 si CC sta solid.
  // Wrapper-ul se monteaza in Hero.tsx cu data-cinematic-wrapper.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    let st: ScrollTrigger | null = null;
    const tryAttach = () => {
      const wrapper = document.querySelector('[data-cinematic-wrapper]') as HTMLElement | null;
      if (!wrapper) return false;
      st = ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });
      return true;
    };

    // Wrapper-ul poate fi mounted dupa CinematicScene3D in arborele DOM.
    // Incercam imediat; daca nu exista, retry pe RAF.
    if (!tryAttach()) {
      const raf = requestAnimationFrame(() => tryAttach());
      return () => {
        cancelAnimationFrame(raf);
        st?.kill();
      };
    }
    return () => {
      st?.kill();
    };
  }, []);

  // Parallax mouse — citim pozitia globala, normalizam la [-1, 1].
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  return (
    <>
      {/* FLASH OVERLAY — div alb full-screen care flashește la momentul impactului
          (p crosses 0.22 forward). z-50 ca să apară deasupra canvas-ului (care
          stă pe -z-10). Animat prin Web Animations API direct din useFrame. */}
      <div
        ref={flashRef}
        className="pointer-events-none fixed inset-0 z-50 bg-white"
        style={{ opacity: 0 }}
        aria-hidden
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        dpr={isMobile ? [1, 1] : [1, 1.75]}
        shadows={!isMobile}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          // Linear tone mapping — ACES (default) boost mid-grays spre alb,
          // saturand asteroidul. Linear pastreaza culorile fidele.
          toneMapping: THREE.LinearToneMapping,
          toneMappingExposure: 0.9,
        }}
      >
        <fog attach="fog" args={['#050505', 6, 12]} />
        {/* Iluminare cinematica "single sun" — un singur soare puternic din
            dreapta, aproape de orizont, creeaza rim crescent alb pop pe
            marginea asteroidului. Restul luminilor reduse la soapta ca sa
            nu concureze si sa pastreze contrastul dramatic din referinta. */}
        <ambientLight intensity={0.08} color="#ffffff" />
        {/* Key light — soarele din dreapta-SPATE, dominant. Pozitionat in
            spatele asteroidului (z negativ) ca razele sa cada pe muchia
            din partea opusa camerei -> rim crescent alb pe edge. */}
        <directionalLight
          position={[8, 2, -4]}
          intensity={3.5}
          color="#ffffff"
          castShadow
        />
        {/* Rim — soapta rece pe partea opusa, doar ca sa nu fie complet plat. */}
        <directionalLight position={[-7, 2, -5]} intensity={0.15} color="#555F6B" />
        {/* Fill de jos — bounce subtil. */}
        <directionalLight position={[0, -4, 4]} intensity={0.2} color="#9aa0b0" />
        {/* Hemisfera — gradient cer/sol pentru ambianta. */}
        <hemisphereLight args={['#1a2030', '#050505', 0.25]} />
        {/* Highlight subtil pe partea de umbra — redus puternic ca sa nu
            mai concureze cu key-ul dominant din dreapta. */}
        <pointLight
          position={[-3, 3, 4]}
          intensity={0.2}
          distance={9}
          decay={2}
          color="#ffffff"
        />
        {/* Backlight — pointLight cald in spate-dreapta, suport pentru rim
            crescent creat de key. Mutat din centru (0) la x=5 ca sa sustina
            partea dreapta a muchiei; boostat de la 1.4 la 5 si distance la
            12 ca lumina sa nu cada prea repede. */}
        <pointLight
          position={[5, 1.5, -3]}
          intensity={5}
          distance={12}
          decay={2}
          color="#fff0d8"
        />
        <Suspense fallback={null}>
          {/* Environment IBL — HDRI dezactivat temporar (mutat in
              _disabled_assets/) ca sa testam daca el cauza Turbopack panic.
              Reactivam dupa ce primim varianta 1k de la utilizator. */}
          {/* <Environment
            files="/hdri/kloppenheim_02_puresky_4k.exr"
            background={false}
            resolution={512}
          /> */}
          {/* Stele 3D cu adancime — drift natural pe baza de fade + speed.
              Skip pe mobile — costul de geometrie pentru 2000 puncte e prea mare. */}
          {!reduced && !isMobile && (
            <Stars
              radius={80}
              depth={60}
              count={2000}
              factor={4}
              saturation={0}
              fade
              speed={0.4}
            />
          )}
          <MorphMeshes progressRef={progressRef} mouseRef={mouseRef} reduced={reduced} isMobile={isMobile} flashRef={flashRef} bloomRef={bloomRef} />
          {/* Umbre de contact moi sub obiect — ancorare vizuala. */}
          <ContactShadows
            position={[0, -1.6, 0]}
            opacity={0.55}
            scale={6}
            blur={2.8}
            far={4}
            color="#000000"
          />
        </Suspense>
        {/* Post-processing — fara pe mobile, costul shader-pass e mare. */}
        {!isMobile && (
          <EffectComposer>
            <Bloom
              ref={bloomRef}
              intensity={0.55}
              luminanceThreshold={0.82}
              luminanceSmoothing={0.6}
              mipmapBlur
            />
            <Vignette offset={0.3} darkness={0.8} />
          </EffectComposer>
        )}
      </Canvas>
      </div>
    </>
  );
}

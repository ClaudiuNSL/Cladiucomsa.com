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
  Environment,
  Float,
  Lightformer,
  Sparkles,
  Stars,
  useGLTF,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, Suspense } from 'react';

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

// Sample N puncte pe geometria asteroidului — pozitii initiale fragmente.
// Sample-am direct din vertex positions, asa fragmentele explodeaza fix
// de unde "exista" pe suprafata asteroidului.
function sampleAsteroidPoints(geometry: THREE.BufferGeometry, count: number) {
  const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
  const total = positionAttr.count;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * total);
    const v = new THREE.Vector3().fromBufferAttribute(positionAttr, idx);
    points.push(v);
  }
  return points;
}

// Generate target positions pe forma "C C" — doua arce de cerc 3/4.
// Distributie aleatoare pe interiorul "stroke-ului" pentru a citi literele.
function sampleCCTargets(count: number) {
  const points: THREE.Vector3[] = [];
  const halfN = Math.floor(count / 2);
  const arcStart = Math.PI * 0.27;        // ~49°
  const arcEnd = Math.PI * 1.73;          // ~312°
  const arcSpan = arcEnd - arcStart;

  for (let i = 0; i < halfN; i++) {
    // C-ul din stanga, centrat la x = -1.4
    const t = Math.random();
    const angle = arcStart + t * arcSpan;
    const r = 1.0 + (Math.random() - 0.5) * 0.32; // stroke width
    points.push(new THREE.Vector3(
      -1.4 + Math.cos(angle) * r,
      Math.sin(angle) * r,
      (Math.random() - 0.5) * 0.18
    ));
  }
  for (let i = 0; i < count - halfN; i++) {
    // C-ul din dreapta, centrat la x = 1.4
    const t = Math.random();
    const angle = arcStart + t * arcSpan;
    const r = 1.0 + (Math.random() - 0.5) * 0.32;
    points.push(new THREE.Vector3(
      1.4 + Math.cos(angle) * r,
      Math.sin(angle) * r,
      (Math.random() - 0.5) * 0.18
    ));
  }
  return points;
}

// Pentru fiecare fragment, generam si o pozitie "float" intermediara
// — pozitia in care fragmentul se aseaza dupa explozie, inainte sa
// fie atras spre litera. Aleator in jurul originii, dar mai larg decat asteroidul.
function sampleFloatTargets(originPoints: THREE.Vector3[]) {
  return originPoints.map((origin) => {
    const direction = origin.clone().normalize();
    const distance = 2.8 + Math.random() * 1.5; // 2.8-4.3 unitati de la centru
    return direction.multiplyScalar(distance).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 1.2
      )
    );
  });
}

// Rotatii aleatoare per-fragment — axa de rotatie normalizata + viteza.
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
      speed: 0.5 + Math.random() * 1.5,
    });
  }
  return rotations;
}

// Scale-uri aleatoare per-fragment. Acelasi motiv ca buildFragmentRotations.
function buildFragmentScales(count: number) {
  const scales: number[] = [];
  for (let i = 0; i < count; i++) {
    scales.push(0.05 + Math.random() * 0.07);
  }
  return scales;
}

// Delay-uri aleatoare per-fragment — variatie pe explozie/atragere.
// Extras la nivel de modul pentru react-hooks/purity.
function buildFragmentDelays(count: number) {
  const delays: number[] = [];
  for (let i = 0; i < count; i++) {
    delays.push(Math.random() * 0.04);
  }
  return delays;
}

const FRAGMENT_COUNT_PER_GROUP = 75;
const FRAGMENT_COUNT = FRAGMENT_COUNT_PER_GROUP * 4;

interface MorphMeshesProps {
  progressRef: ProgressRef;
  mouseRef: MouseRef;
  reduced: boolean;
  isMobile: boolean;
}

function MorphMeshes({ progressRef, mouseRef, reduced, isMobile }: MorphMeshesProps) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const asteroidMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Pulse ring + fragments.
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);
  // Dust shockwave + dust particles fine.
  const dustRef = useRef<THREE.Mesh>(null);
  const dustMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const dustParticlesRef = useRef<THREE.Group>(null);
  // 4 grupuri de fragmente — fiecare cu propria geometrie, dar acelasi material.
  const fragmentIcosaRef = useRef<THREE.InstancedMesh>(null);
  const fragmentOctaRef = useRef<THREE.InstancedMesh>(null);
  const fragmentTetraRef = useRef<THREE.InstancedMesh>(null);
  const fragmentDodecaRef = useRef<THREE.InstancedMesh>(null);

  // Modelul Bennu NASA OSIRIS-REx (.glb compressed Draco, 419KB).
  // useGLTF suspends until ready — Suspense-ul din parent acopera asteptarea.
  // NU folosim try/catch fiindca useGLTF arunca un Promise pe Suspense (mecanism
  // intern React), iar try/catch ar bloca suspendarea legitima.
  const gltf = useGLTF('/models/bennu.glb', '/draco/');

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

  // Sample origin / float / target points + rotatii + scaleuri + delays ONCE on mount.
  const fragmentData = useMemo(() => {
    const origins = sampleAsteroidPoints(asteroidGeometry, FRAGMENT_COUNT);
    const floats = sampleFloatTargets(origins);
    const targets = sampleCCTargets(FRAGMENT_COUNT);
    const rotations = buildFragmentRotations(FRAGMENT_COUNT);
    const scales = buildFragmentScales(FRAGMENT_COUNT);
    // Delay per-fragment in unitati de scroll — variatie timing pe explozie/atragere.
    const delays = buildFragmentDelays(FRAGMENT_COUNT);
    return { origins, floats, targets, rotations, scales, delays };
  }, [asteroidGeometry]);

  // Geometrii fragmente — 4 forme diferite pentru aspect variat, real.
  // Icosaedru (20 fete), octaedru (8), tetraedru (4), dodecaedru (12).
  const fragmentGeometries = useMemo(() => ({
    icosa: new THREE.IcosahedronGeometry(1, 0),
    octa: new THREE.OctahedronGeometry(1, 0),
    tetra: new THREE.TetrahedronGeometry(1, 0),
    dodeca: new THREE.DodecahedronGeometry(1, 0),
  }), []);

  // Material shared pentru toate cele 4 grupe de fragmente — citeste aceleasi
  // texturi ca asteroidul, deci chunkurile arata ca bucati din suprafata lui.
  // Definit ca <meshStandardMaterial> JSX cu ref + atasat via JSX la primul mesh,
  // apoi reutilizat pe ceilalti 3 prin .material assignment in useEffect.
  const fragmentMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Obiect dummy reutilizat in useFrame pentru a calcula matricea per-instanta.
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Cleanup geometrii custom + texturi + material la unmount.
  useEffect(() => {
    // Copiem ref-ul intr-o variabila locala pentru cleanup safety.
    const fragMatAtMount = fragmentMatRef.current;
    return () => {
      asteroidGeometry.dispose();
      fragmentGeometries.icosa.dispose();
      fragmentGeometries.octa.dispose();
      fragmentGeometries.tetra.dispose();
      fragmentGeometries.dodeca.dispose();
      fragMatAtMount?.dispose();
      if (surfaceMaps) {
        surfaceMaps.diffuseMap.dispose();
        surfaceMaps.normalMap.dispose();
        surfaceMaps.roughnessMap.dispose();
        surfaceMaps.aoMap.dispose();
        surfaceMaps.displacementMap.dispose();
        surfaceMaps.emissiveMap.dispose();
      }
    };
  }, [asteroidGeometry, fragmentGeometries, surfaceMaps]);

  // Atasam materialul fragmentelor (definit inline pe icosa) la celelalte 3
  // instanced meshes — astfel toate cele 4 grupuri share aceeasi instanta de material.
  useEffect(() => {
    const mat = fragmentMatRef.current;
    if (!mat) return;
    if (fragmentOctaRef.current) fragmentOctaRef.current.material = mat;
    if (fragmentTetraRef.current) fragmentTetraRef.current.material = mat;
    if (fragmentDodecaRef.current) fragmentDodecaRef.current.material = mat;
  }, [surfaceMaps]);

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
        // sqrt curve — expansiune rapida initial, apoi incetinire.
        const scale = THREE.MathUtils.lerp(0.5, 5.0, Math.pow(dustT, 0.5));
        dustRef.current.scale.setScalar(scale);
        // Opacitatea scade mai repede decat expansiunea (puterea 1.5).
        dustMatRef.current.opacity = (1 - Math.pow(dustT, 1.5)) * 0.35;
        dustRef.current.visible = true;
      } else {
        dustRef.current.visible = false;
      }
    }

    // === STAGE 0.18-0.75: Dust particles fine in volumul exploziei ===
    if (dustParticlesRef.current) {
      dustParticlesRef.current.visible = p > 0.18 && p < 0.75;
    }

    // === STAGE 0.20+: Fragments (explozie -> float -> atragere -> solid) ===
    // Calculam emissive shared pe materialul fragmentelor (hot -> cool -> solid).
    // Gate: doar daca emissiveMap e incarcat — altfel cutout luminos.
    if (fragmentMatRef.current && fragmentMatRef.current.emissiveMap) {
      if (!reduced) {
        let fragEmissive = 0;
        if (p > 0.18 && p < 0.40) {
          // Debris fierbinte imediat dupa explozie.
          const hotT = THREE.MathUtils.clamp((p - 0.18) / 0.22, 0, 1);
          fragEmissive = (1 - hotT) * 1.2; // 1.2 -> 0
        } else if (p > 0.78) {
          // Bloc solid CC — glow subtil pulsat.
          const solidT = THREE.MathUtils.clamp((p - 0.78) / 0.10, 0, 1);
          fragEmissive = solidT * 0.4 + Math.sin(t * 0.6) * 0.08;
        }
        fragmentMatRef.current.emissiveIntensity = fragEmissive;
      } else {
        fragmentMatRef.current.emissiveIntensity = 0;
      }
    }

    const meshes = [
      fragmentIcosaRef.current,
      fragmentOctaRef.current,
      fragmentTetraRef.current,
      fragmentDodecaRef.current,
    ];
    if (meshes.every((m) => m) && p > 0.20) {
      meshes.forEach((m) => {
        m!.visible = true;
      });
      const { origins, floats, targets, rotations, scales, delays } = fragmentData;

      for (let i = 0; i < FRAGMENT_COUNT; i++) {
        const groupIdx = Math.floor(i / FRAGMENT_COUNT_PER_GROUP); // 0-3
        const localIdx = i % FRAGMENT_COUNT_PER_GROUP;             // 0-74
        const origin = origins[i];
        const floatPos = floats[i];
        const target = targets[i];
        const rot = rotations[i];
        const scale = scales[i];
        const delay = delays[i];

        let x: number, y: number, z: number;

        if (p < 0.32) {
          // Faza explozie: origin -> float, ease power3.out, cu delay per-fragment.
          const local = THREE.MathUtils.clamp((p - 0.22 - delay) / 0.10, 0, 1);
          if (local <= 0) {
            // Inca nu a iesit — stationar la origin (acoperit de asteroid).
            x = origin.x;
            y = origin.y;
            z = origin.z;
          } else {
            const eased = 1 - Math.pow(1 - local, 3); // power3.out
            x = THREE.MathUtils.lerp(origin.x, floatPos.x, eased);
            y = THREE.MathUtils.lerp(origin.y, floatPos.y, eased);
            z = THREE.MathUtils.lerp(origin.z, floatPos.z, eased);
          }
        } else if (p < 0.55) {
          // Faza float: stationar la pozitia float cu drift subtil.
          const drift = reduced ? 0 : Math.sin(t * rot.speed + i) * 0.04;
          x = floatPos.x + drift * rot.axis.x;
          y = floatPos.y + drift * rot.axis.y;
          z = floatPos.z + drift * rot.axis.z;
        } else if (p < 0.78) {
          // Faza atragere: float -> target, ease power3.inOut, cu delay per-fragment.
          const attractDelay = delay * 1.5;
          const local = THREE.MathUtils.clamp((p - 0.55 - attractDelay) / 0.23, 0, 1);
          const eased =
            local < 0.5
              ? 4 * local * local * local
              : 1 - Math.pow(-2 * local + 2, 3) / 2;
          x = THREE.MathUtils.lerp(floatPos.x, target.x, eased);
          y = THREE.MathUtils.lerp(floatPos.y, target.y, eased);
          z = THREE.MathUtils.lerp(floatPos.z, target.z, eased);
        } else {
          // Faza solid: bloc la target cu floating subtil pe Y.
          const wobble = reduced ? 0 : Math.sin(t * 0.6 + i * 0.05) * 0.02;
          x = target.x;
          y = target.y + wobble;
          z = target.z;
        }

        dummy.position.set(x, y, z);

        // Rotatie individuala — diferita per fragment, mai rapida in float, mai lenta in solid.
        if (!reduced) {
          const rotSpeed = p > 0.78 ? 0.05 : 0.4;
          const angle = t * rot.speed * rotSpeed;
          dummy.rotation.set(
            rot.axis.x * angle,
            rot.axis.y * angle,
            rot.axis.z * angle
          );
        } else {
          dummy.rotation.set(0, 0, 0);
        }

        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        meshes[groupIdx]!.setMatrixAt(localIdx, dummy.matrix);
      }
      meshes.forEach((m) => {
        m!.instanceMatrix.needsUpdate = true;
      });
    } else {
      meshes.forEach((m) => {
        if (m) m.visible = false;
      });
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
    camera.lookAt(0, 0, 0);
  });

  // Float-ul aplica miscare idle "vie"; cu reduced motion dezactivam complet.
  const asteroidFloat = reduced
    ? { speed: 0, rot: 0, pos: 0 }
    : { speed: 1.0, rot: 0.4, pos: 0.55 };

  return (
    <>
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

      {/* DUST PARTICLES FINE — vizibile in faza explozie + float. */}
      <group ref={dustParticlesRef}>
        {!reduced && !isMobile && (
          <Sparkles count={200} scale={8} size={0.6} speed={0.15} color="#7a7570" />
        )}
      </group>

      {/* FRAGMENTE — 4 grupuri x 75 instante, geometrii diferite, material shared.
          Primul mesh defineste materialul inline (cu ref); celelalte trei il
          reutilizeaza prin asignare directa pe .material in useEffect. */}
      <instancedMesh
        ref={fragmentIcosaRef}
        args={[fragmentGeometries.icosa, undefined, FRAGMENT_COUNT_PER_GROUP]}
        castShadow
      >
        {/* Material fragment — acelasi look ca asteroidul (chunks din el). */}
        <meshStandardMaterial
          ref={fragmentMatRef}
          color="#0a0a0a"
          roughness={0.9}
          metalness={0.1}
        />
      </instancedMesh>
      <instancedMesh
        ref={fragmentOctaRef}
        args={[fragmentGeometries.octa, undefined, FRAGMENT_COUNT_PER_GROUP]}
        castShadow
      />
      <instancedMesh
        ref={fragmentTetraRef}
        args={[fragmentGeometries.tetra, undefined, FRAGMENT_COUNT_PER_GROUP]}
        castShadow
      />
      <instancedMesh
        ref={fragmentDodecaRef}
        args={[fragmentGeometries.dodeca, undefined, FRAGMENT_COUNT_PER_GROUP]}
        castShadow
      />
    </>
  );
}

// Preload Bennu GLB la nivel de modul — porneste cat mai devreme.
useGLTF.preload('/models/bennu.glb', '/draco/');

// Genereaza o textura radiala cu gradient alb -> transparent pentru halou.
// Folosita ca sprite cu additive blending — creeaza glow alb difuz fara
// post-processing (functioneaza si pe mobile unde bloom-ul e off).
function createHaloTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.22)');
  gradient.addColorStop(0.55, 'rgba(190, 205, 230, 0.06)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Sprite cu pulsatie subtila de scale + opacity (3.5s loop). Pozitionat
// putin in spatele asteroidului (z=-1), invizibil cand asteroidul se
// fragmenteaza (gated pe progress < 0.20 in HaloSprite).
function HaloSprite({ texture, progressRef }: {
  texture: THREE.Texture;
  progressRef: ProgressRef;
}) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const matRef = useRef<THREE.SpriteMaterial>(null);
  useFrame(({ clock }) => {
    if (!spriteRef.current || !matRef.current) return;
    const t = clock.elapsedTime;
    // Pulsatie subtila: scale 1 -> 1.04, opacity 0.85 -> 1.
    const pulse = (Math.sin(t * 1.8) + 1) * 0.5; // 0..1
    const scale = 5 + pulse * 0.2;
    spriteRef.current.scale.set(scale, scale, 1);
    // Halo dispare cand asteroidul se fragmenteaza (progress 0.22+).
    const p = progressRef.current;
    const haloOpacity = p < 0.22 ? 0.85 + pulse * 0.15 : Math.max(0, 0.85 - (p - 0.22) * 4);
    matRef.current.opacity = haloOpacity;
  });
  return (
    <sprite ref={spriteRef} position={[0, 0, -1]} scale={[5, 5, 1]}>
      <spriteMaterial
        ref={matRef}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.85}
      />
    </sprite>
  );
}

export default function CinematicScene3D() {
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const progressRef = useRef<number>(0);
  // Textura pentru halou — generata o singura data la mount.
  const haloTexture = useMemo(() => createHaloTexture(), []);
  // Pozitia mouse-ului normalizata in [-1, 1]. Citita per-frame in MorphMeshes.
  const mouseRef = useRef({ x: 0, y: 0 });

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
        {/* Iluminare cinematica balansata — toate intensitatile reduse
            ca asteroidul sa nu mai fie blow-out pe diffuse #121417. */}
        <ambientLight intensity={0.08} color="#ffffff" />
        {/* Key light — directionalul principal. */}
        <directionalLight
          position={[6, 8, 6]}
          intensity={0.6}
          color="#ffffff"
          castShadow
        />
        {/* Rim — accent rece subtil, contureaza silueta. */}
        <directionalLight position={[-7, 2, -5]} intensity={0.7} color="#555F6B" />
        {/* Fill de jos — bounce subtil. */}
        <directionalLight position={[0, -4, 4]} intensity={0.2} color="#9aa0b0" />
        {/* Hemisfera — gradient cer/sol pentru ambianta. */}
        <hemisphereLight args={['#1a2030', '#050505', 0.25]} />
        {/* Highlight pe suprafata — pointLight alb din stanga-sus,
            creeaza specular subtil pe asteroid fara sa-i schimbe culoarea. */}
        <pointLight
          position={[-3, 3, 4]}
          intensity={0.85}
          distance={9}
          decay={2}
          color="#ffffff"
        />
        {/* Glow subtil in spatele obiectului. */}
        <pointLight
          position={[0, 0.5, -3]}
          intensity={0.4}
          distance={6}
          decay={2}
          color="#5a708a"
        />
        <Suspense fallback={null}>
          {/* Environment IBL generat din Lightformer-i — fara HDR extern.
              Da reflexii reale pe asteroid + fragmente. */}
          <Environment background={false} resolution={256}>
            <Lightformer
              form="rect"
              position={[5, 4, 5]}
              scale={[3, 3, 1]}
              intensity={2}
              color="#ffffff"
            />
            <Lightformer
              form="rect"
              position={[-5, 2, -3]}
              scale={[3, 4, 1]}
              intensity={1.6}
              color="#6b8aa8"
            />
            <Lightformer
              form="circle"
              position={[0, -4, 0]}
              scale={[5, 1, 5]}
              intensity={0.5}
              color="#2a3040"
            />
          </Environment>
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
          {/* Halou alb difuz in spatele asteroidului — sprite cu additive
              blending. Vizibil pe mobile (post-processing dezactivat acolo). */}
          {haloTexture && <HaloSprite texture={haloTexture} progressRef={progressRef} />}
          <MorphMeshes progressRef={progressRef} mouseRef={mouseRef} reduced={reduced} isMobile={isMobile} />
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
              intensity={0.4}
              luminanceThreshold={0.92}
              luminanceSmoothing={0.6}
              mipmapBlur
            />
            <Vignette offset={0.3} darkness={0.8} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}

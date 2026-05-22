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
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Ref shared intre componenta-parinte si meshes — citit la fiecare frame.
type ProgressRef = { current: number };
// Pozitia mouse-ului normalizata in [-1, 1] pe fiecare axa.
type MouseRef = { current: { x: number; y: number } };

// Geometrie asteroid: icosaedru subdivizat la 10 cu displacement noise
// 5-octava per-vertex + vertex colors pentru variatie minerala. Silueta
// de poliedru e rupta complet — pare stanca naturala, nu un D20.
function buildAsteroidGeometry() {
  // Sub-10 = ~80k triangles. Distributie uniforma fara singularitati polare.
  const geometry = new THREE.IcosahedronGeometry(1.2, 10);
  const noise3D = createNoise3D();
  const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(positionAttr.count * 3);
  const v = new THREE.Vector3();

  for (let i = 0; i < positionAttr.count; i++) {
    v.fromBufferAttribute(positionAttr, i);
    const dirX = v.x, dirY = v.y, dirZ = v.z;

    // 5 octave noise — frecvente diferite pentru detalii la scari diferite.
    const n1 = noise3D(dirX * 0.7, dirY * 0.7, dirZ * 0.7) * 0.32; // lumps mari, asimetrie
    const n2 = noise3D(dirX * 1.8, dirY * 1.8, dirZ * 1.8) * 0.14; // lumps medii
    const n3 = noise3D(dirX * 4.0, dirY * 4.0, dirZ * 4.0) * 0.06; // detalii mici
    const n4 = noise3D(dirX * 9.0, dirY * 9.0, dirZ * 9.0) * 0.025; // micro
    const n5 = noise3D(dirX * 18.0, dirY * 18.0, dirZ * 18.0) * 0.01; // nano
    const total = n1 + n2 + n3 + n4 + n5;

    v.multiplyScalar(1 + total);
    positionAttr.setXYZ(i, v.x, v.y, v.z);

    // Variatie de culoare pe suprafata: noise mai mic ca frecventa
    // simuleaza vene minerale / zone iluminate diferit.
    const cNoise = noise3D(dirX * 1.4, dirY * 1.4, dirZ * 1.4);
    // brightness in [0.04, 0.18] — foarte intunecat, dar cu variatie vizibila
    const brightness = 0.11 + cNoise * 0.07;
    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness * 0.98;
    colors[i * 3 + 2] = brightness * 1.04; // tint subtil rece
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  positionAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

// Genereaza canvas-based normal map + roughness map + emissive map din noise.
// - normal/roughness: micro-detalii suprafata (zgârieturi, craters)
// - emissive: pattern crack-uri subtile care emit lumina rece din interior
function buildAsteroidSurfaceMaps() {
  if (typeof document === 'undefined') return null;
  const size = 1024;
  const noise2D = createNoise2D();

  // Pas 1: genereaza un heightmap intern
  const heightMap = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 6;
      const w = (y / size) * 6;
      const h =
        noise2D(u, w) * 0.5 +
        noise2D(u * 2.3, w * 2.3) * 0.25 +
        noise2D(u * 5.1, w * 5.1) * 0.12 +
        noise2D(u * 11.0, w * 11.0) * 0.06;
      heightMap[y * size + x] = h;
    }
  }

  // Pas 2: converteste heightmap-ul in normal map
  const normalData = new Uint8Array(size * size * 4);
  const strength = 3.0; // cat de pronuntate sunt normalele
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const left = heightMap[y * size + Math.max(0, x - 1)];
      const right = heightMap[y * size + Math.min(size - 1, x + 1)];
      const up = heightMap[Math.max(0, y - 1) * size + x];
      const down = heightMap[Math.min(size - 1, y + 1) * size + x];
      const dx = (right - left) * strength;
      const dy = (down - up) * strength;
      const dz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      normalData[i * 4] = Math.floor(((dx / len) * 0.5 + 0.5) * 255);
      normalData[i * 4 + 1] = Math.floor(((dy / len) * 0.5 + 0.5) * 255);
      normalData[i * 4 + 2] = Math.floor(((dz / len) * 0.5 + 0.5) * 255);
      normalData[i * 4 + 3] = 255;
    }
  }
  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.needsUpdate = true;
  normalMap.colorSpace = THREE.NoColorSpace;

  // Pas 3: roughness map din inaltime — zone joase mai rugoase
  const roughData = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const h = heightMap[i];
    // h e ~ -1 la 1; mapeaza la 0.55-0.95 roughness (foarte ne-lucios)
    const r = 0.75 + h * 0.2;
    const val = Math.max(0, Math.min(255, Math.floor(r * 255)));
    roughData[i * 4] = val;
    roughData[i * 4 + 1] = val;
    roughData[i * 4 + 2] = val;
    roughData[i * 4 + 3] = 255;
  }
  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.needsUpdate = true;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  // Pas 4: emissive map — pattern crack-uri subtile. Iau valoare absoluta
  // de noise + threshold ingust pentru a obtine linii subtiri ramificate
  // care arata ca fisuri prin care iese lumina din interior.
  const emissiveData = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = (x / size) * 4;
      const w = (y / size) * 4;
      // Combinatie de 2 noise — banda ingusta unde valoarea e aproape de 0
      // = linie de crack.
      const n1 = noise2D(u, w);
      const n2 = noise2D(u * 3.1, w * 3.1) * 0.4;
      const crackVal = Math.abs(n1 + n2);
      const crack = crackVal < 0.06 ? 1 - crackVal / 0.06 : 0;
      // Multiplicat cu un al doilea noise mai larg ca sa nu fie crack-uri uniforme.
      const breakup = (noise2D(u * 0.5, w * 0.5) + 1) * 0.5;
      const intensity = Math.pow(crack * breakup, 1.4);
      // Culoare rece desaturata — fara wash warm, ramane in paleta mdx.
      emissiveData[i * 4] = Math.floor(intensity * 110);
      emissiveData[i * 4 + 1] = Math.floor(intensity * 130);
      emissiveData[i * 4 + 2] = Math.floor(intensity * 165);
      emissiveData[i * 4 + 3] = 255;
    }
  }
  const emissiveMap = new THREE.DataTexture(emissiveData, size, size, THREE.RGBAFormat);
  emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.needsUpdate = true;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;

  return { normalMap, roughnessMap, emissiveMap };
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

const FRAGMENT_COUNT = 300;

interface MorphMeshesProps {
  progressRef: ProgressRef;
  mouseRef: MouseRef;
  reduced: boolean;
}

function MorphMeshes({ progressRef, mouseRef, reduced }: MorphMeshesProps) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const asteroidMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Pulse ring + fragments.
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const fragmentMeshRef = useRef<THREE.InstancedMesh>(null);

  // Geometrii construite o singura data si stocate in memo.
  const asteroidGeometry = useMemo(() => buildAsteroidGeometry(), []);
  // Texturi procedurale pentru asteroid — normal + roughness map.
  const surfaceMaps = useMemo(() => buildAsteroidSurfaceMaps(), []);

  // Sample origin / float / target points + rotatii + scaleuri ONCE on mount.
  const fragmentData = useMemo(() => {
    const origins = sampleAsteroidPoints(asteroidGeometry, FRAGMENT_COUNT);
    const floats = sampleFloatTargets(origins);
    const targets = sampleCCTargets(FRAGMENT_COUNT);
    const rotations = buildFragmentRotations(FRAGMENT_COUNT);
    const scales = buildFragmentScales(FRAGMENT_COUNT);
    return { origins, floats, targets, rotations, scales };
  }, [asteroidGeometry]);

  // Geometrie fragment — dodecaedru mic, cinematic. Single shared geometry.
  const fragmentGeometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);

  // Obiect dummy reutilizat in useFrame pentru a calcula matricea per-instanta.
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Cleanup geometrii custom + texturi la unmount.
  useEffect(() => {
    return () => {
      asteroidGeometry.dispose();
      fragmentGeometry.dispose();
      if (surfaceMaps) {
        surfaceMaps.normalMap.dispose();
        surfaceMaps.roughnessMap.dispose();
        surfaceMaps.emissiveMap.dispose();
      }
    };
  }, [asteroidGeometry, fragmentGeometry, surfaceMaps]);

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
      if (!reduced) {
        const baseIntensity = 0.45 + Math.sin(t * 0.8) * 0.15;
        // Boost emissive aggressively as we approach explosion (p=0.22).
        const explosionBoost = p < 0.22 ? Math.pow(p / 0.22, 3) * 1.5 : 0;
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

    // === STAGE 0.20+: Fragments (explozie -> float -> atragere -> solid) ===
    if (fragmentMeshRef.current && p > 0.20) {
      fragmentMeshRef.current.visible = true;
      const { origins, floats, targets, rotations, scales } = fragmentData;

      for (let i = 0; i < FRAGMENT_COUNT; i++) {
        const origin = origins[i];
        const floatPos = floats[i];
        const target = targets[i];
        const rot = rotations[i];
        const scale = scales[i];

        let x: number, y: number, z: number;

        if (p < 0.32) {
          // Faza explozie: origin -> float, ease power3.out
          const local = THREE.MathUtils.clamp((p - 0.22) / 0.10, 0, 1);
          const eased = 1 - Math.pow(1 - local, 3); // power3.out
          x = THREE.MathUtils.lerp(origin.x, floatPos.x, eased);
          y = THREE.MathUtils.lerp(origin.y, floatPos.y, eased);
          z = THREE.MathUtils.lerp(origin.z, floatPos.z, eased);
        } else if (p < 0.55) {
          // Faza float: stationar la pozitia float cu drift subtil.
          const drift = reduced ? 0 : Math.sin(t * rot.speed + i) * 0.04;
          x = floatPos.x + drift * rot.axis.x;
          y = floatPos.y + drift * rot.axis.y;
          z = floatPos.z + drift * rot.axis.z;
        } else if (p < 0.78) {
          // Faza atragere: float -> target, ease power3.inOut
          const local = THREE.MathUtils.clamp((p - 0.55) / 0.23, 0, 1);
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
        fragmentMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      fragmentMeshRef.current.instanceMatrix.needsUpdate = true;
    } else if (fragmentMeshRef.current) {
      fragmentMeshRef.current.visible = false;
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
            <meshStandardMaterial
              ref={asteroidMatRef}
              vertexColors
              normalMap={surfaceMaps?.normalMap ?? null}
              normalScale={new THREE.Vector2(1.4, 1.4)}
              roughnessMap={surfaceMaps?.roughnessMap ?? null}
              roughness={1}
              metalness={0.18}
              emissiveMap={surfaceMaps?.emissiveMap ?? null}
              emissive="#ffffff"
              emissiveIntensity={0.55}
              transparent
              opacity={1}
            />
          </mesh>
          {!reduced && (
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

      {/* FRAGMENTE — 300 instanced meshes, animate per frame din useFrame. */}
      <instancedMesh
        ref={fragmentMeshRef}
        args={[fragmentGeometry, undefined, FRAGMENT_COUNT]}
        castShadow
      >
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.85}
          metalness={0.2}
          emissive="#6e82a5"
          emissiveIntensity={0.3}
        />
      </instancedMesh>
    </>
  );
}

export default function CinematicScene3D() {
  const reduced = useReducedMotion() ?? false;
  const progressRef = useRef<number>(0);
  // Pozitia mouse-ului normalizata in [-1, 1]. Citita per-frame in MorphMeshes.
  const mouseRef = useRef({ x: 0, y: 0 });

  // ScrollTrigger urmareste intregul document si actualizeaza progressRef.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
    return () => {
      st.kill();
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
      className="pointer-events-none fixed inset-0 -z-10 hidden lg:block"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#050505', 6, 12]} />
        {/* Iluminare cinematica in 3 puncte. */}
        {/* Ambient foarte slab — doar pentru a evita negru perfect. */}
        <ambientLight intensity={0.08} color="#ffffff" />
        {/* Key light — directionalul principal. Tonat in jos pentru a evita wash-out pe rocky. */}
        <directionalLight
          position={[6, 8, 6]}
          intensity={1.2}
          color="#ffffff"
          castShadow
        />
        {/* Rim blue — accent rece mai pronuntat, sa scoata silueta neregulata. */}
        <directionalLight position={[-7, 2, -5]} intensity={1.4} color="#7a98c0" />
        {/* Fill de jos — bounce mai vizibil pentru depth. */}
        <directionalLight position={[0, -4, 4]} intensity={0.4} color="#9aa0b0" />
        {/* Hemisfera — gradient cer/sol pentru ambianta. */}
        <hemisphereLight args={['#1a2030', '#050505', 0.45]} />
        {/* Glow subtil in spatele obiectului — redus, sa nu blow-out bloom-ul. */}
        <pointLight
          position={[0, 0.5, -3]}
          intensity={1.0}
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
          {/* Stele 3D cu adancime — drift natural pe baza de fade + speed. */}
          {!reduced && (
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
          <MorphMeshes progressRef={progressRef} mouseRef={mouseRef} reduced={reduced} />
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
        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.75}
            luminanceSmoothing={0.6}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.8} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

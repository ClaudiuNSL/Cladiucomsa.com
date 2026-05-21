'use client';
// Scena 3D cinematica fixata in spatele continutului paginii.
// Morphing: asteroid -> ADN -> cub, condus de progresul de scroll
// al documentului prin GSAP ScrollTrigger. Vibe mdx.so: dark, minimal,
// rim-lights subtile, bloom subtil, vignette, contact shadows.
// Iluminare cinematica in 3 puncte (key + blue rim + fill) + glow point
// in spatele obiectului. Rotatii continue conduse prin GSAP.
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Sparkles, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Ref shared intre componenta-parinte si meshes — citit la fiecare frame.
type ProgressRef = { current: number };

// Construieste o curba helicoidala pe Z pentru un fir de ADN.
function buildHelixCurve(phaseShift: number) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100 - 0.5) * 2.8; // z in [-1.4, 1.4]
    const angle = t * Math.PI * 6 + phaseShift; // ~6 rasuciri
    points.push(new THREE.Vector3(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, t));
  }
  return new THREE.CatmullRomCurve3(points);
}

// Geometrie asteroid: icosaedru subdivizat la 8 cu displacement noise
// dual-octava per-vertex pentru o forma mai detaliata, neregulata, stancoasa.
function buildAsteroidGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1.2, 8);
  const noise3D = createNoise3D();
  const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < positionAttr.count; i++) {
    v.fromBufferAttribute(positionAttr, i);
    // Doua octave de noise: prima da silueta, a doua adauga detaliu fin.
    const n1 = noise3D(v.x * 1.5, v.y * 1.5, v.z * 1.5) * 0.15;
    const n2 = noise3D(v.x * 4.0, v.y * 4.0, v.z * 4.0) * 0.04;
    v.multiplyScalar(1 + n1 + n2);
    positionAttr.setXYZ(i, v.x, v.y, v.z);
  }
  positionAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

interface MorphMeshesProps {
  progressRef: ProgressRef;
  reduced: boolean;
}

function MorphMeshes({ progressRef, reduced }: MorphMeshesProps) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const dnaGroupRef = useRef<THREE.Group>(null);
  const dnaMesh1Ref = useRef<THREE.Mesh>(null);
  const dnaMesh2Ref = useRef<THREE.Mesh>(null);
  const cubeRef = useRef<THREE.Mesh>(null);

  const asteroidMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dnaMat1Ref = useRef<THREE.MeshStandardMaterial>(null);
  const dnaMat2Ref = useRef<THREE.MeshStandardMaterial>(null);
  const cubeMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Geometrii construite o singura data si stocate in memo.
  const asteroidGeometry = useMemo(() => buildAsteroidGeometry(), []);
  const dnaGeometryA = useMemo(() => {
    const curve = buildHelixCurve(0);
    return new THREE.TubeGeometry(curve, 100, 0.07, 16, false);
  }, []);
  const dnaGeometryB = useMemo(() => {
    const curve = buildHelixCurve(Math.PI);
    return new THREE.TubeGeometry(curve, 100, 0.07, 16, false);
  }, []);

  // Cleanup geometrii custom la unmount.
  useEffect(() => {
    return () => {
      asteroidGeometry.dispose();
      dnaGeometryA.dispose();
      dnaGeometryB.dispose();
    };
  }, [asteroidGeometry, dnaGeometryA, dnaGeometryB]);

  // Rotatii continue conduse prin GSAP — viata vizuala constanta.
  // Tweens sunt inrolate intr-un context scoped pentru cleanup automat.
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
      if (dnaGroupRef.current) {
        gsap.to(dnaGroupRef.current.rotation, {
          y: '+=6.28',
          duration: 18,
          repeat: -1,
          ease: 'none',
        });
      }
      if (cubeRef.current) {
        gsap.to(cubeRef.current.rotation, {
          y: '+=6.28',
          duration: 35,
          repeat: -1,
          ease: 'none',
        });
        gsap.to(cubeRef.current.rotation, {
          x: '+=6.28',
          duration: 50,
          repeat: -1,
          ease: 'none',
        });
      }
    });
    return () => ctx.revert();
  }, [reduced]);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const camera = state.camera;

    // Crossfade opacitate dupa specificatia R4.
    const asteroidOpacity = THREE.MathUtils.clamp(1 - (p - 0.3) / 0.1, 0, 1);
    const dnaIn = THREE.MathUtils.clamp((p - 0.3) / 0.1, 0, 1);
    const dnaOut = THREE.MathUtils.clamp(1 - (p - 0.63) / 0.1, 0, 1);
    const dnaOpacity = Math.min(dnaIn, dnaOut);
    const cubeOpacity = THREE.MathUtils.clamp((p - 0.63) / 0.1, 0, 1);

    if (asteroidMatRef.current) asteroidMatRef.current.opacity = asteroidOpacity;
    if (asteroidRef.current) asteroidRef.current.visible = asteroidOpacity > 0.01;

    if (dnaMat1Ref.current) dnaMat1Ref.current.opacity = dnaOpacity;
    if (dnaMat2Ref.current) dnaMat2Ref.current.opacity = dnaOpacity;
    if (dnaGroupRef.current) dnaGroupRef.current.visible = dnaOpacity > 0.01;

    if (cubeMatRef.current) cubeMatRef.current.opacity = cubeOpacity;
    if (cubeRef.current) cubeRef.current.visible = cubeOpacity > 0.01;

    // Dolly subtil tied to scroll: 5 -> 4.4 (DNA) -> 5.3 (cub). Smooth = delta*1.5.
    let targetZ = 5;
    if (p < 0.5) {
      targetZ = THREE.MathUtils.lerp(5, 4.4, p / 0.5);
    } else {
      targetZ = THREE.MathUtils.lerp(4.4, 5.3, (p - 0.5) / 0.5);
    }
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 1.5);
    // Drift subtil pe Y pentru senzatie de parallax — camera coboara putin pe scroll.
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, p * -0.4, delta * 1.5);

    // Mesh-urile dau drift subtil cu scroll-ul — "obiectul se misca cu scroll".
    if (asteroidRef.current) {
      asteroidRef.current.position.x = THREE.MathUtils.lerp(
        asteroidRef.current.position.x,
        p * -0.5,
        delta * 1.5
      );
    }
    if (dnaGroupRef.current) {
      dnaGroupRef.current.position.y = THREE.MathUtils.lerp(
        dnaGroupRef.current.position.y,
        (p - 0.5) * 0.3,
        delta * 1.5
      );
    }
    if (cubeRef.current) {
      cubeRef.current.position.x = THREE.MathUtils.lerp(
        cubeRef.current.position.x,
        (1 - p) * 0.4,
        delta * 1.5
      );
    }
  });

  // Float-ul aplica miscare idle "vie"; cu reduced motion dezactivam complet.
  const asteroidFloat = reduced
    ? { speed: 0, rot: 0, pos: 0 }
    : { speed: 1.0, rot: 0.4, pos: 0.55 };
  const dnaFloat = reduced
    ? { speed: 0, rot: 0, pos: 0 }
    : { speed: 1.2, rot: 0.2, pos: 0.45 };
  const cubeFloat = reduced
    ? { speed: 0, rot: 0, pos: 0 }
    : { speed: 0.8, rot: 0.3, pos: 0.35 };

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
              color="#1a1a1a"
              roughness={0.7}
              metalness={0.4}
              envMapIntensity={1}
              transparent
              opacity={1}
            />
          </mesh>
          {!reduced && (
            <Sparkles count={40} scale={3.5} size={1.4} speed={0.25} color="#aaaaaa" />
          )}
        </group>
      </Float>

      {/* ADN — helix dublu, metal lustruit inchis, sparkles fine in interior. */}
      <Float
        speed={dnaFloat.speed}
        rotationIntensity={dnaFloat.rot}
        floatIntensity={dnaFloat.pos}
      >
        <group ref={dnaGroupRef} rotation={[Math.PI / 2, 0, 0]}>
          <mesh ref={dnaMesh1Ref} geometry={dnaGeometryA} castShadow>
            <meshStandardMaterial
              ref={dnaMat1Ref}
              color="#2a2a2a"
              roughness={0.4}
              metalness={0.6}
              transparent
              opacity={0}
            />
          </mesh>
          <mesh ref={dnaMesh2Ref} geometry={dnaGeometryB} castShadow>
            <meshStandardMaterial
              ref={dnaMat2Ref}
              color="#2a2a2a"
              roughness={0.4}
              metalness={0.6}
              transparent
              opacity={0}
            />
          </mesh>
          {!reduced && (
            <Sparkles
              count={80}
              scale={[0.8, 0.8, 3]}
              size={0.8}
              speed={0.3}
              color="#cccccc"
            />
          )}
        </group>
      </Float>

      {/* CUB — metal negru lustruit, reflectiv. */}
      <Float
        speed={cubeFloat.speed}
        rotationIntensity={cubeFloat.rot}
        floatIntensity={cubeFloat.pos}
      >
        <RoundedBox ref={cubeRef} args={[1.6, 1.6, 1.6]} radius={0.06} smoothness={6} castShadow>
          <meshStandardMaterial
            ref={cubeMatRef}
            color="#0d0d0d"
            roughness={0.15}
            metalness={0.95}
            transparent
            opacity={0}
          />
        </RoundedBox>
      </Float>
    </>
  );
}

export default function CinematicScene3D() {
  const reduced = useReducedMotion() ?? false;
  const progressRef = useRef<number>(0);

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
        {/* Key light — directionalul principal. */}
        <directionalLight
          position={[6, 8, 6]}
          intensity={1.8}
          color="#ffffff"
          castShadow
        />
        {/* Rim subtil blue-gray — accent rece pe partea opusa cheii. */}
        <directionalLight position={[-7, 2, -5]} intensity={0.9} color="#6b8aa8" />
        {/* Fill de jos — bounce moale pentru a evita umbrele dure. */}
        <directionalLight position={[0, -4, 4]} intensity={0.25} color="#9aa0b0" />
        {/* Hemisfera — gradient cer/sol pentru ambianta. */}
        <hemisphereLight args={['#1a2030', '#050505', 0.35]} />
        {/* Glow subtil in spatele obiectului — punctul de "respiratie" cald-rece. */}
        <pointLight
          position={[0, 0.5, -3]}
          intensity={1.5}
          distance={6}
          decay={2}
          color="#5a708a"
        />
        <Suspense fallback={null}>
          <MorphMeshes progressRef={progressRef} reduced={reduced} />
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
            intensity={0.55}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.6}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.8} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

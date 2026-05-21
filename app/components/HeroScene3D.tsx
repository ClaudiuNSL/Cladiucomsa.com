'use client';
// Scena 3D principala a sectiunii Hero: morph sfera -> ADN -> cub
// condus de progresul de scroll al sectiunii. Trei mesh-uri intr-un
// singur Canvas, cu crossfade pe opacitate citita din MotionValue.
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  MeshTransmissionMaterial,
  RoundedBox,
  Sparkles,
} from '@react-three/drei';
import { useReducedMotion, type MotionValue } from 'framer-motion';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  scrollProgress: MotionValue<number>;
}

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

// MeshTransmissionMaterial nu expune un ref tipizat exact, asa ca folosim
// un ref generic pe care setam `.opacity` la fiecare frame.
type MaterialLike = { opacity: number; transparent: boolean } | null;
type MaterialRefHolder = { current: MaterialLike };

// Callback-ref pentru materialul transmisiv: ne intereseaza doar accesul
// la .opacity la runtime, asa ca stocam instanta intr-un ref-holder fara
// sa luptam cu tipul strict expus de drei.
function setMatRef(holder: MaterialRefHolder) {
  return (instance: unknown) => {
    holder.current = (instance ?? null) as MaterialLike;
  };
}

interface MorphMeshesProps {
  scrollProgress: MotionValue<number>;
  reduced: boolean;
}

function MorphMeshes({ scrollProgress, reduced }: MorphMeshesProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const dnaGroupRef = useRef<THREE.Group>(null);
  const dnaMesh1Ref = useRef<THREE.Mesh>(null);
  const dnaMesh2Ref = useRef<THREE.Mesh>(null);
  const cubeRef = useRef<THREE.Mesh>(null);

  const sphereMatRef = useRef<MaterialLike>(null);
  const dnaMat1Ref = useRef<MaterialLike>(null);
  const dnaMat2Ref = useRef<MaterialLike>(null);
  const cubeMatRef = useRef<MaterialLike>(null);

  // Geometrii memorizate (create o singura data).
  const dnaGeometryA = useMemo(() => {
    const curve = buildHelixCurve(0);
    return new THREE.TubeGeometry(curve, 100, 0.08, 16, false);
  }, []);
  const dnaGeometryB = useMemo(() => {
    const curve = buildHelixCurve(Math.PI);
    return new THREE.TubeGeometry(curve, 100, 0.08, 16, false);
  }, []);

  useFrame((_state, delta) => {
    const p = scrollProgress.get();

    // Calcule opacitate per mesh dupa specificatia E9.
    const sphereOpacity = THREE.MathUtils.clamp(1 - (p - 0.3) / 0.1, 0, 1);
    const dnaOpacityIn = THREE.MathUtils.clamp((p - 0.3) / 0.1, 0, 1);
    const dnaOpacityOut = THREE.MathUtils.clamp(1 - (p - 0.63) / 0.1, 0, 1);
    const dnaOpacity = Math.min(dnaOpacityIn, dnaOpacityOut);
    const cubeOpacity = THREE.MathUtils.clamp((p - 0.63) / 0.1, 0, 1);

    // Aplica opacitatea + vizibilitatea ca optimizare.
    if (sphereMatRef.current) sphereMatRef.current.opacity = sphereOpacity;
    if (sphereRef.current) sphereRef.current.visible = sphereOpacity > 0.01;

    if (dnaMat1Ref.current) dnaMat1Ref.current.opacity = dnaOpacity;
    if (dnaMat2Ref.current) dnaMat2Ref.current.opacity = dnaOpacity;
    if (dnaGroupRef.current) dnaGroupRef.current.visible = dnaOpacity > 0.01;

    if (cubeMatRef.current) cubeMatRef.current.opacity = cubeOpacity;
    if (cubeRef.current) cubeRef.current.visible = cubeOpacity > 0.01;

    // Auto-rotatie lenta, sarita daca utilizatorul prefera reduced motion.
    if (!reduced) {
      if (sphereRef.current) sphereRef.current.rotation.y += delta * 0.2;
      if (dnaGroupRef.current) dnaGroupRef.current.rotation.y += delta * 0.3;
      if (cubeRef.current) cubeRef.current.rotation.y += delta * 0.2;
    }
  });

  // Float-ul aplica miscare idle; cu reduced motion dezactivam complet.
  const floatSpeed = reduced ? 0 : 1;
  const floatRotIntensity = reduced ? 0 : 0.4;
  const floatPosIntensity = reduced ? 0 : 0.3;

  return (
    <>
      {/* SFERA */}
      <Float speed={floatSpeed} rotationIntensity={floatRotIntensity} floatIntensity={floatPosIntensity}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshTransmissionMaterial
            ref={setMatRef(sphereMatRef)}
            transparent
            opacity={1}
            color="#FFFFFF"
            ior={1.5}
            transmission={1}
            chromaticAberration={0.04}
            thickness={0.3}
            roughness={0.05}
            distortion={0.2}
            samples={6}
            resolution={512}
          />
          {/* Lumina interna cyan: face mesh-ul sa straluceasca din interior. */}
          <pointLight color="#06B6D4" intensity={5} decay={2} position={[0, 0, 0]} />
        </mesh>
      </Float>

      {/* ADN */}
      <Float speed={floatSpeed} rotationIntensity={floatRotIntensity} floatIntensity={floatPosIntensity}>
        <group ref={dnaGroupRef} rotation={[Math.PI / 2, 0, 0]}>
          <mesh ref={dnaMesh1Ref} geometry={dnaGeometryA}>
            <MeshTransmissionMaterial
              ref={setMatRef(dnaMat1Ref)}
              transparent
              opacity={0}
              color="#FFFFFF"
              ior={1.5}
              transmission={1}
              chromaticAberration={0.04}
              thickness={0.3}
              roughness={0.05}
              distortion={0.2}
              samples={6}
              resolution={512}
            />
          </mesh>
          <mesh ref={dnaMesh2Ref} geometry={dnaGeometryB}>
            <MeshTransmissionMaterial
              ref={setMatRef(dnaMat2Ref)}
              transparent
              opacity={0}
              color="#FFFFFF"
              ior={1.5}
              transmission={1}
              chromaticAberration={0.04}
              thickness={0.3}
              roughness={0.05}
              distortion={0.2}
              samples={6}
              resolution={512}
            />
          </mesh>
          <pointLight color="#06B6D4" intensity={5} decay={2} position={[0, 0, 0]} />
        </group>
      </Float>

      {/* CUB */}
      <Float speed={floatSpeed} rotationIntensity={floatRotIntensity} floatIntensity={floatPosIntensity}>
        <RoundedBox ref={cubeRef} args={[1.6, 1.6, 1.6]} radius={0.15} smoothness={4}>
          <MeshTransmissionMaterial
            ref={setMatRef(cubeMatRef)}
            transparent
            opacity={0}
            color="#FFFFFF"
            ior={1.5}
            transmission={1}
            chromaticAberration={0.04}
            thickness={0.3}
            roughness={0.05}
            distortion={0.2}
            samples={6}
            resolution={512}
          />
          <pointLight color="#06B6D4" intensity={5} decay={2} position={[0, 0, 0]} />
        </RoundedBox>
      </Float>
    </>
  );
}

export default function HeroScene3D({ scrollProgress }: Props) {
  const reduced = useReducedMotion() ?? false;

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      {!reduced && (
        <Sparkles count={60} scale={4} size={2} speed={0.4} color="#06B6D4" />
      )}
      <MorphMeshes scrollProgress={scrollProgress} reduced={reduced} />
    </Canvas>
  );
}

# Asteroid Shatter Effects — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 cinematic effects to the existing scroll-driven asteroid shatter sequence in `app/components/CinematicScene3D.tsx`, without touching the asteroid's material.

**Architecture:** All effects are additive — separate meshes, separate materials, separate lights, or DOM overlays. Triggered by detecting forward crossing of `progressRef >= 0.22`. Reset when scrolling back below that threshold. Time-decayed where appropriate (shake, flash, bloom recovery) using `performance.now()` captured at trigger.

**Tech Stack:** Next.js 15, React 19, Three.js 0.184, @react-three/fiber 9, @react-three/postprocessing 3, TypeScript.

**Validation:** Visual — no unit tests. After each task, hard-refresh `http://localhost:3000`, scroll the hero sections, observe the named effect at the impact moment. Cross-check on mobile viewport (Chrome DevTools, iPhone 12 preset).

**Branching:** This is invasive multi-commit work. Create branch `feature/asteroid-shatter-effects` first.

---

## Task 0: Branch + sanity check

**Files:** none modified.

**Step 1:** Create branch from main
```bash
git checkout -b feature/asteroid-shatter-effects
```

**Step 2:** Confirm dev server is running and preview still works at `http://localhost:3000/preview/asteroid` (manual visual check — asteroid rotates, Trigger Shatter works).

**Step 3:** Confirm the live site shatter at `http://localhost:3000/ro` still works (scroll into hero sequence, observe current shatter at section 2→3 boundary).

**Step 4:** Commit nothing yet.

---

## Task 1: External halo pre-impact

**Files:**
- Modify: `app/components/CinematicScene3D.tsx` — inside `MorphMeshes` JSX, near where the asteroid mesh is mounted (around line 1047-1068).

**Goal:** Add a transparent additive sphere around the asteroid + an orange point light that pulse together during `p ∈ [0.16, 0.22]`.

**Step 1:** Add refs at the top of `MorphMeshes`:
```tsx
const haloRef = useRef<THREE.Mesh>(null);
const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
const haloLightRef = useRef<THREE.PointLight>(null);
```

**Step 2:** In the JSX returned by `MorphMeshes`, near the asteroid mesh, add:
```tsx
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
<pointLight ref={haloLightRef} position={[0, 0, 0]} intensity={0} distance={4} decay={2} color="#ff6a2a" />
```

**Step 3:** In the `useFrame` callback (line 785), add at the end (after existing scroll-progress logic):
```tsx
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
```

**Step 4:** Save, hard-refresh `http://localhost:3000/ro`, scroll slowly through the hero. Expected: between section 2 mid-scroll and shatter moment, an orange glow appears around the asteroid and pulses. Disappears at shatter.

**Step 5:** Commit:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "feat(shatter): orange halo + point light pre-impact"
```

---

## Task 2: Flash overlay DOM

**Files:**
- Modify: `app/components/CinematicScene3D.tsx` — wrapper div at line 1270, plus state in `CinematicScene3D`.

**Goal:** White flash overlay covers viewport for ~380ms at the moment scroll crosses `p = 0.22` forward.

**Step 1:** In `CinematicScene3D` (the default export), add a ref:
```tsx
const flashRef = useRef<HTMLDivElement>(null);
```

**Step 2:** Pass `flashRef` to `MorphMeshes` via props. Update `MorphMeshesProps` type to add:
```tsx
flashRef?: React.RefObject<HTMLDivElement | null>;
```

**Step 3:** Inside `CinematicScene3D` return, BEFORE `<Canvas>`, add the flash div as a sibling of `<Canvas>`. The wrapper has `pointer-events-none fixed inset-0 -z-10`, but the flash should be on top of the canvas, so it goes inside but above:
```tsx
<div
  ref={flashRef}
  className="pointer-events-none fixed inset-0 z-50 bg-white"
  style={{ opacity: 0 }}
  aria-hidden
/>
```
Note: outer wrapper has `-z-10` — move the flash OUTSIDE that wrapper, as a separate sibling in the JSX root, OR change the structure so the flash is in its own div with z-50.

Simpler: return a fragment from `CinematicScene3D`:
```tsx
return (
  <>
    <div ref={flashRef} className="pointer-events-none fixed inset-0 z-50 bg-white" style={{ opacity: 0 }} aria-hidden />
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Canvas ...>
        ...existing...
      </Canvas>
    </div>
  </>
);
```

**Step 4:** In `MorphMeshes`, add at the top of the component:
```tsx
const lastProgressRef = useRef(0);
```

**Step 5:** In `useFrame`, at the very beginning (right after `const p = progressRef.current;`), add trigger detection:
```tsx
const lastP = lastProgressRef.current;
if (lastP < 0.22 && p >= 0.22) {
  flashRef?.current?.animate(
    [{ opacity: 0.95 }, { opacity: 0 }],
    { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
  );
}
lastProgressRef.current = p;
```

**Step 6:** Save, hard-refresh, scroll to shatter moment. Expected: brief white flash exactly when asteroid breaks. Test on mobile viewport: flash also works (DOM-only, no GPU dependency).

**Step 7:** Commit:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "feat(shatter): white flash overlay at impact"
```

---

## Task 3: Camera shake

**Files:**
- Modify: `app/components/CinematicScene3D.tsx` — `useFrame` in `MorphMeshes`.

**Goal:** Apply random offsets to `state.camera.position` for 500ms after the shatter trigger, decaying quadratically.

**Step 1:** Add ref in `MorphMeshes`:
```tsx
const shatterTimeRef = useRef<number | null>(null);
```

**Step 2:** Inside the existing trigger-detection block (from Task 2), capture timestamp:
```tsx
if (lastP < 0.22 && p >= 0.22) {
  flashRef?.current?.animate(...);  // existing
  shatterTimeRef.current = performance.now();
}
```

**Step 3:** Add reset detection (scroll back):
```tsx
if (lastP >= 0.22 && p < 0.22) {
  shatterTimeRef.current = null;
}
```

**Step 4:** Find the existing camera dolly lerp in `useFrame`. It sets `camera.position.z` based on `p`. AFTER that block, add the shake:
```tsx
if (shatterTimeRef.current !== null) {
  const elapsed = (performance.now() - shatterTimeRef.current) / 1000;
  if (elapsed < 0.5) {
    const decay = (1 - elapsed / 0.5) ** 2;
    state.camera.position.x += (Math.random() * 2 - 1) * 0.08 * decay;
    state.camera.position.y += (Math.random() * 2 - 1) * 0.08 * decay;
    state.camera.position.z += (Math.random() * 2 - 1) * 0.032 * decay;
  }
}
```

**Step 5:** Save, hard-refresh, scroll to shatter. Expected: camera trembles for ~0.5s right at impact moment.

**Step 6:** Commit:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "feat(shatter): time-decayed camera shake at impact"
```

---

## Task 4: Bloom spike + recovery

**Files:**
- Modify: `app/components/CinematicScene3D.tsx` — `<Bloom>` in `EffectComposer` (line 1365), plus a way to pass a ref into `<Bloom>`.

**Goal:** At impact, bloom intensity jumps from 0.55 to 2.4, then dampens back to 0.55 over ~0.8s.

**Step 1:** Note that `@react-three/postprocessing`'s `<Bloom>` accepts a `ref` that points to the `BloomEffect` instance. Add ref in `CinematicScene3D`:
```tsx
const bloomRef = useRef<any>(null);
```

**Step 2:** Pass `bloomRef` to `MorphMeshes` via props (similar to `flashRef`).

**Step 3:** Update the `<Bloom>` line:
```tsx
<Bloom
  ref={bloomRef}
  intensity={0.55}
  luminanceThreshold={0.82}
  luminanceSmoothing={0.6}
  mipmapBlur
/>
```

**Step 4:** In `MorphMeshes` trigger block:
```tsx
if (lastP < 0.22 && p >= 0.22) {
  // ...existing...
  if (bloomRef?.current) bloomRef.current.intensity = 2.4;
}
```

**Step 5:** In `useFrame`, after all other logic, damp the bloom intensity back to baseline:
```tsx
if (bloomRef?.current) {
  bloomRef.current.intensity = THREE.MathUtils.damp(bloomRef.current.intensity, 0.55, 1.8, delta);
}
```

**Step 6:** Save, hard-refresh on DESKTOP (Bloom is gated to `!isMobile`). Expected: at impact, the entire scene briefly glows brighter (bloom spike), then recovers.

**Step 7:** Commit:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "feat(shatter): bloom intensity spike + damp recovery"
```

---

## Task 5: Sparks (emissive instanced points)

**Files:**
- Modify: `app/components/CinematicScene3D.tsx` — new InstancedMesh inside `MorphMeshes`.

**Goal:** 80 small bright orange points (`#ffaa55`) explode outward from asteroid center at impact, with random velocities, drag, scale flicker, and lifetime 0.6-1.4s.

**Step 1:** Define constants and add refs in `MorphMeshes`:
```tsx
const SPARK_COUNT_DESKTOP = 80;
const SPARK_COUNT_MOBILE = 30;
const sparkCount = isMobile ? SPARK_COUNT_MOBILE : SPARK_COUNT_DESKTOP;
const sparksRef = useRef<THREE.InstancedMesh>(null);
```

**Step 2:** Define spark data structure with useMemo:
```tsx
const sparkData = useMemo(
  () => Array.from({ length: sparkCount }, () => ({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 1,
    alive: false,
  })),
  [sparkCount]
);
```

**Step 3:** In JSX, add the instanced mesh (inside `MorphMeshes` return, near other instanced meshes):
```tsx
<instancedMesh ref={sparksRef} args={[undefined, undefined, sparkCount]}>
  <sphereGeometry args={[0.025, 6, 6]} />
  <meshBasicMaterial color="#ffaa55" transparent />
</instancedMesh>
```
Initial count: set to 0 in useEffect after mount, so they're invisible until spawned.

**Step 4:** Add a `dummy = new THREE.Object3D()` reuse object near top of `MorphMeshes` if not already present (one exists at line 733). Add a spawn helper:
```tsx
const spawnSparks = useCallback(() => {
  for (let i = 0; i < sparkCount; i++) {
    const s = sparkData[i];
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    s.pos.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi))
         .multiplyScalar(0.9 + Math.random() * 0.4);
    s.vel.copy(s.pos).normalize().multiplyScalar(4 + Math.random() * 8);
    s.vel.x += (Math.random() - 0.5) * 1.5;
    s.vel.y += (Math.random() - 0.5) * 1.5;
    s.life = 0;
    s.maxLife = 0.6 + Math.random() * 0.8;
    s.alive = true;
  }
  if (sparksRef.current) sparksRef.current.count = sparkCount;
}, [sparkCount, sparkData]);
```

**Step 5:** In trigger block, call `spawnSparks()`.

**Step 6:** In reset block (scroll-back), set `sparksRef.current.count = 0` and `sparkData.forEach(s => s.alive = false)`.

**Step 7:** In `useFrame`, after camera shake block, update sparks (only if any alive):
```tsx
const sparks = sparksRef.current;
if (sparks && shatterTimeRef.current !== null) {
  const dummy = new THREE.Object3D();  // or reuse existing
  const m = new THREE.Matrix4();
  for (let i = 0; i < sparkCount; i++) {
    const s = sparkData[i];
    if (!s.alive) { m.makeScale(0, 0, 0); sparks.setMatrixAt(i, m); continue; }
    s.life += delta;
    if (s.life >= s.maxLife) {
      s.alive = false;
      m.makeScale(0, 0, 0);
      sparks.setMatrixAt(i, m);
      continue;
    }
    const decay = Math.exp(-s.life * 1.6);
    s.pos.addScaledVector(s.vel, decay * delta);
    s.vel.multiplyScalar(0.985);
    const fade = 1 - s.life / s.maxLife;
    const scl = (0.5 + fade * 0.8) * (0.6 + Math.sin(state.clock.elapsedTime * 60 + i) * 0.4);
    dummy.position.copy(s.pos);
    dummy.scale.setScalar(scl);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    sparks.setMatrixAt(i, dummy.matrix);
  }
  sparks.instanceMatrix.needsUpdate = true;
}
```

**Step 8:** Save, hard-refresh, scroll to shatter. Expected: 80 bright orange points fly outward, fading over ~1.4s. With bloom active, they leave streaks.

**Step 9:** Commit:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "feat(shatter): 80 emissive sparks burst from impact center"
```

---

## Task 6: Dust trails on debris

**Files:**
- Modify: `app/components/CinematicScene3D.tsx` — new `LineSegments` inside `MorphMeshes`.

**Goal:** Each of the 25 existing debris chunks leaves a fading additive-blend dust trail of 10 points behind it.

**Step 1:** Add constants and refs in `MorphMeshes`:
```tsx
const TRAIL_LEN_DESKTOP = 10;
const TRAIL_LEN_MOBILE = 5;
const trailLen = isMobile ? TRAIL_LEN_MOBILE : TRAIL_LEN_DESKTOP;
const trailObjRef = useRef<THREE.LineSegments>(null);
```

**Step 2:** Set up buffers — these reference `debrisData.origins.length` for the count. With useMemo:
```tsx
const debrisCount = debrisData.origins.length; // existing
const trailBuffers = useMemo(() => {
  const positions = new Float32Array(debrisCount * trailLen * 3);
  const colors = new Float32Array(debrisCount * trailLen * 3);
  const history = Array.from({ length: debrisCount }, () =>
    Array.from({ length: trailLen }, () => new THREE.Vector3())
  );
  return { positions, colors, history };
}, [debrisCount, trailLen]);
```

**Step 3:** In JSX:
```tsx
<lineSegments ref={trailObjRef}>
  <bufferGeometry>
    <bufferAttribute attach="attributes-position" args={[trailBuffers.positions, 3]} />
    <bufferAttribute attach="attributes-color" args={[trailBuffers.colors, 3]} />
  </bufferGeometry>
  <lineBasicMaterial
    vertexColors
    transparent
    opacity={0.5}
    blending={THREE.AdditiveBlending}
    depthWrite={false}
  />
</lineSegments>
```

**Step 4:** In `useFrame`, inside the existing debris-active block (around line 970-1011), after updating each debris matrix, also update the trail history:
```tsx
// After setting debris dummy position for piece i:
const hist = trailBuffers.history[i];
for (let j = hist.length - 1; j > 0; j--) hist[j].copy(hist[j - 1]);
hist[0].copy(dummy.position);
```

**Step 5:** After the per-debris loop, rebuild the line-segments buffer:
```tsx
const tShatter = shatterTimeRef.current
  ? (performance.now() - shatterTimeRef.current) / 1000
  : 0;
const trailFade = Math.max(0, 1 - tShatter * 0.5);
for (let i = 0; i < debrisCount; i++) {
  const hist = trailBuffers.history[i];
  for (let j = 0; j < trailLen - 1; j++) {
    const idx = (i * trailLen + j) * 3;
    trailBuffers.positions[idx] = hist[j].x;
    trailBuffers.positions[idx + 1] = hist[j].y;
    trailBuffers.positions[idx + 2] = hist[j].z;
    const fade = 1 - j / (trailLen - 1);
    const a = fade * 0.85 * trailFade;
    trailBuffers.colors[idx] = 0.55 * a;
    trailBuffers.colors[idx + 1] = 0.5 * a;
    trailBuffers.colors[idx + 2] = 0.45 * a;
  }
}
const geom = trailObjRef.current?.geometry as THREE.BufferGeometry | undefined;
if (geom) {
  (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (geom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
}
```

**Step 6:** Save, hard-refresh, scroll to shatter. Expected: debris chunks leave faint, fading dust trails behind them as they fly outward.

**Step 7:** Commit:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "feat(shatter): additive dust trails on debris chunks"
```

---

## Task 7: Sub-shatter

**Files:**
- Modify: `app/components/CinematicScene3D.tsx` — new InstancedMesh inside `MorphMeshes`.

**Goal:** Each of the 25 debris chunks has a chance to split mid-flight (at 0.55-1.05s after impact) into 6 smaller pieces using the same material.

**Step 1:** Add constants and refs:
```tsx
const SUB_DEBRIS_COUNT_DESKTOP = 60;
const SUB_DEBRIS_COUNT_MOBILE = 30;
const subDebrisCount = isMobile ? SUB_DEBRIS_COUNT_MOBILE : SUB_DEBRIS_COUNT_DESKTOP;
const subDebrisRef = useRef<THREE.InstancedMesh>(null);
```

**Step 2:** Per-debris extra state. In `debrisData` useMemo, extend each entry with `splitAt` and `didSplit`:
```tsx
// Inside debrisData useMemo, where each debris entry is built:
{
  ...existing fields...
  splitAt: 0.55 + Math.random() * 0.5,
  didSplit: false,
}
```
Note: `debrisData` is defined at line 705. Check existing shape; add `splitAt` and `didSplit` to the per-piece object (or store separately in a parallel useRef array if `debrisData` is structured differently).

**Step 3:** Define sub-debris data:
```tsx
const subData = useMemo(
  () => Array.from({ length: subDebrisCount }, () => ({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 2,
    alive: false,
    quat: new THREE.Quaternion(),
    rotAxis: new THREE.Vector3(),
    rotSpeed: 0,
  })),
  [subDebrisCount]
);
```

**Step 4:** In JSX (use the same material ref as debris OR a sibling instanced mesh; cleanest: separate instanced mesh that shares the existing debris material):
```tsx
<instancedMesh ref={subDebrisRef} args={[undefined, undefined, subDebrisCount]}>
  <icosahedronGeometry args={[0.07, 0]} />
  {/* Reuse the existing debris material — no new color, no new style */}
  <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.1} />
</instancedMesh>
```
(Or attach a ref to the existing `debrisMatRef` material and share it via JSX — simpler to declare a separate material with same params.)

**Step 5:** Spawn helper:
```tsx
const spawnSubDebris = useCallback((originPos: THREE.Vector3, originVel: THREE.Vector3) => {
  let placed = 0;
  for (let i = 0; i < subDebrisCount && placed < 6; i++) {
    const s = subData[i];
    if (s.alive) continue;
    const dir = new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize();
    s.pos.copy(originPos);
    s.vel.copy(originVel).multiplyScalar(0.5).add(dir.multiplyScalar(1.8 + Math.random()*1.6));
    s.life = 0;
    s.maxLife = 1.2 + Math.random() * 0.8;
    s.rotAxis.set(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1).normalize();
    s.rotSpeed = 3 + Math.random() * 6;
    s.quat.identity();
    s.alive = true;
    placed++;
  }
  if (subDebrisRef.current) subDebrisRef.current.count = subDebrisCount;
}, [subDebrisCount, subData]);
```

**Step 6:** In the existing per-debris update loop (inside the debris-active block in `useFrame`), after computing the new position, check for split:
```tsx
if (!debrisData[i].didSplit && shatterTimeRef.current !== null) {
  const tShatter = (performance.now() - shatterTimeRef.current) / 1000;
  if (tShatter > debrisData[i].splitAt && Math.random() < 0.7) {
    debrisData[i].didSplit = true;
    spawnSubDebris(dummy.position, /* velocity vector for piece i */);
    debrisData[i].scale *= 0.55;  // parent shrinks
  }
}
```

**Step 7:** In `useFrame`, after debris loop, add sub-debris update:
```tsx
const subMesh = subDebrisRef.current;
if (subMesh) {
  const dummy = new THREE.Object3D();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < subDebrisCount; i++) {
    const s = subData[i];
    if (!s.alive) { m.makeScale(0,0,0); subMesh.setMatrixAt(i, m); continue; }
    s.life += delta;
    if (s.life >= s.maxLife) { s.alive = false; m.makeScale(0,0,0); subMesh.setMatrixAt(i, m); continue; }
    const decay = Math.exp(-s.life * 0.8);
    s.pos.addScaledVector(s.vel, decay * delta);
    q.setFromAxisAngle(s.rotAxis, s.rotSpeed * delta);
    s.quat.multiplyQuaternions(q, s.quat);
    const fade = 1 - s.life / s.maxLife;
    const sc = 0.7 * Math.pow(fade, 0.6);
    dummy.position.copy(s.pos);
    dummy.quaternion.copy(s.quat);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    subMesh.setMatrixAt(i, dummy.matrix);
  }
  subMesh.instanceMatrix.needsUpdate = true;
}
```

**Step 8:** In reset block (scroll-back), reset all sub-debris and `didSplit` flags:
```tsx
if (lastP >= 0.22 && p < 0.22) {
  // ...existing resets...
  subData.forEach(s => s.alive = false);
  if (subDebrisRef.current) subDebrisRef.current.count = 0;
  debrisData.forEach(d => { d.didSplit = false; });
}
```

**Step 9:** Save, hard-refresh, scroll to shatter. Expected: at 0.55-1.05s after impact, debris chunks visibly split into smaller pieces (you should see ~6 small icosa appear from each chunk that splits).

**Step 10:** Commit:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "feat(shatter): sub-shatter — debris chunks split mid-flight"
```

---

## Task 8: Mobile verification + tweaks

**Files:** none modified unless something breaks.

**Step 1:** Open Chrome DevTools, switch to iPhone 12 viewport. Hard-refresh `http://localhost:3000/ro`. Scroll through hero.

**Step 2:** Check each effect:
- Halo: should be visible (zero perf cost)
- Flash: should fire (DOM)
- Camera shake: should fire (math only)
- Bloom spike: skip (Bloom is desktop-only)
- Sparks: 30 instead of 80, should fire
- Dust trails: TRAIL_LEN=5 instead of 10, should fire
- Sub-shatter: 30 sub-pieces, should fire

**Step 3:** Watch FPS. If <40, reduce counts further (sparks 20, sub-debris 20).

**Step 4:** If anything is broken on mobile, fix in-place.

**Step 5:** Commit any fixes:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "perf(shatter): mobile-specific count reductions"
```

---

## Task 9: Cleanup verification

**Files:** none modified unless leaks found.

**Step 1:** In dev tools, open Performance / Memory tab. Navigate to home (`/ro`), then to `/projects`, back to `/ro`. Repeat 3 times.

**Step 2:** Check that geometry/material counts don't grow unbounded. Three.js objects from `MorphMeshes` should be GC'd on unmount.

**Step 3:** If leaks found, add explicit `.dispose()` calls in a `useEffect` cleanup inside `MorphMeshes`. Otherwise no action.

**Step 4:** If any disposes added:
```bash
git add app/components/CinematicScene3D.tsx
git commit -m "chore(shatter): explicit dispose on unmount for new resources"
```

---

## Task 10: Final review + merge prep

**Step 1:** Run typecheck:
```bash
npx tsc --noEmit
```
Expected: zero errors.

**Step 2:** Run lint:
```bash
npm run lint
```
Expected: zero new warnings.

**Step 3:** Build:
```bash
npm run build
```
Expected: clean build, no Three.js-related warnings about disposal or memory.

**Step 4:** Final visual review — desktop + mobile, scroll through home page slowly, verify all 6 effects play in sequence:
1. Halo pulses 0.16 → 0.22
2. Flash + bloom spike + camera shake at 0.22
3. Sparks burst out
4. Debris with dust trails fly out
5. Sub-shatter splits chunks at 0.55-1.05s after impact
6. Everything continues into the existing CC-formation phase smoothly

**Step 5:** When happy, ask user whether to merge to main or open PR.

---

## Notes for the executing engineer

- **DO NOT touch the asteroid's material.** It is `MeshStandardMaterial` at `color="#0a0a0a"`, `roughness=0.9`, `metalness=0.1`, no textures. Leave it. User specifically asked for this constraint.
- **All new resources are additions, not replacements.** The existing 100 fragments → CC letters, 25 debris, energy ring, dust sphere — all stay untouched.
- **The trigger threshold is `p >= 0.22`.** This matches the existing debris-active window start.
- **`progressRef` is a number ref, not state.** Read in `useFrame` only. Don't trigger re-renders from it.
- **Reset on scroll-back is critical.** If the user scrolls back above section 2, we must reset spawned things, otherwise re-scrolling forward won't re-trigger correctly.
- **Visual validation only.** Don't write Jest tests for these effects. Open the browser, watch the shatter, judge by eye.

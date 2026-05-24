# Asteroid Shatter — efecte „wow" suplimentare

**Data:** 2026-05-24
**Țintă:** `app/components/CinematicScene3D.tsx`
**Constrângere strictă:** Nu se modifică `asteroidMat` (rămâne `MeshStandardMaterial` cu `color="#0a0a0a"`, `roughness=0.9`, `metalness=0.1`, fără hărți).

---

## Obiectiv

Spargerea actuală (scroll-driven, declanșată la `progressRef ≈ 0.22`) e curată dar previzibilă: 100 fragmente + 25 debris + inel de undă + sferă de praf. Adăugăm 6 efecte aditive (toate ca obiecte separate sau parametri de scenă) care transformă momentul impactului din „nice 3D" în „cinematic real".

Validat vizual cu preview-ul standalone de la `/preview/asteroid`. Userul a aprobat direcția, cu condiția să nu atingem materialul asteroidului.

---

## Cele 6 efecte (toate aditive, scroll-driven)

### 1. Halo extern pre-impact (înlocuiește crack-glow-ul din preview)
- **Ce:** Sferă transparentă R≈1.32 (puțin mai mare decât asteroidul de R≈1.2), `MeshBasicMaterial` cu `color="#ff6a2a"`, `transparent=true`, `blending: AdditiveBlending`, `depthWrite=false`.
- **Când:** Apare în window-ul `p ∈ [0.16, 0.22]` (cu ~0.06 înainte de momentul shatter).
- **Cum se animă:** `opacity` pulsează `0 → 0.55` cu sinus, `scale` ușor `1.0 → 1.06`. Plus un `PointLight` portocaliu (`#ff6a2a`, intensity 0 → 2) co-locat cu asteroidul ca să arunce lumina caldă pe scenă.
- **Iese:** la `p > 0.22`, opacity → 0 instantaneu (momentul shatter ascunde asteroidul, deci halo-ul nu mai are sens).

### 2. Flash overlay alb
- **Ce:** `<div>` full-screen `position: fixed`, `background: white`, `pointer-events: none`, z-index sub UI dar peste canvas.
- **Când:** Declanșat o singură dată când `progressRef` traversează 0.22 (`if (lastP < 0.22 && p >= 0.22)`).
- **Cum se animă:** `element.animate([{opacity: 0.95}, {opacity: 0}], { duration: 380, easing: 'cubic-bezier(0.16,1,0.3,1)' })`. Web Animations API; nu reține state.
- **Note:** Trebuie tras în React (ref pe div). Refacem pe replay dacă userul scroll-ează înapoi → tracking simplu cu `lastProgressRef`.

### 3. Camera shake time-decayed
- **Ce:** Offset random aplicat pe `camera.position` 500ms după momentul shatter.
- **Trigger:** la fel ca flash-ul — când `progressRef` traversează 0.22, capturăm `shatterTime = performance.now()`.
- **Cum se animă:** În `useFrame`, calculăm `elapsed = (now - shatterTime) / 1000`. Dacă `elapsed < 0.5`, adunăm la `camera.position`:
  ```
  decay = (1 - elapsed/0.5)^2
  offset = (rand(-1,1), rand(-1,1), rand(-1,1)*0.4) * 0.08 * decay
  ```
- **Compatibilitate cu camera dolly existentă:** Shake-ul se adună PESTE lerp-ul actual (`z: 5 → 6.5 → 4.5`). Adăugăm offset-ul după lerp-ul final.

### 4. Bloom spike
- **Ce:** Bump pe `Bloom.intensity` de la baseline 0.55 → 2.4, apoi damp înapoi.
- **Trigger:** la `progressRef >= 0.22`, setăm `bloomTargetRef.current = 2.4`.
- **Recovery:** În `useFrame`, `bloomRef.current.intensity = damp(current, 0.55, 1.8, dt)`. Atinge baseline în ~0.8s.
- **Acces la pass-ul Bloom:** Setăm ref pe `<Bloom>` din `<EffectComposer>`. Verificat că `@react-three/postprocessing` expune `intensity` direct mutabil.

### 5. Scântei (sparks)
- **Ce:** `InstancedMesh` separat de 80 sfere mici (R=0.025, low-poly 6×6 segmente), `MeshBasicMaterial` `color="#ffaa55"`, `transparent=true`. Singura categorie cu material emissive vizibil — culoarea + bloom-ul fac luminozitatea.
- **Lifecycle:** Spawn la `p >= 0.22`. Fiecare spark are `pos`, `vel`, `life`, `maxLife (0.6-1.4s)`. Update în `useFrame`:
  - `vel *= 0.985` pe frame (drag)
  - `pos += vel * decay * dt` (decay = `exp(-life * 1.6)`)
  - Scale modulat `(0.5 + fade*0.8) * (0.6 + sin(t*60+i)*0.4)` — flicker subtil
  - Când `life > maxLife`, scale → 0 (hidden via matrix)
- **Window de spawn:** O singură dată la trigger. Lifetime maxim 1.4s; după aceea, toate moarte. Pe reset (scroll înapoi sub 0.22), resetăm `count = 0` și `alive = false` pe toate.

### 6. Dust trails pe debris
- **Ce:** `LineSegments` cu vertex colors, `LineBasicMaterial` `vertexColors=true`, `blending: AdditiveBlending`, `transparent=true`, `opacity=0.5`, `depthWrite=false`.
- **Buffer:** `DEBRIS_COUNT (25) × TRAIL_LEN (10) × 3` floats pentru poziții. La fel pentru culori.
- **Update:** Pentru fiecare debris alive, shift history buffer (push poziția curentă în slot 0, ceilalți shiftează la index+1). Buffer-ul de segmente se scrie ca pairs (j, j+1) cu culoare gradient fade `(1 - j/TRAIL_LEN)`.
- **Culoare:** Praf gri-cald `(0.55, 0.5, 0.45) * alpha`. Alpha scade global cu `max(0, 1 - timeSinceShatter * 0.5)`.

### 7. Sub-shatter
- **Ce:** Al doilea `InstancedMesh` de 60 piese mici (`IcosahedronGeometry(0.07, 0)`), folosește același `debrisMat` (același material ca debris-ul existent, deci nu introducem un al doilea material).
- **Trigger per piece:** Fiecare din cele 25 debris-uri „decide" pe `splitAt = 0.55 + random()*0.5` (relativ la `timeSinceShatter`) să se sub-spargă, cu probabilitate 0.7. Când se întâmplă, spawnăm 6 sub-piese cu poziția părintelui, viteza părintelui × 0.5 + direcție random, lifetime 1.2-2.0s. Scale-ul părintelui se reduce cu ×0.55.
- **Update:** Sub-piesele rotesc independent, decay 0.8/s, scale fade `0.7 * pow((1-life/max), 0.6)`.

---

## Integrare cu scroll-progress existent

Toate efectele se atașează la sistemul existent în `CinematicScene3D.tsx`:

```
const lastProgressRef = useRef(0);
const shatterTimeRef = useRef<number | null>(null);
const sparksAliveRef = useRef(false);
// ...

useFrame((state, dt) => {
  const p = progressRef.current; // existing
  const lastP = lastProgressRef.current;

  // Trigger detect — only forward direction
  if (lastP < 0.22 && p >= 0.22) {
    shatterTimeRef.current = performance.now();
    bloomTargetRef.current = 2.4;
    flashElRef.current?.animate(...);
    spawnSparks();
    sparksAliveRef.current = true;
  }
  // Reset detect — scroll back below threshold
  if (lastP >= 0.22 && p < 0.22) {
    shatterTimeRef.current = null;
    sparks.count = 0;
    subDebris.count = 0;
    sparksAliveRef.current = false;
  }
  lastProgressRef.current = p;

  // Camera shake (after existing dolly lerp)
  if (shatterTimeRef.current !== null) {
    const elapsed = (performance.now() - shatterTimeRef.current) / 1000;
    if (elapsed < 0.5) {
      const decay = Math.pow(1 - elapsed/0.5, 2);
      camera.position.x += (Math.random()*2-1) * 0.08 * decay;
      camera.position.y += (Math.random()*2-1) * 0.08 * decay;
      camera.position.z += (Math.random()*2-1) * 0.032 * decay;
    }
  }

  // Halo pre-impact — opacity bound to p
  if (p >= 0.16 && p < 0.22) {
    const halo_p = (p - 0.16) / 0.06; // 0→1
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 12);
    haloMat.opacity = halo_p * (0.4 + pulse * 0.15);
    haloLight.intensity = halo_p * (1.5 + pulse * 0.5);
    halo.scale.setScalar(1 + halo_p * 0.06);
    halo.visible = true;
  } else {
    halo.visible = false;
  }

  // Sparks, sub-debris, trails updated only while alive
  if (sparksAliveRef.current) {
    updateSparks(dt);
    updateSubDebris(dt);
    updateTrails(dt);
  }

  // Bloom recovery
  if (bloomRef.current) {
    bloomRef.current.intensity = damp(bloomRef.current.intensity, 0.55, 1.8, dt);
  }
});
```

---

## Considerații mobil

Constrângere proiect: paritate mobil obligatorie. Setup mobil actual: `dpr=1`, `Bloom` dezactivat, fără `Stars`.

- **Halo pre-impact** → activ și pe mobil (1 mesh + 1 light, neglijabil)
- **Flash overlay** → DOM, gratis
- **Camera shake** → activ și pe mobil (doar math)
- **Bloom spike** → dezactivat pe mobil (nu există Bloom acolo); userul nu va vedea spike-ul, dar nici nu va observa lipsa
- **Sparks** → reducem la 30 pe mobil (vs 80 desktop)
- **Dust trails** → reducem `TRAIL_LEN` de la 10 la 5 pe mobil
- **Sub-shatter** → reducem la 30 sub-pieces total (vs 60)

Performance budget: target 50+ fps pe mid-range mobile (iPhone 12 / Pixel 6).

---

## Ce NU se schimbă

- `asteroidMat`: zero modificări
- Inelul de undă existent (`Energy pulse ring`): rămâne, încă merge cu noile efecte
- Sfera de praf existentă (`Dust shockwave`): rămâne
- Cele 100 fragmente cu trajectorie spre litere CC: rămân, nu interferează
- Cele 25 debris-uri rocky: rămân, dar primesc trail-uri (efect aditiv pe ele)
- Camera dolly scroll-driven: rămâne, shake-ul se adună peste

---

## Lifecycle resources

Toate noile resurse Three.js (`InstancedMesh`-uri, `BufferGeometry`-uri, materiale, lights) trebuie dispuse în cleanup-ul `useEffect` existent / `onBeforeUnmount`. Pattern: ținem ref-uri și apelăm `.dispose()` pe geometries + materials la unmount.

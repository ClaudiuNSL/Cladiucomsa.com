"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export default function AsteroidShatterPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const stageTitleRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const triggerFnRef = useRef<() => void>(() => {});
  const replayFnRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ---------- Scene ----------
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 7, 18);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ---------- Lights ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2); keyLight.position.set(8, 2, -4); scene.add(keyLight);
    const rim = new THREE.DirectionalLight(0x556070, 0.25); rim.position.set(-7, 2, -5); scene.add(rim);
    const fill = new THREE.DirectionalLight(0x9aa0b0, 0.2); fill.position.set(0, -4, 4); scene.add(fill);
    scene.add(new THREE.HemisphereLight(0x1a2030, 0x050505, 0.25));
    const warmBack = new THREE.PointLight(0xfff0d8, 4, 12); warmBack.position.set(5, 1.5, -3); scene.add(warmBack);
    const crackLight = new THREE.PointLight(0xff6a2a, 0, 4); scene.add(crackLight);

    // ---------- Stars ----------
    const starsGeo = new THREE.BufferGeometry();
    const N = 1800;
    const starArr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 14 + Math.random() * 24;
      const phi = Math.acos(2 * Math.random() - 1);
      const th = 2 * Math.PI * Math.random();
      starArr[i * 3] = r * Math.sin(phi) * Math.cos(th);
      starArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(th);
      starArr[i * 3 + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starArr, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.03, color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
    const stars = new THREE.Points(starsGeo, starMat);
    scene.add(stars);

    // ---------- Noise ----------
    function hash2(x: number, y: number) { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }
    function vnoise(x: number, y: number) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const n00 = hash2(xi, yi), n10 = hash2(xi + 1, yi), n01 = hash2(xi, yi + 1), n11 = hash2(xi + 1, yi + 1);
      return n00 * (1 - u) * (1 - v) + n10 * u * (1 - v) + n01 * (1 - u) * v + n11 * u * v;
    }
    function fbm(x: number, y: number, oct = 5) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += vnoise(x * f, y * f) * a; a *= 0.5; f *= 2; } return v; }
    function ridge(x: number, y: number, oct = 4) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += (1 - Math.abs(vnoise(x * f, y * f) * 2 - 1)) * a; a *= 0.5; f *= 2; } return v; }

    function makeCanvasTex(size: number, fn: (u: number, v: number) => { r: number; g: number; b: number }) {
      const c = document.createElement("canvas"); c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const img = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const v = fn(x / size, y / size);
          img.data[i] = v.r | 0;
          img.data[i + 1] = v.g | 0;
          img.data[i + 2] = v.b | 0;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.NoColorSpace;
      return tex;
    }

    const diffuseTex = makeCanvasTex(512, (u, v) => {
      const n = fbm(u * 6, v * 6, 5);
      const r2 = ridge(u * 4, v * 4, 3);
      const base = 36 + n * 38 + r2 * 12;
      return { r: base, g: base * 0.95, b: base * 0.88 };
    });
    diffuseTex.colorSpace = THREE.SRGBColorSpace;

    const roughnessTex = makeCanvasTex(512, (u, v) => {
      const n = fbm(u * 10, v * 10, 4);
      const r = 200 + n * 50;
      return { r, g: r, b: r };
    });

    const crackTex = makeCanvasTex(512, (u, v) => {
      const r = ridge(u * 5, v * 5, 4);
      const c = r > 0.86 ? 255 * Math.pow((r - 0.86) / 0.14, 2) : 0;
      return { r: c, g: c * 0.35, b: c * 0.08 };
    });

    // ---------- Asteroid ----------
    const asteroidGeo = new THREE.IcosahedronGeometry(1.2, 5);
    {
      const pos = asteroidGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const len = Math.hypot(x, y, z);
        const nx = x / len, ny = y / len, nz = z / len;
        const u = 0.5 + Math.atan2(nz, nx) / (2 * Math.PI);
        const v = 0.5 - Math.asin(ny) / Math.PI;
        const d = fbm(u * 5, v * 5, 5) * 0.22 + ridge(u * 3, v * 3, 3) * 0.06 - 0.08;
        pos.setXYZ(i, x + nx * d, y + ny * d, z + nz * d);
      }
      asteroidGeo.computeVertexNormals();
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const len = Math.hypot(x, y, z);
        uvs[i * 2] = 0.5 + Math.atan2(z / len, x / len) / (2 * Math.PI);
        uvs[i * 2 + 1] = 0.5 - Math.asin(y / len) / Math.PI;
      }
      asteroidGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
    const asteroidMat = new THREE.MeshStandardMaterial({
      map: diffuseTex,
      roughnessMap: roughnessTex,
      roughness: 0.95,
      metalness: 0.04,
      emissiveMap: crackTex,
      emissive: new THREE.Color(0xff6a2a),
      emissiveIntensity: 0,
    });
    const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
    scene.add(asteroid);

    // ---------- Debris ----------
    const DEBRIS_COUNT = 28;
    const debrisGeo = new THREE.IcosahedronGeometry(0.18, 1);
    {
      const pos = debrisGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const d = (vnoise(x * 4 + 5, y * 4 + 5) - 0.5) * 0.12;
        pos.setXYZ(i, x * (1 + d), y * (1 + d), z * (1 + d));
      }
      debrisGeo.computeVertexNormals();
    }
    const debrisMat = new THREE.MeshStandardMaterial({ map: diffuseTex, roughnessMap: roughnessTex, roughness: 0.92, metalness: 0.05 });
    const debris = new THREE.InstancedMesh(debrisGeo, debrisMat, DEBRIS_COUNT);
    debris.count = 0;
    scene.add(debris);

    type DebrisDatum = {
      dir: THREE.Vector3; pos: THREE.Vector3; rotAxis: THREE.Vector3; rotSpeed: number;
      speed: number; scale: number; quat: THREE.Quaternion; alive: boolean; splitAt: number; didSplit: boolean;
    };
    const debrisData: DebrisDatum[] = [];
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      debrisData.push({ dir: new THREE.Vector3(), pos: new THREE.Vector3(), rotAxis: new THREE.Vector3(),
        rotSpeed: 0, speed: 0, scale: 1, quat: new THREE.Quaternion(), alive: false, splitAt: 0, didSplit: false });
    }

    // ---------- Sparks ----------
    const SPARK_COUNT = 80;
    const sparkGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 1 });
    const sparks = new THREE.InstancedMesh(sparkGeo, sparkMat, SPARK_COUNT);
    sparks.count = 0;
    scene.add(sparks);
    type SparkDatum = { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; alive: boolean };
    const sparkData: SparkDatum[] = [];
    for (let i = 0; i < SPARK_COUNT; i++) {
      sparkData.push({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 1, alive: false });
    }

    // ---------- Sub-debris ----------
    const SUB_DEBRIS_COUNT = 60;
    const subDebrisGeo = new THREE.IcosahedronGeometry(0.07, 0);
    const subDebris = new THREE.InstancedMesh(subDebrisGeo, debrisMat, SUB_DEBRIS_COUNT);
    subDebris.count = 0;
    scene.add(subDebris);
    type SubDatum = { pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; alive: boolean;
      quat: THREE.Quaternion; rotAxis: THREE.Vector3; rotSpeed: number };
    const subData: SubDatum[] = [];
    for (let i = 0; i < SUB_DEBRIS_COUNT; i++) {
      subData.push({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 2, alive: false,
        quat: new THREE.Quaternion(), rotAxis: new THREE.Vector3(), rotSpeed: 0 });
    }

    // ---------- Dust trails ----------
    const TRAIL_LEN = 10;
    const trailPositions = new Float32Array(DEBRIS_COUNT * TRAIL_LEN * 3);
    const trailColors = new Float32Array(DEBRIS_COUNT * TRAIL_LEN * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));
    const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const trailHistory: THREE.Vector3[][] = Array.from({ length: DEBRIS_COUNT }, () =>
      Array.from({ length: TRAIL_LEN }, () => new THREE.Vector3()));
    const trailObj = new THREE.LineSegments(trailGeo, trailMat);
    scene.add(trailObj);

    // ---------- Shockwave ----------
    const shockGeo = new THREE.RingGeometry(0.7, 0.8, 64);
    const shockMat = new THREE.MeshBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    scene.add(shock);

    // ---------- Post ----------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.55, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // ---------- State ----------
    const STAGE = { IDLE: 0, CHARGING: 1, IMPACT: 2, EXPLODE: 3, COOLDOWN: 4 } as const;
    let stage: number = STAGE.IDLE;
    let stageT = 0;
    let timeSinceShatter = 0;

    const setStage = (s: number, name: string) => {
      stage = s; stageT = 0;
      if (stageTitleRef.current) stageTitleRef.current.textContent = name;
    };

    const trigger = () => {
      if (stage !== STAGE.IDLE && stage !== STAGE.COOLDOWN) return;
      setStage(STAGE.CHARGING, "01 — Crack glow building");
    };
    triggerFnRef.current = trigger;

    const replay = () => {
      asteroid.visible = true;
      asteroidMat.emissiveIntensity = 0;
      asteroid.scale.set(1, 1, 1);
      debris.count = 0;
      subDebris.count = 0;
      sparks.count = 0;
      for (const s of subData) s.alive = false;
      for (const s of sparkData) s.alive = false;
      for (const d of debrisData) d.alive = false;
      shockMat.opacity = 0;
      crackLight.intensity = 0;
      timeSinceShatter = 0;
      bloom.strength = 0.6;
      setStage(STAGE.IDLE, "Idle — rotating");
    };
    replayFnRef.current = replay;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); trigger(); }
      else if (e.code === "KeyR") { replay(); }
    };
    window.addEventListener("keydown", onKey);

    // ---------- Helpers ----------
    const _m = new THREE.Matrix4();
    const _q = new THREE.Quaternion();
    const _v = new THREE.Vector3();

    function shakeOffset(time: number) {
      const decay = Math.max(0, 1 - time / 0.5);
      const intensity = decay * decay * 0.08;
      return new THREE.Vector3(
        (Math.random() * 2 - 1) * intensity,
        (Math.random() * 2 - 1) * intensity,
        (Math.random() * 2 - 1) * intensity * 0.4,
      );
    }

    function spawnShatter() {
      if (flashRef.current) {
        flashRef.current.animate(
          [{ opacity: 0.95 }, { opacity: 0 }],
          { duration: 380, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
        );
      }
      bloom.strength = 2.4;
      for (let i = 0; i < DEBRIS_COUNT; i++) {
        const d = debrisData[i];
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        d.dir.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi));
        d.pos.copy(d.dir).multiplyScalar(1.1);
        d.speed = 2.2 + Math.random() * 2.6;
        d.scale = 0.6 + Math.random() * 1.0;
        d.rotAxis.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        d.rotSpeed = 1.5 + Math.random() * 5;
        d.quat.identity();
        d.alive = true;
        d.didSplit = false;
        d.splitAt = 0.55 + Math.random() * 0.5;
        for (let j = 0; j < TRAIL_LEN; j++) trailHistory[i][j].copy(d.pos);
      }
      debris.count = DEBRIS_COUNT;

      for (let i = 0; i < SPARK_COUNT; i++) {
        const s = sparkData[i];
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        s.pos.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(0.9 + Math.random() * 0.4);
        s.vel.copy(s.pos).normalize().multiplyScalar(4 + Math.random() * 8);
        s.vel.x += (Math.random() - 0.5) * 1.5;
        s.vel.y += (Math.random() - 0.5) * 1.5;
        s.life = 0;
        s.maxLife = 0.6 + Math.random() * 0.8;
        s.alive = true;
      }
      sparks.count = SPARK_COUNT;

      shockMat.opacity = 0.9;
      shock.scale.set(0.5, 0.5, 0.5);
      shock.lookAt(camera.position);

      asteroid.visible = false;
      asteroidMat.emissiveIntensity = 0;
      crackLight.intensity = 0;
    }

    function spawnSubDebris(originPos: THREE.Vector3, originVel: THREE.Vector3) {
      let placed = 0;
      for (let i = 0; i < SUB_DEBRIS_COUNT && placed < 6; i++) {
        const s = subData[i];
        if (s.alive) continue;
        const dir = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        s.pos.copy(originPos);
        s.vel.copy(originVel).multiplyScalar(0.5).add(dir.multiplyScalar(1.8 + Math.random() * 1.6));
        s.life = 0;
        s.maxLife = 1.2 + Math.random() * 0.8;
        s.rotAxis.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        s.rotSpeed = 3 + Math.random() * 6;
        s.quat.identity();
        s.alive = true;
        placed++;
      }
      subDebris.count = SUB_DEBRIS_COUNT;
    }

    // ---------- Loop ----------
    const clock = new THREE.Clock();
    let lastFpsT = 0, frames = 0;
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 1 / 30);
      const t = clock.elapsedTime;

      frames++;
      if (t - lastFpsT > 0.5) {
        if (fpsRef.current) fpsRef.current.textContent = Math.round(frames / (t - lastFpsT)) + " fps";
        frames = 0; lastFpsT = t;
      }

      if (asteroid.visible) {
        asteroid.rotation.y += dt * 0.18;
        asteroid.rotation.x += dt * 0.04;
      }

      stageT += dt;

      if (stage === STAGE.IDLE) {
        asteroidMat.emissiveIntensity = 0;
        crackLight.intensity = 0;
      } else if (stage === STAGE.CHARGING) {
        const p = Math.min(stageT / 0.9, 1);
        const pulse = 0.5 + 0.5 * Math.sin(t * 12);
        asteroidMat.emissiveIntensity = p * (1.2 + pulse * 0.8);
        crackLight.intensity = p * 1.6 * (0.7 + pulse * 0.3);
        asteroid.scale.setScalar(1 + p * 0.04 + pulse * 0.005);
        if (stageT > 0.9) {
          setStage(STAGE.IMPACT, "02 — Impact flash + camera shake");
          spawnShatter();
          timeSinceShatter = 0;
        }
      } else if (stage === STAGE.IMPACT) {
        if (stageT > 0.12) setStage(STAGE.EXPLODE, "03 — Debris + sparks + dust + sub-shatter");
      } else if (stage === STAGE.EXPLODE) {
        if (stageT > 2.6) setStage(STAGE.COOLDOWN, "04 — Press R or Replay");
      }

      if (stage === STAGE.IMPACT || stage === STAGE.EXPLODE || stage === STAGE.COOLDOWN) {
        timeSinceShatter += dt;
        for (let i = 0; i < DEBRIS_COUNT; i++) {
          const d = debrisData[i];
          if (!d.alive) { _m.makeScale(0, 0, 0); debris.setMatrixAt(i, _m); continue; }
          const decay = Math.exp(-timeSinceShatter * 0.55);
          d.pos.add(_v.copy(d.dir).multiplyScalar(d.speed * decay * dt));
          _q.setFromAxisAngle(d.rotAxis, d.rotSpeed * dt);
          d.quat.multiplyQuaternions(_q, d.quat);
          const s = d.scale * Math.max(0, 1 - Math.max(0, timeSinceShatter - 2) * 0.8);
          _m.compose(d.pos, d.quat, _v.set(s, s, s));
          debris.setMatrixAt(i, _m);
          if (!d.didSplit && timeSinceShatter > d.splitAt && Math.random() < 0.7) {
            d.didSplit = true;
            spawnSubDebris(d.pos, _v.copy(d.dir).multiplyScalar(d.speed * decay));
            d.scale *= 0.55;
          }
          const hist = trailHistory[i];
          for (let j = hist.length - 1; j > 0; j--) hist[j].copy(hist[j - 1]);
          hist[0].copy(d.pos);
          for (let j = 0; j < TRAIL_LEN - 1; j++) {
            const idx = (i * TRAIL_LEN + j) * 3;
            trailPositions[idx] = hist[j].x;
            trailPositions[idx + 1] = hist[j].y;
            trailPositions[idx + 2] = hist[j].z;
            const fade = 1 - (j / (TRAIL_LEN - 1));
            const a = fade * 0.85 * Math.max(0, 1 - timeSinceShatter * 0.5);
            trailColors[idx] = 0.55 * a;
            trailColors[idx + 1] = 0.5 * a;
            trailColors[idx + 2] = 0.45 * a;
          }
        }
        debris.instanceMatrix.needsUpdate = true;
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.color.needsUpdate = true;

        for (let i = 0; i < SUB_DEBRIS_COUNT; i++) {
          const s = subData[i];
          if (!s.alive) { _m.makeScale(0, 0, 0); subDebris.setMatrixAt(i, _m); continue; }
          s.life += dt;
          if (s.life >= s.maxLife) { s.alive = false; _m.makeScale(0, 0, 0); subDebris.setMatrixAt(i, _m); continue; }
          const decay = Math.exp(-s.life * 0.8);
          s.pos.add(_v.copy(s.vel).multiplyScalar(decay * dt));
          _q.setFromAxisAngle(s.rotAxis, s.rotSpeed * dt);
          s.quat.multiplyQuaternions(_q, s.quat);
          const fade = 1 - s.life / s.maxLife;
          const sc = 0.7 * Math.pow(fade, 0.6);
          _m.compose(s.pos, s.quat, _v.set(sc, sc, sc));
          subDebris.setMatrixAt(i, _m);
        }
        subDebris.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < SPARK_COUNT; i++) {
          const s = sparkData[i];
          if (!s.alive) { _m.makeScale(0, 0, 0); sparks.setMatrixAt(i, _m); continue; }
          s.life += dt;
          if (s.life >= s.maxLife) { s.alive = false; _m.makeScale(0, 0, 0); sparks.setMatrixAt(i, _m); continue; }
          const decay = Math.exp(-s.life * 1.6);
          s.pos.add(_v.copy(s.vel).multiplyScalar(decay * dt));
          s.vel.multiplyScalar(0.985);
          const fade = 1 - s.life / s.maxLife;
          const scl = (0.5 + fade * 0.8) * (0.6 + Math.sin(t * 60 + i) * 0.4);
          _m.compose(s.pos, _q.identity(), _v.set(scl, scl, scl));
          sparks.setMatrixAt(i, _m);
        }
        sparks.instanceMatrix.needsUpdate = true;

        if (shockMat.opacity > 0.001) {
          shock.scale.multiplyScalar(1 + dt * 4.5);
          shockMat.opacity = Math.max(0, shockMat.opacity - dt * 1.4);
          shock.lookAt(camera.position);
        }

        bloom.strength = THREE.MathUtils.damp(bloom.strength, 0.6, 1.8, dt);
      }

      const baseCam = new THREE.Vector3(0, 0, 6);
      if (stage === STAGE.CHARGING) {
        baseCam.z = 6 - Math.min(stageT / 0.9, 1) * 0.4;
      } else if (stage === STAGE.IMPACT || stage === STAGE.EXPLODE) {
        const p = Math.min(timeSinceShatter / 1.2, 1);
        baseCam.z = 5.6 + p * 1.0;
      } else if (stage === STAGE.COOLDOWN) {
        baseCam.z = 6.6;
      }
      if (timeSinceShatter > 0 && timeSinceShatter < 0.5 && stage !== STAGE.IDLE) {
        baseCam.add(shakeOffset(timeSinceShatter));
      }
      camera.position.lerp(baseCam, 1 - Math.exp(-dt * 8));
      camera.lookAt(0, 0, 0);

      composer.render();
    };
    animate();
    setReady(true);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      bloom.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      diffuseTex.dispose(); roughnessTex.dispose(); crackTex.dispose();
      asteroidGeo.dispose(); asteroidMat.dispose();
      debrisGeo.dispose(); debrisMat.dispose(); debris.dispose();
      subDebrisGeo.dispose(); subDebris.dispose();
      sparkGeo.dispose(); sparkMat.dispose(); sparks.dispose();
      starsGeo.dispose(); starMat.dispose();
      trailGeo.dispose(); trailMat.dispose();
      shockGeo.dispose(); shockMat.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] text-white overflow-hidden font-sans">
      <canvas ref={canvasRef} className="fixed inset-0 block" />

      <div className="pointer-events-none fixed inset-0 z-[4]"
           style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />

      <div ref={flashRef} className="pointer-events-none fixed inset-0 z-[5] bg-white opacity-0" />

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-7 md:p-8">
        <div className="flex justify-between items-start gap-6">
          <div className="flex items-center gap-2.5 text-[11px] tracking-[0.32em] uppercase text-white/55">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            Asteroid Shatter Preview / Claudiu Comșa
          </div>
          <div ref={fpsRef}
               className="border border-white/10 px-3.5 py-2 rounded-full text-[11px] tracking-[0.24em] uppercase text-white/55 backdrop-blur-sm bg-black/20">
            {ready ? "60 fps" : "loading…"}
          </div>
        </div>
        <div className="flex justify-between items-end gap-6">
          <div className="border border-white/10 px-4.5 py-3.5 rounded backdrop-blur-sm bg-black/35 min-w-[260px]"
               style={{ padding: "14px 18px" }}>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/55 mb-1.5">Stage</div>
            <div ref={stageTitleRef} className="text-xl font-medium tracking-tight">Idle — rotating</div>
          </div>
          <div className="flex gap-3 pointer-events-auto items-center">
            <span className="text-white/55 text-[11px] tracking-[0.24em] uppercase">
              Press <b className="text-white">Space</b> or
            </span>
            <button
              onClick={() => triggerFnRef.current?.()}
              className="bg-white text-[#050505] border border-white px-5 py-3.5 text-xs tracking-[0.28em] uppercase rounded cursor-pointer transition hover:bg-white/90 hover:-translate-y-px">
              Trigger Shatter
            </button>
            <button
              onClick={() => replayFnRef.current?.()}
              className="bg-white/5 text-white border border-white/10 px-5 py-3.5 text-xs tracking-[0.28em] uppercase rounded cursor-pointer transition backdrop-blur-sm hover:bg-white/10 hover:border-white/30 hover:-translate-y-px">
              Replay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import * as THREE from "three";

// Locked color-space contract (plan T11/T12 Option A):
// Three.js r155+ defaults `THREE.ColorManagement.enabled = true`, which auto-
// converts Color constructor args sRGB → linear at upload. Combined with the
// renderer's outputColorSpace = LinearSRGBColorSpace (chosen to match the
// approved mockup's r160 behavior), colors would be linearized twice and ship
// lighter/desaturated than spec. Disabling ColorManagement globally before any
// Color is constructed prevents the double conversion.
//
// MUST be imported FIRST (before any other three import) in:
// - app/lib/scroll-palette-context.tsx
// - app/components/ShaderBackground.tsx
// - app/components/IcosahedronScene.tsx
THREE.ColorManagement.enabled = false;

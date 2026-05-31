// Vertex shader — Chromatic Drift (Task 11)
// Trivial passthrough: emits UVs and full-screen NDC coords for the fullscreen plane.
// Ported verbatim from previews/chromatic-drift/index.html.
export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

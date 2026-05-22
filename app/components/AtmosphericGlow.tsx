// Glow atmosferic in spatele scenei 3D: gradient radial subtil albastru-gri.
// Sta pe -z-20, sub canvas-ul scenei (-z-10), si simuleaza halo-ul difuz
// din spatele obiectului pentru o impresie de adancime suplimentara.
export default function AtmosphericGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20"
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(90, 112, 138, 0.18) 0%, rgba(20, 24, 32, 0.08) 35%, transparent 70%)',
      }}
    />
  );
}

// Orb-uri gradient atmosferice — fixed pe viewport, blur masiv, opacitate joasă
export default function GradientOrbs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-[0.05] blur-[160px]"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-60 h-[700px] w-[700px] rounded-full opacity-[0.04] blur-[180px]"
        style={{ background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full opacity-[0.03] blur-[140px]"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
    </div>
  );
}

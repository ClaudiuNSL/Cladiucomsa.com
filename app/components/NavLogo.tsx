'use client';
import { motion, useAnimation } from 'framer-motion';
import { useState } from 'react';

interface Particle {
  id: number;
  angle: number;
  distance: number;
}

const generateParticles = (): Particle[] =>
  Array.from({ length: 24 }, (_, i) => ({
    id: Date.now() + i,
    angle: (Math.PI * 2 * i) / 24 + Math.random() * 0.4,
    distance: 60 + Math.random() * 40,
  }));

export default function NavLogo() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const cControls = useAnimation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cControls.start({
      scale: [1, 1.2, 0.95, 1],
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    });
    setParticles(generateParticles());
    setTimeout(() => setParticles([]), 900);
  };

  return (
    <div className="relative inline-flex items-center gap-2.5 select-none">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Animate logo"
        className="relative h-10 w-10 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded-full"
      >
        <motion.svg
          viewBox="0 0 40 40"
          className="h-9 w-9"
          animate={cControls}
        >
          <path
            d="M30 11 A 12 12 0 1 0 30 29"
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </motion.svg>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[#06B6D4]"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(p.angle) * p.distance,
              y: Math.sin(p.angle) * p.distance,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </button>
      <span className="text-base font-semibold tracking-tight text-zinc-900">
        Claudiu Comsa
      </span>
    </div>
  );
}

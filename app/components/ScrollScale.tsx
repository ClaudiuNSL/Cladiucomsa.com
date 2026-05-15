// ==========================================
// SCROLL SCALE — Card care se scalează și alunecă lateral continuu
// pe măsură ce trece prin viewport. Folosit pentru proiecte.
// scale: 0.85 → 1 → 0.92 (intrare, centru, ieșire)
// x: fromX → 0 → -fromX * 0.4
// opacity: 0 → 1 → 1 → 0.7
// Se dezactivează la prefers-reduced-motion.
// ==========================================
'use client';

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

interface ScrollScaleProps {
  children: React.ReactNode;
  fromX?: number;
  className?: string;
}

export default function ScrollScale({ children, fromX = -80, className }: ScrollScaleProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.92]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], [fromX, 0, -fromX * 0.4]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.7]);

  if (reduceMotion) return <div ref={ref} className={className}>{children}</div>;

  return (
    <motion.div ref={ref} className={className} style={{ scale, x, opacity, willChange: 'transform' }}>
      {children}
    </motion.div>
  );
}

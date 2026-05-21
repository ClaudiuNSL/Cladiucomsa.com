'use client';
import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useReducedMotion } from 'framer-motion';

export default function CustomCursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const ringX = useSpring(mouseX, { stiffness: 220, damping: 24, mass: 0.4 });
  const ringY = useSpring(mouseY, { stiffness: 220, damping: 24, mass: 0.4 });
  const dotX = useSpring(mouseX, { stiffness: 600, damping: 30, mass: 0.2 });
  const dotY = useSpring(mouseY, { stiffness: 600, damping: 30, mass: 0.2 });

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia('(hover: none)').matches) return;
    // Feature detection for fine-pointer device — must run after mount to avoid SSR/hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);
    document.body.classList.add('custom-cursor-active');

    const onMove = (e: PointerEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('a, button, [role="button"], input, textarea, select, [data-cursor="lg"]');
      setHovered(Boolean(interactive));
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('mouseover', onOver);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [reduced, mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-6 w-6 rounded-full border border-[#06B6D4] mix-blend-difference"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{ scale: hovered ? 1.8 : 1, opacity: hovered ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1 w-1 rounded-full bg-[#06B6D4]"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
      />
    </>
  );
}

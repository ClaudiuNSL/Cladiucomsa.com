'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  chips: string[];
}

export default function HeroTagChips({ chips }: Props) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((n) => (n + 1) % chips.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [chips.length, reduced]);

  return (
    <ul className="mt-6 flex flex-wrap items-center gap-3" aria-label="Service categories">
      {chips.map((chip, i) => (
        <li key={chip}>
          <motion.span
            animate={{
              color: active === i ? '#06B6D4' : '#71717A',
              borderColor: active === i ? 'rgba(6, 182, 212, 0.4)' : 'rgba(0, 0, 0, 0.08)',
            }}
            transition={{ duration: 0.6 }}
            className="inline-block rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]"
          >
            {chip}
          </motion.span>
        </li>
      ))}
    </ul>
  );
}

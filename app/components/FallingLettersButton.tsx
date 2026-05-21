'use client';
import { motion } from 'framer-motion';
import { useState, type ReactNode, type CSSProperties } from 'react';

interface Props {
  children: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  external?: boolean;
  ariaLabel?: string;
  className?: string;
  trailing?: ReactNode;
  style?: CSSProperties;
  disabled?: boolean;
}

const variants = {
  primary:
    'rounded-full bg-[#06B6D4] hover:bg-[#0891B2] text-white shadow-sm focus-visible:ring-[#06B6D4]/50',
  secondary:
    'rounded-full border border-black/15 text-zinc-900 hover:border-black/30 focus-visible:ring-black/30',
} as const;

export default function FallingLettersButton({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  external,
  ariaLabel,
  className = '',
  trailing,
  style,
  disabled,
}: Props) {
  const [hoverId, setHoverId] = useState(0);
  const letters = Array.from(children);

  const inner = (
    <span className="relative inline-flex items-center gap-2 overflow-hidden">
      <span aria-hidden="true" className="inline-flex">
        {letters.map((letter, i) => (
          <motion.span
            key={`${hoverId}-${i}`}
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.35,
              delay: i * 0.03,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block whitespace-pre"
          >
            {letter === ' ' ? ' ' : letter}
          </motion.span>
        ))}
      </span>
      <span className="sr-only">{children}</span>
      {trailing}
    </span>
  );

  const sharedClass = `inline-flex items-center px-7 py-3.5 font-semibold transition-colors focus:outline-none focus-visible:ring-2 ${variants[variant]} ${className}`;

  const handleEnter = () => setHoverId((n) => n + 1);

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        onMouseEnter={handleEnter}
        onFocus={handleEnter}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        aria-label={ariaLabel}
        className={sharedClass}
        style={style}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onFocus={handleEnter}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${sharedClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={style}
    >
      {inner}
    </button>
  );
}

'use client';
// Navbar minimal dark — placeholder pentru R1. R3 va aduce versiunea finala.
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/[0.08] bg-[#050505]/80 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 lg:px-8 py-5">
        <Link
          href="/"
          className="text-sm font-medium tracking-tight text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
        >
          Claudiu Comsa
        </Link>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <button
            type="button"
            className="text-xs uppercase tracking-[0.2em] text-zinc-300 hover:text-white transition-colors"
          >
            {t('openMenu')}
          </button>
        </div>
      </div>
    </nav>
  );
}

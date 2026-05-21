'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import NavLogo from './NavLogo';
import LanguageSwitcher from './LanguageSwitcher';
import FallingLettersButton from './FallingLettersButton';

const sections = ['services', 'projects', 'contact'] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
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
          ? 'border-b border-black/[0.06] bg-[#F5F5F7]/80 backdrop-blur-md'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 lg:px-8 py-4">
        <Link
          href="/"
          aria-label="Comsa Claudiu — Home"
          className="group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded-lg pr-2"
        >
          <NavLogo />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {sections.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded"
            >
              {t(s)}
            </a>
          ))}
          <LanguageSwitcher />
          <FallingLettersButton
            href="https://wa.me/40761880406"
            external
            variant="primary"
            className="px-5 py-2 text-sm"
          >
            {t('cta')}
          </FallingLettersButton>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('closeMenu') : t('openMenu')}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" role="menu" className="md:hidden border-t border-black/[0.08] bg-white/95 backdrop-blur-xl">
          <div className="space-y-1 px-6 py-4">
            {sections.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded px-2 py-3 text-base font-medium text-zinc-700 transition-colors hover:text-zinc-900"
              >
                {t(s)}
              </a>
            ))}
            <FallingLettersButton
              href="https://wa.me/40761880406"
              external
              variant="primary"
              className="mt-2 w-full justify-center"
              onClick={() => setOpen(false)}
            >
              {t('cta')}
            </FallingLettersButton>
          </div>
        </div>
      )}
    </nav>
  );
}

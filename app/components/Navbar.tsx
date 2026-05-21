'use client';
// Navbar cinematic mdx-style: wordmark stanga, MENU + language switcher dreapta.
// Foarte subtire, foarte ingust, sa lase scena 3D sa domine.
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.06] bg-[#050505]/70 backdrop-blur-md'
            : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-6 lg:px-12">
          <Link
            href="/"
            aria-label="Claudiu Comsa — Home"
            className="group inline-flex items-baseline gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            Claudiu Comsa
          </Link>

          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="cinematic-menu"
              className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
            >
              {menuOpen ? t('closeMenu') : t('openMenu')}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="cinematic-menu"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#050505]/95 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <ul className="space-y-6 text-center" onClick={(e) => e.stopPropagation()}>
            {[
              { href: '#section-1', label: '01 — Intro' },
              { href: '#section-2', label: '02 — Work' },
              { href: '#section-3', label: '03 — Studio' },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-3xl font-semibold tracking-tight text-zinc-400 transition-colors hover:text-white sm:text-5xl"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

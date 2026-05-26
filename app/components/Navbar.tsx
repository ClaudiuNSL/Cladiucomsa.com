'use client';
// Navbar cinematic-blue: wordmark cu dot pulsand stanga, linkuri inline mijloc
// (doar desktop), LanguageSwitcher + CTA dreapta. Progress bar de scroll
// dedesubt (scaleX dupa pozitia in pagina). Mobile pastreaza hamburger overlay.
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (progressRef.current) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = h > 0 ? Math.min(1, Math.max(0, y / h)) : 0;
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }
      rafId = 0;
    };
    const onScroll = () => {
      if (rafId === 0) rafId = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const navLinks = [
    { href: '#projects', label: t('work') },
    { href: '#story', label: t('about') },
    { href: '#contact', label: t('contact') },
  ];

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-[var(--border-soft)] bg-[var(--bg-deep)]/80 backdrop-blur-xl'
            : 'border-b border-transparent'
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1600px] items-center justify-between px-8 lg:px-12 transition-all duration-500 ${
            scrolled ? 'py-4' : 'py-6'
          }`}
        >
          {/* Wordmark stanga cu dot pulsand */}
          <Link
            href="/"
            aria-label="Claudiu Comsa — Home"
            className="group inline-flex items-baseline gap-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30 rounded"
          >
            <span className="wordmark-dot inline-block h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
            Claudiu Comșa
          </Link>

          {/* Linkuri inline mijloc — DESKTOP only */}
          <ul className="hidden items-center gap-6 md:flex">
            {navLinks.map((item, i) => (
              <li key={item.href} className="flex items-center gap-6">
                <a
                  href={item.href}
                  className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--text-quiet)] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30 rounded"
                >
                  {item.label}
                </a>
                {i < navLinks.length - 1 && (
                  <span className="text-[var(--text-quiet)]/40" aria-hidden="true">·</span>
                )}
              </li>
            ))}
          </ul>

          {/* Dreapta: LanguageSwitcher + CTA + Mobile hamburger */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href={t('ctaHref')}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-[var(--text-soft)]/30 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white transition-all duration-300 hover:border-[var(--text-soft)]/60 hover:bg-[var(--text-soft)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30"
            >
              {t('cta')}
              <span aria-hidden="true">→</span>
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="cinematic-menu"
              className="md:hidden text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--text-mid)] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-soft)]/30 rounded"
            >
              {menuOpen ? t('closeMenu') : t('openMenu')}
            </button>
          </div>
        </div>

        {/* Progress bar scroll — 1px ice-blue, scaleX dupa scrollY */}
        <span
          ref={progressRef}
          aria-hidden="true"
          className="absolute bottom-0 left-0 block h-px w-full origin-left bg-[var(--accent)] transition-none"
          style={{ transform: 'scaleX(0)' }}
        />
      </nav>

      {menuOpen && (
        <div
          id="cinematic-menu"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg-deep)]/95 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <ul className="space-y-6 text-center" onClick={(e) => e.stopPropagation()}>
            {[
              { href: '#section-1', label: '01 — Intro' },
              { href: '#projects', label: '02 — Work' },
              { href: '#story', label: '03 — About' },
              { href: '#contact', label: '04 — Contact' },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block text-3xl font-semibold tracking-tight text-[var(--text-mid)] transition-colors hover:text-white sm:text-5xl"
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

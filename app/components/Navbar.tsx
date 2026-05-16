'use client';

import { useState, useEffect } from 'react';
import NavLogo from './NavLogo';

const sections = ['home', 'about', 'services', 'projects', 'contact'] as const;

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      let current = 'home';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.top >= -rect.height + 200) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const desktopLinkClass = (section: string) =>
    `relative font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded px-1 pb-1 ${
      activeSection === section
        ? 'text-[#06B6D4] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#06B6D4] after:rounded-full'
        : 'text-gray-300 hover:text-white'
    }`;

  const mobileLinkClass = (section: string) =>
    `block font-medium px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 ${
      activeSection === section
        ? 'text-[#06B6D4] border-l-2 border-[#06B6D4]'
        : 'text-gray-300 hover:text-white'
    }`;

  return (
    <nav
      className={`fixed top-0 w-full z-50 border-b border-white/20 transition-all duration-300 ${
        scrolled
          ? 'bg-white/[0.08] backdrop-blur-xl'
          : 'bg-white/5 backdrop-blur-md'
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
          <a href="/#home" className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded-lg pr-2" aria-label="Comsa Claudiu — Home">
            <NavLogo />
            <span className="text-sm text-gray-500 hidden sm:block font-medium tracking-wide group-hover:text-gray-300 transition-colors">Comsa Claudiu</span>
          </a>

          <div className="hidden md:flex items-center space-x-8">
            {sections.map((section) => (
              <a key={section} href={`/#${section}`} className={desktopLinkClass(section)}>
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </a>
            ))}
            <a
              href="https://wa.me/40761880406"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact me on WhatsApp"
              className="bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-6 py-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Get in Touch
            </a>
          </div>

          <button
            className="md:hidden text-white p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden pb-4 space-y-2 bg-gray-900/95 backdrop-blur-xl rounded-lg p-4" role="menu">
            {sections.map((section) => (
              <a key={section} href={`/#${section}`} role="menuitem" className={mobileLinkClass(section)} onClick={() => setIsMobileMenuOpen(false)}>
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </a>
            ))}
            <a href="https://wa.me/40761880406" target="_blank" rel="noopener noreferrer" role="menuitem" aria-label="Contact me on WhatsApp" className="block bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-6 py-2.5 rounded-full text-center mx-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50" onClick={() => setIsMobileMenuOpen(false)}>Get in Touch</a>
          </div>
        )}
      </div>
    </nav>
  );
}

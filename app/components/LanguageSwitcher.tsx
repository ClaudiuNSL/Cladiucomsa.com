'use client';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useState, useRef, useEffect } from 'react';
import { routing } from '@/i18n/routing';

const labels: Record<'ro' | 'en', string> = { ro: 'Română', en: 'English' };

export default function LanguageSwitcher() {
  const locale = useLocale() as 'ro' | 'en';
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const switchTo = (next: 'ro' | 'en') => {
    setOpen(false);
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('langSwitcherLabel')}
        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-md border border-white/10 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
      >
        {locale.toUpperCase()}
        <span aria-hidden="true" className="ml-1.5 opacity-60">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 min-w-[8rem] rounded-lg border border-white/10 bg-[#13131A] py-1 shadow-xl"
        >
          {routing.locales.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                role="option"
                aria-selected={locale === loc}
                onClick={() => switchTo(loc)}
                className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                  locale === loc ? 'text-[#06B6D4]' : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {labels[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

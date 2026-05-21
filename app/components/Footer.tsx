import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="text-sm text-zinc-500">
          © {year} Comsa Claudiu. {t('rights')}
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <a href="https://github.com/ClaudiuNSL" target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/claudiu-comsa-72b552364/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
            LinkedIn
          </a>
          <a href="mailto:claudiucomsa29@gmail.com" className="text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
            Email
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

// Footer minimal dark — placeholder R1. R6 va aduce versiunea finala.
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer
      aria-label="Footer"
      className="border-t border-white/[0.08] bg-[#050505] py-10"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-6 text-xs text-zinc-500 sm:flex-row sm:justify-between lg:px-8">
        <p>© {year} Comsa Claudiu. {t('rights')}</p>
      </div>
    </footer>
  );
}

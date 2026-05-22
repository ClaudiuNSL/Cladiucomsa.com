'use client';
// SocialBlock — card-uri "wow" pentru prezenta sociala a clientului dintr-un
// case study. Icoane brand-accurate (Simple Icons) pe fundal monocrom dark,
// hover cu sweep gradient + scale + soft glow. Publicitate gratuita pentru
// clientii existenti, semnal puternic pentru viitorii clienti.
import { useTranslations } from 'next-intl';
import { SiInstagram, SiFacebook } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';
import { Globe } from 'lucide-react';
import type { IconType } from 'react-icons';

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
};

type Platform = {
  key: keyof SocialLinks;
  label: string;
  Icon: IconType | typeof Globe;
};

const PLATFORMS: Platform[] = [
  { key: 'instagram', label: 'Instagram', Icon: SiInstagram },
  { key: 'facebook', label: 'Facebook', Icon: SiFacebook },
  { key: 'linkedin', label: 'LinkedIn', Icon: FaLinkedin },
  { key: 'website', label: 'Website', Icon: Globe },
];

// Scurteaza un URL pentru afisare ca "subtitle" pe card (fara https://, fara www.).
function shortenUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '')
    .slice(0, 40);
}

export default function SocialBlock({
  social,
  displayName,
}: {
  social: SocialLinks;
  displayName: string;
}) {
  const t = useTranslations('projects.social');
  const links = PLATFORMS.filter((p) => social[p.key]);
  if (links.length === 0) return null;

  return (
    <section
      aria-label={`Social links — ${displayName}`}
      className="border-t border-white/[0.04] px-8 py-20 lg:px-12"
    >
      <div className="mx-auto max-w-3xl">
        <p data-reveal className="text-center text-[10px] font-medium uppercase tracking-[0.32em] text-zinc-500">
          {t('eyebrow')}
        </p>
        <h3
          data-reveal
          className="mt-6 text-center text-2xl font-semibold tracking-[-0.02em] text-white lg:text-3xl"
        >
          {t('title', { name: displayName })}
        </h3>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {links.map(({ key, label, Icon }) => {
            const url = social[key]!;
            return (
              <a
                key={key}
                data-reveal
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-500 hover:border-white/30 hover:bg-white/[0.04] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                {/* Sweep gradient pe hover — left to right */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                <div className="relative flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white transition-all duration-500 group-hover:scale-110 group-hover:border-white/25 group-hover:bg-white/[0.06]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{label}</p>
                    <p className="truncate text-[11px] text-zinc-500">
                      {shortenUrl(url)}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-zinc-600 transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-white"
                  >
                    ↗
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

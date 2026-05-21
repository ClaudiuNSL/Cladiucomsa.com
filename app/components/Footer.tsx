// Footer cinematic: tech stack logos sus, copyright + social jos.
// Iconite din react-icons (simple-icons set) — monocrome, opacitate joasa.
import { useTranslations } from 'next-intl';
import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiThreedotjs,
  SiVercel,
  SiGithub,
  SiInstagram,
} from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';

const TECH = [
  { label: 'Next.js', Icon: SiNextdotjs },
  { label: 'React', Icon: SiReact },
  { label: 'TypeScript', Icon: SiTypescript },
  { label: 'Tailwind CSS', Icon: SiTailwindcss },
  { label: 'Three.js', Icon: SiThreedotjs },
  { label: 'Vercel', Icon: SiVercel },
];

const SOCIAL = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/claudiu-comsa/', Icon: FaLinkedin },
  { label: 'GitHub', href: 'https://github.com/ClaudiuNSL', Icon: SiGithub },
  { label: 'Instagram', href: 'https://www.instagram.com/claudiu.comsa/', Icon: SiInstagram },
];

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label="Footer"
      className="relative z-10 border-t border-white/[0.06] bg-[#050505]"
    >
      <div className="mx-auto max-w-[1600px] px-8 lg:px-12">
        {/* Tech stack — rand cu logo-uri grayscale */}
        <div className="flex flex-col items-center gap-6 border-b border-white/[0.06] py-12 sm:flex-row sm:justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-600">
            {t('builtWith')}
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-8 sm:gap-10">
            {TECH.map(({ label, Icon }) => (
              <li key={label}>
                <span
                  className="group inline-flex items-center gap-2 text-zinc-500 transition-colors hover:text-white"
                  title={label}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Copyright + social */}
        <div className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            © {year} Claudiu Comsa — {t('rights')}
          </p>
          <ul className="flex items-center gap-6">
            {SOCIAL.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-zinc-500 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

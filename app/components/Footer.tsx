// Footer cinematic: tech stack ca marquee infinit dreapta -> stanga, copyright + social jos.
// Iconite din react-icons (simple-icons set) — monocrome, opacitate joasa, hover oprestea marquee-ul.
import { useTranslations } from 'next-intl';
import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiJavascript,
  SiTailwindcss,
  SiThreedotjs,
  SiVercel,
  SiVite,
  SiNodedotjs,
  SiGreensock,
  SiGooglecloud,
  SiPostgresql,
  SiOpenai,
  SiGit,
  SiGithub,
  SiInstagram,
} from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';

const TECH = [
  { label: 'Next.js', Icon: SiNextdotjs },
  { label: 'React', Icon: SiReact },
  { label: 'TypeScript', Icon: SiTypescript },
  { label: 'JavaScript', Icon: SiJavascript },
  { label: 'Tailwind CSS', Icon: SiTailwindcss },
  { label: 'Vite', Icon: SiVite },
  { label: 'Node.js', Icon: SiNodedotjs },
  { label: 'GSAP', Icon: SiGreensock },
  { label: 'Three.js', Icon: SiThreedotjs },
  { label: 'Google Cloud', Icon: SiGooglecloud },
  { label: 'PostgreSQL', Icon: SiPostgresql },
  { label: 'OpenAI', Icon: SiOpenai },
  { label: 'Git', Icon: SiGit },
  { label: 'Vercel', Icon: SiVercel },
];

const SOCIAL = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/claudiu-comsa-72b552364/', Icon: FaLinkedin },
  { label: 'GitHub', href: 'https://github.com/ClaudiuNSL', Icon: SiGithub },
  { label: 'Instagram', href: 'https://www.instagram.com/claudiu77004/', Icon: SiInstagram },
];

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  // Continutul marquee-ului trebuie dublat ca animatia sa fie seamless (-50%).
  const marqueeItems = [...TECH, ...TECH];

  return (
    <footer
      aria-label="Footer"
      className="relative z-10 border-t border-[var(--border-soft)] bg-[var(--bg-deep)]"
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Tech stack marquee — full-bleed in interiorul max-w, cu fade pe margini */}
        <div className="border-y border-[var(--border-soft)] py-10">
          <p className="mb-6 px-8 text-center text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)]/70 lg:px-12">
            {t('builtWith')}
          </p>
          {/* Wrapper cu overflow + mask gradient — items intra/ies cu fade lateral.
              `mask-image` aplica gradient transparent pe stanga si dreapta. */}
          <div
            className="relative overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
          >
            <ul
              aria-hidden="true"
              className="animate-marquee flex items-center gap-14"
            >
              {marqueeItems.map(({ label, Icon }, i) => (
                <li key={`${label}-${i}`} className="shrink-0">
                  <span
                    className="group inline-flex items-center gap-2 text-[var(--text-quiet)] transition-colors hover:text-white"
                    title={label}
                  >
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                </li>
              ))}
            </ul>
            {/* Lista accesibila ascunsa vizual — exporta tech-ul catre screen readers
                fara duplicare. Marquee-ul vizibil e aria-hidden. */}
            <ul className="sr-only">
              {TECH.map(({ label }) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright + social */}
        <div className="flex flex-col items-center gap-6 px-8 py-8 sm:flex-row sm:justify-between lg:px-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-quiet)]">
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
                  className="text-[var(--text-quiet)] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
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

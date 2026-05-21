import { useTranslations } from 'next-intl';
import ContactForm from '../ContactForm';

export default function Contact() {
  const t = useTranslations('contact');
  return (
    <section id="contact" aria-labelledby="contact-heading" className="relative px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h2 id="contact-heading" className="max-w-[14ch] text-4xl font-bold tracking-tight text-zinc-900 lg:text-6xl">
              {t('sectionTitle')}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600">{t('sectionSubtitle')}</p>
            <div className="mt-10 space-y-3 text-sm">
              <p className="text-zinc-500">{t('directContactLabel')}</p>
              <a href="mailto:claudiucomsa29@gmail.com" className="block text-zinc-800 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                claudiucomsa29@gmail.com
              </a>
              <a href="tel:+40761880406" className="block text-zinc-800 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                0761 880 406
              </a>
              <a href="https://www.linkedin.com/in/claudiu-comsa-72b552364/" target="_blank" rel="noopener noreferrer" className="block text-zinc-800 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                LinkedIn
              </a>
              <a href="https://github.com/ClaudiuNSL" target="_blank" rel="noopener noreferrer" className="block text-zinc-800 underline-offset-4 hover:text-[#06B6D4] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded">
                GitHub
              </a>
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

import { useTranslations } from 'next-intl';
import ServiceCard from '../ServiceCard';

const items = [
  { key: 'websites', href: '#project-banciu' },
  { key: 'ai', href: '#project-aurasjobs' },
  { key: 'internal', href: '#project-stereocad' },
] as const;

export default function Services() {
  const t = useTranslations('services');
  return (
    <section id="services" aria-labelledby="services-heading" className="relative px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 max-w-2xl">
          <h2 id="services-heading" className="text-4xl font-bold tracking-tight text-zinc-900 lg:text-6xl">
            {t('sectionTitle')}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{t('sectionSubtitle')}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {items.map(({ key, href }) => (
            <ServiceCard
              key={key}
              number={t(`items.${key}.number`)}
              title={t(`items.${key}.title`)}
              body={t(`items.${key}.body`)}
              linkLabel={t(`items.${key}.linkLabel`)}
              href={href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

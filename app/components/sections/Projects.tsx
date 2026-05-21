import { useTranslations } from 'next-intl';
import ProjectShowcase from '../ProjectShowcase';

type Project = {
  key: string;
  anchor: string;
  image: string;
  liveUrl?: string;
  sourceUrl?: string;
};

const projects: Project[] = [
  {
    key: 'banciuCostin',
    anchor: 'project-banciu',
    image: '/projects/banciu-preview.png',
    liveUrl: 'https://www.banciucostin.ro',
    sourceUrl: 'https://github.com/ClaudiuNSL',
  },
  {
    key: 'aurasjobs',
    anchor: 'project-aurasjobs',
    image: '/projects/aurasjobs-preview.png',
    liveUrl: 'https://aurasjobs-automations.vercel.app/',
    sourceUrl: 'https://github.com/cristianCeamatuAssist/aurasjobs-automations',
  },
  {
    key: 'stereocad',
    anchor: 'project-stereocad',
    image: '/projects/stereocad-preview.png',
    sourceUrl: 'https://github.com/cristianCeamatuAssist/stereocad-automations',
  },
];

export default function Projects() {
  const t = useTranslations('projects');
  return (
    <section id="projects" aria-labelledby="projects-heading" className="relative px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 max-w-2xl">
          <h2 id="projects-heading" className="text-4xl font-bold tracking-tight text-zinc-900 lg:text-6xl">
            {t('sectionTitle')}
          </h2>
          <p className="mt-4 text-lg text-zinc-600">{t('sectionSubtitle')}</p>
        </div>
        <div className="space-y-32">
          {projects.map((p, i) => (
            <div key={p.key} id={p.anchor} className="scroll-mt-24">
              <ProjectShowcase
                title={t(`items.${p.key}.title`)}
                kicker={t(`items.${p.key}.kicker`)}
                body={t(`items.${p.key}.body`)}
                tech={t.raw(`items.${p.key}.tech`) as string[]}
                image={p.image}
                liveUrl={p.liveUrl}
                sourceUrl={p.sourceUrl}
                viewLiveLabel={t('viewLive')}
                viewSourceLabel={t('viewSource')}
                reverse={i % 2 === 1}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProjectShowcaseProps {
  title: string;
  kicker: string;
  body: string;
  tech: string[];
  image?: string;
  liveUrl?: string;
  sourceUrl?: string;
  viewLiveLabel: string;
  viewSourceLabel: string;
  reverse?: boolean;
}

export default function ProjectShowcase({
  title,
  kicker,
  body,
  tech,
  image,
  liveUrl,
  sourceUrl,
  viewLiveLabel,
  viewSourceLabel,
  reverse = false,
}: ProjectShowcaseProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`grid items-center gap-12 lg:grid-cols-12 ${reverse ? 'lg:[direction:rtl]' : ''}`}
    >
      <div className="lg:col-span-7 lg:[direction:ltr]">
        {image && (
          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <Image
              src={image}
              alt={`${title} — preview`}
              width={1400}
              height={900}
              sizes="(max-width: 1024px) 92vw, 800px"
              className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#06B6D4]/0 via-transparent to-[#06B6D4]/0 transition-opacity duration-500 group-hover:from-[#06B6D4]/[0.06]" />
          </div>
        )}
      </div>
      <div className="lg:col-span-5 lg:[direction:ltr]">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-[#06B6D4]">{kicker}</p>
        <h3 className="mb-5 text-4xl font-bold text-white lg:text-5xl">{title}</h3>
        <p className="mb-6 text-lg leading-relaxed text-zinc-400">{body}</p>
        <ul className="mb-8 flex flex-wrap gap-2">
          {tech.map((t) => (
            <li
              key={t}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400"
            >
              {t}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#06B6D4] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0891B2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
            >
              {viewLiveLabel} <span aria-hidden="true">→</span>
            </a>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-medium text-zinc-200 transition-colors hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {viewSourceLabel}
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

'use client';
import { motion } from 'framer-motion';

interface ServiceCardProps {
  number: string;
  title: string;
  body: string;
  linkLabel: string;
  href: string;
}

export default function ServiceCard({ number, title, body, linkLabel, href }: ServiceCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full flex-col justify-between rounded-2xl border border-black/[0.08] bg-white p-8 transition-all hover:border-[#06B6D4]/30 hover:bg-zinc-50 hover:shadow-sm"
    >
      <div>
        <div className="mb-8 font-bold text-7xl leading-none text-black/[0.08] transition-colors group-hover:text-[#06B6D4]/30">
          {number}
        </div>
        <h3 className="mb-4 text-2xl font-bold text-zinc-900">{title}</h3>
        <p className="text-zinc-600 leading-relaxed">{body}</p>
      </div>
      <a
        href={href}
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#06B6D4] transition-colors hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded"
      >
        {linkLabel}
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
      </a>
    </motion.article>
  );
}

'use client';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import FallingLettersButton from '@/app/components/FallingLettersButton';

export default function Hero() {
  const t = useTranslations('hero');
  return (
    <section id="home" aria-label="Introduction" className="relative flex min-h-screen items-center px-6 pt-24 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#06B6D4]"
        >
          {t('eyebrow')}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[18ch] text-5xl font-bold leading-[1.05] tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          {t('title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-600 lg:text-xl"
        >
          {t('subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-wrap gap-4"
        >
          <FallingLettersButton href="#projects" variant="primary" trailing={<span aria-hidden="true">→</span>}>
            {t('ctaPrimary')}
          </FallingLettersButton>
          <FallingLettersButton href="#contact" variant="secondary">
            {t('ctaSecondary')}
          </FallingLettersButton>
        </motion.div>
      </div>
      <div aria-hidden="true" className="absolute bottom-8 right-8 hidden flex-col items-center gap-3 text-xs uppercase tracking-widest text-zinc-500 lg:flex">
        <span>{t('scrollIndicator')}</span>
        <span className="h-12 w-px bg-gradient-to-b from-zinc-400 to-transparent" />
      </div>
    </section>
  );
}

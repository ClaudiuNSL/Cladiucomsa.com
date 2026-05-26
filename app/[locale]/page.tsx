// Homepage cinematic: IntroAnimation (prima vizita) + Hero (3 sectiuni) + Story + Projects + Contact.
import { setRequestLocale } from 'next-intl/server';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import IntroAnimation from '@/app/components/IntroAnimation';
import Hero from '@/app/components/sections/Hero';
import Story from '@/app/components/sections/Story';
import Projects from '@/app/components/sections/Projects';
import Contact from '@/app/components/sections/Contact';
import type { Locale } from '@/i18n/routing';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <a
        href="#section-1"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <IntroAnimation />
      <Navbar />
      <main>
        <Hero />
        <Story />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

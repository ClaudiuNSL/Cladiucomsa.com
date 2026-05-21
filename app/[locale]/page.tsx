import { setRequestLocale } from 'next-intl/server';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import ScrollProgress from '@/app/components/ScrollProgress';
import type { Locale } from '@/i18n/routing';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#06B6D4] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <ScrollProgress />
      <Navbar />
      <main id="main" className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-[#06B6D4] mb-4">In progress</p>
          <h1 className="text-4xl lg:text-6xl font-bold text-white">Construim noul site.</h1>
          <p className="mt-4 text-zinc-400">Stub temporar. Hero / Services / Projects / Contact se asamblează în task-urile 16-20.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

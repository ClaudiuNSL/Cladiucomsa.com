'use client';
// Wrapper client pentru CinematicScene3D. Renderizeaza scena 3D doar pe
// pagina home (/, /ro, /en) — case studies si alte rute interne nu au
// nevoie de 3D si platesc costul Draco worker degeaba.
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const CinematicScene3D = dynamic(
  () => import('@/app/components/CinematicScene3D'),
  { ssr: false, loading: () => null }
);

export default function CinematicScene3DLoader() {
  const pathname = usePathname();
  // Match exact: /, /ro, /en (cu sau fara trailing slash).
  const isHome = /^\/(ro|en)?\/?$/.test(pathname);
  if (!isHome) return null;
  return <CinematicScene3D />;
}

'use client';
// Wrapper client pentru CinematicScene3D — necesar fiindca layout-ul de
// locale este un Server Component si `dynamic({ ssr: false })` poate fi
// folosit doar dintr-un Client Component in Next 15+.
import dynamic from 'next/dynamic';

const CinematicScene3D = dynamic(
  () => import('@/app/components/CinematicScene3D'),
  { ssr: false, loading: () => null }
);

export default function CinematicScene3DLoader() {
  return <CinematicScene3D />;
}

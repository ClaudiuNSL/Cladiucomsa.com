// Home — singura pagină. Compoziție de secțiuni; toate au "use client" intern.

import Hero from "@/app/components/sections/Hero";
import Manifesto from "@/app/components/sections/Manifesto";
import ProjectsHeader from "@/app/components/sections/ProjectsHeader";
import P1Banciu from "@/app/components/sections/projects/P1Banciu";
import P2Aurasjobs from "@/app/components/sections/projects/P2Aurasjobs";
import P3Stereocad from "@/app/components/sections/projects/P3Stereocad";
import P4Confidential from "@/app/components/sections/projects/P4Confidential";
import P5Atelier from "@/app/components/sections/projects/P5Atelier";
import Studio from "@/app/components/sections/Studio";
import Story from "@/app/components/sections/Story";
import Footer from "@/app/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Manifesto />
      <ProjectsHeader />
      <P1Banciu />
      <P2Aurasjobs />
      <P3Stereocad />
      <P4Confidential />
      <P5Atelier />
      <Studio />
      <Story />
      <Footer />
    </main>
  );
}

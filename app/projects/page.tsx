import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Briefcase, Rocket } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnimatedSection from "../components/AnimatedSection";
import TiltCard from "../components/TiltCard";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Portfolio of web development projects by Comsa Claudiu. React, Next.js, and modern web applications. Portofoliu programator web.",
  openGraph: {
    title: "Projects | Comsa Claudiu — Web Developer",
    description:
      "Portfolio of web development projects by Comsa Claudiu.",
    url: "https://www.claudiucomsa.com/projects",
  },
};

const projects = [
  {
    icon: <Globe className="w-16 h-16" aria-hidden="true" />,
    title: "Banciu Costin — Professional Website",
    description:
      "A complete professional website built for Banciu Costin. Features responsive design, optimized performance, SEO-friendly structure, and modern aesthetics. Delivered a clean, fast-loading site that effectively showcases the client\u2019s services.",
    tags: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "SEO"],
    buttons: [
      { label: "View Live", href: "https://www.banciucostin.ro", primary: true },
      { label: "GitHub", href: "https://github.com/ClaudiuNSL", primary: false },
    ],
  },
  {
    icon: <Briefcase className="w-16 h-16" aria-hidden="true" />,
    title: "Interactive Portfolio",
    description:
      "My personal portfolio website built with Next.js and Tailwind CSS. Features modern animations, responsive design, contact form integration, and comprehensive SEO optimization. Currently in active development with new features being added regularly.",
    tags: ["Next.js", "Tailwind CSS", "TypeScript", "Formspree", "SEO"],
    buttons: [
      { label: "In Development", href: "#", disabled: true },
      { label: "GitHub", href: "https://github.com/ClaudiuNSL", primary: false },
    ],
  },
  {
    icon: <Rocket className="w-16 h-16" aria-hidden="true" />,
    title: "Custom Web Solutions",
    description:
      "Custom web development services for businesses of all sizes. From landing pages to complex web applications, I deliver tailored solutions using React, Node.js, and MongoDB. Each project is built with scalability, performance, and user experience in mind.",
    tags: ["React", "Node.js", "MongoDB", "REST APIs", "Full-Stack"],
    buttons: [
      { label: "Discuss Project", href: "/#contact", primary: true },
      { label: "GitHub", href: "https://github.com/ClaudiuNSL", primary: false },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Navbar />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h1 className="text-4xl font-bold text-white mb-4">All Projects</h1>
            <p className="text-lg text-gray-300 mb-16">
              A showcase of my recent work and contributions
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <AnimatedSection key={project.title} delay={i * 0.15}>
                <TiltCard className="h-full">
                  <article
                    className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden hover:shadow-lg hover:shadow-cyan-500/5 hover:border-[#06B6D4]/30 transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="h-56 bg-gradient-to-br from-[#06B6D4]/20 to-[#0891B2]/20 flex items-center justify-center text-[#06B6D4]">
                      {project.icon}
                    </div>

                    <div className="p-8 flex flex-col flex-1">
                      <h2 className="text-xl font-semibold text-white mb-3">
                        {project.title}
                      </h2>
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-3 py-1 bg-[#06B6D4]/20 text-gray-200 text-xs rounded-full border border-[#06B6D4]/30 m-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-6 mt-auto">
                        {project.buttons.map((btn) =>
                          btn.disabled ? (
                            <span
                              key={btn.label}
                              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-700 text-gray-400 cursor-not-allowed"
                              aria-label="Project is in development"
                            >
                              {btn.label}
                            </span>
                          ) : btn.primary ? (
                            <a
                              key={btn.label}
                              href={btn.href}
                              target={btn.href.startsWith("http") ? "_blank" : undefined}
                              rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                              aria-label={`${btn.label}: ${project.title}`}
                            >
                              {btn.label}
                            </a>
                          ) : (
                            <a
                              key={btn.label}
                              href={btn.href}
                              target={btn.href.startsWith("http") ? "_blank" : undefined}
                              rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-600 text-gray-200 hover:border-gray-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50"
                              aria-label={`${btn.label}: ${project.title}`}
                            >
                              {btn.label}
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  </article>
                </TiltCard>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.3}>
            <div className="text-center mt-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-12">
              <h2 className="text-2xl font-bold text-white mb-4">
                Have a Project in Mind?
              </h2>
              <p className="text-gray-300 mb-6">
                I&apos;m always open to discussing new projects and creative ideas.
              </p>
              <Link
                href="/#contact"
                className="inline-block px-8 py-3 rounded-lg text-sm font-medium bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Let&apos;s Talk &rarr;
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </main>
      <Footer />
    </div>
  );
}

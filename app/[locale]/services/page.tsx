import type { Metadata } from "next";
import { Monitor, Bot, Zap, Palette } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import AnimatedSection from "@/app/components/AnimatedSection";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Professional web development services: React, Next.js, AI integration, custom web solutions. Programator web Constanța, România.",
  openGraph: {
    title: "Services | Comsa Claudiu — Web Developer",
    description:
      "Professional web development services: React, Next.js, AI integration, custom web solutions.",
    url: "https://www.claudiucomsa.com/services",
  },
};

const services = [
  {
    icon: <Monitor className="w-8 h-8" aria-hidden="true" />,
    title: "Web Development",
    description:
      "I build modern, responsive websites and web applications using cutting-edge technologies. From landing pages to complex web platforms, I deliver clean, performant code.",
    includes: [
      "Responsive Design",
      "Performance Optimization",
      "SEO-Friendly Code",
      "Cross-Browser Compatibility",
      "Mobile-First Approach",
    ],
  },
  {
    icon: <Bot className="w-8 h-8" aria-hidden="true" />,
    title: "AI Integration",
    description:
      "Enhance your applications with artificial intelligence. I integrate AI-powered features like chatbots, content generation, data analysis, and smart automation into existing or new projects.",
    includes: [
      "AI Chatbot Development",
      "Content Generation Tools",
      "Data Analysis Dashboards",
      "Workflow Automation",
      "API Integration",
    ],
  },
  {
    icon: <Zap className="w-8 h-8" aria-hidden="true" />,
    title: "Custom Solutions",
    description:
      "Every business is unique. I develop tailored web solutions including management systems, dashboards, e-commerce platforms, and internal tools designed specifically for your workflow.",
    includes: [
      "Business Management Systems",
      "Custom Dashboards",
      "E-Commerce Solutions",
      "Internal Tools",
      "Database Design",
    ],
  },
  {
    icon: <Palette className="w-8 h-8" aria-hidden="true" />,
    title: "UI/UX Design",
    description:
      "Great software starts with great design. I create intuitive, visually appealing interfaces that provide excellent user experiences while maintaining brand consistency.",
    includes: [
      "User Interface Design",
      "User Experience Research",
      "Prototyping",
      "Design Systems",
      "Accessibility Compliance",
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Navbar />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h1 className="text-4xl font-bold text-white mb-4">My Services</h1>
            <p className="text-lg text-gray-300 mb-16">
              Comprehensive web development solutions for your business
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, i) => (
              <AnimatedSection key={service.title} delay={i * 0.15}>
                <article
                  className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-10 hover:border-[#06B6D4]/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300"
                >
                  <div className="text-[#06B6D4] mb-4">{service.icon}</div>
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    {service.title}
                  </h2>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  <p className="text-sm font-semibold text-white mb-3">
                    What&apos;s included
                  </p>
                  <ul className="space-y-2 mb-6" aria-label={`${service.title} features`}>
                    {service.includes.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="text-[#06B6D4]" aria-hidden="true">&#10003;</span>
                        <span className="text-gray-300 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/#contact"
                    className="inline-block bg-[#06B6D4] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#0891B2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    Get Started
                  </a>
                </article>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.2}>
            <div className="text-center mt-16 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-12">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to Start Your Project?
              </h2>
              <p className="text-gray-300 mb-6">
                Let&apos;s discuss your ideas and bring them to life.
              </p>
              <a
                href="/#contact"
                className="inline-block bg-[#06B6D4] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#0891B2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Get in Touch &rarr;
              </a>
            </div>
          </AnimatedSection>
        </div>
      </main>
      <Footer />
    </div>
  );
}

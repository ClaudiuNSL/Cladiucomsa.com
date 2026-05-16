import Image from 'next/image';
import { Monitor, Bot, Zap, Palette, Globe, Briefcase } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnimatedSection from './components/AnimatedSection';
import ContactForm from './components/ContactForm';
import ScrollProgress from './components/ScrollProgress';
import TiltCard from './components/TiltCard';
import TypeWriter from './components/TypeWriter';
import FloatingParticles from './components/FloatingParticles';
import TechStack from './components/TechStack';
import MagneticButton from './components/MagneticButton';
import TextReveal from './components/TextReveal';
import AuroraBackground from './components/AuroraBackground';
import SpotlightCard from './components/SpotlightCard';
import TestimonialsCarousel from './components/TestimonialsCarousel';
import ScrollScale from './components/ScrollScale';

const serviceIcons: Record<string, React.ReactNode> = {
  'Web Development': <Monitor className="w-8 h-8" aria-hidden="true" />,
  'AI Integration': <Bot className="w-8 h-8" aria-hidden="true" />,
  'Custom Solutions': <Zap className="w-8 h-8" aria-hidden="true" />,
  'UI/UX Design': <Palette className="w-8 h-8" aria-hidden="true" />,
};

const projectIcons: Record<string, React.ReactNode> = {
  'Banciu Costin': <Globe className="w-14 h-14" aria-hidden="true" />,
  'Aurasjobs': <Bot className="w-14 h-14" aria-hidden="true" />,
  'Stereocad': <Briefcase className="w-14 h-14" aria-hidden="true" />,
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#06B6D4] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <ScrollProgress />
      <Navbar />

      <main id="main-content">
        {/* Hero Section */}
        <section id="home" aria-label="Introduction" className="min-h-screen flex items-center pt-20 px-6 relative overflow-hidden">
          <AuroraBackground />
          <FloatingParticles />
          <div className="max-w-6xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection direction="left">
                <span className="inline-block bg-[#06B6D4]/20 text-white font-medium text-sm px-4 py-1.5 rounded-full mb-6 border border-[#06B6D4]/40">
                  <TypeWriter words={['Web Developer & AI Enthusiast', 'Freelancer in Romania', 'React & Next.js Expert', 'Building Digital Solutions']} />
                </span>
                <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="text-white">Building Digital</span>{' '}
                  <span className="text-gradient">Solutions That Drive Results</span>
                </h1>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  From innovative web applications to AI-powered solutions, I provide expert development to help your business grow, scale, and thrive.
                </p>
                <div className="flex gap-4">
                  <MagneticButton>
                    <a
                      href="#projects"
                      className="bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-8 py-3 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 inline-block"
                    >
                      View Projects &rarr;
                    </a>
                  </MagneticButton>
                  <MagneticButton>
                    <a
                      href="#contact"
                      className="border-2 border-gray-600 hover:border-gray-400 text-gray-200 px-8 py-3 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 inline-block"
                    >
                      Contact Me &rarr;
                    </a>
                  </MagneticButton>
                </div>
              </AnimatedSection>

              <AnimatedSection direction="right" delay={0.2}>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#06B6D4] to-[#38bdf8] rounded-2xl opacity-20 blur-xl" />
                  <Image
                    src="/profil.jpg"
                    alt="Comsa Claudiu — Web Developer"
                    width={600}
                    height={600}
                    priority
                    className="relative w-full h-auto rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
                  />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <div className="section-glow-line max-w-4xl mx-auto" />

        {/* About Section */}
        <section id="about" aria-labelledby="about-heading" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 id="about-heading" className="text-4xl font-bold mb-12"><TextReveal text="About" className="text-white" /> <TextReveal text="Me" className="text-gradient" delay={0.15} /></h2>
            </AnimatedSection>

            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <AnimatedSection delay={0.1}>
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8">
                    <h3 className="text-2xl font-semibold text-white mb-4">My Story</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      I&apos;m a passionate web developer with experience in creating modern and innovative applications.
                      I love transforming ideas into reality using the latest technologies.
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      My specialization includes React, Next.js, TypeScript, and AI integration in web applications.
                      I&apos;m always looking for new challenges and learning opportunities.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={0.2}>
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8">
                    <h3 className="text-2xl font-semibold text-white mb-4">My Goals</h3>
                    <p className="text-gray-300 leading-relaxed">
                      To create web applications that not only work perfectly but also provide
                      memorable experiences for users. I believe in the power of technology to change the world for the better.
                    </p>
                  </div>
                </AnimatedSection>
              </div>

              <div className="space-y-8">
                <AnimatedSection delay={0.15}>
                  <TechStack />
                </AnimatedSection>

              </div>
            </div>
          </div>
        </section>

        <div className="section-glow-line max-w-4xl mx-auto" />

        {/* Services Section */}
        <section id="services" aria-labelledby="services-heading" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 id="services-heading" className="text-4xl font-bold mb-4"><TextReveal text="What I" className="text-white" /> <TextReveal text="Offer" className="text-gradient" delay={0.1} /></h2>
              <p className="text-lg text-gray-300 mb-12">Comprehensive web development services tailored to your needs</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Web Development', desc: 'Modern, responsive websites and web applications built with React, Next.js, and the latest technologies.' },
                { name: 'AI Integration', desc: 'Smart AI-powered features and automation to enhance your applications and streamline workflows.' },
                { name: 'Custom Solutions', desc: 'Tailored business applications, dashboards, and management systems designed for your specific needs.' },
                { name: 'UI/UX Design', desc: 'Clean, modern interfaces with focus on user experience, accessibility, and visual appeal.' },
              ].map((service, i) => (
                <AnimatedSection key={service.name} delay={i * 0.1}>
                  <SpotlightCard className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8 hover:shadow-lg hover:shadow-cyan-500/5 hover:border-[#06B6D4]/30 transition-all h-full">
                    <div className="text-[#06B6D4] mb-4">{serviceIcons[service.name]}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{service.name}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{service.desc}</p>
                  </SpotlightCard>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={0.4}>
              <div className="text-center mt-10">
                <a
                  href="/services"
                  className="inline-flex items-center gap-2 text-gray-200 font-semibold hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded-lg px-2 py-1"
                >
                  View All Services
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <div className="section-glow-line max-w-4xl mx-auto" />

        {/* Projects Section */}
        <section id="projects" aria-labelledby="projects-heading" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 id="projects-heading" className="text-4xl font-bold mb-4"><TextReveal text="My" className="text-white" /> <TextReveal text="Projects" className="text-gradient" delay={0.05} /></h2>
              <p className="text-lg text-gray-300 mb-12">Some of my recent work</p>
            </AnimatedSection>

            <div className="space-y-16">
              {[
                {
                  key: 'Banciu Costin',
                  title: 'Banciu Costin - Professional Website',
                  desc: 'Modern professional website with responsive design, optimized for performance and SEO. Helps the client showcase the business and receive new applications and contact requests.',
                  tech: 'HTML5, CSS3, JavaScript, Mobile responsive, SEO optimization',
                  image: '/projects/banciu-preview.png',
                  liveUrl: 'https://www.banciucostin.ro',
                  githubUrl: 'https://github.com/ClaudiuNSL',
                },
                {
                  key: 'Aurasjobs',
                  title: 'Aurasjobs — Agent AI pentru recrutare',
                  desc: 'Agent AI care procesează automat email-urile candidaților, generează răspunsuri personalizate și gestionează fluxul propunere → aprobare → trimitere. Dashboard cu statistici live, programări de interviu și statusuri. Construit pentru o companie de recrutare din industria cruise ship.',
                  tech: 'Next.js, TypeScript, Tailwind CSS, integrare LLM, automatizare email',
                  image: '/projects/aurasjobs-preview.png',
                  liveUrl: 'https://aurasjobs-automations.vercel.app/',
                  githubUrl: 'https://github.com/cristianCeamatuAssist/aurasjobs-automations',
                },
                {
                  key: 'Stereocad',
                  title: 'Stereocad — Platformă automatizări cadastrale',
                  desc: 'Platformă internă care generează automat documente cadastrale pentru o firmă din domeniu. Autentificare passwordless cu magic link pe email, monitorizare etape în timp real și acces securizat fără parolă.',
                  tech: 'Next.js, TypeScript, Tailwind CSS, magic link auth, generare documente',
                  image: '/projects/stereocad-preview.png',
                  githubUrl: 'https://github.com/cristianCeamatuAssist/stereocad-automations',
                },
              ].map((project, i) => (
                <AnimatedSection key={project.key} delay={i * 0.1}>
                  <ScrollScale fromX={i % 2 === 0 ? -80 : 80}>
                  <article className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'lg:direction-rtl' : ''}`}>
                    {/* Screenshot side */}
                    <div className={`${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#06B6D4]/20 to-[#38bdf8]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                          {project.image ? (
                            <Image
                              src={project.image}
                              alt={`${project.title} preview`}
                              width={700}
                              height={450}
                              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="w-full aspect-[16/10] bg-gradient-to-br from-[#06B6D4]/20 to-[#0891B2]/10 flex items-center justify-center">
                              {projectIcons[project.key]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details side */}
                    <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">{project.title}</h3>
                      <p className="text-gray-300 leading-relaxed mb-6">{project.desc}</p>
                      <p className="text-gray-400 text-sm mb-8 font-medium">{project.tech}</p>
                      <div className="flex flex-wrap gap-3">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-6 py-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                            aria-label={`View live site: ${project.title}`}
                          >
                            <Monitor className="w-4 h-4" />
                            Live demo
                          </a>
                        )}
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold px-6 py-3 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50"
                          aria-label={`View ${project.title} source code`}
                        >
                          Source code
                        </a>
                      </div>
                    </div>
                  </article>
                  </ScrollScale>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={0.4}>
              <div className="text-center mt-10">
                <a
                  href="/projects"
                  className="inline-flex items-center gap-2 text-gray-200 font-semibold hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded-lg px-2 py-1"
                >
                  View All Projects
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </AnimatedSection>
          </div>
        </section>

        <div className="section-glow-line max-w-4xl mx-auto" />

        {/* Testimonials Section */}
        <section id="testimonials" aria-labelledby="testimonials-heading" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 id="testimonials-heading" className="text-4xl font-bold mb-4"><TextReveal text="What Clients" className="text-white" /> <TextReveal text="Say" className="text-gradient" delay={0.1} /></h2>
              <p className="text-lg text-gray-300 mb-12">Feedback from people I&apos;ve worked with</p>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <TestimonialsCarousel />
            </AnimatedSection>
          </div>
        </section>

        <div className="section-glow-line max-w-4xl mx-auto" />

        {/* Contact Section */}
        <section id="contact" aria-labelledby="contact-heading" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 id="contact-heading" className="text-4xl font-bold mb-4"><TextReveal text="Let's Work" className="text-white" /> <TextReveal text="Together" className="text-gradient" delay={0.1} /></h2>
              <p className="text-lg text-gray-300 mb-12">Have a project in mind? Let&apos;s discuss how I can bring it to life!</p>
            </AnimatedSection>

            <div className="grid lg:grid-cols-2 gap-12">
              <AnimatedSection delay={0.1}>
                <ContactForm />
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h3 className="font-semibold text-white mb-2">Email</h3>
                    <p className="text-gray-300 mb-3">claudiucomsa29@gmail.com</p>
                    <a
                      href="mailto:claudiucomsa29@gmail.com"
                      className="inline-block bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                    >
                      Send Email
                    </a>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h3 className="font-semibold text-white mb-2">Phone</h3>
                    <p className="text-gray-300 mb-3">0761 880 406</p>
                    <a
                      href="tel:+40761880406"
                      className="inline-block bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                    >
                      Call Now
                    </a>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h3 className="font-semibold text-white mb-2">Location</h3>
                    <p className="text-gray-300 mb-3">Constanța, Romania</p>
                    <span className="inline-block bg-[#06B6D4]/20 text-white font-medium px-4 py-2 rounded-lg text-sm border border-[#06B6D4]/40">
                      Available Remote
                    </span>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h3 className="font-semibold text-white mb-4">Connect</h3>
                    <div className="flex gap-3">
                      <a
                        href="https://github.com/ClaudiuNSL"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub profile"
                        className="flex-1 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-4 py-2 rounded-lg text-sm text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                      >
                        GitHub
                      </a>
                      <a
                        href="https://www.linkedin.com/in/claudiu-comsa-72b552364/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn profile"
                        className="flex-1 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-4 py-2 rounded-lg text-sm text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                      >
                        LinkedIn
                      </a>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d89717.47034519996!2d28.5831228!3d44.1598013!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40bae0ba0a462f71%3A0x5765bc591a20fdd6!2sConstan%C8%9Ba!5e0!3m2!1sen!2sro!4v1"
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Location - Constanța, Romania"
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

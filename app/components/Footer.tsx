import NavLogo from './NavLogo';

export default function Footer() {
  return (
    <footer className="bg-black/40 backdrop-blur-xl border-t border-white/10 py-12 px-6" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Column 1 — Brand */}
          <div>
            <NavLogo />
            <p className="text-gray-400 mt-3">Comsa Claudiu</p>
            <p className="text-gray-500 text-sm mt-2">Building digital solutions that drive results.</p>
          </div>

          {/* Column 2 — Quick Links */}
          <nav aria-label="Footer navigation">
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <a href="/#home" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit">Home</a>
            <a href="/#about" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit">About</a>
            <a href="/#services" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit">Services</a>
            <a href="/#projects" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit">Projects</a>
            <a href="/#contact" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit">Contact</a>
          </nav>

          {/* Column 3 — Connect */}
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <a href="https://github.com/ClaudiuNSL" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit" aria-label="GitHub profile">GitHub</a>
            <a href="https://www.linkedin.com/in/claudiu-comsa-72b552364/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit" aria-label="LinkedIn profile">LinkedIn</a>
            <a href="mailto:claudiucomsa29@gmail.com" className="text-gray-400 hover:text-[#06B6D4] transition-colors block mb-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded w-fit" aria-label="Send email">Email</a>
          </div>
        </div>

        {/* Bottom divider + copyright */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Comsa Claudiu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';

const testimonials = [
  { quote: 'Mulțumit de servicii, Profi și rapiditate.', name: 'zlat3', role: 'Google Review' },
  { quote: 'Implicat si pasionat de site-urile care le construiește.', name: 'Banciu Costin', role: 'Google Review' },
  { quote: 'Recomand cu încredere tuturor celor care își doresc un site de calitate, realizat cu pasiune și seriozitate. Cu siguranță voi reveni și pentru alte proiecte!', name: 'Monica Crișu', role: 'Google Review' },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % testimonials.length);
  }, [current, goTo]);

  // Auto-rotate
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const t = testimonials[current];

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Main testimonial card */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-10 md:p-12 text-center min-h-[320px] flex flex-col justify-center">
        <span className="text-[#06B6D4] text-6xl font-serif leading-none block mb-4" aria-hidden="true">&ldquo;</span>
        <p
          className={`text-gray-200 text-lg md:text-xl leading-relaxed italic mb-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          {t.quote}
        </p>
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-[#06B6D4] mb-3 text-lg" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <cite className="not-italic">
            <div className="text-white font-semibold text-lg">{t.name}</div>
            <div className="text-gray-400 text-sm">{t.role}</div>
          </cite>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-3 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 ${
              i === current
                ? 'bg-[#06B6D4] w-8'
                : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => goTo((current - 1 + testimonials.length) % testimonials.length)}
        className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
        aria-label="Previous testimonial"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={() => goTo((current + 1) % testimonials.length)}
        className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
        aria-label="Next testimonial"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

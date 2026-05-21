'use client';

import Link from 'next/link';
import { useMemo } from 'react';

export default function NotFound() {
  // Generate particles once on mount to avoid hydration mismatch
  const particles = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      size: 3 + (i % 5) * 2,
      left: (i * 7.3 + 5) % 100,
      delay: (i * 0.8) % 6,
      duration: 8 + (i % 4) * 3,
      opacity: 0.15 + (i % 3) * 0.1,
    }));
  }, []);

  return (
    <>
      <style>{`
        /* ── Glitch Effect ── */
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          2% { transform: translate(-3px, 1px); }
          4% { transform: translate(3px, -1px); }
          6% { transform: translate(-2px, -2px); }
          8% { transform: translate(2px, 2px); }
          10% { transform: translate(0); }
          50% { transform: translate(0); }
          52% { transform: translate(2px, -1px); }
          54% { transform: translate(-3px, 2px); }
          56% { transform: translate(1px, -2px); }
          58% { transform: translate(0); }
        }

        @keyframes glitch-before {
          0%, 100% { clip-path: inset(0 0 80% 0); transform: translate(-4px, -2px); }
          10% { clip-path: inset(20% 0 60% 0); transform: translate(4px, 2px); }
          20% { clip-path: inset(40% 0 30% 0); transform: translate(-3px, 1px); }
          30% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -1px); }
          40% { clip-path: inset(10% 0 70% 0); transform: translate(-2px, 3px); }
          50% { clip-path: inset(30% 0 50% 0); transform: translate(2px, -3px); }
          60% { clip-path: inset(70% 0 5% 0); transform: translate(-4px, 2px); }
          70% { clip-path: inset(5% 0 75% 0); transform: translate(4px, -2px); }
          80% { clip-path: inset(50% 0 20% 0); transform: translate(-3px, -1px); }
          90% { clip-path: inset(15% 0 65% 0); transform: translate(3px, 1px); }
        }

        @keyframes glitch-after {
          0%, 100% { clip-path: inset(80% 0 0 0); transform: translate(4px, 2px); }
          10% { clip-path: inset(50% 0 20% 0); transform: translate(-4px, -2px); }
          20% { clip-path: inset(10% 0 60% 0); transform: translate(3px, -1px); }
          30% { clip-path: inset(30% 0 40% 0); transform: translate(-3px, 1px); }
          40% { clip-path: inset(70% 0 5% 0); transform: translate(2px, -3px); }
          50% { clip-path: inset(5% 0 75% 0); transform: translate(-2px, 3px); }
          60% { clip-path: inset(40% 0 30% 0); transform: translate(4px, -2px); }
          70% { clip-path: inset(60% 0 15% 0); transform: translate(-4px, 2px); }
          80% { clip-path: inset(20% 0 50% 0); transform: translate(3px, 1px); }
          90% { clip-path: inset(75% 0 0 0); transform: translate(-3px, -1px); }
        }

        .glitch-text {
          position: relative;
          display: inline-block;
          animation: glitch 4s infinite;
        }

        .glitch-text::before,
        .glitch-text::after {
          content: '404';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
        }

        .glitch-text::before {
          color: #06B6D4;
          animation: glitch-before 3s infinite linear;
          text-shadow: -2px 0 #06B6D4;
          opacity: 0.8;
        }

        .glitch-text::after {
          color: #ef4444;
          animation: glitch-after 2.5s infinite linear reverse;
          text-shadow: 2px 0 #ef4444;
          opacity: 0.6;
        }

        /* ── Floating Particles ── */
        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1);
            opacity: 0;
          }
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: float-up linear infinite;
        }

        /* ── Fade-in Entry ── */
        @keyframes fadeSlideUp {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-slide-up {
          animation: fadeSlideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
        }

        .fade-slide-up-d1 { animation-delay: 0.1s; }
        .fade-slide-up-d2 { animation-delay: 0.25s; }
        .fade-slide-up-d3 { animation-delay: 0.4s; }
        .fade-slide-up-d4 { animation-delay: 0.55s; }
        .fade-slide-up-d5 { animation-delay: 0.7s; }

        /* ── CC Logo Glow Pulse ── */
        @keyframes glowPulse {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.5))
                    drop-shadow(0 0 30px rgba(56, 189, 248, 0.2));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.8))
                    drop-shadow(0 0 50px rgba(56, 189, 248, 0.4));
          }
        }

        .cc-logo-404 {
          display: inline-flex;
          font-size: 5rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
          font-family: 'Segoe UI', system-ui, sans-serif;
          animation: glowPulse 3s ease-in-out infinite;
        }

        .cc-logo-404-c1 {
          background: linear-gradient(135deg, #38bdf8 0%, #06B6D4 40%, #0284c7 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cc-logo-404-c2 {
          margin-left: -0.08em;
          background: linear-gradient(135deg, #94a3b8 0%, #e2e8f0 50%, #64748b 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Button Glow ── */
        .btn-glow {
          position: relative;
          transition: all 0.3s ease;
        }

        .btn-glow::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #06B6D4, #38bdf8, #0284c7);
          opacity: 0;
          z-index: -1;
          filter: blur(12px);
          transition: opacity 0.3s ease;
        }

        .btn-glow:hover::before {
          opacity: 0.7;
        }

        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(6, 182, 212, 0.4),
                      0 0 50px rgba(6, 182, 212, 0.15);
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center px-6 overflow-hidden relative">
        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: '-20px',
              background: `radial-gradient(circle, rgba(6, 182, 212, ${p.opacity + 0.2}) 0%, rgba(6, 182, 212, 0) 70%)`,
              boxShadow: `0 0 ${p.size * 2}px rgba(6, 182, 212, ${p.opacity})`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Subtle radial glow behind content */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '600px',
            height: '600px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="text-center max-w-lg relative z-10">
          {/* Animated CC Logo */}
          <div className="fade-slide-up fade-slide-up-d1 mb-6">
            <span className="cc-logo-404" aria-hidden="true">
              <span className="cc-logo-404-c1">C</span>
              <span className="cc-logo-404-c2">C</span>
            </span>
          </div>

          {/* Glitch 404 */}
          <div className="fade-slide-up fade-slide-up-d2 mb-4">
            <span
              className="glitch-text text-[8rem] sm:text-[10rem] font-black leading-none"
              style={{
                color: '#06B6D4',
                textShadow: '0 0 30px rgba(6,182,212,0.3)',
              }}
            >
              404
            </span>
          </div>

          {/* Title */}
          <h1 className="fade-slide-up fade-slide-up-d3 text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Page Not Found
          </h1>

          {/* Fun message */}
          <p className="fade-slide-up fade-slide-up-d4 text-gray-400 mb-10 leading-relaxed text-lg max-w-md mx-auto">
            Looks like you&apos;ve ventured into uncharted territory.
            <br />
            <span className="text-gray-500 text-base">
              This page doesn&apos;t exist — but your next project might start right here.
            </span>
          </p>

          {/* Back to Home Button */}
          <div className="fade-slide-up fade-slide-up-d5">
            <Link
              href="/"
              className="btn-glow inline-block bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold px-10 py-3.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Back to Home &rarr;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState, FormEvent } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/xkovzrpr', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-8">
      <h3 className="text-2xl font-semibold text-white mb-6">Send a Message</h3>

      {status === 'success' ? (
        <div
          role="alert"
          aria-live="polite"
          className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center"
        >
          <svg
            className="w-12 h-12 text-green-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-300 font-semibold text-lg">Message sent!</p>
          <p className="text-gray-400 text-sm mt-1">I&apos;ll get back to you as soon as possible.</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-4 text-sm text-[#06B6D4] hover:text-[#0891B2] underline transition-colors"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                required
                autoComplete="name"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-[#06B6D4] focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus:outline-none transition-colors text-white placeholder-gray-400"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-[#06B6D4] focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus:outline-none transition-colors text-white placeholder-gray-400"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              name="subject"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-[#06B6D4] focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus:outline-none transition-colors text-white placeholder-gray-400"
              placeholder="What do you want to discuss?"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={5}
              name="message"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-[#06B6D4] focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus:outline-none transition-colors resize-none text-white placeholder-gray-400"
              placeholder="Tell me more about your project..."
            />
          </div>

          {status === 'error' && (
            <div role="alert" aria-live="assertive" className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-300 text-sm">Something went wrong. Please try again or email me directly.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-[#06B6D4] hover:bg-[#0891B2] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {status === 'submitting' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Or email me directly at{' '}
          <a
            href="mailto:claudiucomsa29@gmail.com"
            className="font-semibold text-white hover:text-[#0891B2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded"
          >
            claudiucomsa29@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

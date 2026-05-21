'use client';

// Formular de contact — stilizare flat (fără card), traduceri prin next-intl
import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const t = useTranslations('contact');
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

  if (status === 'success') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="border-b border-green-500/40 py-6"
      >
        <p className="text-green-300 font-semibold text-lg">Message sent!</p>
        <p className="text-zinc-400 text-sm mt-1">I&apos;ll get back to you as soon as possible.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-[#06B6D4] hover:text-[#0891B2] underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 rounded"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-400 mb-1">
          {t('formName')}
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          className="w-full bg-transparent border-b border-white/15 py-3 text-white placeholder-zinc-500 focus:border-[#06B6D4] focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-400 mb-1">
          {t('formEmail')}
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full bg-transparent border-b border-white/15 py-3 text-white placeholder-zinc-500 focus:border-[#06B6D4] focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-400 mb-1">
          {t('formMessage')}
        </label>
        <textarea
          id="contact-message"
          rows={4}
          name="message"
          required
          className="w-full bg-transparent border-b border-white/15 py-3 text-white placeholder-zinc-500 focus:border-[#06B6D4] focus:outline-none transition-colors resize-none"
        />
      </div>

      {status === 'error' && (
        <div role="alert" aria-live="assertive" className="border-b border-red-500/40 py-3">
          <p className="text-red-300 text-sm">Something went wrong. Please try again or email me directly.</p>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-full bg-[#06B6D4] hover:bg-[#0891B2] px-7 py-3 font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending...' : t('formSubmit')}
        </button>
      </div>
    </form>
  );
}

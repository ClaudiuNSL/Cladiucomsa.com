'use client';
// Formular contact — Formspree async submit, stari idle/submitting/success/error.
// Inputs minimaliste cu border-bottom doar, focus alb.
import { useState, type FormEvent } from 'react';
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
      <div role="alert" aria-live="polite" className="border-l border-[var(--border-soft)] py-4 pl-6">
        <p className="text-lg font-semibold text-white">{t('formSuccess')}</p>
        <p className="mt-1 text-sm text-[var(--text-mid)]">{t('formSuccessBody')}</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-mid)] underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          {t('formAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div>
        <label
          htmlFor="contact-name"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)]"
        >
          {t('formName')}
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          className="w-full border-b border-white/30 bg-transparent py-4 text-lg text-white placeholder-[var(--text-quiet)]/70 transition-colors focus:border-white focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="contact-email"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)]"
        >
          {t('formEmail')}
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full border-b border-white/30 bg-transparent py-4 text-lg text-white placeholder-[var(--text-quiet)]/70 transition-colors focus:border-white focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.3em] text-[var(--text-quiet)]"
        >
          {t('formMessage')}
        </label>
        <textarea
          id="contact-message"
          rows={4}
          name="message"
          required
          className="w-full resize-none border-b border-white/30 bg-transparent py-4 text-lg text-white placeholder-[var(--text-quiet)]/70 transition-colors focus:border-white focus:outline-none"
        />
      </div>
      {status === 'error' && (
        <div role="alert" aria-live="assertive" className="border-l border-red-500/40 py-2 pl-4">
          <p className="text-sm text-red-300">{t('formError')}</p>
        </div>
      )}
      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="group inline-flex items-center gap-3 rounded-full border border-white/20 px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.03] hover:border-white/60 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'submitting' ? t('formSubmitting') : t('formSubmit')}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </form>
  );
}

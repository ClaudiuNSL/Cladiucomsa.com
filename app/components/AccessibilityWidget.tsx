'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface A11ySettings {
  fontSize: number;
  highContrast: boolean;
  stopAnimations: boolean;
  bigCursor: boolean;
  underlineLinks: boolean;
}

const DEFAULT_SETTINGS: A11ySettings = {
  fontSize: 0,
  highContrast: false,
  stopAnimations: false,
  bigCursor: false,
  underlineLinks: false,
};

const STORAGE_KEY = 'a11y-settings';

function loadSettings(): A11ySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: A11ySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

function applySettings(settings: A11ySettings) {
  const root = document.documentElement;

  // Font size
  const sizes = ['87.5%', '93.75%', '100%', '112.5%', '125%'];
  root.style.fontSize = sizes[settings.fontSize + 2] || '100%';

  // High contrast
  root.classList.toggle('a11y-high-contrast', settings.highContrast);

  // Stop animations
  root.classList.toggle('a11y-stop-animations', settings.stopAnimations);

  // Big cursor
  root.classList.toggle('a11y-big-cursor', settings.bigCursor);

  // Underline links
  root.classList.toggle('a11y-underline-links', settings.underlineLinks);
}

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettings(loaded);
  }, []);

  const update = useCallback((partial: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      applySettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const hasChanges =
    settings.fontSize !== 0 ||
    settings.highContrast ||
    settings.stopAnimations ||
    settings.bigCursor ||
    settings.underlineLinks;

  return (
    <>
      {/* Floating button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="a11y-panel"
        aria-label={isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
        className="fixed bottom-6 right-6 z-[60] w-12 h-12 sm:w-14 sm:h-14 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-full shadow-lg flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="4.5" r="2.5" fill="currentColor" stroke="none" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5m0 0l-3 5m3-5l3 5M5 12h14" />
        </svg>
        {hasChanges && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" aria-hidden="true" />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          id="a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility settings"
          aria-modal="true"
          className="fixed bottom-20 sm:bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 z-[60] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-5 max-h-[70vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold text-lg">Accessibility</h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility settings"
              className="text-gray-400 hover:text-white p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {/* Font Size */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-sm text-gray-300 mb-3 font-medium">Text Size</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => update({ fontSize: Math.max(-2, settings.fontSize - 1) })}
                  disabled={settings.fontSize <= -2}
                  aria-label="Decrease text size"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-lg font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                >
                  A-
                </button>
                <div className="flex-1 text-center text-sm text-gray-400">
                  {settings.fontSize === 0 ? 'Default' : `${settings.fontSize > 0 ? '+' : ''}${settings.fontSize}`}
                </div>
                <button
                  onClick={() => update({ fontSize: Math.min(2, settings.fontSize + 1) })}
                  disabled={settings.fontSize >= 2}
                  aria-label="Increase text size"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-lg font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Toggle buttons */}
            <ToggleButton
              label="High Contrast"
              description="Increases color contrast"
              active={settings.highContrast}
              onClick={() => update({ highContrast: !settings.highContrast })}
            />
            <ToggleButton
              label="Stop Animations"
              description="Disables all motion"
              active={settings.stopAnimations}
              onClick={() => update({ stopAnimations: !settings.stopAnimations })}
            />
            <ToggleButton
              label="Large Cursor"
              description="Makes cursor bigger"
              active={settings.bigCursor}
              onClick={() => update({ bigCursor: !settings.bigCursor })}
            />
            <ToggleButton
              label="Underline Links"
              description="Makes links more visible"
              active={settings.underlineLinks}
              onClick={() => update({ underlineLinks: !settings.underlineLinks })}
            />
          </div>

          {/* Reset */}
          {hasChanges && (
            <button
              onClick={reset}
              className="w-full mt-4 min-h-[44px] bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50"
            >
              Reset to Default
            </button>
          )}
        </div>
      )}
    </>
  );
}

function ToggleButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={active}
      aria-label={`${label}: ${active ? 'on' : 'off'}`}
      className={`w-full min-h-[44px] flex items-center justify-between rounded-xl p-4 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50 ${
        active
          ? 'bg-[#06B6D4]/20 border-[#06B6D4]/40 text-white'
          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
      }`}
    >
      <div className="text-left">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
          active ? 'bg-[#06B6D4]' : 'bg-gray-600'
        }`}
        aria-hidden="true"
      >
        <div
          className={`w-4 h-4 bg-white rounded-full transition-transform ${
            active ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}

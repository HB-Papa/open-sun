'use client';

import { switchTheme, useTheme } from '@/lib/theme';

/**
 * Switches between the light and dark themes. The button names what it will do;
 * until the browser reports the theme it renders as a same-sized, unlabelled-icon placeholder.
 */
export function ThemeToggle({ variant = 'icon', className = '' }: { variant?: 'icon' | 'menu'; className?: string }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = theme ? `Switch to ${next} theme` : 'Switch theme';

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={() => switchTheme(next)}
        className={`flex min-h-11 items-center gap-2.5 border-b-[3px] border-transparent py-2.5 text-left text-ink ${className}`}
      >
        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center">
          {theme && (next === 'dark' ? <MoonIcon /> : <SunIcon />)}
        </span>
        {theme ? `Switch to ${next} theme` : 'Switch theme'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => switchTheme(next)}
      aria-label={label}
      title={label}
      className={`h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-line-strong bg-card text-ink hover:border-leaf ${className}`}
    >
      {theme && (next === 'dark' ? <MoonIcon /> : <SunIcon />)}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

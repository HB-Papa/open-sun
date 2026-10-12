'use client';

import { useSyncExternalStore } from 'react';
import { THEME_KEY as KEY } from './themeScript';

export type Theme = 'light' | 'dark';

const BAR = { light: '#fffdf7', dark: '#142219' };

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)');

export function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return systemDark().matches ? 'dark' : 'light';
}

/** Calls back when the visitor picks a theme or the device setting changes. */
export function subscribeTheme(onChange: () => void): () => void {
  const mq = systemDark();
  mq.addEventListener('change', onChange);
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    mq.removeEventListener('change', onChange);
    mo.disconnect();
  };
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  // The browser's own toolbar colour follows the page.
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', BAR[theme]));
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {}
}

/**
 * Switches theme with a gentle crossfade where the browser supports view transitions.
 * The short wait lets the sky (which listens for the change) repaint before the new view is captured.
 * Visitors who ask for reduced motion, and older browsers, get the switch without the fade.
 */
export function switchTheme(theme: Theme) {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !document.startViewTransition) {
    setTheme(theme);
    return;
  }
  document.startViewTransition(async () => {
    setTheme(theme);
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

/** The theme in use, or null during server rendering (before the browser can say). */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => null);
}

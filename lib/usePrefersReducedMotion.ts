'use client';

import { useSyncExternalStore } from 'react';

// A tiny stand-in for framer-motion's useReducedMotion, so pages that don't animate
// with framer-motion (like /play) don't have to load it.
const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

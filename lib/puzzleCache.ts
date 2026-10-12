'use client';

import { generatePuzzle, type Puzzle, type Variant } from './microgrid';

// Building a puzzle runs a small solver (about 0.1–0.5 s on a phone). The result is the
// same for everyone on a given day, so keep it in the visitor's browser after the first build.
const VERSION = 1;
const key = (date: string, variant: Variant, seed: string) => `opensun:puzzle:v${VERSION}:${date}:${variant}:${seed}`;

export function getPuzzle(date: string, variant: Variant = 'daily', extraSeed = ''): Puzzle {
  const k = key(date, variant, extraSeed);
  try {
    const hit = localStorage.getItem(k);
    if (hit) return JSON.parse(hit) as Puzzle;
  } catch {}
  const p = generatePuzzle(date, variant, extraSeed);
  try {
    // Drop older days' puzzles so storage stays small.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const name = localStorage.key(i);
      if (name?.startsWith('opensun:puzzle:') && !name.includes(`:${date}:`)) localStorage.removeItem(name);
    }
    localStorage.setItem(k, JSON.stringify(p));
  } catch {}
  return p;
}

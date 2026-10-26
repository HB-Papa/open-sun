'use client';

// Everything a visitor does is saved only in their own browser (localStorage).
// Storage can be missing (private windows, blocked cookies), so every access
// is wrapped and the site keeps working with in-memory state.

import { useSyncExternalStore } from 'react';
import { daysBetween, localDateKey, type Layout } from './microgrid';

export interface DailyGame {
  tries: number;
  history: boolean[][]; // lit hours for each try
  layout: Layout; // the board as the player left it
  layouts?: Layout[]; // the board as it was for each try (games saved before this was added have none)
  won: boolean;
  done: boolean;
}

export interface Progress {
  v: 1;
  games: Record<string, DailyGame>;
  streak: number;
  best: number;
  lastDone: string | null;
  // Field-note questions answered (slug -> date). A reflection only: nothing is earned.
  // Saves from before rewards were removed may still carry restDays/bonus fields; they are ignored.
  notes: Record<string, string>;
  visited: Record<string, string>; // slug -> first visit date
  histogram: [number, number, number, number]; // won in 1, 2, 3, not won
  /** When the Microgrid tutorial was first closed, so it only opens by itself once. */
  tutorialSeen?: string;
}

const KEY = 'opensun:v1';

const empty = (): Progress => ({
  v: 1,
  games: {},
  streak: 0,
  best: 0,
  lastDone: null,
  notes: {},
  visited: {},
  histogram: [0, 0, 0, 0],
});

let state: Progress | null = null;
const listeners = new Set<() => void>();

function load(): Progress {
  if (state) return state;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    state = empty();
  }
  return state!;
}

function save(next: Progress) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

export function update(fn: (p: Progress) => Progress) {
  save(fn(structuredClone(load())));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

/** Progress for client components; null during server render and hydration. */
export function useProgress(): Progress | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

// ---------- daily puzzle and streaks ----------

export function saveDaily(date: string, game: DailyGame) {
  update((p) => {
    const before = p.games[date];
    p.games[date] = game;
    if (game.done && !before?.done) finishDay(p, date, game);
    return p;
  });
}

function finishDay(p: Progress, date: string, game: DailyGame) {
  // The streak counts days played in a row; a missed day ends it.
  if (p.lastDone !== date) {
    p.streak = p.lastDone && daysBetween(p.lastDone, date) === 1 ? p.streak + 1 : 1;
    p.lastDone = date;
    p.best = Math.max(p.best, p.streak);
  }
  const slot = game.won ? Math.min(game.tries, 3) - 1 : 3;
  p.histogram[slot] += 1;
}

/** The streak as it stands today: still alive if the last game was today or yesterday, otherwise over. */
export function currentStreak(p: Progress, today = localDateKey()): number {
  if (!p.lastDone) return 0;
  return daysBetween(p.lastDone, today) <= 1 ? p.streak : 0;
}

export function stats(p: Progress) {
  const played = p.histogram.reduce((a, b) => a + b, 0);
  const wins = played - p.histogram[3];
  return { played, wins, winRate: played ? Math.round((wins / played) * 100) : 0 };
}

// ---------- reading: visits and field notes ----------

export function recordVisit(slug: string) {
  const p = load();
  if (p.visited[slug]) return;
  update((q) => {
    q.visited[slug] = localDateKey();
    return q;
  });
}

/** Remember that a reading's field-note question was answered, so it shows as done next time. */
export function recordReflection(slug: string) {
  if (load().notes[slug]) return;
  update((q) => {
    q.notes[slug] = localDateKey();
    return q;
  });
}

/** The Microgrid tutorial has been seen: it won't open by itself again. */
export function markTutorialSeen() {
  if (load().tutorialSeen) return;
  update((q) => {
    q.tutorialSeen = localDateKey();
    return q;
  });
}

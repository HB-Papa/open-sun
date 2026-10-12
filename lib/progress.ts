'use client';

// Everything a visitor does is saved only in their own browser (localStorage).
// Storage can be missing (private windows, blocked cookies), so every access
// is wrapped and the site keeps working with in-memory state.

import { useSyncExternalStore } from 'react';
import { daysBetween, localDateKey, type Layout, type Variant } from './microgrid';

export const MAX_BONUS_PER_DAY = 3;
export const MAX_REST_DAYS = 2;
export const NOTES_PER_REST_DAY = 3;

export interface DailyGame {
  tries: number;
  history: boolean[][]; // lit hours for each try
  layout: Layout; // the board as the player left it
  layouts?: Layout[]; // the board as it was for each try (games saved before this was added have none)
  won: boolean;
  done: boolean;
}

export interface BonusRound {
  id: string;
  slug: string; // the library item that earned it
  title: string;
  variant: Variant;
  game?: DailyGame;
}

export interface Progress {
  v: 1;
  games: Record<string, DailyGame>;
  streak: number;
  best: number;
  lastDone: string | null;
  restDays: number;
  restUsed: string[];
  notes: Record<string, string>; // slug -> date earned
  notesTowardRest: number;
  bonus: Record<string, BonusRound[]>; // date -> rounds
  visited: Record<string, string>; // slug -> first visit date
  histogram: [number, number, number, number]; // won in 1, 2, 3, not won
}

const KEY = 'opensun:v1';

const empty = (): Progress => ({
  v: 1,
  games: {},
  streak: 0,
  best: 0,
  lastDone: null,
  restDays: 0,
  restUsed: [],
  notes: {},
  notesTowardRest: 0,
  bonus: {},
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
  // Streak counts days played in a row. Missed days are covered by rest days if you have them.
  if (p.lastDone !== date) {
    if (!p.lastDone) p.streak = 1;
    else {
      const gap = daysBetween(p.lastDone, date);
      if (gap === 1) p.streak += 1;
      else if (gap > 1 && gap - 1 <= p.restDays) {
        p.restDays -= gap - 1;
        for (let i = 1; i < gap; i++) p.restUsed.push(addDaysKey(p.lastDone, i));
        p.streak += 1;
      } else if (gap > 1) p.streak = 1;
    }
    p.lastDone = date;
    p.best = Math.max(p.best, p.streak);
  }
  const slot = game.won ? Math.min(game.tries, 3) - 1 : 3;
  p.histogram[slot] += 1;
}

function addDaysKey(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number);
  return localDateKey(new Date(y, m - 1, d + n));
}

/** The streak as it stands today, counting rest days that would cover a gap. */
export function currentStreak(p: Progress, today = localDateKey()): { streak: number; coveredByRest: number } {
  if (!p.lastDone) return { streak: 0, coveredByRest: 0 };
  const gap = daysBetween(p.lastDone, today);
  if (gap <= 1) return { streak: p.streak, coveredByRest: 0 };
  if (gap - 1 <= p.restDays) return { streak: p.streak, coveredByRest: gap - 1 };
  return { streak: 0, coveredByRest: 0 };
}

export function stats(p: Progress) {
  const played = p.histogram.reduce((a, b) => a + b, 0);
  const wins = played - p.histogram[3];
  return { played, wins, winRate: played ? Math.round((wins / played) * 100) : 0 };
}

// ---------- reading: visits, field notes, bonus rounds ----------

export function recordVisit(slug: string) {
  const p = load();
  if (p.visited[slug]) return;
  update((q) => {
    q.visited[slug] = localDateKey();
    return q;
  });
}

const VARIANT_BY_TOPIC: [string[], Variant][] = [
  [['community-energy', 'energy-justice', 'commons', 'libraries', 'governance'], 'commons'],
  [['resilience', 'climate-futures', 'education'], 'storm'],
  [['agriculture', 'ecology', 'multispecies', 'urban', 'design'], 'garden'],
  [['fiction', 'solarpunk', 'indigenous-futures', 'degrowth', 'technology', 'justice'], 'longnight'],
];

export function variantForTopics(topics: string[]): Variant {
  for (const [list, v] of VARIANT_BY_TOPIC) if (topics.some((t) => list.includes(t))) return v;
  return 'commons';
}

export interface NoteResult {
  earned: boolean; // false if this item already gave a note
  bonus?: BonusRound;
  restDay: boolean;
  bonusCapReached: boolean;
}

export function earnFieldNote(slug: string, title: string, topics: string[]): NoteResult {
  const p = load();
  if (p.notes[slug]) return { earned: false, restDay: false, bonusCapReached: false };
  const today = localDateKey();
  let result: NoteResult = { earned: true, restDay: false, bonusCapReached: false };
  update((q) => {
    q.notes[slug] = today;
    q.notesTowardRest += 1;
    if (q.notesTowardRest >= NOTES_PER_REST_DAY) {
      q.notesTowardRest = 0;
      if (q.restDays < MAX_REST_DAYS) {
        q.restDays += 1;
        result.restDay = true;
      }
    }
    const rounds = q.bonus[today] ?? [];
    if (rounds.length < MAX_BONUS_PER_DAY) {
      const round: BonusRound = { id: `${today}-${slug}`, slug, title, variant: variantForTopics(topics) };
      q.bonus[today] = [...rounds, round];
      result = { ...result, bonus: round };
    } else result.bonusCapReached = true;
    return q;
  });
  return result;
}

export function saveBonus(date: string, id: string, game: DailyGame) {
  update((p) => {
    p.bonus[date] = (p.bonus[date] ?? []).map((b) => (b.id === id ? { ...b, game } : b));
    return p;
  });
}

export function notesToday(p: Progress, today = localDateKey()) {
  return Object.values(p.notes).filter((d) => d === today).length;
}

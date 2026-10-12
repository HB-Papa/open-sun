// Microgrid: the daily Open Sun puzzle.
//
// Everything here is pure and deterministic. A puzzle comes from a seed string
// (the local date plus an optional bonus variant), so every player gets the
// same map without a server. Only + - * / and comparisons are used on numbers,
// which keeps results identical across browsers.

export const SIZE = 5;
export const CELLS = SIZE * SIZE;
export const HOURS = 24;
export const MAX_TRIES = 3;
export const LAUNCH_DATE = '2026-10-11';

/** 'rock' is stony ground: nothing can be built on it, and power can't pass across it. */
export type Terrain = 'open' | 'ridge' | 'home' | 'tree' | 'pond' | 'rock';
export type Part = 'solar' | 'wind' | 'battery' | 'garden';
export type Layout = (Part | null)[];

export type Variant = 'daily' | 'commons' | 'storm' | 'garden' | 'longnight';

export interface Puzzle {
  seed: string;
  variant: Variant;
  terrain: Terrain[];
  budget: number;
  sun: number[]; // 0..1 per hour, after clouds
  wind: number[]; // 0..1 per hour
  sky: SkyKind[]; // display label per hour
  demandScale: number;
  /** A layout the built-in solver found that keeps all 24 hours lit. */
  solution: Layout;
  sunrise: number;
  sunset: number;
}

export type SkyKind = 'night' | 'sunny' | 'hazy' | 'cloudy';

export const PART_ORDER: Part[] = ['solar', 'wind', 'battery', 'garden'];

export const RULES = {
  solarPeak: 4,
  treeShade: 0.5,
  gardenBoost: 1.5,
  windPeak: 1.4,
  ridgeBoost: 1.5,
  windWake: 0.6,
  batteryCapacity: 6,
  batteryStart: 0.5,
  gardenHomeCooling: 0.75,
};

export const VARIANT_INFO: Record<Variant, { name: string; blurb: string }> = {
  daily: { name: 'Daily grid', blurb: 'Today’s ranked puzzle.' },
  commons: {
    name: 'Commons Day',
    blurb: 'The neighborhood pools its storage: every battery holds twice as much.',
  },
  storm: { name: 'Storm Day', blurb: 'Heavy cloud all day, but a strong wind blows in.' },
  garden: { name: 'Garden Day', blurb: 'Rooftop and community gardens keep panels extra cool.' },
  longnight: { name: 'Long Night', blurb: 'A winter day: the sun rises late and sets early.' },
};

// ---------- seeded randomness ----------

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const randInt = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
function shuffle<T>(r: Rand, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- dates ----------

export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayIndex(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function daysBetween(a: string, b: string): number {
  return dayIndex(b) - dayIndex(a);
}

export function addDays(key: string, n: number): string {
  const t = (dayIndex(key) + n) * 86400000;
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function puzzleNumber(key: string): number {
  return Math.max(1, daysBetween(LAUNCH_DATE, key) + 1);
}

// ---------- geometry ----------

export function neighbors(i: number): number[] {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  const out: number[] = [];
  if (r > 0) out.push(i - SIZE);
  if (r < SIZE - 1) out.push(i + SIZE);
  if (c > 0) out.push(i - 1);
  if (c < SIZE - 1) out.push(i + 1);
  return out;
}

export const buildable = (t: Terrain) => t === 'open' || t === 'ridge';

// ---------- weather and demand ----------

function makeWeather(r: Rand, key: string, variant: Variant) {
  const month = Number(key.split('-')[1]) || 6;
  // Longer days in (northern) summer; a gentle seasonal swing.
  const summer = 1 - Math.abs(month - 6.5) / 5.5; // 0 in Dec/Jan, 1 in Jun/Jul
  let sunrise = 7 - Math.round(summer * 2);
  let sunset = 18 + Math.round(summer * 2);
  if (variant === 'longnight') {
    sunrise = 8;
    sunset = 16;
  }
  const noon = (sunrise + sunset) / 2;
  const half = (sunset - sunrise) / 2 + 0.5;

  const sky: SkyKind[] = [];
  const cloud: number[] = new Array(HOURS).fill(1);
  // One or two cloud fronts during daylight.
  const fronts = variant === 'storm' ? 0 : randInt(r, 1, 2);
  for (let f = 0; f < fronts; f++) {
    const start = randInt(r, sunrise, sunset - 2);
    const len = randInt(r, 2, 4);
    const heavy = r() < 0.5;
    for (let h = start; h < Math.min(HOURS, start + len); h++) cloud[h] = Math.min(cloud[h], heavy ? 0.3 : 0.6);
  }
  if (variant === 'storm') cloud.fill(0.3);

  const sun: number[] = [];
  for (let h = 0; h < HOURS; h++) {
    const x = (h + 0.5 - noon) / half;
    const clear = h >= sunrise && h < sunset ? Math.max(0, 1 - x * x) : 0;
    sun.push(clear * cloud[h]);
    if (clear === 0) sky.push('night');
    else sky.push(cloud[h] >= 1 ? 'sunny' : cloud[h] >= 0.6 ? 'hazy' : 'cloudy');
  }

  // Wind: a smoothed random walk, often stronger at night.
  const wind: number[] = [];
  let w = 0.15 + r() * 0.45;
  for (let h = 0; h < HOURS; h++) {
    w += (r() - 0.5) * 0.35;
    const nightLift = h < sunrise || h >= sunset ? 0.1 : -0.06;
    w = Math.min(0.95, Math.max(0.05, w + nightLift * 0.5));
    wind.push(Math.round(w * 100) / 100);
  }
  if (variant === 'storm') for (let h = 0; h < HOURS; h++) wind[h] = Math.min(1, wind[h] + 0.35);

  return { sun, wind, sky, sunrise, sunset };
}

const DEMAND_SHAPE = [
  0.6, 0.55, 0.5, 0.5, 0.55, 0.65, // 0-5
  0.9, 1.1, 1.0, 0.8, 0.7, 0.7, // 6-11
  0.75, 0.75, 0.75, 0.8, 0.9, 1.15, // 12-17
  1.3, 1.3, 1.2, 1.0, 0.85, 0.7, // 18-23
];

/** Neighborhood demand per hour before any garden cooling. */
export function baseDemand(p: Puzzle): number[] {
  const homes = p.terrain.filter((t) => t === 'home').length;
  return DEMAND_SHAPE.map((d) => d * homes * p.demandScale);
}

// ---------- simulation ----------

export interface SimResult {
  lit: boolean[];
  litCount: number;
  supply: number[];
  demand: number[];
  storage: number[]; // end-of-hour charge
  capacity: number;
  connected: boolean[]; // per cell: does this part reach the neighborhood grid?
  output: number[]; // per cell: production multiplier summary (for labels)
}

/** Which placed parts are joined to the grid: touching a home or a connected part. */
export function connectedParts(terrain: Terrain[], layout: Layout): boolean[] {
  const on = new Array(CELLS).fill(false);
  const queue: number[] = [];
  for (let i = 0; i < CELLS; i++) if (terrain[i] === 'home') queue.push(i);
  const seen = new Array(CELLS).fill(false);
  queue.forEach((i) => (seen[i] = true));
  while (queue.length) {
    const i = queue.shift()!;
    for (const n of neighbors(i)) {
      if (seen[n] || !layout[n]) continue;
      seen[n] = true;
      on[n] = true;
      queue.push(n);
    }
  }
  return on;
}

export function cellMultipliers(p: Puzzle, layout: Layout, connected: boolean[]): number[] {
  const mult = new Array(CELLS).fill(0);
  const gardenBoost = p.variant === 'garden' ? 1.9 : RULES.gardenBoost;
  for (let i = 0; i < CELLS; i++) {
    const part = layout[i];
    if (!part || !connected[i]) continue;
    const ns = neighbors(i);
    if (part === 'solar') {
      let m = 1;
      if (ns.some((n) => p.terrain[n] === 'tree')) m *= RULES.treeShade;
      if (ns.some((n) => layout[n] === 'garden' && connected[n])) m *= gardenBoost;
      mult[i] = m;
    } else if (part === 'wind') {
      let m = 1;
      if (p.terrain[i] === 'ridge') m *= RULES.ridgeBoost;
      if (ns.some((n) => layout[n] === 'wind')) m *= RULES.windWake;
      mult[i] = m;
    } else {
      mult[i] = 1;
    }
  }
  return mult;
}

export function homeDemandFactors(p: Puzzle, layout: Layout, connected: boolean[]): number[] {
  // Per home: 1, or less in the afternoon if a connected garden shades it.
  const out: number[] = [];
  for (let i = 0; i < CELLS; i++) {
    if (p.terrain[i] !== 'home') continue;
    const cooled = neighbors(i).some((n) => layout[n] === 'garden' && connected[n]);
    out.push(cooled ? 1 : 0);
  }
  return out;
}

export function simulate(p: Puzzle, layout: Layout, demandScale = p.demandScale): SimResult {
  const connected = connectedParts(p.terrain, layout);
  const mult = cellMultipliers(p, layout, connected);
  const cooled = homeDemandFactors(p, layout, connected);
  const homes = cooled.length;
  const nCooled = cooled.reduce((a, b) => a + b, 0);
  let solarMult = 0;
  let windMult = 0;
  let batteries = 0;
  for (let i = 0; i < CELLS; i++) {
    if (!connected[i]) continue;
    if (layout[i] === 'solar') solarMult += mult[i];
    else if (layout[i] === 'wind') windMult += mult[i];
    else if (layout[i] === 'battery') batteries += 1;
  }
  const perBattery = RULES.batteryCapacity * (p.variant === 'commons' ? 2 : 1);
  const capacity = batteries * perBattery;
  let stored = capacity * RULES.batteryStart;
  const lit: boolean[] = [];
  const supply: number[] = [];
  const demand: number[] = [];
  const storage: number[] = [];
  for (let h = 0; h < HOURS; h++) {
    const s = RULES.solarPeak * solarMult * p.sun[h] + RULES.windPeak * windMult * p.wind[h];
    const afternoon = h >= 12 && h <= 18;
    const homeLoad = afternoon ? homes - nCooled + nCooled * RULES.gardenHomeCooling : homes;
    const d = DEMAND_SHAPE[h] * homeLoad * demandScale;
    let ok: boolean;
    if (s + 1e-9 >= d) {
      stored = Math.min(capacity, stored + (s - d));
      ok = true;
    } else if (stored + 1e-9 >= d - s) {
      stored -= d - s;
      ok = true;
    } else {
      stored = 0;
      ok = false;
    }
    lit.push(ok);
    supply.push(s);
    demand.push(d);
    storage.push(stored);
  }
  return {
    lit,
    litCount: lit.filter(Boolean).length,
    supply,
    demand,
    storage,
    capacity,
    connected,
    output: mult,
  };
}

/** The largest demand scale at which this layout keeps all 24 hours lit. */
export function maxScale(p: Puzzle, layout: Layout): number {
  let lo = 0;
  let hi = 8;
  if (simulate(p, layout, hi).litCount === HOURS) return hi;
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2;
    if (simulate(p, layout, mid).litCount === HOURS) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function countParts(layout: Layout): number {
  return layout.filter(Boolean).length;
}

// ---------- solver ----------

/**
 * Simulated annealing over layouts within the part budget, maximising the
 * demand the layout can carry for all 24 hours. Deterministic for a given rng.
 */
export function solve(p: Puzzle, r: Rand, iterations = 2500): { layout: Layout; scale: number } {
  const free = p.terrain.map((t, i) => (buildable(t) ? i : -1)).filter((i) => i >= 0);
  let best: Layout = new Array(CELLS).fill(null);
  let bestScore = -1;

  for (let restart = 0; restart < 3; restart++) {
    // Start from a connected seed layout grown out of the homes.
    let cur: Layout = new Array(CELLS).fill(null);
    const homeAdj = shuffle(
      r,
      free.filter((i) => neighbors(i).some((n) => p.terrain[n] === 'home')),
    );
    const starter: Part[] = ['solar', 'battery', 'wind', 'solar', 'battery', 'wind', 'solar', 'garden'];
    for (let k = 0; k < Math.min(p.budget, homeAdj.length); k++) cur[homeAdj[k]] = starter[k % starter.length];
    let curScore = maxScale(p, cur);
    let temp = 0.3;
    for (let it = 0; it < iterations; it++) {
      const next = cur.slice();
      const move = r();
      const cell = free[Math.floor(r() * free.length)];
      if (move < 0.5) {
        // Change or place a part.
        const part = PART_ORDER[Math.floor(r() * PART_ORDER.length)];
        if (!next[cell] && countParts(next) >= p.budget) continue;
        next[cell] = part;
      } else if (move < 0.8) {
        // Move a part to an empty cell.
        const filled = free.filter((i) => next[i]);
        const empty = free.filter((i) => !next[i]);
        if (!filled.length || !empty.length) continue;
        const from = filled[Math.floor(r() * filled.length)];
        const to = empty[Math.floor(r() * empty.length)];
        next[to] = next[from];
        next[from] = null;
      } else {
        next[cell] = null;
      }
      const score = maxScale(p, next);
      // Accept worse layouts sometimes (a rational stand-in for exp(), which can
      // differ in the last bit between JavaScript engines).
      if (score >= curScore || r() < temp / (temp + (curScore - score) * 4)) {
        cur = next;
        curScore = score;
        if (score > bestScore) {
          bestScore = score;
          best = next.slice();
        }
      }
      temp = Math.max(0.005, temp * 0.997);
    }
  }
  return { layout: best, scale: bestScore };
}

// ---------- generation ----------

/** Demand is set to this fraction of the solver's best, so good human layouts can win. */
export const SLACK = 0.78;

/**
 * Puzzles from this date on are harder: demand sits closer to the best possible layout,
 * and a few rocky plots break up easy routes. Earlier dates keep the original puzzles
 * exactly, so nobody's saved board changes underneath them.
 */
export const HARDER_FROM = '2026-10-13';

export interface Difficulty {
  /** Demand as a fraction of the solver's best layout. */
  slack: number;
  /** Unbuildable rocky plots on the map. */
  rocks: number;
}

/** Monday is the gentlest day and Sunday the hardest, like many daily puzzles. */
const WEEK: Difficulty[] = [
  { slack: 0.97, rocks: 3 }, // Sunday
  { slack: 0.88, rocks: 1 }, // Monday
  { slack: 0.9, rocks: 2 }, // Tuesday
  { slack: 0.92, rocks: 2 }, // Wednesday
  { slack: 0.93, rocks: 2 }, // Thursday
  { slack: 0.94, rocks: 3 }, // Friday
  { slack: 0.95, rocks: 3 }, // Saturday
];

/** For tuning only: replaces the weekly table (used by the difficulty measurement script). */
export const difficultyOverride: { value: Difficulty | null } = { value: null };

const weekday = (key: string) => (((dayIndex(key) + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday

export function difficultyFor(dateKey: string, variant: Variant = 'daily'): Difficulty {
  if (daysBetween(HARDER_FROM, dateKey) < 0) return { slack: SLACK, rocks: 0 };
  const d = difficultyOverride.value ?? WEEK[weekday(dateKey)];
  // Bonus grids are just for fun, so they stay a notch gentler than the day's ranked grid.
  return variant === 'daily' ? d : { slack: Math.min(d.slack, 0.88), rocks: Math.min(d.rocks, 1) };
}

export function weekdayName(dateKey: string): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday(dateKey)];
}

const cache = new Map<string, Puzzle>();

export function generatePuzzle(dateKey: string, variant: Variant = 'daily', extraSeed = ''): Puzzle {
  const seed = `open-sun:${dateKey}:${variant}:${extraSeed}`;
  const hit = cache.get(seed);
  if (hit) return hit;
  const r = mulberry32(hashString(seed));
  const level = difficultyFor(dateKey, variant);

  for (let attempt = 0; attempt < 12; attempt++) {
    const terrain: Terrain[] = new Array(CELLS).fill('open');
    const order = shuffle(r, Array.from({ length: CELLS }, (_, i) => i));
    const interior = order.filter((i) => {
      const rr = Math.floor(i / SIZE);
      const cc = i % SIZE;
      return rr > 0 && rr < SIZE - 1 && cc > 0 && cc < SIZE - 1;
    });
    const nHomes = randInt(r, 3, 5);
    // Homes: mostly interior so they have room around them.
    const homes: number[] = [];
    for (const i of interior.concat(order)) {
      if (homes.length >= nHomes) break;
      if (homes.includes(i)) continue;
      // Avoid homes touching each other on all sides.
      if (neighbors(i).filter((n) => homes.includes(n)).length > 1) continue;
      homes.push(i);
    }
    homes.forEach((i) => (terrain[i] = 'home'));
    const rest = order.filter((i) => terrain[i] === 'open');
    const nTrees = randInt(r, 2, 4);
    let k = 0;
    for (; k < nTrees; k++) terrain[rest[k]] = 'tree';
    if (r() < 0.5) terrain[rest[k++]] = 'pond';
    // Rocky plots, kept off the cells right next to homes so every home can still be reached.
    if (level.rocks > 0) {
      rest
        .slice(k)
        .filter((i) => !neighbors(i).some((n) => terrain[n] === 'home'))
        .slice(0, level.rocks)
        .forEach((i) => (terrain[i] = 'rock'));
    }
    // Ridges sit on the edges of the map.
    const edges = rest.slice(k).filter((i) => terrain[i] === 'open').filter((i) => {
      const rr = Math.floor(i / SIZE);
      const cc = i % SIZE;
      return rr === 0 || cc === 0 || rr === SIZE - 1 || cc === SIZE - 1;
    });
    const nRidges = randInt(r, 2, 3);
    edges.slice(0, nRidges).forEach((i) => (terrain[i] = 'ridge'));

    const weather = makeWeather(r, dateKey, variant);
    const budget = Math.min(9, nHomes + randInt(r, 3, 4));
    const base: Puzzle = {
      seed,
      variant,
      terrain,
      budget,
      ...weather,
      demandScale: 1,
      solution: new Array(CELLS).fill(null),
    };
    const { layout, scale } = solve(base, r);
    if (scale <= 0.05) continue; // degenerate map; try another
    // Leave a little slack below the solver's best so good human layouts win.
    const demandScale = Math.floor(scale * level.slack * 1000) / 1000;
    const puzzle: Puzzle = { ...base, demandScale, solution: layout };
    if (simulate(puzzle, layout).litCount !== HOURS) continue; // should never happen
    cache.set(seed, puzzle);
    return puzzle;
  }
  throw new Error(`Could not generate a solvable puzzle for ${seed}`);
}

// ---------- sharing ----------

export function shareText(num: number, won: boolean, tries: number, lit: boolean[], bonusName?: string) {
  const title = bonusName ? `Open Sun · ${bonusName} (bonus) · Microgrid #${num}` : `Open Sun · Microgrid #${num}`;
  const hours = lit.filter(Boolean).length;
  const line = won
    ? `☀️ ${hours}/24 hours lit in ${tries} ${tries === 1 ? 'try' : 'tries'}`
    : `🌙 ${hours}/24 hours lit after ${tries} tries`;
  const strip = lit.map((ok) => (ok ? '🟨' : '⬛')).join('');
  const plain = won
    ? `Open Sun Microgrid #${num}: kept all 24 hours lit on try ${tries} of ${MAX_TRIES}.`
    : `Open Sun Microgrid #${num}: lit ${hours} of 24 hours after ${tries} tries.`;
  return { emoji: `${title}\n${line}\n${strip.slice(0, 12)}\n${strip.slice(12)}`, plain };
}

/** Describe the dark hours in words, for screen readers and color-blind players. */
export function describeHours(lit: boolean[]): string {
  const dark: string[] = [];
  let h = 0;
  while (h < HOURS) {
    if (lit[h]) {
      h++;
      continue;
    }
    const start = h;
    while (h < HOURS && !lit[h]) h++;
    dark.push(start === h - 1 ? hourLabel(start) : `${hourLabel(start)} to ${hourLabel(h - 1)}`);
  }
  const n = lit.filter(Boolean).length;
  if (!dark.length) return 'All 24 hours lit.';
  return `${n} of 24 hours lit. Dark: ${dark.join(', ')}.`;
}

export function hourLabel(h: number): string {
  if (h === 0) return 'midnight';
  if (h === 12) return 'noon';
  return h < 12 ? `${h} am` : `${h - 12} pm`;
}

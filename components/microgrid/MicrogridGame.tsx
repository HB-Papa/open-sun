'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  baseDemand,
  buildable,
  cellMultipliers,
  connectedParts,
  countParts,
  CELLS,
  describeHours,
  generatePuzzle,
  HOURS,
  MAX_TRIES,
  neighbors,
  puzzleNumber,
  RULES,
  shareText,
  simulate,
  SIZE,
  VARIANT_INFO,
  type Layout,
  type Part,
  type Puzzle,
  type SimResult,
  type Terrain,
  type Variant,
} from '@/lib/microgrid';
import type { DailyGame } from '@/lib/progress';
import { BatteryIcon, GardenIcon, HomeIcon, PondIcon, RidgeMark, SolarIcon, TreeIcon, WindIcon } from '@/components/icons';
import { ForecastChart, ResultChart } from './DayCharts';

type Tool = Part | 'clear';

const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: 'solar', label: 'Solar', key: '1' },
  { id: 'wind', label: 'Wind', key: '2' },
  { id: 'battery', label: 'Battery', key: '3' },
  { id: 'garden', label: 'Garden', key: '4' },
  { id: 'clear', label: 'Clear', key: '5' },
];

const PART_NAME: Record<Part, string> = { solar: 'Solar panel', wind: 'Wind turbine', battery: 'Battery', garden: 'Garden' };
const TERRAIN_NAME: Record<Terrain, string> = { open: 'Open ground', ridge: 'Windy ridge', home: 'Home', tree: 'Tree', pond: 'Pond' };

const PART_BG: Record<Part, string> = { solar: '#1F6F78', wind: '#FFFDF7', battery: '#2F6B45', garden: '#CFE3D3' };
const TERRAIN_BG: Record<Terrain, string> = { open: '#CFE3D3', ridge: '#BFD3A6', home: '#F3E3B5', tree: '#A9C48E', pond: '#A9C48E' };

export interface GameProps {
  date: string;
  variant: Variant;
  extraSeed?: string;
  saved?: DailyGame;
  onSave: (g: DailyGame) => void;
  ranked: boolean;
}

export function MicrogridGame({ date, variant, extraSeed = '', saved, onSave, ranked }: GameProps) {
  const reduceMotion = useReducedMotion();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Puzzle generation runs a small solver (~0.1–0.5 s), so do it after first paint.
  useEffect(() => {
    setPuzzle(null);
    const t = setTimeout(() => {
      try {
        setPuzzle(generatePuzzle(date, variant, extraSeed));
      } catch (e) {
        setError(String(e));
      }
    }, 30);
    return () => clearTimeout(t);
  }, [date, variant, extraSeed]);

  if (error) return <p role="alert">Sorry, today’s grid could not be drawn. Please reload the page.</p>;
  if (!puzzle)
    return (
      <p className="py-16 text-center text-lg text-muted" role="status">
        Drawing today’s map…
      </p>
    );
  return <Board key={puzzle.seed} puzzle={puzzle} date={date} saved={saved} onSave={onSave} ranked={ranked} reduceMotion={!!reduceMotion} />;
}

function Board({
  puzzle,
  date,
  saved,
  onSave,
  ranked,
  reduceMotion,
}: {
  puzzle: Puzzle;
  date: string;
  saved?: DailyGame;
  onSave: (g: DailyGame) => void;
  ranked: boolean;
  reduceMotion: boolean;
}) {
  const [layout, setLayout] = useState<Layout>(() => saved?.layout ?? new Array(CELLS).fill(null));
  const [history, setHistory] = useState<boolean[][]>(() => saved?.history ?? []);
  const [tool, setTool] = useState<Tool>('solar');
  const [focus, setFocus] = useState(() => puzzle.terrain.findIndex(buildable));
  const [anim, setAnim] = useState<{ sim: SimResult; hour: number } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [notice, setNotice] = useState('');
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tries = history.length;
  const won = history.some((h) => h.every(Boolean));
  const done = won || tries >= MAX_TRIES;
  const running = anim !== null && anim.hour < HOURS - 1;
  const used = countParts(layout);
  const connected = useMemo(() => connectedParts(puzzle.terrain, layout), [puzzle, layout]);
  const mult = useMemo(() => cellMultipliers(puzzle, layout, connected), [puzzle, layout, connected]);
  const demand = useMemo(() => baseDemand(puzzle), [puzzle]);
  const lastSim = useMemo(() => (tries ? simulate(puzzle, layout) : null), [puzzle, layout, tries]);
  const shownSim = anim?.sim ?? null;
  const shownHour = anim?.hour ?? -1;
  const lastLit = history[tries - 1];

  // Persist the board as the player edits it.
  const persist = useCallback(
    (next: Partial<DailyGame>) => {
      const h = next.history ?? history;
      const w = h.some((x) => x.every(Boolean));
      onSave({ tries: h.length, history: h, layout: next.layout ?? layout, won: w, done: w || h.length >= MAX_TRIES });
    },
    [history, layout, onSave],
  );

  function place(i: number) {
    if (done || running) return;
    const t = puzzle.terrain[i];
    if (!buildable(t)) {
      setNotice(`${TERRAIN_NAME[t]}: nothing can be built here.`);
      return;
    }
    const next = layout.slice();
    if (tool === 'clear' || next[i] === tool) next[i] = null;
    else {
      if (!next[i] && used >= puzzle.budget) {
        setNotice(`You have used all ${puzzle.budget} parts. Clear one first.`);
        return;
      }
      next[i] = tool;
    }
    setNotice(next[i] ? `${PART_NAME[next[i]!]} placed. ${used + (layout[i] ? 0 : 1)} of ${puzzle.budget} parts used.` : `Cleared. ${countParts(next)} of ${puzzle.budget} parts used.`);
    setLayout(next);
    persist({ layout: next });
  }

  function run() {
    if (done || running || used === 0) return;
    const sim = simulate(puzzle, layout);
    const nextHistory = [...history, sim.lit];
    setHistory(nextHistory);
    persist({ history: nextHistory });
    const msg = sim.litCount === HOURS ? 'Every hour stayed lit!' : describeHours(sim.lit);
    if (reduceMotion) {
      setAnim({ sim, hour: HOURS - 1 });
      setNotice(msg);
      return;
    }
    setAnim({ sim, hour: 0 });
    let h = 0;
    const id = window.setInterval(() => {
      h += 1;
      setAnim({ sim, hour: h });
      if (h >= HOURS - 1) {
        window.clearInterval(id);
        setNotice(msg);
      }
    }, 70);
  }

  // Keyboard: arrows move around the grid; 1–5 pick a tool.
  function onGridKey(e: React.KeyboardEvent) {
    const r = Math.floor(focus / SIZE);
    const c = focus % SIZE;
    let n = focus;
    if (e.key === 'ArrowUp' && r > 0) n -= SIZE;
    else if (e.key === 'ArrowDown' && r < SIZE - 1) n += SIZE;
    else if (e.key === 'ArrowLeft' && c > 0) n -= 1;
    else if (e.key === 'ArrowRight' && c < SIZE - 1) n += 1;
    else if (e.key === 'Home') n = r * SIZE;
    else if (e.key === 'End') n = r * SIZE + SIZE - 1;
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (layout[focus] && !done && !running) {
        const next = layout.slice();
        next[focus] = null;
        setLayout(next);
        persist({ layout: next });
        setNotice(`Cleared. ${countParts(next)} of ${puzzle.budget} parts used.`);
      }
      return;
    } else return;
    e.preventDefault();
    setFocus(n);
    cellRefs.current[n]?.focus();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = TOOLS.find((x) => x.key === e.key);
      if (t) setTool(t.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const lightsHour = shownSim && shownHour >= 0 ? shownSim.lit[Math.min(shownHour, HOURS - 1)] : null;
  const num = puzzleNumber(date);
  const info = VARIANT_INFO[puzzle.variant];
  const share = done && lastLit ? shareText(num, won, tries, lastLit, ranked ? undefined : info.name) : null;

  function cellLabel(i: number) {
    const r = Math.floor(i / SIZE) + 1;
    const c = (i % SIZE) + 1;
    const t = puzzle.terrain[i];
    const part = layout[i];
    let s = `Row ${r}, column ${c}. ${TERRAIN_NAME[t]}`;
    if (part) {
      s += `, ${PART_NAME[part]}`;
      s += connected[i] ? partNote(i) : ', not connected to any home';
    } else if (buildable(t)) s += ', empty';
    return s + '.';
  }

  function partNote(i: number): string {
    const part = layout[i];
    const ns = neighbors(i);
    const notes: string[] = [];
    if (part === 'solar') {
      if (ns.some((n) => puzzle.terrain[n] === 'tree')) notes.push('shaded by a tree');
      if (ns.some((n) => layout[n] === 'garden' && connected[n])) notes.push('cooled by a garden');
    } else if (part === 'wind') {
      if (puzzle.terrain[i] === 'ridge') notes.push('on a windy ridge');
      if (ns.some((n) => layout[n] === 'wind')) notes.push('slowed by a nearby turbine');
    }
    return notes.length ? `, ${notes.join(', ')}` : '';
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[14px] font-bold uppercase tracking-[.08em] text-leaf-ink">
            {ranked ? `Daily puzzle · ${formatDate(date)}` : `Bonus grid · just for fun`}
          </p>
          <h1 className="font-serif text-[36px] font-bold leading-tight sm:text-[44px]">{ranked ? `Microgrid #${num}` : info.name}</h1>
          {!ranked && <p className="mt-1 text-[17px] text-body">{info.blurb}</p>}
        </div>
        <p className="text-[17px]">
          Tries left: <strong>{MAX_TRIES - tries}</strong> of {MAX_TRIES}
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        {/* ---------- the board ---------- */}
        <section aria-label="Neighborhood grid" className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5">
          <p className="text-[17px] leading-normal">
            Keep every home lit for all 24 hours using up to <strong>{puzzle.budget} parts</strong>. Pick a part, then tap a plot to place it.
          </p>

          <div role="radiogroup" aria-label="Part to place" className="flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tool === t.id}
                onClick={() => setTool(t.id)}
                disabled={done}
                className={`flex min-h-12 items-center gap-2 rounded-full border-2 px-3.5 font-bold disabled:opacity-50 ${
                  tool === t.id ? 'border-leaf bg-leaf text-white' : 'border-line-strong bg-card text-ink'
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: t.id === 'clear' ? 'transparent' : PART_BG[t.id as Part] }} aria-hidden="true">
                  {t.id === 'solar' && <SolarIcon />}
                  {t.id === 'wind' && <WindIcon />}
                  {t.id === 'battery' && <BatteryIcon />}
                  {t.id === 'garden' && <GardenIcon />}
                  {t.id === 'clear' && <span className="text-lg leading-none">×</span>}
                </span>
                {t.label}
                <kbd className="hidden text-[12px] font-normal opacity-70 md:inline" aria-hidden="true">
                  {t.key}
                </kbd>
              </button>
            ))}
          </div>

          <div
            role="grid"
            aria-label={`Microgrid map, ${SIZE} by ${SIZE}. Use arrow keys to move, Enter to place the selected part, Delete to clear.`}
            className="grid max-w-[480px] grid-cols-5 gap-2 rounded-[20px] bg-meadow p-3 sm:p-3.5"
            onKeyDown={onGridKey}
          >
            {Array.from({ length: SIZE }, (_, r) => (
              <div role="row" key={r} className="contents">
                {Array.from({ length: SIZE }, (_, c) => {
                  const i = r * SIZE + c;
                  const t = puzzle.terrain[i];
                  const part = layout[i];
                  const off = part && !connected[i];
                  const m = mult[i];
                  return (
                    <div role="gridcell" key={i} className="contents">
                      <button
                        ref={(el) => {
                          cellRefs.current[i] = el;
                        }}
                        type="button"
                        tabIndex={i === focus ? 0 : -1}
                        onFocus={() => setFocus(i)}
                        onClick={() => place(i)}
                        aria-label={cellLabel(i)}
                        aria-disabled={!buildable(t) || done}
                        className={`relative flex aspect-square min-h-11 items-center justify-center rounded-xl border-0 p-0 transition-transform duration-150 ${
                          buildable(t) && !done ? 'cursor-pointer hover:scale-[1.04]' : 'cursor-default'
                        } ${off ? 'outline-2 outline-dashed outline-terracotta' : ''}`}
                        style={{ background: part ? PART_BG[part] : TERRAIN_BG[t], opacity: off ? 0.6 : 1 }}
                      >
                        {t === 'ridge' && <RidgeMark />}
                        {t === 'home' && <HomeIcon lit={lightsHour} />}
                        {t === 'tree' && <TreeIcon />}
                        {t === 'pond' && <PondIcon />}
                        {part === 'solar' && <SolarIcon tilt={running} />}
                        {part === 'wind' && <WindIcon spin={running && !reduceMotion} />}
                        {part === 'battery' && <BatteryIcon level={shownSim && shownSim.capacity ? shownSim.storage[Math.max(0, shownHour)] / shownSim.capacity : -1} />}
                        {part === 'garden' && <GardenIcon />}
                        {part && connected[i] && (part === 'solar' || part === 'wind') && m !== 1 && (
                          <span
                            aria-hidden="true"
                            className="absolute right-1 top-1 rounded-full bg-card px-1.5 text-[11px] font-bold leading-[18px] text-ink shadow-sm"
                          >
                            ×{fmt(m)}
                          </span>
                        )}
                        {off && (
                          <span aria-hidden="true" className="absolute bottom-1 rounded-full bg-card px-1.5 text-[10px] font-bold leading-4 text-terracotta">
                            off grid
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
            <span>
              Parts used: <strong>{used}</strong> of {puzzle.budget}
            </span>
            <span className="text-muted">Homes: {puzzle.terrain.filter((t) => t === 'home').length}</span>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {notice}
          </p>
          <TerrainKey />
        </section>

        {/* ---------- the day ---------- */}
        <section aria-label="The day" className="flex min-w-0 flex-[1_1_400px] flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-card p-5">
            <h2 className="font-serif text-[22px] font-semibold">Today’s forecast</h2>
            <ForecastChart puzzle={puzzle} demand={demand} />
            <button
              type="button"
              onClick={run}
              disabled={done || running || used === 0}
              className="min-h-[52px] rounded-full bg-leaf text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? 'Running the day…' : done ? (won ? 'Solved!' : 'No tries left') : `Run the day (try ${tries + 1} of ${MAX_TRIES})`}
            </button>
            {used === 0 && !done && <p className="text-[14px] text-muted">Place at least one part to run the day.</p>}
          </div>

          {lastLit && (
            <div className="flex flex-col gap-3 rounded-[18px] bg-forest p-5 text-on-forest">
              <h2 className="font-serif text-[26px] font-semibold">
                {shownSim ? shownSim.lit.slice(0, shownHour + 1).filter(Boolean).length : lastLit.filter(Boolean).length} of 24 hours lit
              </h2>
              <ResultChart
                lit={shownSim ? shownSim.lit : lastLit}
                sim={shownSim ?? (done ? lastSim ?? undefined : undefined)}
                upTo={shownSim ? shownHour : HOURS - 1}
              />
              {!running && (
                <p className="text-base leading-normal text-on-forest-muted">
                  {won
                    ? ranked
                      ? 'Every home stayed lit all day and night. Come back tomorrow for a new grid.'
                      : 'Every home stayed lit. Nicely done!'
                    : lastLit
                      ? `${describeHours(lastLit)} ${hint(puzzle, lastLit, layout)}`
                      : ''}
                </p>
              )}
              {history.length > 1 && (
                <ol className="flex flex-wrap gap-2 text-[14px] text-on-forest-muted" aria-label="Earlier tries">
                  {history.map((h, k) => (
                    <li key={k} className="rounded-full bg-forest-2 px-3 py-1">
                      Try {k + 1}: {h.filter(Boolean).length}/24
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {done && share && !running && <SharePanel share={share} />}

          {done && !won && !running && (
            <div className="rounded-[18px] border border-line bg-card p-5">
              <button type="button" className="font-bold text-sky underline" onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution}>
                {showSolution ? 'Hide' : 'Show'} one way to light every hour
              </button>
              {showSolution && <SolutionPreview puzzle={puzzle} />}
            </div>
          )}

          <HowToPlay />
        </section>
      </div>
    </div>
  );
}

function hint(p: Puzzle, lit: boolean[], layout: Layout): string {
  const dark = lit.map((ok, h) => (ok ? -1 : h)).filter((h) => h >= 0);
  const night = dark.filter((h) => h < p.sunrise || h >= p.sunset).length;
  const hasBattery = layout.includes('battery');
  if (night > dark.length / 2) return hasBattery ? 'Nights are the hard part: more storage or wind could help.' : 'Batteries carry daytime sun into the night.';
  return 'Daytime gaps: try more panels, or move them out of the shade.';
}

function fmt(m: number) {
  return Number.isInteger(m) ? String(m) : m.toFixed(2).replace(/0$/, '');
}

function formatDate(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function TerrainKey() {
  const items: [string, React.ReactNode, string][] = [
    ['Home', <HomeIcon key="h" lit={null} />, TERRAIN_BG.home],
    ['Tree (shades panels)', <TreeIcon key="t" />, TERRAIN_BG.tree],
    ['Pond', <PondIcon key="p" />, TERRAIN_BG.pond],
    ['Windy ridge', <RidgeMark key="r" />, TERRAIN_BG.ridge],
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] text-body" aria-label="Map key">
      {items.map(([label, icon, bg]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-md" style={{ background: bg }} aria-hidden="true">
            {icon}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

function HowToPlay() {
  return (
    <details id="how" className="rounded-[18px] border border-line bg-card p-5">
      <summary className="cursor-pointer font-serif text-[20px] font-semibold">How it works</summary>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[16px] leading-normal text-body">
        <li>
          <strong>Connect everything.</strong> A part only joins the grid if it touches a home or another connected part (up, down, left, or right). Parts marked “off grid” do nothing.
        </li>
        <li>
          <strong>Solar panels</strong> follow the sun. A panel next to a tree is shaded and makes half as much. A panel next to a garden stays cool and makes {Math.round((RULES.gardenBoost - 1) * 100)}% more (that’s agrivoltaics).
        </li>
        <li>
          <strong>Wind turbines</strong> work day and night, whenever the wind blows. On a windy ridge they make {Math.round((RULES.ridgeBoost - 1) * 100)}% more, but two turbines side by side slow each other down.
        </li>
        <li>
          <strong>Batteries</strong> save extra power for later. Each one holds a few hours of evening use and starts the day half full.
        </li>
        <li>
          <strong>Gardens</strong> make no power, but they cool the panels beside them and shade homes, cutting those homes’ afternoon use by a quarter.
        </li>
        <li>
          You have <strong>three tries</strong>. After each run, the lights strip shows which hours went dark so you can adjust.
        </li>
      </ul>
    </details>
  );
}

function SolutionPreview({ puzzle }: { puzzle: Puzzle }) {
  return (
    <div className="mt-3 grid max-w-[260px] grid-cols-5 gap-1.5 rounded-xl bg-meadow p-2" role="img" aria-label={solutionText(puzzle)}>
      {puzzle.terrain.map((t, i) => {
        const part = puzzle.solution[i];
        return (
          <div key={i} className="relative flex aspect-square items-center justify-center rounded-md" style={{ background: part ? PART_BG[part] : TERRAIN_BG[t] }}>
            {t === 'ridge' && <RidgeMark />}
            {t === 'home' && <HomeIcon lit />}
            {t === 'tree' && <TreeIcon />}
            {t === 'pond' && <PondIcon />}
            {part === 'solar' && <SolarIcon />}
            {part === 'wind' && <WindIcon />}
            {part === 'battery' && <BatteryIcon />}
            {part === 'garden' && <GardenIcon />}
          </div>
        );
      })}
    </div>
  );
}

function solutionText(p: Puzzle): string {
  const parts = p.solution
    .map((part, i) => (part ? `${PART_NAME[part]} at row ${Math.floor(i / SIZE) + 1}, column ${(i % SIZE) + 1}` : null))
    .filter(Boolean);
  return `One solution: ${parts.join('; ')}.`;
}

function SharePanel({ share }: { share: { emoji: string; plain: string } }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      setCopied('error');
    }
  }
  async function nativeShare() {
    try {
      await navigator.share({ text: share.emoji });
    } catch {
      /* cancelled */
    }
  }
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-card p-5">
      <h2 className="font-serif text-[22px] font-semibold">Share your day</h2>
      <pre className="whitespace-pre-wrap rounded-xl bg-chip p-3 font-sans text-[15px] leading-normal" aria-hidden="true">
        {share.emoji}
      </pre>
      <p className="text-[15px] text-body">
        <span className="sr-only">Share text: </span>
        {share.plain}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copy(share.emoji, 'grid')} className="min-h-12 rounded-full bg-sun px-5 font-bold text-[#1E3328]">
          Copy with emoji grid
        </button>
        <button type="button" onClick={() => copy(share.plain, 'plain')} className="min-h-12 rounded-full border-2 border-line-strong bg-card px-5 font-bold text-ink">
          Copy plain text
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button type="button" onClick={nativeShare} className="min-h-12 rounded-full border-2 border-line-strong bg-card px-5 font-bold text-ink">
            Share…
          </button>
        )}
      </div>
      <p role="status" className="min-h-[1.25em] text-[14px] text-muted">
        {copied === 'error' ? 'Could not copy. Select the text above instead.' : copied ? 'Copied to your clipboard.' : ''}
      </p>
    </div>
  );
}

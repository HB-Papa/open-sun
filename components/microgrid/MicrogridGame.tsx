'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { getPuzzle } from '@/lib/puzzleCache';
import {
  baseDemand,
  buildable,
  cellMultipliers,
  connectedParts,
  countParts,
  CELLS,
  describeHours,
  HOURS,
  MAX_TRIES,
  daysBetween,
  HARDER_FROM,
  weekdayName,
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
import { MAX_BONUS_PER_DAY, type DailyGame } from '@/lib/progress';
import { BatteryIcon, GardenIcon, HomeIcon, PondIcon, RidgeMark, RockIcon, SolarIcon, TreeIcon, WindIcon } from '@/components/icons';
import { ForecastChart, MiniForecast, ResultChart } from './DayCharts';
import { Nums } from '@/lib/nums';
import { VillageLights } from './VillageLights';

type Tool = Part;

// Tapping a placed part with its own tool removes it, so there is no separate Clear tool.
const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: 'solar', label: 'Solar', key: '1' },
  { id: 'wind', label: 'Wind', key: '2' },
  { id: 'battery', label: 'Battery', key: '3' },
  { id: 'garden', label: 'Garden', key: '4' },
];

const PART_NAME: Record<Part, string> = { solar: 'Solar panel', wind: 'Wind turbine', battery: 'Battery', garden: 'Garden' };
const TERRAIN_NAME: Record<Terrain, string> = { open: 'Open ground', ridge: 'Windy ridge', home: 'Home', tree: 'Tree', pond: 'Pond', rock: 'Rocky ground' };

// Colors come from CSS tokens so the board dims to a moonlit version in dark mode.
const PART_BG: Record<Part, string> = { solar: 'var(--g-solar)', wind: 'var(--g-wind)', battery: 'var(--g-battery)', garden: 'var(--g-garden)' };
const TERRAIN_BG: Record<Terrain, string> = { open: 'var(--g-open)', ridge: 'var(--g-ridge)', home: 'var(--g-home)', tree: 'var(--g-green)', pond: 'var(--g-green)', rock: 'var(--g-rock)' };

export interface GameProps {
  date: string;
  variant: Variant;
  extraSeed?: string;
  saved?: DailyGame;
  onSave: (g: DailyGame) => void;
  ranked: boolean;
  /** Open the rules on a player's very first visit. */
  firstVisit?: boolean;
}

export function MicrogridGame({ date, variant, extraSeed = '', saved, onSave, ranked, firstVisit = false }: GameProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Puzzle generation runs a small solver (~0.1–0.5 s), so do it after first paint.
  useEffect(() => {
    setPuzzle(null);
    const t = setTimeout(() => {
      try {
        setPuzzle(getPuzzle(date, variant, extraSeed));
      } catch (e) {
        setError(String(e));
      }
    }, 30);
    return () => clearTimeout(t);
  }, [date, variant, extraSeed]);

  if (error) return <p role="alert">Sorry, today’s grid could not be drawn. Please reload the page.</p>;
  if (!puzzle) return <BoardSkeleton label="Drawing today’s map…" />;
  return <Board key={puzzle.seed} puzzle={puzzle} date={date} saved={saved} onSave={onSave} ranked={ranked} reduceMotion={!!reduceMotion} firstVisit={firstVisit} />;
}

function Board({
  puzzle,
  date,
  saved,
  onSave,
  ranked,
  reduceMotion,
  firstVisit,
}: {
  puzzle: Puzzle;
  date: string;
  saved?: DailyGame;
  onSave: (g: DailyGame) => void;
  ranked: boolean;
  reduceMotion: boolean;
  firstVisit: boolean;
}) {
  const [layout, setLayout] = useState<Layout>(() => saved?.layout ?? new Array(CELLS).fill(null));
  const [history, setHistory] = useState<boolean[][]>(() => saved?.history ?? []);
  const [tool, setTool] = useState<Tool>('solar');
  const [focus, setFocus] = useState(() => puzzle.terrain.findIndex(buildable));
  const [anim, setAnim] = useState<{ sim: SimResult; hour: number } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [notice, setNotice] = useState('');
  // Set when the player tries to run with parts that aren't connected; a second press runs anyway.
  const [offWarning, setOffWarning] = useState(false);
  const [rulesDismissed, setRulesDismissed] = useState(false);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // "How it works" links open the rules where they are, rather than jumping away from the board.
  function openHow(e?: React.MouseEvent) {
    e?.preventDefault();
    showHow('how');
  }
  useEffect(() => {
    const go = () => {
      const target = window.location.hash.slice(1);
      if (target === 'how' || target === 'rewards') showHow(target);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, []);

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
  const offCount = layout.filter((part, i) => part && !connected[i]).length;

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
    if (next[i] === tool) next[i] = null;
    else {
      if (!next[i] && used >= puzzle.budget) {
        setNotice(`You have used all ${puzzle.budget} parts. Clear one first.`);
        return;
      }
      next[i] = tool;
    }
    setNotice(next[i] ? `${PART_NAME[next[i]!]} placed. ${used + (layout[i] ? 0 : 1)} of ${puzzle.budget} parts used.` : `Cleared. ${countParts(next)} of ${puzzle.budget} parts used.`);
    setOffWarning(false);
    setLayout(next);
    persist({ layout: next });
  }

  function run() {
    if (done || running || used === 0) return;
    if (offCount > 0 && !offWarning) {
      setOffWarning(true);
      setNotice(offText(offCount));
      return;
    }
    setOffWarning(false);
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
        setOffWarning(false);
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
      const el = e.target as HTMLElement | null;
      // Leave typing alone: inputs, selects, text areas, and anything editable.
      if (el && (el.isContentEditable || el.closest('input, textarea, select, [contenteditable], [role="combobox"], [role="textbox"]'))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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
    // Say the badge's number too, so screen-reader players get the same figure sighted players see.
    const m = mult[i];
    if ((part === 'solar' || part === 'wind') && m !== 1) notes.push(`making ${fmt(m)} times normal`);
    return notes.length ? `, ${notes.join(', ')}` : '';
  }

  const runLabel = running
    ? 'Running the day…'
    : done
      ? won
        ? 'Solved!'
        : 'No tries left'
      : used === 0
        ? 'Place a part to run the day'
        : offWarning
          ? 'Run anyway'
          : `Run the day (try ${tries + 1} of ${MAX_TRIES})`;
  // The phone thumb bar gets a shorter label.
  const barLabel = canRunNow() ? (offWarning ? 'Run anyway' : `Run the day · try ${tries + 1}/${MAX_TRIES}`) : runLabel;
  function canRunNow() {
    return !(done || running || used === 0);
  }
  const canRun = !(done || running || used === 0);
  const runClass = `min-h-[52px] rounded-full text-lede font-bold ${
    canRun ? 'bg-leaf text-white' : 'cursor-not-allowed border-2 border-dashed border-line-strong bg-transparent text-muted'
  }`;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* On phones the title and tries share one line, so the board starts higher. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:items-end md:justify-start md:gap-x-10">
        <div>
          <h1 className="font-serif text-section font-bold leading-tight sm:text-page-lg">{ranked ? `Microgrid #${num}` : info.name}</h1>
          <p className={`mt-1 text-copy text-body ${ranked ? 'hidden sm:block' : ''}`}>{ranked ? `Today’s puzzle, ${formatDate(date)}${levelLabel(date)}` : `Bonus grid, just for fun. ${info.blurb}`}</p>
        </div>
        <p className="text-copy sm:text-copy">
          Tries left: <strong className="num text-title sm:text-heading">{MAX_TRIES - tries}</strong> of <span className="num">{MAX_TRIES}</span>
        </p>
      </div>

      {/* Two columns on wide screens that end at about the same height: the board and each run's result on the left;
          the forecast, rules and the end-of-day panels on the right. On phones the columns dissolve into one, in
          source order (board, result, sharing, then the full forecast), so focus order always matches the screen. */}
      <div className="play-layout">
        <div className="play-col">
          {/* ---------- the board ---------- */}
          <section aria-label="Neighborhood grid" className="flex min-w-0 flex-col gap-2.5 sm:gap-3.5">
            {/* Rules first on phones: a short version on a first visit; the full rules sit below the board. */}
            {firstVisit && !rulesDismissed && (
              <div className="flex flex-col gap-2 rounded-[18px] border border-line bg-card p-4 md:hidden">
                <ol className="flex list-decimal flex-col gap-1 pl-5 text-small leading-snug text-body">
                  <li>Connect every part to a home, directly or through other parts.</li>
                  <li>Trees shade panels; gardens and windy ridges boost them.</li>
                  <li>Batteries carry daytime sun into the night. Then run the day.</li>
                </ol>
                <div className="flex gap-4 text-small">
                  <button type="button" className="font-bold text-sky underline" onClick={() => setRulesDismissed(true)}>
                    Got it
                  </button>
                  <a href="#how" onClick={openHow} className="font-bold">
                    Full rules
                  </a>
                </div>
              </div>
            )}
            <p className="text-small leading-snug sm:text-copy sm:leading-normal">
              <span className="sm:hidden">
                Light every hour with up to <strong>{puzzle.budget} parts</strong>. Tap a plot to place; tap again to remove.{' '}
              </span>
              <span className="hidden sm:inline">
                Keep every home lit for all 24 hours using up to <strong>{puzzle.budget} parts</strong>. Pick a part, then tap a plot; tap it again to remove it.{' '}
              </span>
              <a href="#how" onClick={openHow} className="font-bold">
                How it works
              </a>
            </p>

            <div role="radiogroup" aria-label="Part to place" className="grid max-w-[460px] grid-cols-4 gap-1.5 sm:gap-2 md:max-w-[400px]">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tool === t.id}
                  onClick={() => setTool(t.id)}
                  disabled={done}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-1 py-1.5 text-small font-bold disabled:opacity-50 sm:text-small ${
                    tool === t.id ? 'border-leaf bg-leaf text-white' : 'border-line-strong bg-card text-ink'
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: PART_BG[t.id] }} aria-hidden="true">
                    {t.id === 'solar' && <SolarIcon />}
                    {t.id === 'wind' && <WindIcon />}
                    {t.id === 'battery' && <BatteryIcon />}
                    {t.id === 'garden' && <GardenIcon />}
                  </span>
                  {t.label}
                  <kbd className="absolute right-1.5 top-1 hidden rounded border border-current px-1 text-micro font-normal leading-4 md:inline" aria-hidden="true">
                    {t.key}
                  </kbd>
                </button>
              ))}
            </div>

            {/* A compact forecast right above the board on phones, so you can plan while you place. */}
            <MiniForecast puzzle={puzzle} demand={demand} className="md:hidden" />

            <div
              role="grid"
              aria-label={`Microgrid map, ${SIZE} by ${SIZE}. Use arrow keys to move, Enter to place the selected part, Delete to clear.`}
              className="board board-fit grid grid-cols-5 gap-2 rounded-[22px] p-3 shadow-[inset_0_2px_6px_rgba(30,51,40,.15)] sm:p-3.5"
              style={{ background: 'var(--board)' }}
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
                          {t === 'rock' && <RockIcon />}
                          {part === 'solar' && <SolarIcon tilt={running} />}
                          {part === 'wind' && <WindIcon spin={running && !reduceMotion} />}
                          {part === 'battery' && <BatteryIcon level={shownSim && shownSim.capacity ? shownSim.storage[Math.max(0, shownHour)] / shownSim.capacity : -1} />}
                          {part === 'garden' && <GardenIcon />}
                          {part && connected[i] && (part === 'solar' || part === 'wind') && m !== 1 && (
                            <span aria-hidden="true" className="absolute right-1 top-1 rounded-full bg-card px-1.5 text-micro font-bold leading-[18px] text-ink shadow-sm">
                              ×{fmt(m)}
                            </span>
                          )}
                          {off && (
                            <span aria-hidden="true" className="absolute bottom-1 rounded-full bg-card px-1.5 text-micro font-bold leading-4 text-terracotta">
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

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
              <span>
                Parts used: <strong className="num">{used}</strong> of <span className="num">{puzzle.budget}</span>
              </span>
              <span className="hidden text-muted sm:inline">
                Homes: <span className="num">{puzzle.terrain.filter((t) => t === 'home').length}</span>
              </span>
            </div>
            <div className="hidden max-w-[400px] flex-col gap-2 md:flex">
              <button type="button" onClick={run} disabled={!canRun} className={runClass}>
                {runLabel}
              </button>
              {offWarning && <p className="text-small font-bold text-terracotta">{offText(offCount)}</p>}
            </div>
            <p className="sr-only" role="status" aria-live="polite">
              {notice}
            </p>
            <TerrainKey hasRock={puzzle.terrain.includes('rock')} />
            {/* On phones the full rules live below the board, one tap away from the "How it works" links. */}
            <HowToPlay open={false} id="how" className="md:hidden" />
          </section>

          {lastLit && (
            <section aria-label="The day" className="on-forest flex flex-col gap-3 rounded-[20px] bg-forest p-5 text-on-forest">
              <h2 className="font-serif text-heading font-semibold">
                <span className="num">{shownSim ? shownSim.lit.slice(0, shownHour + 1).filter(Boolean).length : lastLit.filter(Boolean).length}</span> of 24 hours lit
              </h2>
              <ResultChart
                lit={shownSim ? shownSim.lit : lastLit}
                sim={shownSim ?? (done ? lastSim ?? undefined : undefined)}
                upTo={shownSim ? shownHour : HOURS - 1}
              />
              {!running && (
                <p className="text-copy leading-normal text-on-forest-muted">
                  {won
                    ? ranked
                      ? 'Every home stayed lit all day and night. Come back tomorrow for a new grid.'
                      : 'Every home stayed lit. Nicely done!'
                    : lastLit
                      ? <Nums text={`${describeHours(lastLit)} ${hint(puzzle, lastLit, layout)}`} />
                      : ''}
                </p>
              )}
              {history.length > 1 && (
                <ol className="flex flex-wrap gap-2 text-small text-on-forest-muted" aria-label="Earlier tries">
                  {history.map((h, k) => (
                    <li key={k} className="rounded-full bg-forest-2 px-3 py-1">
                      Try {k + 1}: {h.filter(Boolean).length}/24
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
          {/* The worked solution is a small board, so it sits under the real one. */}
          {done && !won && !running && (
            <div className="rounded-[20px] border border-line bg-card p-5">
              <button type="button" className="font-bold text-sky underline" onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution}>
                {showSolution ? 'Hide' : 'Show'} one way to light every hour
              </button>
              {showSolution && <SolutionPreview puzzle={puzzle} />}
            </div>
          )}
        </div>

        <div className="play-col">
          {/* The peak of the day: the village lights up, house by house. */}
          {won && !running && <VillageLights />}

          {done && share && !running && <SharePanel share={share} />}

          {/* A loss ends in the village too: some windows dark, and a reading that helps. */}
          {done && !won && !running && <VillageLights dim />}

          {/* ---------- the full forecast (last on phones; moved to the top of the right column on wide screens) ---------- */}
          <section aria-label="Today’s forecast" className="flex min-w-0 flex-col gap-4 min-[900px]:-order-1">
            <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-5">
              <h2 className="font-serif text-heading font-semibold">Today’s forecast</h2>
              <ForecastChart puzzle={puzzle} demand={demand} />
            </div>
            <HowToPlay open={firstVisit} id="how-wide" className="hidden md:block" />
          </section>
        </div>
      </div>

      {/* On phones, the run button stays within thumb's reach while you place parts. */}
      {!done && (
        <div className="run-bar on-forest fixed inset-x-0 bottom-0 z-30 border-t-2 border-sun/70 bg-forest px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 text-on-forest shadow-[0_-8px_24px_-12px_rgba(13,24,18,.5)] md:hidden">
          {offWarning && <p className="mb-2 text-small font-bold text-on-forest-gold">{offText(offCount)}</p>}
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-small">
              Parts <strong className="num">{used}</strong>/<span className="num">{puzzle.budget}</span>
            </p>
            <button
              type="button"
              onClick={run}
              disabled={!canRun}
              className={`min-h-12 flex-1 rounded-full text-copy font-bold ${canRun ? 'bg-sun text-[#1E3328]' : 'cursor-not-allowed border-2 border-dashed border-on-forest-muted/50 text-on-forest-muted'}`}
            >
              {barLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A board-sized placeholder while the puzzle is drawn, so the page doesn't jump when it arrives.
 * It mirrors the real page's header, tools and board footprint.
 */
export function BoardSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div className="h-[40px] w-[220px] rounded-xl bg-chip sm:h-[62px] sm:w-[340px]" aria-hidden="true" />
      <div className="play-layout" aria-hidden="true">
        <div className="play-col flex min-w-0 flex-col gap-3.5">
          <div className="h-[52px] rounded-xl bg-chip" />
          <div className="grid max-w-[460px] grid-cols-4 gap-1.5 sm:gap-2 md:max-w-[400px]">
            {Array.from({ length: 4 }, (_, k) => (
              <div key={k} className="min-h-14 rounded-2xl bg-chip" />
            ))}
          </div>
          <div className="board board-fit grid grid-cols-5 gap-2 rounded-[22px] p-3 sm:p-3.5" style={{ background: 'var(--board)' }}>
            {Array.from({ length: 25 }, (_, k) => (
              <div key={k} className="aspect-square min-h-11 rounded-xl animate-pulse" style={{ background: 'var(--g-open)', opacity: 0.7 }} />
            ))}
          </div>
        </div>
        <div className="play-col">
          <div className="hidden h-[340px] rounded-[20px] border border-line bg-card min-[900px]:block" />
        </div>
      </div>
    </div>
  );
}

function offText(n: number): string {
  return `${n === 1 ? 'One part is' : `${n} parts are`} off grid and won’t make power. Connect ${n === 1 ? 'it' : 'them'} to a home, or press again to run anyway.`;
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

/** " · Tuesday, medium": how hard today's grid is meant to be, from the weekly ramp. */
function levelLabel(key: string): string {
  if (daysBetween(HARDER_FROM, key) < 0) return '';
  const day = weekdayName(key);
  const word = { Monday: 'gentle', Tuesday: 'medium', Wednesday: 'medium', Thursday: 'tricky', Friday: 'tricky', Saturday: 'hard', Sunday: 'hardest' }[day];
  return ` · ${day}, ${word}`;
}

function formatDate(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function TerrainKey({ hasRock }: { hasRock: boolean }) {
  const items: [string, React.ReactNode, string][] = [
    ['Home', <HomeIcon key="h" lit={null} />, TERRAIN_BG.home],
    ['Tree (shades panels)', <TreeIcon key="t" />, TERRAIN_BG.tree],
    ['Pond', <PondIcon key="p" />, TERRAIN_BG.pond],
    ['Windy ridge', <RidgeMark key="r" />, TERRAIN_BG.ridge],
    ...(hasRock ? ([['Rocky ground (can’t build)', <RockIcon key="k" />, TERRAIN_BG.rock]] as [string, React.ReactNode, string][]) : []),
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-small text-body" aria-label="Map key">
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

/** Opens every copy of the rules (one for phones, one for wide screens) and scrolls to the visible one. */
function showHow(target: 'how' | 'rewards') {
  const all = Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-how]'));
  all.forEach((d) => (d.open = true));
  const visible = all.find((d) => d.offsetParent !== null);
  const rewards = visible?.querySelector<HTMLDetailsElement>('details[data-rewards]');
  if (target === 'rewards' && rewards) rewards.open = true;
  const el = target === 'rewards' ? rewards : visible;
  el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function HowToPlay({ open, id, className = '' }: { open: boolean; id: string; className?: string }) {
  return (
    <details id={id} data-how open={open} className={`scroll-mt-4 rounded-[20px] border border-line bg-card p-5 ${className}`}>
      <summary className="cursor-pointer font-serif text-title font-semibold">How it works</summary>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-copy leading-normal text-body">
        <li>
          <strong>Connect everything.</strong> A part only joins the grid if it touches a home or another connected part (up, down, left, or right). Parts marked “off grid” do nothing.
        </li>
        <li>
          <strong>Solar panels</strong> follow the sun. A panel next to a tree is shaded and makes half as much. A panel next to a garden stays cool and makes <span className="num-i">{Math.round((RULES.gardenBoost - 1) * 100)}%</span> more (that’s agrivoltaics).
        </li>
        <li>
          <strong>Wind turbines</strong> work day and night, whenever the wind blows. On a windy ridge they make <span className="num-i">{Math.round((RULES.ridgeBoost - 1) * 100)}%</span> more, but two turbines side by side slow each other down.
        </li>
        <li>
          <strong>Batteries</strong> save extra power for later. Each one holds a few hours of evening use and starts the day half full.
        </li>
        <li>
          <strong>Gardens</strong> make no power, but they cool the panels beside them and shade homes, cutting those homes’ afternoon use by a quarter.
        </li>
        <li>
          <strong>Rocky ground</strong> can’t be built on, and power can’t pass across it, so plan your routes around it.
        </li>
        <li>
          <strong>Harder through the week.</strong> Monday’s grid is the gentlest; Sunday’s is the toughest, with demand close to the best possible layout.
        </li>
        <li>
          You have <strong>three tries</strong>. After each run, the lights strip shows which hours went dark so you can adjust.
        </li>
        <li>
          <strong>Badges</strong> like ×0.5 or ×1.5 show how much a panel or turbine makes compared with normal: shade halves it, gardens and ridges boost it.
        </li>
      </ul>
      {/* The one place the extras are explained; everywhere else links here. */}
      <details data-rewards id={id === 'how' ? 'rewards' : undefined} className="mt-5 scroll-mt-4 border-t border-line pt-4">
        <summary className="cursor-pointer font-serif text-lede font-semibold">How rewards work</summary>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-copy leading-normal text-body">
          <li>
            <strong>Your streak</strong> counts the days you play the daily grid. Your score and share result only ever come from that grid.
          </li>
          <li>
            <strong>Field notes</strong> come from library pages: open a reading (or spend a little time with its summary) and answer one short question.
          </li>
          <li>
            Each field note opens a <strong>bonus grid</strong> themed on what you read, up to {MAX_BONUS_PER_DAY} a day. Bonus grids are just for fun.
          </li>
          <li>
            Every three field notes earn a <strong>rest day</strong> (hold up to two). A rest day keeps your streak going on a day you miss.
          </li>
          <li>
            <strong>Your garden</strong> on the home page grows a plant for every page you read. It is a record of curiosity, not a score.
          </li>
        </ul>
      </details>
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
                        {t === 'rock' && <RockIcon />}
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
      <h2 className="font-serif text-heading font-semibold">Share your day</h2>
      <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-xl bg-chip p-3 font-sans text-small leading-normal" aria-hidden="true">
        {share.emoji}
      </pre>
      <p className="text-small text-body">
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
      <p role="status" className="min-h-[1.25em] text-small text-muted">
        {copied === 'error' ? 'Could not copy. Select the text above instead.' : copied ? 'Copied to your clipboard.' : ''}
      </p>
    </div>
  );
}

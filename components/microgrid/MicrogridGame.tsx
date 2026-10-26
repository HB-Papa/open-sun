'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { useMinWidth } from '@/lib/useMinWidth';
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
import { type DailyGame } from '@/lib/progress';
import { BatteryIcon, GardenIcon, HomeIcon, PondIcon, RidgeMark, RockIcon, SolarIcon, TreeIcon, WindIcon } from '@/components/icons';
import { ForecastChart, MiniForecast, ResultChart } from './DayCharts';
import { Nums } from '@/lib/nums';
import { VillageLights } from './VillageLights';
import { PART_BG, PART_NAME, TERRAIN_BG, TERRAIN_NAME, washFor } from './tiles';

type Tool = Part;

// Tapping a placed part with its own tool removes it, so there is no separate Clear tool.
const TOOLS: { id: Tool; label: string }[] = [
  { id: 'solar', label: 'Solar' },
  { id: 'wind', label: 'Wind' },
  { id: 'battery', label: 'Battery' },
  { id: 'garden', label: 'Garden' },
];


export interface GameProps {
  date: string;
  variant: Variant;
  extraSeed?: string;
  saved?: DailyGame;
  onSave: (g: DailyGame) => void;
  ranked: boolean;
  /** Open the rules on a player's very first visit. */
  firstVisit?: boolean;
  /** The rest of the page (your stats): shown below while playing, folded into "More about today" once the day is over. */
  extras?: React.ReactNode;
  /** Opens the step-by-step tutorial. */
  onTutorial?: () => void;
}

export function MicrogridGame({ date, variant, extraSeed = '', saved, onSave, ranked, firstVisit = false, extras, onTutorial }: GameProps) {
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
  return <Board key={puzzle.seed} puzzle={puzzle} date={date} saved={saved} onSave={onSave} ranked={ranked} reduceMotion={!!reduceMotion} firstVisit={firstVisit} extras={extras} onTutorial={onTutorial} />;
}

function Board({
  puzzle,
  date,
  saved,
  onSave,
  ranked,
  reduceMotion,
  firstVisit,
  extras,
  onTutorial,
}: {
  puzzle: Puzzle;
  date: string;
  saved?: DailyGame;
  onSave: (g: DailyGame) => void;
  ranked: boolean;
  reduceMotion: boolean;
  firstVisit: boolean;
  extras?: React.ReactNode;
  onTutorial?: () => void;
}) {
  const [layout, setLayout] = useState<Layout>(() => saved?.layout ?? new Array(CELLS).fill(null));
  const [history, setHistory] = useState<boolean[][]>(() => saved?.history ?? []);
  // The board as it stood for each try, so a try can be looked back at and an unchanged board isn't run twice.
  const [tryLayouts, setTryLayouts] = useState<Layout[]>(() => saved?.layouts ?? []);
  const [previewTry, setPreviewTry] = useState<number | null>(null);
  const wide = useMinWidth(900);
  const [tool, setTool] = useState<Tool>('solar');
  const [focus, setFocus] = useState(() => puzzle.terrain.findIndex(buildable));
  const [anim, setAnim] = useState<{ sim: SimResult; hour: number } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [notice, setNotice] = useState('');
  // Set when the player tries to run with parts that aren't connected; a second press runs anyway.
  const [offWarning, setOffWarning] = useState(false);
  // "Clear all" keeps the board it removed until the next piece is placed, so a mis-tap can be undone.
  const [clearedBoard, setClearedBoard] = useState<Layout | null>(null);
  // Plots whose piece was just set down by the player, so only those settle in (not a saved board on load).
  const [settling, setSettling] = useState<{ cells: number[]; n: number }>({ cells: [], n: 0 });
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // "How it works" links open the rules where they are, rather than jumping away from the board.
  function openHow(e?: React.MouseEvent) {
    e?.preventDefault();
    showHow('how');
  }
  useEffect(() => {
    const go = () => {
      const target = window.location.hash.slice(1);
      if (target === 'how') showHow(target);
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
  // Running the exact board you just ran would only use up a try.
  const unchanged = tryLayouts.length > 0 && tryLayouts[tryLayouts.length - 1].every((x, i) => x === layout[i]);
  const dayOver = done && !running;

  // Persist the board as the player edits it.
  const persist = useCallback(
    (next: Partial<DailyGame>) => {
      const h = next.history ?? history;
      const w = h.some((x) => x.every(Boolean));
      onSave({ tries: h.length, history: h, layout: next.layout ?? layout, layouts: next.layouts ?? tryLayouts, won: w, done: w || h.length >= MAX_TRIES });
    },
    [history, layout, tryLayouts, onSave],
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
        setNotice(`You have used all ${puzzle.budget} pieces. Remove one to place another.`);
        return;
      }
      next[i] = tool;
    }
    setClearedBoard(null);
    if (next[i]) setSettling((p) => ({ cells: [i], n: p.n + 1 }));
    setNotice(next[i] ? `${PART_NAME[next[i]!]} placed. ${used + (layout[i] ? 0 : 1)} of ${puzzle.budget} pieces used.` : `Cleared. ${countParts(next)} of ${puzzle.budget} pieces used.`);
    setOffWarning(false);
    setLayout(next);
    persist({ layout: next });
  }

  function clearAll() {
    if (done || running) return;
    if (clearedBoard) {
      setLayout(clearedBoard);
      persist({ layout: clearedBoard });
      setSettling((p) => ({ cells: clearedBoard.flatMap((x, k) => (x ? [k] : [])), n: p.n + 1 }));
      setNotice(`Board restored. ${countParts(clearedBoard)} of ${puzzle.budget} pieces used.`);
      setClearedBoard(null);
      return;
    }
    if (used === 0) return;
    const empty: Layout = new Array(CELLS).fill(null);
    setClearedBoard(layout);
    setLayout(empty);
    persist({ layout: empty });
    setOffWarning(false);
    setNotice('Board cleared. Press “Undo clear” to bring it back.');
  }

  function run() {
    if (done || running || used === 0 || unchanged) return;
    if (offCount > 0 && !offWarning) {
      setOffWarning(true);
      setNotice(offText(offCount));
      return;
    }
    setOffWarning(false);
    const sim = simulate(puzzle, layout);
    const nextHistory = [...history, sim.lit];
    const nextLayouts = [...tryLayouts, layout.slice()];
    setHistory(nextHistory);
    setTryLayouts(nextLayouts);
    setPreviewTry(null);
    persist({ history: nextHistory, layouts: nextLayouts });
    showResult();
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
    }, 90);
  }

  // Bring the day's result into view (on phones it sits below the board, under the run bar).
  function showResult() {
    requestAnimationFrame(() => {
      const el = document.getElementById('day-result');
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= window.innerHeight - 110) return;
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }
  // When the last try finishes, the finished day moves to the top of the page: follow it there.
  const wasOver = useRef(dayOver);
  useEffect(() => {
    if (dayOver && !wasOver.current) showResult();
    wasOver.current = dayOver;
  });

  // Played with a mouse or touch. Arrow keys and Enter still work on the board, unannounced, for anyone who can't use a pointer.
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
        setNotice(`Cleared. ${countParts(next)} of ${puzzle.budget} pieces used.`);
      }
      return;
    } else return;
    e.preventDefault();
    setFocus(n);
    cellRefs.current[n]?.focus();
  }

  const lightsHour = shownSim && shownHour >= 0 ? shownSim.lit[Math.min(shownHour, HOURS - 1)] : null;
  const skyNow = running ? puzzle.sky[shownHour] : null;
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
        ? 'Place a piece to run the day'
        : unchanged
          ? 'Change something to try again'
          : offWarning
          ? 'Run anyway'
          : `Run the day (try ${tries + 1} of ${MAX_TRIES})`;
  // The phone thumb bar gets a shorter label.
  const canRun = !(done || running || used === 0 || unchanged);
  const barLabel = canRun ? (offWarning ? 'Run anyway' : `Run the day · try ${tries + 1}/${MAX_TRIES}`) : unchanged && !done && !running ? 'Change the board first' : runLabel;
  const runClass = `min-h-[52px] rounded-full text-lede font-bold ${
    canRun ? 'bg-leaf text-white' : 'cursor-not-allowed border-2 border-dashed border-line-strong bg-transparent text-muted'
  }`;


  const boardEl = (
          <section aria-label="Neighborhood grid" className="flex min-w-0 flex-col gap-2.5 sm:gap-3.5">
            {/* Once the day is over the board stays as a keepsake: the tools and instructions step aside. */}
            {!dayOver && (
            <>
            <p className="text-small leading-snug sm:text-copy sm:leading-normal">
              <span className="sm:hidden">
                Light every hour with up to <strong>{puzzle.budget} pieces</strong>. Pick a piece in the bar below, then tap open ground to place it; tap again to remove it.{' '}
              </span>
              <span className="hidden sm:inline">
                Keep every home lit for all 24 hours using up to <strong>{puzzle.budget} pieces</strong>. Pick a piece, then click open ground to place it; click again to remove it.{' '}
              </span>
              <a href="#how" onClick={openHow} className="font-bold">
                How it works
              </a>
              {onTutorial && (
                <>
                  {' · '}
                  <button type="button" onClick={onTutorial} className="font-bold text-sky underline">
                    Watch the tutorial
                  </button>
                </>
              )}
            </p>

            {/* On phones the parts live in the bar at the bottom of the screen, always in reach; this row is for wider screens. */}
            <div role="radiogroup" aria-label="Piece to place" className="hidden max-w-[460px] grid-cols-4 gap-1.5 sm:gap-2 md:grid md:max-w-[400px]">
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
                </button>
              ))}
            </div>

            {/* A compact forecast right above the board on phones, so you can plan while you place. */}
            <MiniForecast puzzle={puzzle} demand={demand} className="md:hidden" />
            </>
            )}

            <div
              role="grid"
              aria-label={`Microgrid map, ${SIZE} by ${SIZE}. Use arrow keys to move, Enter to place the selected piece, Delete to clear.`}
              className={`board board-fit grid grid-cols-5 gap-2 rounded-[22px] p-3 shadow-[inset_0_2px_6px_rgba(30,51,40,.15)] sm:p-3.5 ${running ? 'is-running' : ''} ${skyNow === 'night' ? 'is-night' : ''}`}
              style={{ '--wash': running ? washFor(skyNow, puzzle.sun[shownHour]) : undefined } as React.CSSProperties}
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
                          className={`plot relative flex aspect-square min-h-11 items-center justify-center rounded-xl border-0 p-0 transition-transform duration-150 ${
                            buildable(t) && !done ? 'cursor-pointer hover:scale-[1.04]' : 'cursor-default'
                          } ${off ? 'outline-2 outline-dashed outline-terracotta' : ''}`}
                          style={{ background: part ? PART_BG[part] : TERRAIN_BG[t], opacity: off ? 0.6 : 1 }}
                        >
                          {t === 'ridge' && <RidgeMark />}
                          {t === 'home' && <HomeIcon lit={lightsHour} />}
                          {t === 'tree' && <TreeIcon />}
                          {t === 'pond' && <PondIcon />}
                          {t === 'rock' && <RockIcon />}
                          {part && (
                            <span
                              key={`${part}-${settling.cells.includes(i) ? settling.n : 0}`}
                              className={`flex h-full w-full items-center justify-center ${settling.cells.includes(i) ? 'piece-in' : ''}`}
                              style={settling.cells.includes(i) ? ({ '--d': `${Math.min(settling.cells.indexOf(i), 8) * 30}ms` } as React.CSSProperties) : undefined}
                            >
                              {part === 'solar' && <SolarIcon tilt={running} />}
                              {part === 'wind' && <WindIcon spin={running && !reduceMotion} />}
                              {part === 'battery' && <BatteryIcon level={shownSim && shownSim.capacity ? shownSim.storage[Math.max(0, shownHour)] / shownSim.capacity : -1} />}
                              {part === 'garden' && <GardenIcon />}
                            </span>
                          )}
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

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
              <span>
                Pieces used: <strong className="num">{used}</strong> of <span className="num">{puzzle.budget}</span>
              </span>
              <span className="hidden text-muted sm:inline">
                Homes: <span className="num">{puzzle.terrain.filter((t) => t === 'home').length}</span>
              </span>
              {!dayOver && (clearedBoard || used > 0) && (
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={running}
                  className="ml-auto inline-flex min-h-10 items-center rounded-full border-2 border-line-strong bg-card px-3.5 font-bold text-ink hover:border-leaf disabled:opacity-50"
                >
                  {clearedBoard ? 'Undo clear' : 'Clear all'}
                </button>
              )}
            </div>
            {!dayOver && (
              <div className="hidden max-w-[400px] flex-col gap-2 md:flex">
                <button type="button" onClick={run} disabled={!canRun} className={runClass}>
                  {runLabel}
                </button>
                {offWarning && <p className="text-small font-bold text-terracotta">{offText(offCount)}</p>}
              </div>
            )}
            <p className="sr-only" role="status" aria-live="polite">
              {notice}
            </p>
            <TerrainKey terrain={puzzle.terrain} />
            {/* On phones the full rules live below the board, one tap away from the "How it works" links. */}
            <HowToPlay open={false} id="how" className="md:hidden" onTutorial={onTutorial} />
          </section>
  );
  // A try chip shows that try everywhere in the panel (heading, strip, words and board), not just its board.
  const lastIndex = history.length - 1;
  const viewing = !running && previewTry !== null && previewTry !== lastIndex && tryLayouts[previewTry] ? previewTry : null;
  const viewLit = viewing !== null ? history[viewing] : lastLit;
  const viewSim = useMemo(() => (viewing !== null ? simulate(puzzle, tryLayouts[viewing]) : null), [puzzle, tryLayouts, viewing]);
  function viewTry(k: number) {
    const next = k === lastIndex || previewTry === k ? null : k;
    setPreviewTry(next);
    const n = history[k].filter(Boolean).length;
    setNotice(next === null ? `Showing your latest try: ${history[lastIndex].filter(Boolean).length} of 24 hours lit.` : `Showing try ${k + 1}: ${n} of 24 hours lit.`);
  }
  const resultEl = lastLit ? (
    <section
      id="day-result"
      aria-label="The day"
      className={`on-forest flex scroll-mt-4 flex-col gap-3 rounded-[20px] bg-forest p-5 text-on-forest ${running && tries === 1 ? 'rise-in' : ''}`}
    >
      {viewing !== null && (
        <p className="text-small text-on-forest-muted">
          Showing try <span className="num">{viewing + 1}</span> ·{' '}
          <button type="button" className="font-bold text-on-forest-gold underline" onClick={() => viewTry(lastIndex)}>
            back to try <span className="num">{lastIndex + 1}</span>
          </button>
        </p>
      )}
      <h2 className="font-serif text-heading font-semibold">
        {/* The run's animation drives the panel only while it plays; afterwards the chosen try does. */}
        <span className="num">{running && shownSim ? shownSim.lit.slice(0, shownHour + 1).filter(Boolean).length : viewLit.filter(Boolean).length}</span> of 24 hours lit
      </h2>
      <ResultChart
        lit={running && shownSim ? shownSim.lit : viewLit}
        sim={(running ? shownSim : null) ?? viewSim ?? shownSim ?? (done ? lastSim ?? undefined : undefined)}
        upTo={running ? shownHour : HOURS - 1}
      />
      {!running &&
        (viewing !== null ? (
          <p className="text-copy leading-normal text-on-forest-muted">
            <Nums text={darkHours(viewLit)} />
          </p>
        ) : won ? (
          <p className="text-copy leading-normal text-on-forest-muted">
            {ranked ? 'Every home stayed lit all day and night. Come back tomorrow for a new grid.' : 'Every home stayed lit. Nicely done!'}
          </p>
        ) : done ? (
          // A finished loss closes the day kindly first; the advice is for next time, so it comes second.
          <>
            <p className="text-copy leading-normal text-on-forest">
              {ranked ? 'That’s today’s grid done. A new one arrives tomorrow.' : 'That’s this bonus grid done.'}
            </p>
            <p className="text-small leading-normal text-on-forest-muted">
              <Nums text={`${darkHours(lastLit)} For next time: ${hint(puzzle, lastLit, layout)}`} />
            </p>
          </>
        ) : (
          <p className="text-copy leading-normal text-on-forest-muted">
            <Nums text={`${darkHours(lastLit)} ${hint(puzzle, lastLit, layout)}`} />
          </p>
        ))}
      {history.length > 1 && (
        <>
          {/* Each try can be looked back at, when its board was saved (games from before this change have none). */}
          <ol className="flex flex-wrap gap-2 text-small text-on-forest-muted" aria-label="Your tries">
            {history.map((h, k) => {
              const current = (viewing ?? lastIndex) === k;
              return (
                <li key={k}>
                  {tryLayouts[k] && !running ? (
                    <button
                      type="button"
                      aria-pressed={current}
                      aria-label={`Try ${k + 1}, ${h.filter(Boolean).length} of 24 hours lit`}
                      onClick={() => viewTry(k)}
                      className={`inline-flex min-h-9 items-center rounded-full px-3 font-bold ${current ? 'bg-sun text-[#1E3328]' : 'bg-forest-2 text-on-forest hover:bg-forest-2/70'}`}
                    >
                      <span>
                        Try <span className="num">{k + 1}</span> · <span className="num">{h.filter(Boolean).length}/24</span>
                      </span>
                    </button>
                  ) : (
                    // Older saved games kept only the score, so these are plain labels, not buttons.
                    <span className="inline-flex min-h-9 items-center px-1" aria-label={`Try ${k + 1}, ${h.filter(Boolean).length} of 24 hours lit`}>
                      <span>
                        Try <span className="num">{k + 1}</span> · <span className="num">{h.filter(Boolean).length}/24</span>
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {viewing !== null && <LayoutPreview puzzle={puzzle} layout={tryLayouts[viewing]} label={`Your board on try ${viewing + 1}`} />}
        </>
      )}
    </section>
  ) : null;
  const solutionEl = (done && !won && !running && (
            <div className="rounded-[20px] border border-line bg-card p-5">
              <button type="button" className="font-bold text-sky underline" onClick={() => setShowSolution((s) => !s)} aria-expanded={showSolution}>
                {showSolution ? 'Hide' : 'Show'} one way to light every hour
              </button>
              {showSolution && <SolutionPreview puzzle={puzzle} />}
            </div>
          )) || null;
  const winVillageEl = won && !running ? <VillageLights carried={carriedBy(puzzle, layout)} /> : null;
  const shareEl = done && share && !running ? <SharePanel share={share} /> : null;
  // A loss ends in the village too: some windows dark, and a reading that matches what went wrong.
  const dimVillageEl = done && !won && !running && lastLit ? <VillageLights dim shortfall={shortfall(puzzle, lastLit)} /> : null;
  const moreEl = (inner: React.ReactNode, blurb: string) => (
    <details className="rounded-[20px] border border-line bg-card p-5">
      <summary className="cursor-pointer font-serif text-heading font-semibold">More about today</summary>
      <p className="mt-1 text-small text-body">{blurb}</p>
      <div className="mt-4 flex flex-col gap-6">{inner}</div>
    </details>
  );
  // Wide screens show the full rules beside the board; once the day is over they move under it, so the columns stay level.
  const howWideEl = <HowToPlay open={firstVisit} id="how-wide" className="hidden md:block" onTutorial={onTutorial} />;
  const forecastEl = (withRules: boolean) => (
    <section aria-label="Today’s forecast" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-5">
        <h2 className="font-serif text-heading font-semibold">Today’s forecast</h2>
        <p className="-mt-1 text-small leading-snug text-body">
          Each hour, sun and wind make power and the homes use some: that’s demand. When demand is more than sun and wind can make, batteries cover the gap.
        </p>
        <ForecastChart puzzle={puzzle} demand={demand} />
      </div>
      {withRules && howWideEl}
    </section>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* On phones the title and tries share one line, so the board starts higher. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:items-end md:justify-start md:gap-x-10">
        <div>
          <h1 className="font-serif text-section font-bold leading-tight sm:text-page-lg">{ranked ? `Microgrid #${num}` : info.name}</h1>
          <p className={`mt-1 text-copy text-body ${ranked ? 'hidden sm:block' : ''}`}>{ranked ? `Today’s puzzle, ${formatDate(date)}${levelLabel(date)}` : `Bonus grid, just for fun. ${info.blurb}`}</p>
        </div>
        {dayOver ? (
          <p className="text-copy">
            <strong>
              <Nums text={ranked ? (won ? `Today: solved on try ${tries}` : `Today: ${lastLit.filter(Boolean).length}/24 lit`) : won ? 'Bonus grid solved' : 'Bonus grid done'} />
            </strong>
            {ranked && <span className="text-body"> · new grid tomorrow</span>}
          </p>
        ) : (
          <p className="text-copy">
            Tries left: <strong className="num text-title sm:text-heading">{MAX_TRIES - tries}</strong> of <span className="num">{MAX_TRIES}</span>
          </p>
        )}
      </div>

      {/* Wide screens: two columns that end at about the same height. Phones: one column. While playing, the board
          leads; once the day is over, the result leads and the board follows as a keepsake. Source order always
          matches the screen, so keyboard and screen-reader order do too. */}
      {wide ? (
        <div className="play-layout">
          <div className="play-col">
            {dayOver ? <>{resultEl}{solutionEl}{boardEl}{howWideEl}</> : <>{boardEl}{resultEl}{solutionEl}</>}
          </div>
          <div className="play-col">
            {dayOver ? <>{winVillageEl}{dimVillageEl}{shareEl}{forecastEl(false)}</> : <>{forecastEl(true)}{winVillageEl}{dimVillageEl}{shareEl}</>}
          </div>
        </div>
      ) : (
        <div className="play-layout">
          {dayOver ? (
            <>
              {resultEl}
              {winVillageEl}
              {dimVillageEl}
              {shareEl}
              {solutionEl}
              {boardEl}
              {moreEl(
                <>
                  {forecastEl(true)}
                  {extras}
                </>,
                'Today’s forecast and your stats.',
              )}
            </>
          ) : (
            <>
              {boardEl}
              {resultEl}
              {/* The small forecast sits above the board; the full one waits behind a tap. */}
              <details className="rounded-[20px] border border-line bg-card p-5">
                <summary className="cursor-pointer font-serif text-heading font-semibold">Today’s forecast, hour by hour</summary>
                <div className="mt-3">
                  <ForecastChart puzzle={puzzle} demand={demand} />
                </div>
              </details>
            </>
          )}
        </div>
      )}

      {/* Stats: in full while playing; once the day is over, folded away so the day itself is the ending. */}
      {wide && dayOver ? extras && moreEl(extras, 'Your stats.') : !dayOver && extras}

      {/* On phones, the run button stays within thumb's reach while you place parts. */}
      {!done && (
        <div className="run-bar on-forest fixed inset-x-0 bottom-0 z-30 border-t-2 border-sun/70 bg-forest px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 text-on-forest shadow-[0_-8px_24px_-12px_rgba(13,24,18,.5)] md:hidden">
          {offWarning && <p className="mb-2 text-small font-bold text-on-forest-gold">{offText(offCount)}</p>}
          {/* The phone game controller: pick a part, then run, without scrolling away from the board. */}
          <div role="radiogroup" aria-label="Piece to place" className="mb-2.5 grid grid-cols-4 gap-1.5">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={tool === t.id}
                onClick={() => setTool(t.id)}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 py-1 text-caption font-bold ${
                  tool === t.id ? 'border-on-forest bg-on-forest text-[#1E3328]' : 'border-on-forest-muted/40 bg-forest-2 text-on-forest'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: PART_BG[t.id] }} aria-hidden="true">
                  {t.id === 'solar' && <SolarIcon />}
                  {t.id === 'wind' && <WindIcon />}
                  {t.id === 'battery' && <BatteryIcon />}
                  {t.id === 'garden' && <GardenIcon />}
                </span>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-small">
              Pieces <strong className="num">{used}</strong>/<span className="num">{puzzle.budget}</span>
            </p>
            <button
              type="button"
              onClick={run}
              disabled={!canRun}
              className={`min-h-12 flex-1 rounded-full px-4 text-copy font-bold ${canRun ? 'bg-sun text-[#1E3328]' : 'cursor-not-allowed border-2 border-dashed border-on-forest-muted/50 text-on-forest-muted'}`}
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
  return `${n === 1 ? 'One piece is' : `${n} pieces are`} off grid and won’t make power. Connect ${n === 1 ? 'it' : 'them'} to a home, or press again to run anyway.`;
}

/** "Dark: 3 am to 5 am, 9 pm." The heading already gives the count, so the sentence starts at the gaps. */
function darkHours(lit: boolean[]): string {
  return describeHours(lit).replace(/^\d+ of 24 hours lit\. /, '');
}

/** A hint that names what went wrong on this board, most specific first. */
function hint(p: Puzzle, lit: boolean[], layout: Layout): string {
  const dark = lit.filter((x) => !x).length;
  const touchingTurbines = layout.some((part, i) => part === 'wind' && neighbors(i).some((n) => layout[n] === 'wind'));
  if (touchingTurbines) return 'Your turbines sit side by side and slow each other, so try spreading them out.';
  if (dark <= 2) return `Only ${dark === 1 ? 'one hour' : 'two hours'} short, so one more battery or panel could do it.`;
  if (shortfall(p, lit) === 'night') {
    return layout.includes('battery') ? 'Nights are the hard part, so more storage or wind could help.' : 'The nights went dark. A battery stores daytime sun for after dark, so try adding one.';
  }
  const shaded = layout.some((part, i) => part === 'solar' && neighbors(i).some((n) => p.terrain[n] === 'tree'));
  return shaded ? 'Some panels sit in a tree’s shade, so move them into the open.' : 'The days fall short, so try more panels, or a garden beside them.';
}

/** What carried a winning day, for the reading the village offers. */
function carriedBy(p: Puzzle, layout: Layout): 'storage' | 'wind' | 'gardens' | 'sun' {
  if (layout.includes('battery')) return 'storage';
  if (layout.some((part, i) => part === 'wind' && p.terrain[i] === 'ridge')) return 'wind';
  if (layout.some((part, i) => part === 'garden' && neighbors(i).some((n) => layout[n] === 'solar'))) return 'gardens';
  return 'sun';
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

/** What each kind of square on today's map means for you; only the kinds on today's board are listed. */
function TerrainKey({ terrain }: { terrain: Terrain[] }) {
  const all: [Terrain, string, string, React.ReactNode][] = [
    ['open', 'Open ground', 'place your pieces here', null],
    ['home', 'Home', 'keep it lit all day', <HomeIcon key="h" lit={null} />],
    ['ridge', 'Windy ridge', 'a turbine here makes more power', <RidgeMark key="r" />],
    ['tree', 'Tree', 'shades the solar panels beside it', <TreeIcon key="t" />],
    ['pond', 'Pond', 'nothing can be built here', <PondIcon key="p" />],
    ['rock', 'Rocky ground', 'nothing can be built here, and power can’t cross it', <RockIcon key="k" />],
  ];
  const items = all.filter(([t]) => terrain.includes(t));
  return (
    <div className="flex flex-col gap-2">
      <h3 id="map-key" className="text-small font-bold">
        Map key
      </h3>
      <ul aria-labelledby="map-key" className="grid gap-x-5 gap-y-2 text-small text-body sm:grid-cols-2">
        {items.map(([t, name, meaning, icon]) => (
          <li key={t} className="flex items-center gap-2.5">
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: TERRAIN_BG[t] }} aria-hidden="true">
              {icon}
            </span>
            <span>
              <strong className="font-bold text-ink">{name}:</strong> {meaning}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Opens every copy of the rules (one for phones, one for wide screens) and scrolls to the visible one. */
function showHow(_target: 'how') {
  const all = Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-how]'));
  all.forEach((d) => (d.open = true));
  all.find((d) => d.offsetParent !== null)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/** The rules, short enough to read in a moment. The map key under the board explains the badges. */
function HowToPlay({ open, id, className = '', onTutorial }: { open: boolean; id: string; className?: string; onTutorial?: () => void }) {
  return (
    <details id={id} data-how open={open} className={`scroll-mt-4 rounded-[20px] border border-line bg-card p-5 ${className}`}>
      <summary className="cursor-pointer font-serif text-title font-semibold">How it works</summary>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-copy leading-normal text-body">
        <li>
          <strong>Keep every home lit</strong> for all 24 hours, using the pieces you’re given.
        </li>
        <li>
          <strong>Connect</strong> every piece to a home, directly or through other pieces. Pieces connect through their sides, not diagonally, and power can’t cross rocky ground.
        </li>
        <li>
          <strong>Solar</strong> follows the sun; a tree beside a panel shades it, and a garden beside it keeps it cool. <strong>Wind</strong> blows day and night; ridges boost it, and
          turbines side by side slow each other.
        </li>
        <li>
          <strong>Batteries</strong> store daytime power for the night.
        </li>
        <li>
          <strong>Three tries.</strong> After each run, the Lights row shows which hours went dark. Grids get harder through the week.
        </li>
      </ul>
      {onTutorial && (
        <p className="mt-3 text-copy">
          <button type="button" onClick={onTutorial} className="font-bold text-sky underline">
            Watch the step-by-step tutorial
          </button>{' '}
          to see a past grid solved.
        </p>
      )}
    </details>
  );
}

function SolutionPreview({ puzzle }: { puzzle: Puzzle }) {
  return <LayoutPreview puzzle={puzzle} layout={puzzle.solution} label="One solution" />;
}

/** A small, read-only copy of a board: the worked solution, or the layout of an earlier try. */
function LayoutPreview({ puzzle, layout, label }: { puzzle: Puzzle; layout: Layout; label: string }) {
  return (
    <div className="mt-3 grid max-w-[260px] grid-cols-5 gap-1.5 rounded-xl p-2" style={{ background: 'var(--board)' }} role="img" aria-label={`${label}: ${layoutText(layout)}`}>
      {puzzle.terrain.map((t, i) => {
        const part = layout[i];
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

function layoutText(layout: Layout): string {
  const parts = layout.map((part, i) => (part ? `${PART_NAME[part]} at row ${Math.floor(i / SIZE) + 1}, column ${(i % SIZE) + 1}` : null)).filter(Boolean);
  return parts.length ? `${parts.join('; ')}.` : 'no pieces placed.';
}

/** Whether a short day ran out at night (storage) or in daylight (panels and shade). */
function shortfall(p: Puzzle, lit: boolean[]): 'night' | 'day' {
  const dark = lit.map((ok, h) => (ok ? -1 : h)).filter((h) => h >= 0);
  const night = dark.filter((h) => h < p.sunrise || h >= p.sunset).length;
  return night > dark.length / 2 ? 'night' : 'day';
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


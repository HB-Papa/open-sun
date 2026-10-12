'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { baseDemand, localDateKey, puzzleNumber, type Puzzle, type Terrain } from '@/lib/microgrid';
import { useProgress } from '@/lib/progress';
import { getPuzzle } from '@/lib/puzzleCache';
import { forecastSentence } from './microgrid/DayCharts';
import { NouveauCorners } from './Ornaments';
import { Nums } from '@/lib/nums';

// The puzzle card's preview tiles sit on the forest panel in both themes; their colours are tokens.
const TILE: Record<Terrain, string> = { open: 'var(--tile-open)', ridge: 'var(--tile-ridge)', home: 'var(--tile-home)', tree: 'var(--tile-tree)', pond: 'var(--tile-pond)' };

export function TodayPuzzleCard() {
  const progress = useProgress();
  const [today, setToday] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  useEffect(() => {
    const d = localDateKey();
    setToday(d);
    const t = setTimeout(() => setPuzzle(getPuzzle(d)), 50);
    return () => clearTimeout(t);
  }, []);

  const game = today && progress ? progress.games[today] : undefined;
  const lastLit = game?.history[game.history.length - 1]?.filter(Boolean).length;

  return (
    <div className="nouveau on-forest relative flex min-w-0 flex-[2_1_520px] flex-wrap items-center gap-7 rounded-[28px] bg-forest px-7 py-9 text-on-forest shadow-[0_18px_40px_-18px_rgba(13,24,18,.55)] sm:px-10 dark:bg-forest-2 dark:shadow-[0_0_0_1px_rgba(227,167,47,.45),0_18px_40px_-18px_rgba(0,0,0,.8)]">
      <NouveauCorners />
      <div className="flex-[1_1_260px]">
        <h2 id="today" className="mb-2 font-serif text-[2.5rem] font-bold leading-none sm:text-[3rem]">
          Microgrid {today ? <span className="text-sun">#{puzzleNumber(today)}</span> : ''}
        </h2>
        <p className="mb-3 text-[1.0625rem] text-on-forest">Today’s puzzle takes about three minutes.</p>
        <p className="mb-[22px] text-lg leading-normal text-on-forest-muted">
          Keep a small neighborhood lit for all 24 hours.{' '}
          {puzzle ? <Nums text={shortForecast(puzzle)} /> : 'Checking today’s forecast…'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/play"
            className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-bold text-[#1E3328] no-underline hover:text-[#1E3328]"
          >
            {game?.done ? 'See today’s result' : game?.tries ? 'Keep playing' : 'Play today’s grid'}
          </Link>
          {game?.done ? (
            <span className="text-on-forest-muted">
              {game.won ? `Solved in ${game.tries} ${game.tries === 1 ? 'try' : 'tries'}` : `${lastLit}/24 hours lit`}
            </span>
          ) : (
            <Link href="/play#how" className="inline-flex min-h-12 items-center px-2 text-on-forest hover:text-sun">
              How to play
            </Link>
          )}
        </div>
      </div>
      <div className="hidden flex-[0_1_220px] grid-cols-5 gap-1.5 rounded-2xl bg-forest-2 p-2 sm:grid dark:bg-forest" aria-hidden="true">
        {/* Until the puzzle is drawn, the tiles wait as soft meadow green rather than dark gaps. */}
        {(puzzle?.terrain ?? new Array<Terrain>(25).fill('open')).map((t, i) => (
          <div key={i} className="aspect-square rounded-lg transition-[background-color,opacity] duration-500" style={{ background: TILE[t], opacity: puzzle ? 1 : 0.55 }} />
        ))}
      </div>
    </div>
  );
}

function shortForecast(p: Puzzle): string {
  // The first two sentences of the full forecast: daylight and clouds.
  const s = forecastSentence(p, baseDemand(p)).split('. ');
  return `Forecast: ${s.slice(1, 3).join('. ').replace(/\.$/, '')}.`;
}

/** Plants one flower per library page read. A record of curiosity, not a score: the counters live on the Play page. */
export function GardenCard() {
  const progress = useProgress();
  const visited = progress ? Object.keys(progress.visited) : [];
  return (
    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5 rounded-[28px] border border-line bg-card px-6 py-6 shadow-[0_18px_40px_-24px_rgba(30,51,40,.35)] sm:px-7">
      <h2 className="font-serif text-2xl font-semibold">Your garden</h2>
      <p className="text-base leading-normal text-body">
        {visited.length
          ? `You’ve read ${visited.length} ${visited.length === 1 ? 'page' : 'pages'} in the library. Each one planted something here.`
          : 'Every page you read in the library plants something here.'}
      </p>
      <div className="flex min-h-[64px] flex-wrap items-end gap-1.5 rounded-xl bg-chip-leaf px-3 pt-2" aria-hidden="true">
        {visited.length === 0 && <Sprout k={-1} />}
        {visited.slice(0, 40).map((slug) => (
          <Sprout key={slug} k={hash(slug)} />
        ))}
      </div>
      <Link href="/library" className="self-start font-bold">
        Find something to read
      </Link>
    </div>
  );
}
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function Sprout({ k }: { k: number }) {
  if (k < 0)
    return (
      <svg width="30" height="40" viewBox="0 0 46 60">
        <path d="M23 60 V44" stroke="var(--sprout-stem)" strokeWidth="3" />
        <path d="M23 48 C16 46 14 40 17 36 C22 38 24 42 23 48Z" fill="var(--sprout-light)" />
      </svg>
    );
  const kind = k % 4;
  const h = 40 + (k % 17);
  return (
    <svg width="30" height={h} viewBox={`0 0 46 ${h * 1.5}`}>
      <path d={`M23 ${h * 1.5} V${kind === 1 ? 22 : 28}`} stroke="var(--sprout-stem)" strokeWidth="3" />
      {kind === 0 && (
        <>
          <path d="M23 40 C10 36 8 26 12 20 C20 22 24 30 23 40Z" fill="var(--sprout-leaf)" />
          <path d="M23 34 C36 30 38 20 34 14 C26 16 22 24 23 34Z" fill="var(--sprout-leaf-2)" />
        </>
      )}
      {kind === 1 && (
        <>
          <circle cx="23" cy="18" r="10" fill="var(--sun)" />
          <circle cx="23" cy="18" r="4" fill="var(--sprout-seed)" />
        </>
      )}
      {kind === 2 && (
        <>
          <circle cx="17" cy="22" r="6" fill="var(--sprout-rose)" />
          <circle cx="29" cy="22" r="6" fill="var(--sprout-rose)" />
          <circle cx="23" cy="15" r="6" fill="var(--sprout-rose)" />
          <circle cx="23" cy="21" r="3.5" fill="var(--sun)" />
        </>
      )}
      {kind === 3 && <path d="M23 30 C14 26 14 14 23 8 C32 14 32 26 23 30Z" fill="var(--sprout-teal)" />}
    </svg>
  );
}

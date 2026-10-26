'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { baseDemand, localDateKey, puzzleNumber, type Puzzle, type Terrain } from '@/lib/microgrid';
import { useProgress } from '@/lib/progress';
import { dayStatus } from '@/lib/dayStatus';
import { getPuzzle } from '@/lib/puzzleCache';
import { forecastSentence } from './microgrid/DayCharts';
import { NouveauCorners } from './Ornaments';
import { Nums } from '@/lib/nums';

// The puzzle card's preview tiles sit on the forest panel in both themes; their colours are tokens.
const TILE: Record<Terrain, string> = { open: 'var(--tile-open)', ridge: 'var(--tile-ridge)', home: 'var(--tile-home)', tree: 'var(--tile-tree)', pond: 'var(--tile-pond)', rock: 'var(--tile-rock)' };

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
  const status = dayStatus(game);

  return (
    <div className="nouveau on-forest relative flex min-w-0 flex-[2_1_520px] flex-wrap items-center gap-7 rounded-[22px] bg-forest px-4 py-5 text-on-forest sm:rounded-[28px] sm:px-7 sm:py-9 shadow-[0_18px_40px_-18px_rgba(13,24,18,.55)] sm:px-10 dark:bg-forest-2 dark:shadow-[0_0_0_1px_rgba(227,167,47,.45),0_18px_40px_-18px_rgba(0,0,0,.8)]">
      <span className="hidden sm:contents">
        <NouveauCorners />
      </span>
      <div className="flex h-full flex-[1_1_260px] flex-col sm:block sm:h-auto">
        <h2 id="today" className="mb-2 font-serif text-title font-bold leading-none sm:text-page-lg">
          Microgrid {today ? <span className="text-sun">#{puzzleNumber(today)}</span> : ''}
        </h2>
        {/* Phones: one short line. */}
        <p className="mb-3 text-small text-on-forest-muted sm:hidden">
          {status ? <Nums text={status.line} /> : 'Today’s puzzle · 3 minutes'}
        </p>
        {/* Once today is played, the card says how it went and when the next grid comes, not how to start. */}
        <div className="hidden sm:block">
        {status ? (
          <>
            <p className="mb-3 font-serif text-heading text-on-forest">
              <Nums text={status.line} />
            </p>
            <p className="mb-[22px] text-lede leading-normal text-on-forest-muted">A new grid arrives tomorrow.</p>
          </>
        ) : (
          <>
            <p className="mb-3 text-copy text-on-forest">Today’s puzzle takes about three minutes.</p>
            <p className="mb-[22px] text-lede leading-normal text-on-forest-muted">
              Keep a small neighborhood lit for all 24 hours.{' '}
              {puzzle ? <Nums text={shortForecast(puzzle)} /> : 'Checking today’s forecast…'}
            </p>
          </>
        )}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-3 sm:mt-0">
          <Link
            href="/microgrid"
            className="inline-flex min-h-11 items-center rounded-full bg-sun px-4 text-small font-bold text-[#1E3328] no-underline hover:text-[#1E3328] sm:min-h-12 sm:px-6 sm:text-copy"
          >
            {status ? 'See today’s result' : game?.tries ? 'Keep playing' : <><span className="sm:hidden">Play</span><span className="hidden sm:inline">Play today’s grid</span></>}
          </Link>
          {status ? null : (
            <Link href="/microgrid#tutorial" className="hidden min-h-12 items-center px-2 text-on-forest hover:text-sun sm:inline-flex">
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
    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5 rounded-[22px] border border-line bg-card px-4 py-5 shadow-[0_18px_40px_-24px_rgba(30,51,40,.35)] sm:gap-3.5 sm:rounded-[28px] sm:px-7 sm:py-6">
      <h2 className="font-serif text-title font-semibold sm:text-heading">Your garden</h2>
      <p className="hidden text-copy leading-normal text-body sm:block">
        {visited.length
          ? visited.length === 1
            ? 'You’ve read 1 page in the library, and it planted something here. Each page you read adds another.'
            : `You’ve read ${visited.length} pages in the library. Each one planted something here.`
          : 'Every page you read in the library plants something here.'}
      </p>
      <div className="flex min-h-[48px] flex-1 flex-wrap items-end gap-1.5 overflow-hidden rounded-xl bg-chip-leaf px-2 pt-2 sm:min-h-[64px] sm:flex-none sm:px-3" aria-hidden="true">
        {visited.length === 0 && <Sprout k={-1} />}
        {visited.slice(0, 40).map((slug) => (
          <Sprout key={slug} k={hash(slug)} />
        ))}
      </div>
      <Link href="/library" className="self-start text-small font-bold sm:text-copy">
        <span className="sm:hidden">Read to grow it</span>
        <span className="hidden sm:inline">Find something to read</span>
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

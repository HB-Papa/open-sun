'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BoardSkeleton, MicrogridGame } from '@/components/microgrid/MicrogridGame';
import { localDateKey, VARIANT_INFO } from '@/lib/microgrid';
import {
  currentStreak,
  MAX_BONUS_PER_DAY,
  saveBonus,
  saveDaily,
  stats,
  useProgress,
  type DailyGame,
  type Progress,
} from '@/lib/progress';

export interface Suggestion {
  slug: string;
  title: string;
  pathway: string;
}

export function PlayClient({ suggestions = [] }: { suggestions?: Suggestion[] }) {
  const progress = useProgress();
  const params = useSearchParams();
  const bonusId = params.get('bonus');
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localDateKey()), []);

  const onSaveDaily = useCallback((g: DailyGame) => today && saveDaily(today, g), [today]);
  const onSaveBonus = useCallback((g: DailyGame) => today && bonusId && saveBonus(today, bonusId, g), [today, bonusId]);

  if (!today || !progress) return <BoardSkeleton label="Loading the puzzle…" />;

  const rounds = progress.bonus[today] ?? [];
  const bonus = bonusId ? rounds.find((b) => b.id === bonusId) : undefined;

  // Bonus grids and stats sit below the game while it's played, and fold into "More about today" once it's done.
  const extras = (
    <div className="flex flex-wrap items-start gap-6">
      <BonusList progress={progress} today={today} activeId={bonusId} suggestions={suggestions} />
      {/* Stats appear after the first game, so a first visit isn't a wall of zeros. */}
      {stats(progress).played > 0 && <StatsCard progress={progress} today={today} />}
    </div>
  );

  return (
    <>
      {bonusId && !bonus ? (
        <div className="rounded-[18px] border border-line bg-card p-6">
          <h1 className="font-serif text-section font-bold">That bonus grid isn’t available</h1>
          <p className="mt-2 text-lede">
            Bonus grids last for the day they were earned. <Link href="/play">Play today’s grid</Link> instead.
          </p>
        </div>
      ) : bonus ? (
        <>
          <p>
            <Link href="/play" className="font-bold">
              ← Back to today’s ranked grid
            </Link>
          </p>
          <MicrogridGame
            date={today}
            variant={bonus.variant}
            extraSeed={bonus.slug}
            saved={bonus.game}
            onSave={onSaveBonus}
            ranked={false}
            extras={extras}
          />
        </>
      ) : (
        <MicrogridGame date={today} variant="daily" saved={progress.games[today]} onSave={onSaveDaily} ranked firstVisit={Object.keys(progress.games).length === 0} extras={extras} />
      )}

      {bonusId && !bonus && extras}
    </>
  );
}

function BonusList({ progress, today, activeId, suggestions }: { progress: Progress; today: string; activeId: string | null; suggestions: Suggestion[] }) {
  const rounds = progress.bonus[today] ?? [];
  // A few specific readings with field notes you haven't earned yet, in pathway order.
  const next = suggestions.filter((s) => !progress.notes[s.slug]).slice(0, 3);
  return (
    <section aria-labelledby="bonus-h" className="flex min-w-0 flex-[1_1_360px] flex-col gap-3 rounded-[20px] border border-line bg-card p-5">
      <h2 id="bonus-h" className="font-serif text-heading font-semibold">
        Bonus grids from your reading
      </h2>
      <p className="text-small text-body">
        Answer a field note in the library to open a bonus grid, just for fun.{' '}
        <a href="#rewards" className="font-bold">
          How rewards work
        </a>
      </p>
      {rounds.length < MAX_BONUS_PER_DAY && next.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-small font-bold">Readings with a field note waiting:</p>
          <ul className="flex flex-col gap-2">
            {next.map((s) => (
              <li key={s.slug}>
                <Link href={`/library/${s.slug}`} className="flex flex-col gap-0.5 rounded-[14px] border border-line p-3 text-ink no-underline hover:border-leaf hover:text-ink">
                  <span className="font-bold leading-snug">{s.title}</span>
                  <span className="text-small text-muted">On the pathway {s.pathway}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {rounds.length === 0 ? null : (
      <ul className="flex flex-wrap gap-2.5">
        {rounds.map((b) => (
          <li key={b.id} className="flex-[1_1_200px]">
            <Link
              href={`/play?bonus=${encodeURIComponent(b.id)}`}
              aria-current={activeId === b.id ? 'page' : undefined}
              className="flex h-full flex-col gap-1 rounded-[14px] bg-pale-sun p-3.5 text-ink no-underline hover:text-ink"
            >
              <strong>
                {VARIANT_INFO[b.variant].name}
                {b.game?.done ? (b.game.won ? ' · solved' : ' · played') : ''}
              </strong>
              <span className="text-small">Unlocked by your field note on {b.title}</span>
            </Link>
          </li>
        ))}
        {rounds.length < MAX_BONUS_PER_DAY && (
          <li className="flex-[1_1_200px] self-center text-small text-body">
            <strong className="num">{MAX_BONUS_PER_DAY - rounds.length}</strong> more can open today.
          </li>
        )}
      </ul>
      )}
    </section>
  );
}

function StatsCard({ progress, today }: { progress: Progress; today: string }) {
  const s = stats(progress);
  const { streak, coveredByRest } = currentStreak(progress, today);
  const maxBar = Math.max(1, ...progress.histogram);
  const labels = ['1 try', '2 tries', '3 tries', 'Not yet'];
  return (
    <section aria-labelledby="stats-h" className="flex min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-[20px] border border-line bg-card p-5">
      <h2 id="stats-h" className="font-serif text-heading font-semibold">
        Your stats
      </h2>
      <dl className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-5">
        <Stat label="Played" value={s.played} />
        <Stat label="Win rate" value={`${s.winRate}%`} />
        <Stat label="Day streak" value={streak} />
        <Stat label="Best" value={progress.best} />
        <Stat label="Rest days" value={progress.restDays} />
      </dl>
      {coveredByRest > 0 && (
        <p className="text-small text-body">
          You missed {coveredByRest === 1 ? 'a day' : `${coveredByRest} days`}, but a rest day will keep your streak going when you play today.
        </p>
      )}
      {progress.lastDone && streak === 0 && (
        <p className="text-small text-body">Welcome back! Every day is a fresh start. Your best streak is safe in your stats.</p>
      )}
      <div>
        <h3 className="mb-2 text-small font-bold">Tries needed</h3>
        <ul className="flex flex-col gap-1.5" aria-label="Tries histogram">
          {progress.histogram.map((n, k) => (
            <li key={k} className="grid grid-cols-[70px_1fr] items-center gap-2 text-small">
              <span>{labels[k]}</span>
              <span className="flex items-center gap-2">
                <span className="block h-5 rounded-[4px] bg-leaf" style={{ width: `${Math.max(n ? 8 : 2, (n / maxBar) * 100)}%` }} aria-hidden="true" />
                <span className="num">{n}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-small text-muted">
        <a href="#rewards" className="font-bold">
          How streaks and rest days work
        </a>
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-caption text-muted">{label}</dt>
      <dd className="num text-heading font-bold">{value}</dd>
    </div>
  );
}

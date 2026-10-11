'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MicrogridGame } from '@/components/microgrid/MicrogridGame';
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

export function PlayClient() {
  const progress = useProgress();
  const params = useSearchParams();
  const bonusId = params.get('bonus');
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localDateKey()), []);

  const onSaveDaily = useCallback((g: DailyGame) => today && saveDaily(today, g), [today]);
  const onSaveBonus = useCallback((g: DailyGame) => today && bonusId && saveBonus(today, bonusId, g), [today, bonusId]);

  if (!today || !progress) return <p className="py-16 text-center text-lg text-muted">Loading the puzzle…</p>;

  const rounds = progress.bonus[today] ?? [];
  const bonus = bonusId ? rounds.find((b) => b.id === bonusId) : undefined;

  return (
    <>
      {bonusId && !bonus ? (
        <div className="rounded-[18px] border border-line bg-card p-6">
          <h1 className="font-serif text-3xl font-bold">That bonus grid isn’t available</h1>
          <p className="mt-2 text-lg">
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
          />
        </>
      ) : (
        <MicrogridGame date={today} variant="daily" saved={progress.games[today]} onSave={onSaveDaily} ranked firstVisit={Object.keys(progress.games).length === 0} />
      )}

      <div className="flex flex-wrap items-start gap-6">
        <BonusList progress={progress} today={today} activeId={bonusId} />
        {/* Stats appear after the first game, so a first visit isn't a wall of zeros. */}
        {stats(progress).played > 0 && <StatsCard progress={progress} today={today} />}
      </div>
    </>
  );
}

function BonusList({ progress, today, activeId }: { progress: Progress; today: string; activeId: string | null }) {
  const rounds = progress.bonus[today] ?? [];
  return (
    <section aria-labelledby="bonus-h" className="flex min-w-0 flex-[1_1_360px] flex-col gap-3 rounded-[20px] border border-line bg-card p-5">
      <h2 id="bonus-h" className="font-serif text-[22px] font-semibold">
        Bonus grids from your reading
      </h2>
      <p className="text-[15px] text-body">
        Answer a field note in the library to open a bonus grid, just for fun.{' '}
        <a href="#rewards" className="font-bold">
          How rewards work
        </a>
      </p>
      {rounds.length === 0 ? (
        <Link href="/library" className="self-start font-bold">
          Find something to read
        </Link>
      ) : (
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
              <span className="text-[14px]">Unlocked by your field note on {b.title}</span>
            </Link>
          </li>
        ))}
        {rounds.length < MAX_BONUS_PER_DAY && (
          <li className="flex-[1_1_200px]">
            <Link href="/library" className="flex h-full flex-col gap-1 rounded-[14px] border-2 border-dashed border-line-strong p-3.5 text-ink no-underline hover:text-ink">
              <strong>
                {MAX_BONUS_PER_DAY - rounds.length} more today
              </strong>
              <span className="text-[14px] text-body">Read something and answer its field note</span>
            </Link>
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
      <h2 id="stats-h" className="font-serif text-[22px] font-semibold">
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
        <p className="text-[15px] text-body">
          You missed {coveredByRest === 1 ? 'a day' : `${coveredByRest} days`}, but a rest day will keep your streak going when you play today.
        </p>
      )}
      {progress.lastDone && streak === 0 && (
        <p className="text-[15px] text-body">Welcome back! Every day is a fresh start. Your best streak is safe in your stats.</p>
      )}
      <div>
        <h3 className="mb-2 text-[15px] font-bold">Tries needed</h3>
        <ul className="flex flex-col gap-1.5" aria-label="Tries histogram">
          {progress.histogram.map((n, k) => (
            <li key={k} className="grid grid-cols-[70px_1fr] items-center gap-2 text-[14px]">
              <span>{labels[k]}</span>
              <span className="flex items-center gap-2">
                <span className="block h-5 rounded-[4px] bg-leaf" style={{ width: `${Math.max(n ? 8 : 2, (n / maxBar) * 100)}%` }} aria-hidden="true" />
                <span>{n}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[14px] text-muted">
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
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="num text-[26px] font-bold">{value}</dd>
    </div>
  );
}

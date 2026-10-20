'use client';

import { useCallback, useEffect, useState } from 'react';
import { BoardSkeleton, MicrogridGame } from '@/components/microgrid/MicrogridGame';
import { localDateKey } from '@/lib/microgrid';
import { currentStreak, saveDaily, stats, useProgress, type DailyGame, type Progress } from '@/lib/progress';

export function PlayClient() {
  const progress = useProgress();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localDateKey()), []);

  const onSaveDaily = useCallback((g: DailyGame) => today && saveDaily(today, g), [today]);

  if (!today || !progress) return <BoardSkeleton label="Loading the puzzle…" />;

  // Stats appear after the first game, so a first visit isn't a wall of zeros. They sit below the game while
  // it's played, and fold into "More about today" once it's done.
  const extras = stats(progress).played > 0 ? <StatsCard progress={progress} today={today} /> : null;

  return (
    <MicrogridGame
      date={today}
      variant="daily"
      saved={progress.games[today]}
      onSave={onSaveDaily}
      ranked
      firstVisit={Object.keys(progress.games).length === 0}
      extras={extras}
    />
  );
}

function StatsCard({ progress, today }: { progress: Progress; today: string }) {
  const s = stats(progress);
  const streak = currentStreak(progress, today);
  const maxBar = Math.max(1, ...progress.histogram);
  const labels = ['1 try', '2 tries', '3 tries', 'Not solved'];
  return (
    <section aria-labelledby="stats-h" className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-line bg-card p-5">
      <h2 id="stats-h" className="font-serif text-heading font-semibold">
        Your stats
      </h2>
      <dl className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
        <Stat label="Played" value={s.played} />
        <Stat label="Win rate" value={`${s.winRate}%`} />
        <Stat label="Day streak" value={streak} />
        <Stat label="Best streak" value={progress.best} />
      </dl>
      <div>
        <h3 className="mb-2 text-small font-bold">Tries needed</h3>
        <ul className="flex flex-col gap-1.5" aria-label="Tries needed each day">
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

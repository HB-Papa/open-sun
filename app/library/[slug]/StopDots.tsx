'use client';

import { useProgress } from '@/lib/progress';

/** A small run of buds for the pathway's stops: read ones filled, this one ringed. */
export function StopDots({ slugs, current }: { slugs: string[]; current: number }) {
  const progress = useProgress();
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {slugs.map((s, k) => {
        const read = !!progress?.visited[s];
        return (
          <span
            key={s}
            className={`h-2.5 w-2.5 rounded-full border ${read ? 'border-leaf bg-leaf' : 'border-line-strong bg-card'} ${
              k === current ? 'outline outline-2 outline-offset-1 outline-sun' : ''
            }`}
          />
        );
      })}
    </span>
  );
}

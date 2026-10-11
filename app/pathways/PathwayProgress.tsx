'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useProgress } from '@/lib/progress';

export function PathwayCardProgress({ slugs }: { slugs: string[] }) {
  const progress = useProgress();
  if (!progress) return null;
  const done = slugs.filter((s) => progress.visited[s]).length;
  if (!done) return null;
  return (
    <span className="mt-auto pt-2 text-[14px] font-bold">
      {done === slugs.length ? 'Pathway complete' : `${done} of ${slugs.length} read`}
    </span>
  );
}

/** A vine that grows down the left side of a pathway as stops are read. */
export function PathwayVine({ slugs }: { slugs: string[] }) {
  const progress = useProgress();
  const reduce = useReducedMotion();
  const done = progress ? slugs.filter((s) => progress.visited[s]).length : 0;
  const frac = slugs.length ? done / slugs.length : 0;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[15px] font-bold" role="status">
        {progress ? (done === slugs.length ? 'You’ve read every stop on this pathway.' : `${done} of ${slugs.length} stops read`) : ' '}
      </p>
      <svg viewBox="0 0 300 24" className="h-6 w-full max-w-[420px]" aria-hidden="true">
        <path d="M4 12 C40 0 60 24 100 12 S160 0 200 12 S260 24 296 12" stroke="var(--line)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <motion.path
          d="M4 12 C40 0 60 24 100 12 S160 0 200 12 S260 24 296 12"
          stroke="#2F6B45"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: frac }}
          transition={{ duration: reduce ? 0 : 1.2, ease: 'easeOut' }}
        />
        {slugs.map((s, k) => {
          const x = 4 + (292 * (k + 1)) / slugs.length;
          const read = progress?.visited[s];
          return read ? <path key={s} d={`M${x - 6} 12 C${x - 6} 4 ${x} 2 ${x + 4} 2 C${x + 4} 8 ${x} 12 ${x - 6} 12Z`} fill="#5E9467" /> : null;
        })}
      </svg>
    </div>
  );
}

export function StepStatus({ slug }: { slug: string }) {
  const progress = useProgress();
  if (!progress) return null;
  const read = progress.visited[slug];
  const noted = progress.notes[slug];
  if (!read) return null;
  return <span className="rounded-full bg-chip-leaf px-2.5 py-0.5 text-[13px] font-bold">{noted ? 'Read · field note' : 'Read'}</span>;
}

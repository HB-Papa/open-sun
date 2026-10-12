'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useProgress } from '@/lib/progress';

export function PathwayCardProgress({ slugs }: { slugs: string[] }) {
  const progress = useProgress();
  if (!progress) return null;
  const done = slugs.filter((s) => progress.visited[s]).length;
  if (!done) return null;
  return (
    <span className="text-small font-bold text-leaf-ink">
      {done === slugs.length ? 'Pathway complete' : `${done} of ${slugs.length} read`}
    </span>
  );
}

/** How far along the pathway the reader is, in words. */
export function PathwayStatus({ slugs }: { slugs: string[] }) {
  const progress = useProgress();
  const done = progress ? slugs.filter((s) => progress.visited[s]).length : 0;
  return (
    <p className="text-small font-bold" role="status">
      {progress ? (done === slugs.length ? 'You’ve read every stop on this pathway.' : `${done} of ${slugs.length} stops read`) : ' '}
    </p>
  );
}

/** "Start at stop 1", or "Continue at stop N" once some stops are read. */
export function ContinueButton({ steps }: { steps: { slug: string; title: string }[] }) {
  const progress = useProgress();
  const firstUnread = progress ? steps.findIndex((s) => !progress.visited[s.slug]) : 0;
  if (firstUnread < 0) return null;
  const k = firstUnread;
  return (
    <Link
      href={`/library/${steps[k].slug}`}
      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-leaf px-6 font-bold text-white no-underline hover:text-white"
    >
      {k === 0 ? 'Start at stop 1' : `Continue at stop ${k + 1}`}
      <span className="sr-only">: {steps[k].title}</span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/**
 * One stretch of the vine that runs down the left of a pathway. It turns green
 * once that stop is read, and the stop's bud opens into a leaf.
 */
export function VineSegment({ slug, index, last }: { slug: string; index: number; last: boolean }) {
  const progress = useProgress();
  const reduce = useReducedMotion();
  const read = !!progress?.visited[slug];
  const side = index % 2 === 0 ? 1 : -1;
  return (
    <span className="relative flex w-12 shrink-0 flex-col items-center" aria-hidden="true">
      {/* The bud, with the stop number. */}
      <span
        className={`num relative z-10 mt-3 flex h-10 w-10 items-center justify-center rounded-[50%_50%_50%_6px] border-2 text-copy font-bold transition-colors duration-500 ${
          read ? 'border-leaf bg-leaf text-white' : 'border-line-strong bg-card text-ink'
        }`}
        style={{ transform: 'rotate(-45deg)' }}
      >
        <span style={{ transform: 'rotate(45deg)' }}>{index + 1}</span>
      </span>
      {!last && (
        <svg viewBox="0 0 48 100" preserveAspectRatio="none" className="absolute left-0 top-12 h-[calc(100%-2rem)] w-12 overflow-visible">
          <path d="M24 0 C24 30 36 40 24 60 S16 90 24 100" stroke="var(--line-strong)" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          <motion.path
            d="M24 0 C24 30 36 40 24 60 S16 90 24 100"
            stroke="var(--leaf)"
            strokeWidth="3"
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: read ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
      )}
      {!last && (
        <svg viewBox="0 0 24 24" className="absolute top-[58%] h-6 w-6 transition-opacity duration-500" style={{ left: side > 0 ? 30 : -6, opacity: read ? 1 : 0.35 }}>
          <path
            d={side > 0 ? 'M2 20 C4 10 12 4 22 3 C21 13 13 19 2 20Z' : 'M22 20 C20 10 12 4 2 3 C3 13 11 19 22 20Z'}
            fill={read ? '#5E9467' : 'var(--line-strong)'}
          />
        </svg>
      )}
    </span>
  );
}

export function StepStatus({ slug }: { slug: string }) {
  const progress = useProgress();
  if (!progress) return null;
  const read = progress.visited[slug];
  const noted = progress.notes[slug];
  if (!read) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-chip-leaf px-3 py-1 text-small font-bold text-leaf-ink">
      <span aria-hidden="true">✓</span>
      {noted ? 'Read · field note' : 'Read'}
    </span>
  );
}

/** The end of the pathway: a bloom once every stop is read, and the way onward. */
export function PathwayEnd({ slugs, next }: { slugs: string[]; next?: { slug: string; title: string; blurb: string } }) {
  const progress = useProgress();
  const done = progress ? slugs.filter((s) => progress.visited[s]).length : 0;
  const complete = progress && done === slugs.length;
  return (
    <div className="nouveau flex flex-wrap items-center gap-6 rounded-[24px] bg-pale-sun px-7 py-7 sm:px-9">
      <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-hidden="true">
        {complete ? (
          <>
            {Array.from({ length: 8 }, (_, k) => (
              <ellipse key={k} cx="32" cy="17" rx="7" ry="13" fill="#E3A72F" opacity="0.9" transform={`rotate(${k * 45} 32 32)`} />
            ))}
            <circle cx="32" cy="32" r="9" fill="#6B4A2E" />
          </>
        ) : (
          <>
            <path d="M32 60 V30" stroke="#2F6B45" strokeWidth="3" />
            <path d="M32 30 C22 28 20 18 26 12 C34 14 36 22 32 30Z" fill="#5E9467" />
            <path d="M32 40 C42 38 46 30 42 24 C36 26 32 32 32 40Z" fill="#3E7C4F" />
          </>
        )}
      </svg>
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
        <p className="font-serif text-heading font-semibold leading-snug">
          {complete ? 'This pathway is in full bloom.' : 'Keep going: the vine grows with every stop you read.'}
        </p>
        {next && (
          <p className="text-copy text-body">
            Next pathway:{' '}
            <Link href={`/pathways/${next.slug}`} className="font-bold">
              {next.title}
            </Link>
            . {next.blurb}
          </p>
        )}
      </div>
    </div>
  );
}

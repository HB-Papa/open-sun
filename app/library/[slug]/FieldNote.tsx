'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { VARIANT_INFO } from '@/lib/microgrid';
import { earnFieldNote, recordVisit, useProgress, type NoteResult } from '@/lib/progress';
import type { FieldNote } from '@/lib/types';

function resultMessage(r: NoteResult): string {
  const parts = ['Field note earned.'];
  if (r.bonus) parts.push(`A bonus grid, “${VARIANT_INFO[r.bonus.variant].name},” is unlocked in Play.`);
  else if (r.bonusCapReached) parts.push('You’ve unlocked all of today’s bonus grids.');
  if (r.restDay) parts.push('You also earned a rest day for your streak.');
  return parts.join(' ');
}

export function FieldNoteCard({ slug, title, topics, note }: { slug: string; title: string; topics: string[]; note?: FieldNote }) {
  const progress = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<NoteResult | null>(null);
  const already = progress?.notes[slug];

  function pick(k: number) {
    if (!note) return;
    setPicked(k);
    if (k === note.answer && !already) setResult(earnFieldNote(slug, title, topics));
  }

  return (
    <section aria-labelledby="note-h" className="flex flex-col gap-3 rounded-[18px] bg-forest p-[22px] text-on-forest">
      <p className="text-[13px] font-bold uppercase tracking-[.08em] text-sun">Field note</p>
      {note ? (
        <>
          <h2 id="note-h" className="font-serif text-[22px] font-semibold leading-snug">
            {note.question}
          </h2>
          <div role="group" aria-labelledby="note-h" className="flex flex-col gap-2">
            {note.options.map((o, k) => {
              const isPicked = picked === k;
              const right = isPicked && k === note.answer;
              const wrong = isPicked && k !== note.answer;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => pick(k)}
                  aria-pressed={isPicked}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left text-base text-[#1E3328] hover:border-leaf"
                  style={{
                    borderColor: right ? '#E3A72F' : wrong ? '#C9774F' : '#DCD3BC',
                    background: right ? '#F3E3B5' : '#FFFDF7',
                  }}
                >
                  <span>{o}</span>
                  {right && <span className="text-[14px] font-bold">✓ Correct</span>}
                  {wrong && <span className="text-[14px] font-bold">✗ Not this one</span>}
                </button>
              );
            })}
          </div>
          <div role="status" aria-live="polite">
            {picked !== null && picked === note.answer && (
              <p className="rounded-xl bg-leaf px-3.5 py-3 text-base text-white">
                {result?.earned ? resultMessage(result) : 'Correct! You already have a field note from this page.'}{' '}
                <Link href="/play" className="font-bold text-white underline hover:text-pale-sun">
                  Go to Play
                </Link>
              </p>
            )}
            {picked !== null && picked !== note.answer && <p className="text-[15px] text-pale-sun">Not quite. The summary on this page has the answer.</p>}
          </div>
          {already && picked === null && <p className="text-[14px] text-on-forest-muted">You’ve already earned the field note for this page.</p>}
        </>
      ) : (
        <>
          <h2 id="note-h" className="font-serif text-[22px] font-semibold leading-snug">
            Read to the end
          </h2>
          <p className="text-base text-on-forest-muted">
            {already ? 'You’ve earned the field note for this page.' : 'Scroll to the end of this page to earn a field note and unlock a bonus grid.'}
          </p>
        </>
      )}
    </section>
  );
}

/** Records the visit (for the garden) and, for pages without a question, awards a note at the end. */
export function ReadToEnd({ slug, title, topics, hasQuestion }: { slug: string; title: string; topics: string[]; hasQuestion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    recordVisit(slug);
  }, [slug]);
  useEffect(() => {
    if (hasQuestion || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          const r = earnFieldNote(slug, title, topics);
          if (r.earned) setMsg(resultMessage(r));
          io.disconnect();
        }
      },
      { threshold: 1 },
    );
    // Only start watching once the reader has scrolled (or lingered), so simply
    // opening a short page doesn't count as reading it.
    const start = () => {
      io.observe(el);
      window.removeEventListener('scroll', start);
      clearTimeout(timer);
    };
    window.addEventListener('scroll', start, { passive: true });
    const timer = setTimeout(start, 15000);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', start);
      clearTimeout(timer);
    };
  }, [slug, title, topics, hasQuestion]);
  return (
    <div ref={ref} className="min-h-1">
      {msg && (
        <p role="status" className="rounded-xl bg-leaf px-3.5 py-3 text-base text-white">
          {msg}{' '}
          <Link href="/play" className="font-bold text-white underline">
            Go to Play
          </Link>
        </p>
      )}
    </div>
  );
}

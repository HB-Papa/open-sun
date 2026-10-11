'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { VARIANT_INFO } from '@/lib/microgrid';
import { earnFieldNote, recordVisit, useProgress, type NoteResult } from '@/lib/progress';
import type { FieldNote } from '@/lib/types';
import { NouveauCorners } from '@/components/Ornaments';

function resultMessage(r: NoteResult): string {
  const parts = ['Field note earned.'];
  if (r.bonus) parts.push(`A bonus grid, “${VARIANT_INFO[r.bonus.variant].name},” is unlocked in Play.`);
  else if (r.bonusCapReached) parts.push('You’ve unlocked all of today’s bonus grids.');
  if (r.restDay) parts.push('You also earned a rest day for your streak.');
  return parts.join(' ');
}

const OPENED = (slug: string) => `opensun:opened:${slug}`;
/** How long someone spends with the summary before the question appears without opening the reading. */
const DWELL_MS = 30000;

/** "Read it free": opening the reading also opens this page's field note. */
export function ReadItLink({ slug, href, children, className }: { slug: string; href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={className}
      rel="noopener"
      onClick={() => {
        try {
          sessionStorage.setItem(OPENED(slug), '1');
        } catch {}
        window.dispatchEvent(new CustomEvent('opensun:opened', { detail: slug }));
      }}
    >
      {children}
    </a>
  );
}

export function FieldNoteCard({ slug, title, topics, note }: { slug: string; title: string; topics: string[]; note?: FieldNote }) {
  const progress = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<NoteResult | null>(null);
  const already = progress?.notes[slug];
  // The question opens once the reader has opened the reading or spent a little while with the summary.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(OPENED(slug))) setOpened(true);
    } catch {}
    const onOpen = (e: Event) => (e as CustomEvent).detail === slug && setOpened(true);
    window.addEventListener('opensun:opened', onOpen);
    const t = setTimeout(() => setOpened(true), DWELL_MS);
    return () => {
      window.removeEventListener('opensun:opened', onOpen);
      clearTimeout(t);
    };
  }, [slug]);
  const unlocked = opened || !!already;

  function pick(k: number) {
    if (!note) return;
    setPicked(k);
    if (k === note.answer && !already) setResult(earnFieldNote(slug, title, topics));
  }

  return (
    <section aria-labelledby="note-h" className="nouveau on-forest relative flex flex-col gap-3.5 rounded-[24px] bg-forest px-6 pb-7 pt-9 text-on-forest sm:px-9">
      <NouveauCorners />
      {note && !unlocked ? (
        <>
          <h2 id="note-h" className="font-serif text-[24px] font-semibold leading-snug">
            A field note is waiting
          </h2>
          <p className="max-w-[56ch] text-[16px] text-on-forest-muted">
            Open the reading with “Read it free”, or spend a little time with the summary, and a short question will appear here. Answer it to open a bonus grid in Play.
          </p>
        </>
      ) : note ? (
        <>
          <h2 id="note-h" className="font-serif text-[24px] font-semibold leading-snug text-balance">
            {note.question}
          </h2>
          <p className="-mt-1 text-[15px] text-on-forest-muted">A field note: answer from what you just read to open a bonus grid in Play.</p>
          <div role="radiogroup" aria-labelledby="note-h" className="flex max-w-[560px] flex-col gap-2">
            {note.options.map((o, k) => {
              const isPicked = picked === k;
              const right = isPicked && k === note.answer;
              const wrong = isPicked && k !== note.answer;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  onClick={() => pick(k)}
                  aria-checked={isPicked}
                  tabIndex={picked === null ? (k === 0 ? 0 : -1) : isPicked ? 0 : -1}
                  onKeyDown={(e) => {
                    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
                    if (!step) return;
                    e.preventDefault();
                    const n = (k + step + note.options.length) % note.options.length;
                    const sibling = e.currentTarget.parentElement?.children[n] as HTMLElement | undefined;
                    sibling?.focus();
                  }}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 px-4 py-2.5 text-left text-base hover:border-sun"
                  style={{
                    color: right ? '#1E3328' : 'var(--option-ink)',
                    borderColor: right ? 'var(--sun)' : wrong ? 'var(--terracotta)' : 'var(--option-line)',
                    background: right ? '#F3E3B5' : 'var(--option-bg)',
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
  // A page counts as read (for the garden and pathways) once the reader scrolls well into it
  // or stays a while, not the moment it opens.
  useEffect(() => {
    let done = false;
    const mark = () => {
      if (done) return;
      done = true;
      recordVisit(slug);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
    const onScroll = () => {
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight >= doc.scrollHeight * 0.6) mark();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = setTimeout(mark, 20000);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
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

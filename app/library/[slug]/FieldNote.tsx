'use client';

import { useEffect, useState } from 'react';
import { recordReflection, recordVisit, useProgress } from '@/lib/progress';
import type { FieldNote } from '@/lib/types';
import { NouveauCorners } from '@/components/Ornaments';

/** "Read it free": opens the publisher's page in a new tab, so Open Sun stays here for the reader's return. */
export function ReadItLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener">
      {children}
    </a>
  );
}

/**
 * A field note: one short question about the reading, for the reader's own reflection.
 * Nothing is earned or unlocked; answering only marks the question as done for next time.
 */
export function FieldNoteCard({ slug, note }: { slug: string; note?: FieldNote }) {
  const progress = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const answered = !!progress?.notes[slug];
  if (!note) return null;

  function pick(k: number) {
    setPicked(k);
    if (k === note!.answer) recordReflection(slug);
  }

  return (
    <section aria-labelledby="note-h" className="nouveau on-forest relative flex flex-col gap-3.5 rounded-[24px] bg-forest px-6 pb-7 pt-9 text-on-forest sm:px-9">
      <NouveauCorners />
      <h2 id="note-h" className="font-serif text-heading font-semibold leading-snug text-balance">
        A question to think about
      </h2>
      <p className="-mt-1 max-w-[56ch] text-copy text-on-forest">{note.question}</p>
      {/* Each answer is a plain button: pressing one answers the question, so it shouldn't pose as a radio choice. */}
      <div role="group" aria-labelledby="note-h" className="flex max-w-[560px] flex-col gap-2">
        {note.options.map((o, k) => {
          const isPicked = picked === k;
          const right = isPicked && k === note.answer;
          const wrong = isPicked && k !== note.answer;
          return (
            <button
              key={k}
              type="button"
              onClick={() => pick(k)}
              aria-describedby={isPicked ? 'note-result' : undefined}
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 px-4 py-2.5 text-left text-copy hover:border-sun"
              style={{
                color: right ? '#1E3328' : 'var(--option-ink)',
                borderColor: right ? 'var(--sun)' : wrong ? 'var(--terracotta)' : 'var(--option-line)',
                background: right ? '#F3E3B5' : 'var(--option-bg)',
              }}
            >
              <span>{o}</span>
              {right && <span className="text-small font-bold">✓ That’s it</span>}
              {wrong && <span className="text-small font-bold">✗ Not this one</span>}
            </button>
          );
        })}
      </div>
      <p id="note-result" role="status" aria-live="polite" className="text-small text-on-forest-gold">
        {picked === null
          ? answered
            ? 'You’ve answered this one before.'
            : ''
          : picked === note.answer
            ? 'That’s it.'
            : 'Not quite. Have another look at the summary and try again.'}
      </p>
    </section>
  );
}

/** Records the visit, which grows the reader's garden, once they've scrolled well into the page or stayed a while. */
export function ReadToEnd({ slug }: { slug: string }) {
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
  return null;
}

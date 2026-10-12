'use client';

import { useEffect, useState } from 'react';

/**
 * Filters the Field Guide as you type. The terms are rendered on the server (so the page
 * works without JavaScript); this only hides the ones that don't match.
 */
export function TermSearch({ total }: { total: number }) {
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(total);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll<HTMLElement>('[data-term]').forEach((el) => {
      const match = !needle || (el.textContent ?? '').toLowerCase().includes(needle);
      el.hidden = !match;
      if (match) n++;
    });
    document.querySelectorAll<HTMLElement>('[data-term-chip]').forEach((el) => {
      const target = document.getElementById(el.dataset.termChip ?? '');
      el.hidden = !!target?.hidden;
    });
    setShown(n);
  }, [q]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="term-search" className="sr-only">
        Search the Field Guide
      </label>
      <input
        id="term-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search terms and definitions"
        className="min-h-12 w-full max-w-[35rem] rounded-full border-2 border-line-strong bg-input px-[18px] text-copy text-ink placeholder:text-muted"
      />
      <p className="text-small text-muted" role="status" aria-live="polite">
        {q.trim() ? (shown ? `${shown} of ${total} terms` : 'No terms match. Try a shorter word.') : ''}
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ItemRow } from '@/components/ItemCard';
import { Pages } from '@/components/Pages';
import type { ItemCard } from '@/lib/types';

const PAGE_SIZE = 20;

/**
 * New arrivals, newest first, 20 to a page. Each page keeps its "Added …" headings, so a day
 * that runs over two pages is headed on both. The server renders page 1, so the list works
 * without JavaScript; ?page= in the address picks up where a shared link left off.
 */
export function NewArrivalsList({ items }: { items: ItemCard[] }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);

  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get('page'));
    if (n > 1) setPage(n);
  }, []);
  useEffect(() => {
    window.history.replaceState(null, '', current > 1 ? `?page=${current}` : window.location.pathname);
  }, [current]);

  function goTo(n: number) {
    setPage(n);
    requestAnimationFrame(() => {
      const list = document.getElementById('arrivals');
      list?.scrollIntoView({ block: 'start' });
      list?.focus({ preventScroll: true });
    });
  }

  const start = (current - 1) * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);
  const perDay = new Map<string, number>();
  for (const i of items) perDay.set(i.dateAdded, (perDay.get(i.dateAdded) ?? 0) + 1);
  const days: [string, ItemCard[]][] = [];
  for (const i of visible) {
    const last = days[days.length - 1];
    if (last && last[0] === i.dateAdded) last[1].push(i);
    else days.push([i.dateAdded, [i]]);
  }

  return (
    <div id="arrivals" tabIndex={-1} className="flex scroll-mt-6 flex-col gap-7">
      {pageCount > 1 && (
        <p className="text-copy text-muted">
          Showing <span className="num">{start + 1}</span>–<span className="num">{start + visible.length}</span> of <span className="num">{items.length}</span>
        </p>
      )}
      {days.map(([d, list]) => (
        <section key={d} aria-labelledby={`d-${d}`} className="flex flex-col gap-3">
          <h2 id={`d-${d}`} className="font-serif text-heading font-semibold">
            Added {formatDate(d)} <span className="text-copy font-normal text-muted">({perDay.get(d)})</span>
          </h2>
          <ul className="flex flex-col gap-2.5">
            {list.map((i) => (
              <li key={i.slug}>
                <ItemRow item={i} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      {pageCount > 1 && <Pages current={current} count={pageCount} onGo={goTo} label="New arrivals pages" />}
    </div>
  );
}

function formatDate(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

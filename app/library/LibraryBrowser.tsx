'use client';

import MiniSearch from 'minisearch';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ItemCardView, ItemRow } from '@/components/ItemCard';
import { Pages } from '@/components/Pages';
import { languageName, topicLabel } from '@/lib/topics';
import type { ItemCard } from '@/lib/types';

const yr = (y: number | null) => y ?? 0;

type Sort = 'relevance' | 'added' | 'newest' | 'oldest';
type LicenseFilter = 'any' | 'cc' | 'cc-by' | 'other';

const VIEW_KEY = 'opensun:library-view';
const PAGE_SIZE = 15;

function licenseGroup(l: string): 'cc-by' | 'cc' | 'other' {
  if (/^CC BY( 4\.0)?$/i.test(l.trim()) || /^CC BY 4\.0/.test(l)) return 'cc-by';
  if (/^CC /i.test(l)) return 'cc';
  return 'other';
}

export function LibraryBrowser({ items }: { items: ItemCard[] }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [topics, setTopics] = useState<string[]>(() => params.getAll('topic'));
  const [types, setTypes] = useState<string[]>(() => params.getAll('type'));
  const [since, setSince] = useState(params.get('since') ?? 'any');
  const [language, setLanguage] = useState(params.get('lang') ?? 'any');
  const [license, setLicense] = useState<LicenseFilter>((params.get('license') as LicenseFilter) ?? 'any');
  const [sort, setSort] = useState<Sort>((params.get('sort') as Sort) ?? 'relevance');
  const [page, setPage] = useState(() => Math.max(1, Number(params.get('page')) || 1));
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(VIEW_KEY);
      if (v === 'list' || v === 'grid') setView(v);
    } catch {}
  }, []);
  function chooseView(v: 'grid' | 'list') {
    setView(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {}
  }

  // Keep the address bar in sync so searches can be shared.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    topics.forEach((t) => sp.append('topic', t));
    types.forEach((t) => sp.append('type', t));
    if (since !== 'any') sp.set('since', since);
    if (language !== 'any') sp.set('lang', language);
    if (license !== 'any') sp.set('license', license);
    if (sort !== 'relevance') sp.set('sort', sort);
    if (page > 1) sp.set('page', String(page));
    const qs = sp.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [query, topics, types, since, language, license, sort, page]);

  const index = useMemo(() => {
    const ms = new MiniSearch<ItemCard & { id: string; authorText: string; topicText: string }>({
      fields: ['title', 'authorText', 'summary', 'topicText'],
      storeFields: [],
      searchOptions: { boost: { title: 2.5, topicText: 1.5 }, prefix: true, fuzzy: 0.2, combineWith: 'AND' },
    });
    ms.addAll(items.map((i) => ({ ...i, id: i.slug, authorText: i.authors.join(' '), topicText: i.topics.map(topicLabel).join(' ') })));
    return ms;
  }, [items]);

  const allTopics = useMemo(() => countBy(items.flatMap((i) => i.topics)), [items]);
  const allTypes = useMemo(() => countBy(items.map((i) => i.type)), [items]);
  const allLangs = useMemo(() => countBy(items.map((i) => i.language)), [items]);
  const years = useMemo(() => {
    const ys = items.map((i) => i.year).filter((y): y is number => y !== null);
    const min = Math.min(...ys);
    const opts = [2025, 2023, 2020, 2015, 2010].filter((y) => y > min);
    return opts;
  }, [items]);

  const results = useMemo(() => {
    let list = items;
    let scores: Map<string, number> | null = null;
    const q = query.trim();
    if (q) {
      const hits = index.search(q);
      scores = new Map(hits.map((h) => [String(h.id), h.score]));
      list = list.filter((i) => scores!.has(i.slug));
    }
    list = list.filter(
      (i) =>
        (!topics.length || topics.some((t) => i.topics.includes(t))) &&
        (!types.length || types.includes(i.type)) &&
        (since === 'any' || yr(i.year) >= Number(since)) &&
        (language === 'any' || i.language === language) &&
        (license === 'any' || (license === 'cc' ? licenseGroup(i.license) !== 'other' : licenseGroup(i.license) === license)),
    );
    const s = sort === 'relevance' && !scores ? 'added' : sort;
    return [...list].sort((a, b) => {
      if (s === 'relevance') return scores!.get(b.slug)! - scores!.get(a.slug)!;
      if (s === 'added') return b.dateAdded.localeCompare(a.dateAdded) || yr(b.year) - yr(a.year);
      if (s === 'newest') return yr(b.year) - yr(a.year);
      return yr(a.year) - yr(b.year);
    });
  }, [items, index, query, topics, types, since, language, license, sort]);

  // Results come 15 to a page. A new search, filter or sort starts again at page 1.
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const filterKey = JSON.stringify([query, topics, types, since, language, license, sort]);
  const lastKey = useRef(filterKey);
  useEffect(() => {
    if (lastKey.current === filterKey) return;
    lastKey.current = filterKey;
    setPage(1);
  }, [filterKey]);
  const start = (current - 1) * PAGE_SIZE;
  const visible = results.slice(start, start + PAGE_SIZE);
  function goTo(n: number) {
    setPage(n);
    requestAnimationFrame(() => {
      const r = document.getElementById('results');
      r?.scrollIntoView({ block: 'start' });
      r?.focus({ preventScroll: true });
    });
  }

  // Announce the count to screen readers only once typing pauses, not on every keystroke.
  const total = results.length === items.length ? `All ${items.length} items` : `${results.length} of ${items.length} items`;
  const countText = pageCount > 1 ? `${total} · showing ${start + 1}–${start + visible.length}` : total;
  const [announced, setAnnounced] = useState(countText);
  useEffect(() => {
    const t = setTimeout(() => setAnnounced(countText), 700);
    return () => clearTimeout(t);
  }, [countText]);

  const activeFilters = topics.length + types.length + (since !== 'any' ? 1 : 0) + (language !== 'any' ? 1 : 0) + (license !== 'any' ? 1 : 0);
  const clearAll = () => {
    setTopics([]);
    setTypes([]);
    setSince('any');
    setLanguage('any');
    setLicense('any');
  };

  return (
    <>
      <form role="search" className="flex flex-wrap gap-2.5" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="lib-search" className="sr-only">
          Search the library
        </label>
        <input
          id="lib-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, author, or idea"
          className="min-h-[52px] flex-[1_1_320px] rounded-full border-2 border-line-strong bg-input px-[18px] text-lede text-ink placeholder:text-muted"
        />
        <div className="hidden flex-wrap gap-2 sm:flex" role="group" aria-label="View">
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => chooseView(v)}
              className={`min-h-[52px] rounded-full border-2 px-[18px] capitalize ${view === v ? 'border-leaf bg-leaf font-bold text-white' : 'border-line-strong bg-card text-ink'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </form>

      <div className="flex flex-wrap items-start gap-7">
        <a href="#results" className="sr-only focus:not-sr-only focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:font-bold">
          Skip to results
        </a>
        {/* Quick topics for phones, where the full filter panel is folded away. */}
        <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 md:hidden" role="group" aria-label="Popular topics">
          {allTopics.slice(0, 4).map(([t]) => {
            const on = topics.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setTopics(on ? topics.filter((x) => x !== t) : [...topics, t])}
                className={`min-h-10 shrink-0 rounded-full border-2 px-3.5 text-small ${on ? 'border-leaf bg-leaf font-bold text-white' : 'border-line-strong bg-card text-ink'}`}
              >
                {topicLabel(t)}
              </button>
            );
          })}
        </div>
        <div className="w-full md:hidden">
          <button
            type="button"
            className="min-h-12 w-full rounded-full border-2 border-line-strong bg-card font-bold text-ink"
            aria-expanded={filtersOpen}
            aria-controls="filters"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            {filtersOpen ? 'Hide filters' : `Show filters${activeFilters ? ` (${activeFilters} on)` : ''}`}
          </button>
        </div>
        <aside
          id="filters"
          aria-label="Filters"
          className={`${filtersOpen ? 'flex' : 'hidden'} max-w-full flex-[1_1_240px] flex-col gap-5 rounded-[18px] border border-line bg-card p-5 md:flex md:max-w-[280px]`}
        >
          <CheckGroup legend="Topic" options={allTopics.map(([t, n]) => ({ value: t, label: topicLabel(t), n }))} selected={topics} onChange={setTopics} show={6} more="topics" />
          <CheckGroup legend="Type" options={allTypes.map(([t, n]) => ({ value: t, label: t, n }))} selected={types} onChange={setTypes} show={4} more="types" />
          <Select id="since" label="Published since" value={since} onChange={setSince} options={[['any', 'Any year'], ...years.map((y) => [String(y), String(y)] as [string, string])]} />
          <Select
            id="lang"
            label="Language"
            value={language}
            onChange={setLanguage}
            options={[['any', 'Any language'], ...allLangs.map(([l, n]) => [l, `${languageName(l)} (${n})`] as [string, string])]}
          />
          <Select
            id="license"
            label="License"
            value={license}
            onChange={(v) => setLicense(v as LicenseFilter)}
            options={[
              ['any', 'Any (all free to read)'],
              ['cc', 'Creative Commons'],
              ['cc-by', 'CC BY only (most reusable)'],
              ['other', 'Free to read, other terms'],
            ]}
          />
          {activeFilters > 0 && (
            <button type="button" onClick={clearAll} className="self-start font-bold text-sky underline">
              Clear all filters
            </button>
          )}
          {/* On phones the results sit below this panel, so close it and jump straight to them. */}
          <div className="sticky bottom-3 md:hidden">
            <button
              type="button"
              onClick={() => {
                setFiltersOpen(false);
                requestAnimationFrame(() => {
                  const r = document.getElementById('results');
                  r?.scrollIntoView({ block: 'start' });
                  r?.focus({ preventScroll: true });
                });
              }}
              className="min-h-12 w-full rounded-full bg-leaf font-bold text-white shadow-[0_8px_20px_-8px_rgba(13,24,18,.6)]"
            >
              Show {results.length} {results.length === 1 ? 'item' : 'items'}
            </button>
          </div>
        </aside>

        <section id="results" tabIndex={-1} aria-label="Results" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-copy text-muted" aria-hidden="true">
              {countText}
            </p>
            <p className="sr-only" role="status" aria-live="polite">
              {announced}
            </p>
            <Select
              id="sort"
              label="Sort by"
              inline
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={[
                ['relevance', query ? 'Most relevant' : 'Newest added'],
                ...(query ? ([['added', 'Newest added']] as [string, string][]) : []),
                ['newest', 'Newest published'],
                ['oldest', 'Oldest published'],
              ]}
            />
          </div>
          {results.length === 0 ? (
            <div className="rounded-[18px] border border-line bg-card p-6 text-lede">
              <p>Nothing matches yet. Try a shorter search or fewer filters.</p>
              <p className="mt-2 text-copy text-muted">
                Know something that belongs here? <a href="/suggest">Suggest a resource</a>.
              </p>
            </div>
          ) : view === 'grid' ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[18px]">
              {visible.map((i) => (
                <li key={i.slug}>
                  <ItemCardView item={i} headingLevel={2} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visible.map((i) => (
                <li key={i.slug}>
                  <ItemRow item={i} />
                </li>
              ))}
            </ul>
          )}
          {pageCount > 1 && <Pages current={current} count={pageCount} onGo={goTo} />}
        </section>
      </div>
    </>
  );
}

function countBy(values: string[]): [string, number][] {
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function CheckGroup({
  legend,
  options,
  selected,
  onChange,
  show,
  more,
}: {
  legend: string;
  options: { value: string; label: string; n: number }[];
  selected: string[];
  onChange: (v: string[]) => void;
  /** How many options to show before "More …". */
  show: number;
  more: string;
}) {
  const [expanded, setExpanded] = useState(false);
  // Always keep checked options visible, even when they're past the cut.
  const visible = expanded ? options : options.filter((o, k) => k < show || selected.includes(o.value));
  const hidden = options.length - visible.length;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-2 text-copy font-bold">{legend}</legend>
      {visible.map((o) => (
        <label key={o.value} className="flex min-h-8 items-center gap-2.5 text-copy">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-[#2F6B45]"
            checked={selected.includes(o.value)}
            onChange={(e) => onChange(e.target.checked ? [...selected, o.value] : selected.filter((s) => s !== o.value))}
          />
          <span>
            {o.label} <span className="num text-muted">({o.n})</span>
          </span>
        </label>
      ))}
      {(hidden > 0 || expanded) && (
        <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="mt-1 self-start font-bold text-sky underline">
          {expanded ? `Fewer ${more}` : `More ${more} (${hidden})`}
        </button>
      )}
    </fieldset>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  options,
  inline,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  inline?: boolean;
}) {
  return (
    <div className={inline ? 'flex items-center gap-2' : 'flex flex-col gap-2'}>
      <label htmlFor={id} className={inline ? 'text-copy' : 'text-copy font-bold'}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-[10px] border-2 border-line-strong bg-input px-2.5 text-copy text-ink"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

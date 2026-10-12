'use client';

/** Numbered pages under a long list: Previous, page numbers (with gaps when there are many), Next. */
export function Pages({ current, count, onGo, label = 'Result pages' }: { current: number; count: number; onGo: (n: number) => void; label?: string }) {
  // Always show the first and last page and the ones next to the current page.
  const nums: (number | 'gap')[] = [];
  for (let n = 1; n <= count; n++) {
    if (n === 1 || n === count || Math.abs(n - current) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== 'gap') nums.push('gap');
  }
  const btn = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 px-3 font-bold';
  return (
    <nav aria-label={label} className="mt-2 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onGo(current - 1)}
        disabled={current === 1}
        className={`${btn} border-line-strong bg-card text-ink disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span aria-hidden="true">←</span>
        <span className="sr-only sm:not-sr-only sm:ml-1.5">Previous</span>
      </button>
      {/* Phones get a compact "Page 3 of 6"; wider screens get the numbered buttons. */}
      <p className="px-2 text-small font-bold sm:hidden">
        Page <span className="num">{current}</span> of <span className="num">{count}</span>
      </p>
      <ol className="hidden flex-wrap items-center gap-1.5 sm:flex">
        {nums.map((n, k) =>
          n === 'gap' ? (
            <li key={`gap-${k}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                onClick={() => onGo(n)}
                aria-current={n === current ? 'page' : undefined}
                aria-label={`Page ${n} of ${count}`}
                className={`${btn} num ${n === current ? 'border-leaf bg-leaf text-white' : 'border-line-strong bg-card text-ink'}`}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        type="button"
        onClick={() => onGo(current + 1)}
        disabled={current === count}
        className={`${btn} border-line-strong bg-card text-ink disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span className="sr-only sm:not-sr-only sm:mr-1.5">Next</span>
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}

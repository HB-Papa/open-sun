'use client';

import { useState } from 'react';
import { numHtml } from '@/lib/nums';

type Cite = { text: string; html: string };

/** The two citation files built for every item by the cite.ris and cite.bib route handlers. */
const FILES = [
  { ext: 'ris', label: 'Download RIS', hint: ' citation file, for Zotero, EndNote or Mendeley' },
  { ext: 'bib', label: 'Download BibTeX', hint: ' citation file, for LaTeX' },
] as const;

export function CitationBox({ apa, chicago, slug }: { apa: Cite; chicago: Cite; slug: string }) {
  const [style, setStyle] = useState<'apa' | 'chicago'>('apa');
  const [status, setStatus] = useState('');
  const cite = style === 'apa' ? apa : chicago;

  async function copy() {
    try {
      // Copy rich text (keeps italics) where supported, with plain text as a fallback.
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([cite.text], { type: 'text/plain' }),
            'text/html': new Blob([cite.html], { type: 'text/html' }),
          }),
        ]);
      } else await navigator.clipboard.writeText(cite.text);
      setStatus(`${style === 'apa' ? 'APA' : 'Chicago'} citation copied.`);
    } catch {
      setStatus('Could not copy. Select the citation text instead.');
    }
  }

  return (
    <section aria-labelledby="cite" className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="cite" className="font-serif text-heading font-semibold">
          Cite this
        </h2>
        <div role="group" aria-label="Citation style" className="flex gap-1.5">
          {(['apa', 'chicago'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={style === s}
              onClick={() => {
                setStyle(s);
                setStatus('');
              }}
              className={`min-h-11 rounded-full border-2 px-4 text-small ${style === s ? 'border-leaf bg-leaf font-bold text-white' : 'border-line-strong bg-card text-ink'}`}
            >
              {s === 'apa' ? 'APA' : 'Chicago'}
            </button>
          ))}
        </div>
      </div>
      <p className="break-words rounded-xl bg-chip px-[18px] py-4 text-copy leading-relaxed" dangerouslySetInnerHTML={{ __html: numHtml(cite.html) }} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={copy} className="min-h-12 rounded-full border-2 border-line-strong bg-card px-5 font-bold text-ink">
          Copy citation
        </button>
        <span role="status" className="text-small text-muted">
          {status}
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Citation files">
        {FILES.map((f) => (
          <li key={f.ext}>
            <a
              href={`/library/${slug}/cite.${f.ext}`}
              download={`${slug}.${f.ext}`}
              className="inline-flex min-h-11 items-center rounded-full border-2 border-line-strong bg-card px-4 text-small text-ink no-underline hover:text-ink hover:underline"
            >
              {f.label}
              <span className="sr-only">{f.hint}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

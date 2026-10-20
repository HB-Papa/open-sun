import type { Metadata } from 'next';
import Link from 'next/link';
import { getGlossary, getItem } from '@/lib/content';
import { shortAuthors } from '@/lib/cite';
import { yearText } from '@/lib/types';
import { PageSky } from '@/components/PageSky';
import { TermGlyph, VineRule } from '@/components/Ornaments';
import { Nums } from '@/lib/nums';
import { FAMILIES, type Family } from '@/lib/topics';
import { TermSearch } from './TermSearch';

export const metadata: Metadata = { title: 'Field Guide', description: 'Short, plain definitions of solarpunk ideas, each linked to readings in the library.' };

export default function FieldGuidePage() {
  const terms = getGlossary();
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[860px] flex-col gap-7 px-4 pb-16 pt-9 sm:px-6">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-5">
          <h1 className="font-serif text-page font-bold leading-none sm:text-hero">Field Guide</h1>
          <VineRule className="hidden sm:flex" />
        </div>
        <p className="max-w-[35rem] text-lede leading-normal text-body">
          Short definitions of the ideas you’ll meet in the library and in the Microgrid puzzle. Each term links to readings.
        </p>
      </div>
      <TermSearch total={terms.length} />
      <nav aria-label="Terms" className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <a
            key={t.slug}
            href={`#${t.slug}`}
            data-term-chip={t.slug}
            className="rounded-full px-3 py-1.5 text-small text-ink no-underline hover:text-ink hover:underline"
            style={{ background: FAMILIES[t.family].tint }}
          >
            {t.term}
          </a>
        ))}
      </nav>
      {/* What the colours mean, in words: each term belongs to one family of ideas. */}
      <p className="-mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-small text-body">
        <span className="font-bold">Each color is a family of ideas:</span>
        {(Object.keys(FAMILIES) as Family[]).map((f) => (
          <span key={f} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: FAMILIES[f].dot }} />
            {FAMILIES[f].label}
          </span>
        ))}
      </p>
      <dl className="flex flex-col gap-4">
        {terms.map((t) => {
          const related = t.related.map(getItem).filter((x) => x !== undefined);
          return (
            <div key={t.slug} id={t.slug} data-term className="scroll-mt-6 rounded-[20px] border border-line bg-card p-6">
              <dt className="flex flex-wrap items-center gap-x-3.5 gap-y-1 font-serif text-heading font-semibold">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink" style={{ background: FAMILIES[t.family].tint }}>
                  <TermGlyph slug={t.slug} className="h-8 w-8" />
                </span>
                {t.term}
                <span className="ml-auto inline-flex items-center gap-1.5 font-sans text-caption font-bold text-muted">
                  <span className="sr-only">, </span>
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: FAMILIES[t.family].dot }} />
                  {FAMILIES[t.family].label}
                </span>
              </dt>
              <dd className="mt-2 max-w-[35rem] text-copy leading-relaxed text-body"><Nums text={t.definition} /></dd>
              {related.length > 0 && (
                <dd className="mt-3 max-w-[33rem] text-small">
                  <span className="font-bold">Read more: </span>
                  {related.map((r, k) => (
                    <span key={r.slug}>
                      {k > 0 && ' · '}
                      <Link href={`/library/${r.slug}`}>{r.title}</Link>{' '}
                      <span className="text-muted">
                        ({shortAuthors(r)}, <span className="num">{yearText(r.year)}</span>)
                      </span>
                    </span>
                  ))}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      </main>
    </>
  );
}

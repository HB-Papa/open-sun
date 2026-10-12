import type { Metadata } from 'next';
import Link from 'next/link';
import { getGlossary, getItem } from '@/lib/content';
import { shortAuthors } from '@/lib/cite';
import { yearText } from '@/lib/types';
import { PageSky } from '@/components/PageSky';
import { TermGlyph, VineRule } from '@/components/Ornaments';
import { Nums } from '@/lib/nums';
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
          <h1 className="font-serif text-[2.5rem] font-bold leading-none sm:text-[3.5rem]">Field Guide</h1>
          <VineRule className="hidden sm:flex" />
        </div>
        <p className="max-w-[35rem] text-lg leading-normal text-body">
          Short definitions of the ideas you’ll meet in the library and in the Microgrid puzzle. Each term links to readings.
        </p>
      </div>
      <TermSearch total={terms.length} />
      <nav aria-label="Terms" className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <a key={t.slug} href={`#${t.slug}`} data-term-chip={t.slug} className="rounded-full border border-line bg-card px-3 py-1.5 text-[0.875rem] text-ink no-underline hover:bg-chip-hover hover:text-ink">
            {t.term}
          </a>
        ))}
      </nav>
      <dl className="flex flex-col gap-4">
        {terms.map((t) => {
          const related = t.related.map(getItem).filter((x) => x !== undefined);
          return (
            <div key={t.slug} id={t.slug} data-term className="scroll-mt-6 rounded-[20px] border border-line bg-card p-6">
              <dt className="flex items-center gap-3.5 font-serif text-[1.5rem] font-semibold">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-chip-leaf text-leaf-ink">
                  <TermGlyph slug={t.slug} className="h-8 w-8" />
                </span>
                {t.term}
              </dt>
              <dd className="mt-2 max-w-[35rem] text-[1.0625rem] leading-relaxed text-body"><Nums text={t.definition} /></dd>
              {related.length > 0 && (
                <dd className="mt-3 max-w-[33rem] text-[0.9375rem]">
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { getGlossary, getItem } from '@/lib/content';
import { shortAuthors } from '@/lib/cite';
import { yearText } from '@/lib/types';

export const metadata: Metadata = { title: 'Field Guide', description: 'Short, plain definitions of solarpunk ideas, each linked to readings in the library.' };

export default function FieldGuidePage() {
  const terms = getGlossary();
  return (
    <main className="mx-auto flex max-w-[860px] flex-col gap-7 px-4 pb-16 pt-9 sm:px-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-serif text-[40px] font-bold sm:text-[44px]">Field Guide</h1>
        <p className="text-lg leading-normal text-body">
          Short definitions of the ideas you’ll meet in the library and in the Microgrid puzzle. Each term links to readings.
        </p>
      </div>
      <nav aria-label="Terms" className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <a key={t.slug} href={`#${t.slug}`} className="rounded-full border border-line bg-card px-3 py-1.5 text-[14px] text-ink no-underline hover:bg-chip-hover hover:text-ink">
            {t.term}
          </a>
        ))}
      </nav>
      <dl className="flex flex-col gap-4">
        {terms.map((t) => {
          const related = t.related.map(getItem).filter((x) => x !== undefined);
          return (
            <div key={t.slug} id={t.slug} className="scroll-mt-6 rounded-[18px] border border-line bg-card p-6">
              <dt className="font-serif text-[24px] font-semibold">{t.term}</dt>
              <dd className="mt-2 text-[17px] leading-relaxed text-body">{t.definition}</dd>
              {related.length > 0 && (
                <dd className="mt-3 text-[15px]">
                  <span className="font-bold">Read more: </span>
                  {related.map((r, k) => (
                    <span key={r.slug}>
                      {k > 0 && ' · '}
                      <Link href={`/library/${r.slug}`}>
                        {shortAuthors(r)} ({yearText(r.year)})
                      </Link>
                    </span>
                  ))}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </main>
  );
}

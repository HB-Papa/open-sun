import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllItems, getItem, relatedItems } from '@/lib/content';
import { apa, chicago, shortAuthors } from '@/lib/cite';
import { LANGUAGES, topicLabel, TYPE_COLORS } from '@/lib/topics';
import { yearText } from '@/lib/types';
import { ExternalIcon } from '@/components/icons';
import { authorsLine } from '@/components/ItemCard';
import { CitationBox } from './CitationBox';
import { FieldNoteCard, ReadToEnd } from './FieldNote';

// Pages are built ahead of time; a slug added while `npm run dev` is running is
// still found (unknown slugs fall through to notFound below).
export function generateStaticParams() {
  return getAllItems().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) return {};
  return { title: `${item.title} (${shortAuthors(item)}, ${yearText(item.year)})`, description: item.summary.slice(0, 200) };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) notFound();
  const related = relatedItems(item);
  const cites = { apa: apa(item), chicago: chicago(item) };
  const venueLine = [item.venue, item.volume && `${item.volume}${item.issue ? `(${item.issue})` : ''}`, !item.volume && item.issue && `no. ${item.issue}`, item.pages]
    .filter(Boolean)
    .join(', ');

  return (
    <main className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-8 px-4 pb-16 pt-7 sm:px-6">
      <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <nav aria-label="Breadcrumb" className="text-[15px]">
          <Link href="/library">Library</Link>
          {item.topics[0] && (
            <>
              {' '}
              <span aria-hidden="true">/</span> <Link href={`/library?topic=${item.topics[0]}`}>{topicLabel(item.topics[0])}</Link>
            </>
          )}
        </nav>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: TYPE_COLORS[item.type] ?? 'var(--chip)' }}>
            {item.type}
          </span>
          <span className="rounded-full bg-chip-leaf px-3 py-1 text-[13px] font-bold">Open access · {item.license}</span>
          <span className="rounded-full bg-chip px-3 py-1 text-[13px]">{yearText(item.year)}</span>
          {item.language !== 'en' && <span className="rounded-full bg-chip px-3 py-1 text-[13px]">In {LANGUAGES[item.language] ?? item.language}</span>}
        </div>
        <h1 className="font-serif text-[34px] font-bold leading-[1.1] sm:text-[44px]">{item.title}</h1>
        <p className="text-lg text-body">
          {authorsLine(item)} · <em>{venueLine}</em>
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={item.url}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-leaf px-[22px] font-bold text-white no-underline hover:text-white"
            rel="noopener"
          >
            Read it free <ExternalIcon />
            <span className="sr-only">(opens the publisher’s site)</span>
          </a>
          {item.doi && item.url !== `https://doi.org/${item.doi}` && (
            <a href={`https://doi.org/${item.doi}`} className="inline-flex min-h-12 items-center px-2 font-bold" rel="noopener">
              Publisher’s page (DOI)
            </a>
          )}
        </div>

        <section aria-labelledby="sum" className="flex flex-col gap-3 rounded-[18px] border border-line bg-card px-6 py-6 sm:px-7">
          <h2 id="sum" className="font-serif text-2xl font-semibold">
            In plain language
          </h2>
          <div className="prose-os" dangerouslySetInnerHTML={{ __html: item.summaryHtml }} />
          {item.why && (
            <>
              <h3 className="mt-1.5 text-[17px] font-bold">Why it matters</h3>
              <p className="text-[17px] leading-relaxed text-body">{item.why}</p>
            </>
          )}
        </section>

        <CitationBox apa={cites.apa} chicago={cites.chicago} />

        <div className="flex flex-wrap gap-2" aria-label="Topics" role="list">
          {item.topics.map((t) => (
            <Link
              role="listitem"
              key={t}
              href={`/library?topic=${t}`}
              className="rounded-full border border-line bg-card px-3 py-1.5 text-[14px] text-ink no-underline hover:bg-chip-hover hover:text-ink"
            >
              {topicLabel(t)}
            </Link>
          ))}
        </div>
        <ReadToEnd slug={item.slug} title={item.title} topics={item.topics} hasQuestion={!!item.fieldNote} />
      </article>

      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
        <FieldNoteCard slug={item.slug} title={`${shortAuthors(item)} (${yearText(item.year)})`} topics={item.topics} note={item.fieldNote} />
        {related.length > 0 && (
          <section aria-labelledby="rel" className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-card p-[22px]">
            <h2 id="rel" className="font-serif text-[22px] font-semibold">
              Read next
            </h2>
            <ul className="flex flex-col gap-3.5">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/library/${r.slug}`} className="flex flex-col gap-1 text-ink no-underline hover:text-ink">
                    <span className="text-base font-bold hover:underline">{r.title}</span>
                    <span className="text-[14px] text-muted">
                      {shortAuthors(r)}, {yearText(r.year)} · {r.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </main>
  );
}

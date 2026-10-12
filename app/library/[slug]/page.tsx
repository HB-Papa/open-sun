import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllItems, getItem, getPathways, relatedItems } from '@/lib/content';
import { apa, chicago, shortAuthors } from '@/lib/cite';
import { LANGUAGES, topicLabel, TYPE_COLORS } from '@/lib/topics';
import { yearText } from '@/lib/types';
import { ExternalIcon } from '@/components/icons';
import { VineRule } from '@/components/Ornaments';
import { authorsLine } from '@/components/ItemCard';
import { CitationBox } from './CitationBox';
import { FieldNoteCard, FieldNoteChip, ReadItLink, ReadToEnd } from './FieldNote';
import { NextStop, PathwayStrip, type Membership } from './PathwayContext';
import { PageSky } from '@/components/PageSky';
import { Nums, numHtml } from '@/lib/nums';

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
  // Pathways this reading belongs to, so the page can say where it sits on the route.
  const pathways = getPathways();
  const memberships: Membership[] = pathways
    .map((p, k) => ({ pathway: p, index: p.steps.findIndex((s) => s.slug === item.slug), next: pathways[(k + 1) % pathways.length] }))
    .filter((m) => m.index >= 0)
    .slice(0, 2);
  const venueLine = [item.venue, item.volume && `${item.volume}${item.issue ? `(${item.issue})` : ''}`, !item.volume && item.issue && `no. ${item.issue}`, item.pages]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-8 px-4 pb-16 pt-7 sm:px-6">
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
        {memberships.map((m) => (
          <PathwayStrip key={m.pathway.slug} m={m} />
        ))}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: TYPE_COLORS[item.type] ?? 'var(--chip)' }}>
            {item.type}
          </span>
          <span className="rounded-full bg-chip-leaf px-3 py-1 text-[13px] font-bold">Open access · {item.license}</span>
          <span className="num rounded-full bg-chip px-3 py-1 text-[13px]">{yearText(item.year)}</span>
          {item.language !== 'en' && <span className="rounded-full bg-chip px-3 py-1 text-[13px]">In {LANGUAGES[item.language] ?? item.language}</span>}
        </div>
        <h1 className="font-serif text-[34px] font-bold leading-[1.1] sm:text-[44px]">{item.title}</h1>
        <p className="text-lg text-body">
          {authorsLine(item)} · <em>{venueLine}</em>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ReadItLink
            slug={item.slug}
            href={item.url}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-leaf px-[22px] font-bold text-white no-underline hover:text-white"
          >
            Read it free <ExternalIcon />
            <span className="sr-only">(opens the publisher’s site in a new tab)</span>
          </ReadItLink>
          {item.fieldNote && <FieldNoteChip slug={item.slug} />}
          {item.doi && item.url !== `https://doi.org/${item.doi}` && (
            <a href={`https://doi.org/${item.doi}`} className="inline-flex min-h-12 items-center px-2 font-bold" rel="noopener">
              Publisher’s page (DOI)
            </a>
          )}
        </div>

        <section aria-labelledby="sum" className="flex flex-col gap-3 rounded-[22px] border border-line bg-card px-6 py-7 sm:px-8">
          <div className="flex items-center gap-4">
            <h2 id="sum" className="font-serif text-2xl font-semibold">
              In plain language
            </h2>
            <VineRule />
          </div>
          <div className="prose-os" dangerouslySetInnerHTML={{ __html: numHtml(item.summaryHtml) }} />
          {item.why && (
            <>
              <h3 className="mt-1.5 text-[17px] font-bold">Why it matters</h3>
              <p className="max-w-[35rem] text-[17px] leading-relaxed text-body"><Nums text={item.why} /></p>
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
        {/* The field note comes after the reading, so it rewards reading rather than skimming. */}
        <FieldNoteCard slug={item.slug} title={`${shortAuthors(item)} (${yearText(item.year)})`} topics={item.topics} note={item.fieldNote} />
        <ReadToEnd slug={item.slug} title={item.title} topics={item.topics} hasQuestion={!!item.fieldNote} />
        {memberships[0] && <NextStop m={memberships[0]} related={related.slice(0, 2).map((r) => ({ slug: r.slug, title: r.title }))} />}
      </article>

      {related.length > 0 && memberships.length === 0 && (
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5 lg:sticky lg:top-6">
        {/* On a pathway, the Next stop card does this job; related reading folds into it. */}
        {related.length > 0 && memberships.length === 0 && (
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
                      {shortAuthors(r)}, <span className="num">{yearText(r.year)}</span> · {r.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
      )}
      </main>
    </>
  );
}

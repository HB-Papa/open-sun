import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuide, getGuides, getItem, getPathway } from '@/lib/content';
import { authorsLine } from '@/components/ItemCard';
import { PageSky } from '@/components/PageSky';
import { numProse } from '@/lib/nums';
import { FAMILIES, type Family } from '@/lib/topics';
import { yearText } from '@/lib/types';
import { longDate } from '../dates';

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGuide((await params).slug);
  return g ? { title: `${g.title} · Research guides`, description: g.blurb } : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const family = FAMILIES[guide.family as Family] ?? FAMILIES.sun;
  const pathways = guide.relatedPathways.map((s) => getPathway(s)!);
  const items = guide.relatedItems.map((s) => getItem(s)!);
  const hasAside = pathways.length + items.length > 0;

  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1100px] flex-col gap-7 px-4 pb-20 pt-7 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-small">
          <Link href="/guides">Research guides</Link>
        </nav>
        <header className="flex max-w-[44rem] flex-col gap-3">
          <span className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-caption font-bold text-ink" style={{ background: family.tint }}>
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: family.dot }} />
            {family.label}
          </span>
          <h1 className="font-serif text-page font-bold leading-[1.05] text-balance sm:text-page-lg">{guide.title}</h1>
          <p className="text-lede leading-normal text-body">{guide.blurb}</p>
          {guide.lastReviewed && <p className="text-small text-muted">Last reviewed {longDate(guide.lastReviewed)}</p>}
        </header>

        <div className={hasAside ? 'grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]' : ''}>
          <article className="prose-os min-w-0" dangerouslySetInnerHTML={{ __html: numProse(guide.html) }} />
          {hasAside && (
            <aside aria-label="In this library" className="flex min-w-0 flex-col gap-6 rounded-[20px] border border-line bg-card p-5 lg:sticky lg:top-6">
              <h2 className="font-serif text-heading font-semibold">In this library</h2>
              {pathways.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-small font-bold text-ink">Pathways</h3>
                  <ul className="flex flex-col gap-2 text-copy">
                    {pathways.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/pathways/${p.slug}`} className="font-bold">
                          {p.title}
                        </Link>
                        <span className="block text-small leading-snug text-body">{p.blurb}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {items.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-small font-bold text-ink">Readings</h3>
                  <ul className="flex flex-col gap-3 text-copy">
                    {items.map((i) => (
                      <li key={i.slug}>
                        <Link href={`/library/${i.slug}`} className="font-bold leading-snug">
                          {i.title}
                        </Link>
                        <span className="block text-small leading-snug text-muted">
                          {authorsLine(i)} · <span className="num">{yearText(i.year)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

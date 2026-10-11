import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItem, getPathway, getPathways } from '@/lib/content';
import { authorsLine } from '@/components/ItemCard';
import { ArchRays, PathwayGlyph } from '@/components/Ornaments';
import { yearText } from '@/lib/types';
import { PathwayEnd, PathwayStatus, StepStatus, VineSegment } from '../PathwayProgress';

export function generateStaticParams() {
  return getPathways().map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPathway((await params).slug);
  return p ? { title: `${p.title} · Pathways`, description: p.blurb } : {};
}

export default async function PathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const pathway = getPathway((await params).slug);
  if (!pathway) notFound();
  const steps = pathway.steps.map((s) => ({ ...s, item: getItem(s.slug) })).filter((s) => s.item);
  const all = getPathways();
  const next = all[(all.findIndex((p) => p.slug === pathway.slug) + 1) % all.length];

  return (
    <main className="mx-auto flex max-w-[860px] flex-col gap-8 px-4 pb-20 pt-7 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-[15px]">
        <Link href="/pathways">Pathways</Link>
      </nav>
      <div className="arch nouveau relative flex flex-col items-center gap-4 px-6 pb-8 pt-10 text-center sm:px-12" style={{ background: pathway.color }}>
        <span className="relative flex h-[84px] w-[140px] items-end justify-center text-leaf-ink" aria-hidden="true">
          <ArchRays className="absolute inset-x-0 top-0 h-12 w-[140px] text-sun" />
          <PathwayGlyph slug={pathway.slug} className="relative h-14 w-14" />
        </span>
        <h1 className="font-serif text-[38px] font-bold leading-[1.05] text-balance sm:text-[52px]">{pathway.title}</h1>
        <p className="text-[15px] text-muted">
          <span className="num">{steps.length}</span> readings
        </p>
        <div className="prose-os text-left text-ink" dangerouslySetInnerHTML={{ __html: pathway.introHtml }} />
        <PathwayStatus slugs={steps.map((s) => s.slug)} />
      </div>
      <ol className="flex flex-col">
        {steps.map((s, k) => (
          <li key={s.slug} className="flex gap-3 sm:gap-4">
            <VineSegment slug={s.slug} index={k} last={k === steps.length - 1} />
            <Link
              href={`/library/${s.slug}`}
              className="card mb-5 flex flex-1 flex-col gap-1.5 rounded-[20px] border border-line bg-card p-5 text-ink no-underline hover:text-ink sm:p-6"
            >
              <span className="sr-only">Stop {k + 1}: </span>
              <span className="font-serif text-[21px] font-semibold leading-snug">{s.item!.title}</span>
              <span className="text-[14px] text-muted">
                {authorsLine(s.item!)} · <span className="num">{yearText(s.item!.year)}</span> · {s.item!.type}
              </span>
              {s.note && <span className="text-base text-body">{s.note}</span>}
              <span className="mt-1">
                <StepStatus slug={s.slug} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <PathwayEnd slugs={steps.map((s) => s.slug)} next={next && next.slug !== pathway.slug ? { slug: next.slug, title: next.title, blurb: next.blurb } : undefined} />
    </main>
  );
}

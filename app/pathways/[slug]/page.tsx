import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItem, getPathway, getPathways } from '@/lib/content';
import { authorsLine } from '@/components/ItemCard';
import { PathwayVine, StepStatus } from '../PathwayProgress';

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

  return (
    <main className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 pb-16 pt-7 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-[15px]">
        <Link href="/pathways">Pathways</Link>
      </nav>
      <div className="flex flex-col gap-3 rounded-3xl p-6 sm:p-8" style={{ background: pathway.color }}>
        <p className="text-[13px] font-bold uppercase tracking-[.06em]">{steps.length} readings</p>
        <h1 className="font-serif text-[36px] font-bold leading-tight sm:text-[44px]">{pathway.title}</h1>
        <div className="prose-os text-ink" dangerouslySetInnerHTML={{ __html: pathway.introHtml }} />
        <PathwayVine slugs={steps.map((s) => s.slug)} />
      </div>
      <ol className="flex flex-col gap-4">
        {steps.map((s, k) => (
          <li key={s.slug} className="flex gap-4">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf font-bold text-white" aria-hidden="true">
              {k + 1}
            </span>
            <Link href={`/library/${s.slug}`} className="card flex flex-1 flex-col gap-1.5 rounded-[18px] border border-line bg-card p-5 text-ink no-underline hover:text-ink">
              <span className="sr-only">Stop {k + 1}: </span>
              <span className="font-serif text-[20px] font-semibold leading-snug">{s.item!.title}</span>
              <span className="text-[14px] text-muted">
                {authorsLine(s.item!)} · {s.item!.year} · {s.item!.type}
              </span>
              {s.note && <span className="text-base text-body">{s.note}</span>}
              <span className="mt-1">
                <StepStatus slug={s.slug} />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}

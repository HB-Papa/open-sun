import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllItems } from '@/lib/content';

// A private checklist of summaries still marked `summary_status: draft`.
// It only exists while running locally (npm run dev); the live site returns 404.
export const metadata: Metadata = { title: 'Draft summaries', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function DraftsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const items = getAllItems();
  const drafts = items.filter((i) => i.summaryStatus === 'draft');
  const unreviewed = items.filter((i) => !i.reviewed);

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 pb-16 pt-9 sm:px-6">
      <p className="self-start rounded-full bg-pale-sun px-3 py-1 text-[0.8125rem] font-bold">Only visible on your computer</p>
      <h1 className="font-serif text-[2.5rem] font-bold">Summaries to edit</h1>
      <p className="text-lg text-body">
        {drafts.length} of {items.length} summaries are still drafts. Open the file, rewrite the summary and “Why it matters” in your own words, then change{' '}
        <code className="rounded bg-chip px-1.5">summary_status: draft</code> to <code className="rounded bg-chip px-1.5">summary_status: edited</code>. This list
        updates when you save.
      </p>
      {unreviewed.length > 0 && (
        <p className="rounded-xl bg-chip-rose p-4">
          {unreviewed.length} item(s) are marked <code>reviewed: false</code>.
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {drafts.map((i) => (
          <li key={i.slug} className="flex flex-col gap-1 rounded-[14px] border border-line bg-card p-4">
            <Link href={`/library/${i.slug}`} className="font-serif text-[1.1875rem] font-semibold">
              {i.title}
            </Link>
            <code className="break-all text-[0.875rem] text-muted">content/library/{i.slug}.md</code>
            <span className="text-[0.875rem] text-muted">
              Source: {i.source === 'agent' ? 'update agent' : 'curated'} · added {i.dateAdded}
            </span>
          </li>
        ))}
      </ol>
      {drafts.length === 0 && <p className="text-lg font-bold">All summaries are edited. 🌱</p>}
    </main>
  );
}

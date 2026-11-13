import type { Metadata } from 'next';
import Link from 'next/link';
import { getGuides } from '@/lib/content';
import { VineRule } from '@/components/Ornaments';
import { PageSky } from '@/components/PageSky';
import { FAMILIES, type Family } from '@/lib/topics';
import { longDate } from './dates';

export const metadata: Metadata = {
  title: 'Research guides',
  description: 'Where and how to search for open access work on solarpunk and related ideas, and how to judge what you find.',
};

export default function GuidesPage() {
  const guides = getGuides();
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[860px] flex-col gap-8 px-4 pb-20 pt-9 sm:px-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-5">
            <h1 className="font-serif text-page font-bold leading-none sm:text-hero">Research guides</h1>
            <VineRule className="hidden sm:flex" />
          </div>
          <p className="max-w-[35rem] text-lede leading-normal text-body">
            The library holds a small, chosen collection. These guides help you search beyond it: where to look for open access work on a subject, which words to try, and
            how to judge what you find.
          </p>
          <p className="max-w-[35rem] text-copy leading-normal text-body">
            Teaching a class? The{' '}
            <Link href="/lessons" className="font-bold">
              lesson plans
            </Link>{' '}
            turn these guides into ready-to-run sessions.
          </p>
        </div>
        {guides.length === 0 ? (
          <p className="text-lede text-body">The first guides are being written.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {guides.map((g) => {
              const family = FAMILIES[g.family as Family] ?? FAMILIES.sun;
              return (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="card flex flex-col gap-2 rounded-[20px] border border-line bg-card p-5 text-ink no-underline hover:text-ink sm:p-6">
                    <span className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-caption font-bold text-ink" style={{ background: family.tint }}>
                      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: family.dot }} />
                      {family.label}
                    </span>
                    <h2 className="font-serif text-heading font-semibold leading-snug">{g.title}</h2>
                    <span className="text-copy leading-normal text-body">{g.blurb}</span>
                    {g.lastReviewed && <span className="text-small text-muted">Last reviewed {longDate(g.lastReviewed)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

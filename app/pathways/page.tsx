import type { Metadata } from 'next';
import Link from 'next/link';
import { getPathways } from '@/lib/content';
import { PathwayCardProgress } from './PathwayProgress';

export const metadata: Metadata = { title: 'Pathways', description: 'Short guided routes through the Open Sun library.' };

export default function PathwaysPage() {
  const pathways = getPathways();
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 pb-16 pt-9 sm:px-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-serif text-[40px] font-bold sm:text-[44px]">Pathways</h1>
        <p className="max-w-[720px] text-lg leading-normal text-body">
          Short routes through the library, eight to nine readings each. Each one grows a vine as you go.
        </p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
        {pathways.map((p) => (
          <li key={p.slug}>
            <Link href={`/pathways/${p.slug}`} className="card flex h-full flex-col gap-2 rounded-[18px] p-6 text-ink no-underline hover:text-ink" style={{ background: p.color }}>
              <span className="text-[13px] font-bold uppercase tracking-[.06em]">{p.steps.length} readings</span>
              <h2 className="font-serif text-[24px] font-bold leading-tight">{p.title}</h2>
              <p className="text-base leading-snug">{p.blurb}</p>
              <PathwayCardProgress slugs={p.steps.map((s) => s.slug)} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

import type { Metadata } from 'next';
import { ItemRow } from '@/components/ItemCard';
import { getAllItems, toCard } from '@/lib/content';
import { PageSky } from '@/components/PageSky';

export const metadata: Metadata = { title: 'New arrivals', description: 'Everything recently added to the Open Sun library.' };

export default function NewArrivalsPage() {
  const items = getAllItems();
  const byDate = new Map<string, typeof items>();
  for (const i of items) byDate.set(i.dateAdded, [...(byDate.get(i.dateAdded) ?? []), i]);
  const dates = [...byDate.keys()].sort().reverse();

  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[860px] flex-col gap-7 px-4 pb-16 pt-9 sm:px-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-serif text-page font-bold leading-[1.05] text-balance sm:text-page-lg">New arrivals</h1>
        <p className="text-lede leading-normal text-body">
          Everything added to the library, newest first. Follow along with the <a href="/rss.xml" className="whitespace-nowrap">RSS feed</a>.
        </p>
      </div>
      {dates.map((d) => (
        <section key={d} aria-labelledby={`d-${d}`} className="flex flex-col gap-3">
          <h2 id={`d-${d}`} className="font-serif text-heading font-semibold">
            Added {formatDate(d)} <span className="text-copy font-normal text-muted">({byDate.get(d)!.length})</span>
          </h2>
          <ul className="flex flex-col gap-2.5">
            {byDate.get(d)!.map((i) => (
              <li key={i.slug}>
                <ItemRow item={toCard(i)} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      </main>
    </>
  );
}

function formatDate(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

import type { Metadata } from 'next';
import { NewArrivalsList } from './NewArrivalsList';
import { getAllItems, toCard } from '@/lib/content';
import { PageSky } from '@/components/PageSky';

export const metadata: Metadata = { title: 'New arrivals', description: 'Everything recently added to the Open Sun library.' };

export default function NewArrivalsPage() {
  const items = getAllItems();

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
      <NewArrivalsList items={items.map(toCard)} />
      </main>
    </>
  );
}

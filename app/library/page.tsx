import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllItems, toCard } from '@/lib/content';
import { LibraryBrowser } from './LibraryBrowser';

export const metadata: Metadata = {
  title: 'The Library',
  description: 'Search and browse free, open access writing on solarpunk and related ideas.',
};

export default function LibraryPage() {
  const items = getAllItems().map(toCard);
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 pb-16 pt-9 sm:px-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-serif text-[40px] font-bold sm:text-[44px]">The Library</h1>
        <p className="max-w-[720px] text-lg leading-normal text-body">
          Every item here is free to read. Search by idea, or filter by type, topic, year, language, and license.
        </p>
      </div>
      <Suspense>
        <LibraryBrowser items={items} />
      </Suspense>
    </main>
  );
}

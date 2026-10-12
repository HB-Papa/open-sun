import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getAllItems, toCard } from '@/lib/content';
import { VineRule } from '@/components/Ornaments';
import { LibraryBrowser } from './LibraryBrowser';
import { PageSky } from '@/components/PageSky';

export const metadata: Metadata = {
  title: 'The Library',
  description: 'Search and browse free, open access writing on solarpunk and related ideas.',
};

export default function LibraryPage() {
  const items = getAllItems().map(toCard);
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-16 pt-8 sm:gap-7 sm:px-6 sm:pt-10">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-5">
          <h1 className="font-serif text-[2.5rem] font-bold leading-none sm:text-[3.5rem]">The Library</h1>
          <VineRule className="hidden sm:flex" />
        </div>
        <p className="max-w-[35rem] text-lg leading-normal text-body">
          Every item here is free to read. Search by idea, or filter by type, topic, year, language, and license. Know something that belongs here?{' '}
          <Link href="/suggest" className="font-bold">
            Suggest a resource
          </Link>
          .
        </p>
      </div>
      <Suspense>
        <LibraryBrowser items={items} />
      </Suspense>
      </main>
    </>
  );
}

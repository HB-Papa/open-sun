import type { Metadata } from 'next';
import Link from 'next/link';
import { PageSky } from '@/components/PageSky';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pb-20 pt-9 sm:px-6">
        <h1 className="font-serif text-page font-bold">This path is overgrown</h1>
        <p className="text-lede text-body">We couldn’t find that page. It may have moved, or the link may be mistyped.</p>
        {/* Ways back in: search for what you came for, or start somewhere familiar. */}
        <form role="search" action="/library" className="flex max-w-[35rem] flex-wrap gap-2.5">
          <label htmlFor="lost-search" className="sr-only">
            Search the library
          </label>
          <input
            id="lost-search"
            name="q"
            type="search"
            placeholder="Title, author, or idea"
            className="min-h-12 flex-[1_1_220px] rounded-full border-2 border-line-strong bg-input px-4 text-copy text-ink placeholder:text-muted"
          />
          <button type="submit" className="min-h-12 rounded-full bg-leaf px-[22px] font-bold text-white">
            Search
          </button>
        </form>
        <p className="text-lede">
          Or <Link href="/library">browse the library</Link>, <Link href="/play">play today’s puzzle</Link>, or <Link href="/">go back home</Link>.
        </p>
      </main>
    </>
  );
}

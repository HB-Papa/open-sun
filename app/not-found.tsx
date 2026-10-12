import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-[760px] flex-col gap-4 px-4 py-20 sm:px-6">
      <h1 className="font-serif text-page font-bold">This path is overgrown</h1>
      <p className="text-lede text-body">We couldn’t find that page. It may have moved, or the link may be mistyped.</p>
      <p className="text-lede">
        <Link href="/library">Browse the library</Link> or <Link href="/">go back home</Link>.
      </p>
    </main>
  );
}

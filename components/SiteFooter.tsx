import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="bg-forest text-on-forest-muted">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-8 px-4 py-10 sm:px-6">
        <div className="max-w-md flex-[1_1_320px]">
          <p className="mb-2 font-serif text-[22px] text-on-forest">Open Sun</p>
          <p className="text-[15px] leading-relaxed">
            Every item is free to read. New items are found by a search each week and approved by a person before they appear.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap content-start gap-x-6 gap-y-3 text-base">
          <Link href="/about" className="text-on-forest hover:text-sun">About</Link>
          <Link href="/suggest" className="text-on-forest hover:text-sun">Suggest a resource</Link>
          <Link href="/new" className="text-on-forest hover:text-sun">New arrivals</Link>
          <a href="/rss.xml" className="text-on-forest hover:text-sun">RSS feed</a>
          <Link href="/about#accessibility" className="text-on-forest hover:text-sun">Accessibility</Link>
        </nav>
      </div>
    </footer>
  );
}

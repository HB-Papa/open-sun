import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="on-forest relative mt-12 bg-forest text-on-forest-muted">
      {/* The page ends on a hill, like the hero begins on one. */}
      <svg viewBox="0 0 1200 48" preserveAspectRatio="none" className="absolute bottom-full left-0 h-8 w-full sm:h-12" aria-hidden="true">
        <path d="M0 48 C180 14 380 34 600 22 C820 10 1000 30 1200 14 V48 Z" fill="var(--forest)" />
      </svg>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8 px-4 py-10 sm:px-6">
        <p className="font-serif text-[1.375rem] text-on-forest">Open Sun</p>
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

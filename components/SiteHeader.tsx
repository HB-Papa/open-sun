'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { localDateKey } from '@/lib/microgrid';
import { useProgress } from '@/lib/progress';
import { dayStatus } from '@/lib/dayStatus';
import { NAV } from '@/lib/site';
import { Logo } from './icons';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes the phone menu and puts focus back on its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      menuButton.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-2 gap-y-4 px-4 py-3 min-[400px]:gap-x-3 sm:px-6 sm:py-4">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-2 text-ink no-underline hover:text-ink min-[400px]:gap-2.5">
          <Logo size={32} />
          <span className="font-serif text-heading font-bold">Open Sun</span>
        </Link>
        {/* The home hero has its own Play row, and /play is the game itself. */}
        {pathname !== '/play' && pathname !== '/' && <PlayPill />}
        <button
          ref={menuButton}
          type="button"
          className="min-h-11 rounded-full border-2 border-line-strong bg-card px-3 font-bold text-ink min-[360px]:px-4 md:hidden"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {/* "Close" keeps the button the same width as "Menu", so the header never wraps; aria-expanded gives the state. */}
          {open ? 'Close' : 'Menu'}
        </button>
        <nav
          id="main-nav"
          aria-label="Main"
          className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-1 text-copy md:flex md:w-auto md:flex-row md:flex-wrap md:gap-x-5`}
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? 'page' : undefined}
              className={`border-b-[3px] py-2.5 text-ink no-underline hover:text-ink ${
                isActive(n.href) ? 'border-sun font-bold' : 'border-transparent hover:border-line-strong'
              }`}
            >
              {n.label}
            </Link>
          ))}
          {/* On phones the footer is far away, so the menu also offers suggestions. */}
          <Link
            href="/suggest"
            aria-current={isActive('/suggest') ? 'page' : undefined}
            className="border-b-[3px] border-transparent py-2.5 text-ink no-underline hover:text-ink md:hidden"
          >
            Suggest a resource
          </Link>
          <ThemeToggle variant="menu" className="md:hidden" />
        </nav>
        <ThemeToggle className="hidden md:ml-3 md:inline-flex" />
      </div>
    </header>
  );
}

/** On phones, today's puzzle is always one tap away from any page. */
function PlayPill() {
  const progress = useProgress();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localDateKey()), []);
  const status = dayStatus(today ? progress?.games[today] : undefined);
  return (
    <Link
      href="/play"
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-forest px-3 font-bold ${status ? '' : 'min-[360px]:px-3.5'} text-on-forest no-underline hover:text-on-forest md:hidden dark:ring-1 dark:ring-sun/60`}
    >
      {!status && <span aria-hidden="true" className="hidden h-2.5 w-2.5 rounded-full bg-sun min-[360px]:block" />}
      {/* After today's game, the pill shows how it went in a few characters; screen readers hear the full words. */}
      {status ? (
        <>
          {/* The score where it fits; the narrowest phones get a tick so the header stays on one line. */}
          <span aria-hidden="true" className="min-[360px]:hidden">
            ✓
          </span>
          <span aria-hidden="true" className="num hidden min-[360px]:inline">
            {status.short}
          </span>
          <span className="sr-only">{status.spoken}, see your day</span>
        </>
      ) : (
        'Play'
      )}
    </Link>
  );
}

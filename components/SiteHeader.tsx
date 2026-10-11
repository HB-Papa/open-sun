'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { localDateKey } from '@/lib/microgrid';
import { useProgress } from '@/lib/progress';
import { NAV } from '@/lib/site';
import { Logo } from './icons';

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
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-3 gap-y-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="mr-auto flex items-center gap-2.5 text-ink no-underline hover:text-ink md:mr-0">
          <Logo />
          <span className="font-serif text-[26px] font-bold">Open Sun</span>
        </Link>
        {pathname !== '/play' && <PlayPill />}
        <button
          ref={menuButton}
          type="button"
          className="min-h-11 rounded-full border-2 border-line-strong bg-card px-4 font-bold text-ink md:hidden"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close menu' : 'Menu'}
        </button>
        <nav
          id="main-nav"
          aria-label="Main"
          className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-1 text-[17px] md:flex md:w-auto md:flex-row md:flex-wrap md:gap-x-5`}
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
        </nav>
      </div>
    </header>
  );
}

/** On phones, today's puzzle is always one tap away from any page. */
function PlayPill() {
  const progress = useProgress();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localDateKey()), []);
  const played = !!(today && progress?.games[today]?.done);
  return (
    <Link
      href="/play"
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-4 font-bold text-on-forest no-underline hover:text-on-forest md:hidden"
    >
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-sun" />
      {played ? (
        <>
          Played <span aria-hidden="true">✓</span>
          <span className="sr-only">today</span>
        </>
      ) : (
        'Play'
      )}
    </Link>
  );
}

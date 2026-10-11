'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV } from '@/lib/site';
import { Logo } from './icons';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline hover:text-ink">
          <Logo />
          <span className="font-serif text-[26px] font-bold">Open Sun</span>
        </Link>
        <button
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

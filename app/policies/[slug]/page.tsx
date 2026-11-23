import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPolicies, getPolicy } from '@/lib/content';
import { PageSky } from '@/components/PageSky';
import { numProse } from '@/lib/nums';
import { longDate } from '../../guides/dates';

export function generateStaticParams() {
  return getPolicies().map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPolicy((await params).slug);
  return p ? { title: `${p.title} · Policies`, description: p.blurb } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const policy = getPolicy((await params).slug);
  if (!policy) notFound();
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 pb-20 pt-7 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-small">
          <Link href="/policies">Policies</Link>
        </nav>
        <header className="flex flex-col gap-3">
          <h1 className="font-serif text-page font-bold leading-[1.05] text-balance sm:text-page-lg">{policy.title}</h1>
          <p className="text-lede leading-normal text-body">{policy.blurb}</p>
          {policy.lastReviewed && <p className="text-small text-muted">Last reviewed {longDate(policy.lastReviewed)}</p>}
        </header>
        <article className="prose-os" dangerouslySetInnerHTML={{ __html: numProse(policy.html) }} />
      </main>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { getPolicies } from '@/lib/content';
import { VineRule } from '@/components/Ornaments';
import { PageSky } from '@/components/PageSky';
import { longDate } from '../guides/dates';

export const metadata: Metadata = { title: 'Policies', description: 'How Open Sun chooses what it collects, and how AI is used in running it.' };

export default function PoliciesPage() {
  const policies = getPolicies();
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[760px] flex-col gap-8 px-4 pb-20 pt-9 sm:px-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-5">
            <h1 className="font-serif text-page font-bold leading-none sm:text-hero">Policies</h1>
            <VineRule className="hidden sm:flex" />
          </div>
          <p className="max-w-[35rem] text-lede leading-normal text-body">How the library is run, written down so anyone can check it.</p>
        </div>
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {policies.map((p) => (
            <li key={p.slug} className="flex flex-col gap-1 py-5">
              <h2 className="font-serif text-heading font-semibold leading-snug">
                <Link href={`/policies/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="text-copy leading-normal text-body">{p.blurb}</p>
              {p.lastReviewed && <p className="text-small text-muted">Last reviewed {longDate(p.lastReviewed)}</p>}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

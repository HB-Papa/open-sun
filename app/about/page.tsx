import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import { PageSky } from '@/components/PageSky';
import { numHtml } from '@/lib/nums';

export const metadata: Metadata = { title: 'About', description: 'What Open Sun is, how items are chosen, and how new items are found.' };

export default function AboutPage() {
  const page = getPage('about');
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 pb-16 pt-9 sm:px-6">
      <h1 className="font-serif text-page font-bold leading-[1.05] text-balance sm:text-page-lg">{page.title}</h1>
      <div className="prose-os [&_h2]:scroll-mt-6" dangerouslySetInnerHTML={{ __html: numHtml(page.html) }} />
      </main>
    </>
  );
}

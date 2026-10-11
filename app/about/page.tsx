import type { Metadata } from 'next';
import { getPage } from '@/lib/content';

export const metadata: Metadata = { title: 'About', description: 'What Open Sun is, how items are chosen, and how new items are found.' };

export default function AboutPage() {
  const page = getPage('about');
  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 pb-16 pt-9 sm:px-6">
      <h1 className="font-serif text-[40px] font-bold sm:text-[44px]">{page.title}</h1>
      <div className="prose-os [&_h2]:scroll-mt-6" dangerouslySetInnerHTML={{ __html: page.html }} />
    </main>
  );
}

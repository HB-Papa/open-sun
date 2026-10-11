import type { Metadata } from 'next';
import { SuggestForm } from './SuggestForm';

export const metadata: Metadata = { title: 'Suggest a resource', description: 'Know a free, open access resource that belongs in Open Sun? Tell us.' };

export default function SuggestPage() {
  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 pb-16 pt-9 sm:px-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-serif text-[40px] font-bold sm:text-[44px]">Suggest a resource</h1>
        <p className="text-lg leading-normal text-body">
          Know an article, book, story collection, or guide that belongs here? It should be free to read online and connected to solarpunk or the ideas around it. A
          person reviews every suggestion. No account needed.
        </p>
      </div>
      <SuggestForm />
    </main>
  );
}

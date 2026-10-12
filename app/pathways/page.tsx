import type { Metadata } from 'next';
import { getPathways } from '@/lib/content';
import { VineRule } from '@/components/Ornaments';
import { PathwayWindow, readingsPhrase } from '@/components/PathwayWindow';
import { PathwayCardProgress } from './PathwayProgress';
import { PageSky } from '@/components/PageSky';

export const metadata: Metadata = { title: 'Pathways', description: 'Short guided routes through the Open Sun library.' };

export default function PathwaysPage() {
  const pathways = getPathways();
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-20 pt-10 sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-5">
          <h1 className="font-serif text-[44px] font-bold leading-none sm:text-[56px]">Pathways</h1>
          <VineRule className="hidden sm:flex" />
        </div>
        <p className="max-w-[35rem] text-lg leading-normal text-body">
          Short routes through the library, {readingsPhrase(pathways)} readings each. Each one grows a vine as you go.
        </p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
        {pathways.map((p, k) => (
          <li key={p.slug}>
            <PathwayWindow pathway={p} headingLevel={2} featured={k === 0}>
              <PathwayCardProgress slugs={p.steps.map((s) => s.slug)} />
            </PathwayWindow>
          </li>
        ))}
      </ul>
      </main>
    </>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BoardSkeleton } from '@/components/microgrid/MicrogridGame';
import { getItem, getPathways } from '@/lib/content';
import { PlayClient, type Suggestion } from './PlayClient';

export const metadata: Metadata = {
  title: 'Play Microgrid',
  description: 'A three-minute daily puzzle: keep a small solarpunk neighborhood lit for 24 hours.',
};

export default function PlayPage() {
  // Readings with field notes, in pathway order, so /play can suggest a specific next read.
  const seen = new Set<string>();
  const suggestions: Suggestion[] = [];
  for (const p of getPathways())
    for (const s of p.steps) {
      const item = getItem(s.slug);
      if (!item?.fieldNote || seen.has(s.slug)) continue;
      seen.add(s.slug);
      suggestions.push({ slug: s.slug, title: item.title, pathway: p.title });
    }
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 md:pb-16">
      <Suspense fallback={<BoardSkeleton label="Loading the puzzle…" />}>
        <PlayClient suggestions={suggestions} />
      </Suspense>
    </main>
  );
}

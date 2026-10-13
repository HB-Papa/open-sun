import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BoardSkeleton } from '@/components/microgrid/MicrogridGame';
import { PlayClient } from './PlayClient';

export const metadata: Metadata = {
  title: 'Microgrid',
  description: 'A three-minute daily puzzle: keep a small solarpunk neighborhood lit for 24 hours.',
};

export default function MicrogridPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-32 pt-5 sm:px-6 sm:pt-7 md:pb-16">
      <Suspense fallback={<BoardSkeleton label="Loading the puzzle…" />}>
        <PlayClient />
      </Suspense>
    </main>
  );
}

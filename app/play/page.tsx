import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PlayClient } from './PlayClient';

export const metadata: Metadata = {
  title: 'Play Microgrid',
  description: 'A three-minute daily puzzle: keep a small solarpunk neighborhood lit for 24 hours.',
};

export default function PlayPage() {
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-32 pt-7 sm:px-6 md:pb-16">
      <Suspense fallback={<p className="py-16 text-center text-lg text-muted">Loading the puzzle…</p>}>
        <PlayClient />
      </Suspense>
    </main>
  );
}

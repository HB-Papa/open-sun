import type { Metadata } from 'next';
import Link from 'next/link';
import { getLessons } from '@/lib/content';
import { VineRule } from '@/components/Ornaments';
import { PageSky } from '@/components/PageSky';
import { longDate } from '../guides/dates';

export const metadata: Metadata = {
  title: 'Lesson plans',
  description: 'Ready-to-run information-literacy lessons on finding, judging and reusing open access research, mapped to the ACRL Framework.',
};

export default function LessonsPage() {
  const lessons = getLessons();
  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[860px] flex-col gap-8 px-4 pb-20 pt-9 sm:px-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-5">
            <h1 className="font-serif text-page font-bold leading-none sm:text-hero">Lesson plans</h1>
            <VineRule className="hidden sm:flex" />
          </div>
          <p className="max-w-[35rem] text-lede leading-normal text-body">
            Class sessions on finding, judging and reusing open access research, built around readings in this library. Each one lists its learning outcomes, a timed plan,
            an activity, an assessment and ways to adapt it.
          </p>
          <p className="max-w-[35rem] text-copy leading-normal text-body">
            Each lesson is mapped to a frame of the{' '}
            <a href="https://www.ala.org/acrl/standards/ilframework" rel="noopener">
              ACRL Framework for Information Literacy
            </a>{' '}
            and uses the{' '}
            <Link href="/guides" className="font-bold">
              research guides
            </Link>{' '}
            as handouts.
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          {lessons.map((l) => (
            <li key={l.slug}>
              <Link href={`/lessons/${l.slug}`} className="card flex flex-col gap-2 rounded-[20px] border border-line bg-card p-5 text-ink no-underline hover:text-ink sm:p-6">
                <span className="flex flex-wrap gap-1.5">
                  {l.frames.map((f) => (
                    <span key={f} className="rounded-full bg-chip-sky px-3 py-1 text-caption font-bold text-ink">
                      {f}
                    </span>
                  ))}
                </span>
                <h2 className="font-serif text-heading font-semibold leading-snug">{l.title}</h2>
                <span className="text-copy leading-normal text-body">{l.blurb}</span>
                <span className="text-small text-muted">
                  {[l.duration, l.level].filter(Boolean).join(' · ')}
                  {l.lastReviewed && ` · Last reviewed ${longDate(l.lastReviewed)}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

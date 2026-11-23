import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuide, getItem, getLesson, getLessons } from '@/lib/content';
import { authorsLine } from '@/components/ItemCard';
import { PageSky } from '@/components/PageSky';
import { numProse } from '@/lib/nums';
import { yearText } from '@/lib/types';
import { longDate } from '../../guides/dates';

export function generateStaticParams() {
  return getLessons().map((l) => ({ slug: l.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const l = getLesson((await params).slug);
  return l ? { title: `${l.title} · Lesson plans`, description: l.blurb } : {};
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  if (!lesson) notFound();
  const guides = lesson.relatedGuides.map((s) => getGuide(s)!);
  const items = lesson.relatedItems.map((s) => getItem(s)!);
  const facts: [string, string][] = [
    ['For', lesson.level],
    ['Length', lesson.duration],
    ['Format', lesson.format],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[1100px] flex-col gap-7 px-4 pb-20 pt-7 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-small">
          <Link href="/lessons">Lesson plans</Link>
        </nav>
        <header className="flex max-w-[44rem] flex-col gap-3">
          <span className="flex flex-wrap gap-1.5">
            {lesson.frames.map((f) => (
              <span key={f} className="rounded-full bg-chip-sky px-3 py-1 text-caption font-bold text-ink">
                {f}
              </span>
            ))}
          </span>
          <h1 className="font-serif text-page font-bold leading-[1.05] text-balance sm:text-page-lg">{lesson.title}</h1>
          <p className="text-lede leading-normal text-body">{lesson.blurb}</p>
          {lesson.lastReviewed && <p className="text-small text-muted">Last reviewed {longDate(lesson.lastReviewed)}</p>}
        </header>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-8">
            {/* The plan at a glance: who it's for and what students will be able to do. */}
            <section aria-labelledby="outcomes" className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-5 sm:p-6">
              <dl className="grid gap-x-6 gap-y-2 text-copy sm:grid-cols-[auto_1fr]">
                {facts.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-bold text-ink">{k}</dt>
                    <dd className="text-body">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-2 border-t border-dashed border-line pt-4">
                <h2 id="outcomes" className="font-serif text-heading font-semibold">
                  Learning outcomes
                </h2>
                <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-copy leading-normal text-body">
                  {lesson.outcomes.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ol>
              </div>
            </section>
            <article className="prose-os min-w-0" dangerouslySetInnerHTML={{ __html: numProse(lesson.html) }} />
          </div>

          <aside aria-label="Materials" className="flex min-w-0 flex-col gap-6 rounded-[20px] border border-line bg-card p-5 lg:sticky lg:top-6">
            <h2 className="font-serif text-heading font-semibold">Materials</h2>
            {guides.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-small font-bold text-ink">Handouts</h3>
                <ul className="flex flex-col gap-2 text-copy">
                  {guides.map((g) => (
                    <li key={g.slug}>
                      <Link href={`/guides/${g.slug}`} className="font-bold">
                        {g.title}
                      </Link>
                      <span className="block text-small leading-snug text-body">Research guide</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {items.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-small font-bold text-ink">Readings used</h3>
                <ul className="flex flex-col gap-3 text-copy">
                  {items.map((i) => (
                    <li key={i.slug}>
                      <Link href={`/library/${i.slug}`} className="font-bold leading-snug">
                        {i.title}
                      </Link>
                      <span className="block text-small leading-snug text-muted">
                        {authorsLine(i)} · <span className="num">{yearText(i.year)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}

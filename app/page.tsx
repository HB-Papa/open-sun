import Link from 'next/link';
import { Hero } from '@/components/HeroSky';
import { ItemCardView } from '@/components/ItemCard';
import { SectionHeading } from '@/components/Ornaments';
import { PathwayWindow } from '@/components/PathwayWindow';
import { GardenCard, TodayPuzzleCard } from '@/components/TodayCards';
import { getAllItems, getPathways, toCard } from '@/lib/content';

export default function HomePage() {
  const items = getAllItems();
  // Newest additions first; on a tie, favor items with an edited summary, then the most recent work.
  const latest = [...items]
    .sort(
      (a, b) =>
        b.dateAdded.localeCompare(a.dateAdded) ||
        Number(b.summaryStatus === 'edited') - Number(a.summaryStatus === 'edited') ||
        (b.year ?? 0) - (a.year ?? 0),
    )
    .slice(0, 3);
  const pathways = getPathways();

  return (
    <main id="main" tabIndex={-1}>
      <Hero />

      <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 pb-20 sm:px-6">
        {/* Today's puzzle rises out of the front hill. */}
        <section aria-labelledby="today" className="relative z-10 -mt-6 flex flex-wrap gap-6 md:-mt-28">
          <TodayPuzzleCard />
          <GardenCard />
        </section>

        <section aria-labelledby="new" className="flex flex-col gap-6">
          <SectionHeading
            id="new"
            action={
              <Link href="/new" className="text-[17px] font-bold">
                See all new arrivals
              </Link>
            }
          >
            New in the library
          </SectionHeading>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
            {latest.map((i) => (
              <li key={i.slug}>
                <ItemCardView item={toCard(i)} />
              </li>
            ))}
          </ul>
        </section>

        <section id="pathways" aria-labelledby="paths" className="flex flex-col gap-5">
          <SectionHeading id="paths">Pathways: guided reading</SectionHeading>
          <p className="max-w-[640px] text-lg leading-normal text-body">
            Short routes through the library, eight or nine readings each. Every stop with a field note can unlock a bonus grid.
          </p>
          <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:overflow-visible sm:px-0 sm:pb-0">
            {pathways.map((p, k) => (
              <li key={p.slug} className="w-[240px] shrink-0 snap-start sm:w-auto">
                <PathwayWindow pathway={p} featured={k === 0} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="what" className="flex flex-wrap items-center gap-8 border-t border-line pt-12">
          <div className="flex-[1_1_360px]">
            <h2 id="what" className="mb-3 font-serif text-[32px] font-semibold">
              What is solarpunk?
            </h2>
            <p className="mb-3 max-w-[60ch] text-lg leading-relaxed text-body">
              Solarpunk imagines a future powered by the sun, woven into living ecosystems, and built around community instead of profit. It began as an internet word around
              2008 and has grown into fiction, art, design, scholarship, and activism.
            </p>
            <Link href="/field-guide" className="text-[17px] font-bold">
              Read the Field Guide
            </Link>
          </div>
          <div className="nouveau flex-[1_1_320px] rounded-[22px] bg-pale-sun px-7 py-6">
            <p className="mb-2.5 font-serif text-[22px] leading-snug">New here? Start with one short essay.</p>
            <p className="mb-3 text-base text-body">
              Adam Flynn’s “Solarpunk: Notes toward a Manifesto” (<span className="num">2014</span>) is one of the texts most people point to when explaining what solarpunk is
              for.
            </p>
            <Link href="/library/flynn-2014-solarpunk-notes-manifesto" className="font-bold">
              Read the summary
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

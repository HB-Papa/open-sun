import Link from 'next/link';
import { Hero } from '@/components/HeroSky';
import { ItemCardView } from '@/components/ItemCard';
import { SectionHeading } from '@/components/Ornaments';
import { PathwayWindow, readingsPhrase } from '@/components/PathwayWindow';
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
        {/* Phones: two short tiles side by side. Wider screens: the full puzzle card beside the garden. */}
        <section aria-labelledby="today" className="relative z-10 -mt-4 grid grid-cols-2 gap-3 sm:-mt-10 sm:flex sm:flex-wrap sm:gap-6 xl:-mt-28">
          <TodayPuzzleCard />
          <GardenCard />
        </section>

        <section aria-labelledby="new" className="flex flex-col gap-6">
          <SectionHeading
            id="new"
            action={
              <Link href="/new" className="text-copy font-bold">
                See all new arrivals
              </Link>
            }
          >
            New in the library
          </SectionHeading>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
            {latest.map((i) => (
              <li key={i.slug}>
                <ItemCardView item={toCard(i)} phoneCompact />
              </li>
            ))}
          </ul>
        </section>

        <section id="pathways" aria-labelledby="paths" className="flex flex-col gap-5">
          <SectionHeading id="paths">Pathways: guided reading</SectionHeading>
          <p className="max-w-[35rem] text-lede leading-normal text-body">
            Short routes through the library, {readingsPhrase(pathways)} readings each.
          </p>
          {/* A scrolling row clips whatever sits outside it, so the top padding keeps the arches and the "Start here" ring whole. */}
          <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 pt-1.5 sm:mx-0 sm:grid sm:pt-0 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:overflow-visible sm:px-0 sm:pb-0">
            {pathways.map((p, k) => (
              <li key={p.slug} className="w-[240px] shrink-0 snap-start sm:w-auto">
                <PathwayWindow pathway={p} featured={k === 0} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="what" className="flex flex-col gap-3 border-t border-line pt-12">
          <h2 id="what" className="font-serif text-section font-semibold">
            Where solarpunk came from
          </h2>
          <p className="max-w-[35rem] text-lede leading-relaxed text-body">
            Solarpunk began as an internet word around <span className="num">2008</span> and has grown into fiction, art, design, scholarship, and activism. The Field Guide
            explains the ideas you’ll meet here, from agrivoltaics to the commons.
          </p>
          <Link href="/field-guide" className="self-start text-copy font-bold">
            Read the Field Guide
          </Link>
        </section>
      </div>
    </main>
  );
}

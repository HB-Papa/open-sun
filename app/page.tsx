import Link from 'next/link';
import { HeroSky } from '@/components/HeroSky';
import { ItemCardView } from '@/components/ItemCard';
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
        b.year - a.year,
    )
    .slice(0, 3);
  const pathways = getPathways();

  return (
    <>
      <section className="relative overflow-hidden bg-pale-sun">
        <HeroSky />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
            <div className="max-w-[620px] rounded-[20px] bg-card/95 px-6 py-6 shadow-[0_6px_20px_rgba(30,51,40,.10)] sm:px-8 sm:py-7">
              <h1 className="mb-3 font-serif text-[36px] font-bold leading-[1.05] sm:text-[48px]">A free library for a brighter tomorrow</h1>
              <p className="mb-5 text-[17px] leading-normal text-body sm:text-[19px]">
                Open access writing on solarpunk, solar power, living land, and the commons, gathered in one place and updated every week.
              </p>
              <form role="search" action="/library" className="flex flex-wrap gap-2.5">
                <label htmlFor="home-search" className="sr-only">
                  Search the library
                </label>
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Try: community solar, agrivoltaics"
                  className="min-h-12 flex-[1_1_220px] rounded-full border-2 border-line-strong bg-input px-4 text-[17px] text-ink placeholder:text-muted"
                />
                <button type="submit" className="min-h-12 rounded-full bg-leaf px-[22px] font-bold text-white">
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-14 px-4 pb-16 pt-10 sm:px-6">
        <section aria-labelledby="today" className="flex flex-wrap gap-6">
          <TodayPuzzleCard />
          <GardenCard />
        </section>

        <section aria-labelledby="new" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="new" className="font-serif text-[32px] font-semibold">
              New in the library
            </h2>
            <Link href="/new" className="text-[17px] font-bold">
              See all new arrivals
            </Link>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
            {latest.map((i) => (
              <li key={i.slug}>
                <ItemCardView item={toCard(i)} />
              </li>
            ))}
          </ul>
        </section>

        <section id="pathways" aria-labelledby="paths" className="flex flex-col gap-5">
          <h2 id="paths" className="font-serif text-[32px] font-semibold">
            Pathways: guided reading
          </h2>
          <p className="max-w-[720px] text-lg leading-normal text-body">
            Short routes through the library, five to seven readings each. Every stop with a field note can unlock a bonus grid.
          </p>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {pathways.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/pathways/${p.slug}`}
                  className="card flex h-full min-h-[150px] flex-col gap-2 rounded-[18px] p-5 text-ink no-underline hover:text-ink"
                  style={{ background: p.color }}
                >
                  <span className="text-[13px] font-bold uppercase tracking-[.06em]">{p.steps.length} readings</span>
                  <span className="font-serif text-[22px] font-bold leading-tight">{p.title}</span>
                  <span className="text-[15px] leading-snug">{p.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="what" className="flex flex-wrap items-center gap-8 rounded-3xl border border-line bg-card p-6 sm:p-8">
          <div className="flex-[1_1_360px]">
            <h2 id="what" className="mb-3 font-serif text-[32px] font-semibold">
              What is solarpunk?
            </h2>
            <p className="mb-3 text-lg leading-relaxed text-body">
              Solarpunk imagines a future powered by the sun, woven into living ecosystems, and built around community instead of profit. It began as an internet word around
              2008 and has grown into fiction, art, design, scholarship, and activism.
            </p>
            <Link href="/field-guide" className="text-[17px] font-bold">
              Read the Field Guide
            </Link>
          </div>
          <div className="flex-[1_1_320px] rounded-2xl bg-pale-sun px-6 py-5">
            <p className="mb-2.5 font-serif text-[22px] leading-snug">New here? Start with one short essay.</p>
            <p className="mb-3 text-base text-body">
              Adam Flynn’s “Solarpunk: Notes toward a Manifesto” (2014) is one of the texts most people point to when explaining what solarpunk is for.
            </p>
            <Link href="/library/flynn-2014-solarpunk-notes-manifesto" className="font-bold">
              Read the summary
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

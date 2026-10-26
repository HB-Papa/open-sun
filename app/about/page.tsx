import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllItems, getGlossary, getPathways } from '@/lib/content';
import { PageSky } from '@/components/PageSky';
import { NouveauCorners, PathwayGlyph, SectionHeading, VineRule } from '@/components/Ornaments';
import { BatteryIcon, GardenIcon, HomeIcon, PondIcon, RidgeMark, RockIcon, SolarIcon, TreeIcon, WindIcon } from '@/components/icons';
import { PART_BG, TERRAIN_BG } from '@/components/microgrid/tiles';
import { TUTORIAL_PUZZLE } from '@/lib/tutorialPuzzle';
import { FAMILIES, type Family } from '@/lib/topics';

export const metadata: Metadata = {
  title: 'About',
  description: 'What Open Sun is, how readings are chosen and found, the daily Microgrid puzzle, and your privacy.',
};

// The five ways into the site, each as an arched window in its idea family's tint.
const WAYS: { href: string; title: string; text: string; glyph: string; family: Family }[] = [
  { href: '/library', title: 'The library', text: 'Search and filter every reading by topic, type, year and language.', glyph: 'libraries-and-the-commons', family: 'commons' },
  { href: '/pathways', title: 'Pathways', text: 'Short guided routes through the library, a few readings at a time.', glyph: 'what-is-solarpunk', family: 'sun' },
  { href: '/field-guide', title: 'Field Guide', text: 'Plain definitions of the ideas you’ll meet, each linked to readings.', glyph: 'living-land', family: 'land' },
  { href: '/new', title: 'New arrivals', text: 'The latest additions, also as an RSS feed you can follow.', glyph: 'imagining-futures', family: 'futures' },
  { href: '/microgrid', title: 'Microgrid', text: 'A three-minute daily puzzle about powering a neighborhood.', glyph: 'power-from-the-sun', family: 'energy' },
];

const CRITERIA: [string, string][] = [
  ['Free to read', 'Every item is open access: free to read online, usually under a Creative Commons license. Each item’s page shows its license.'],
  [
    'On topic',
    'Items are about solarpunk itself or closely related ideas: energy justice and democracy, community solar, degrowth, multispecies and urban ecology, Indigenous and decolonial futures, libraries and the commons, and hopeful, utopian thinking.',
  ],
  ['Trustworthy', 'Most items are peer-reviewed scholarship, books from university and nonprofit presses, or practical guides from credible organizations.'],
  ['Plain language', 'Each item has a short summary and a note on why it matters, written to be read by anyone.'],
];

const STEPS: [string, string][] = [
  ['A weekly search', 'Every Monday, an automated search checks three open scholarly databases (OpenAlex, the Directory of Open Access Journals, and Crossref) for newly published open access work on these topics.'],
  ['A person reviews it', 'Anything promising is read by a person, who writes or edits its summary before anything is added.'],
  ['It joins the library', 'New readings appear in the library and on New arrivals, and in the RSS feed.'],
];

export default function AboutPage() {
  const items = getAllItems().length;
  const pathways = getPathways().length;
  const terms = getGlossary().length;

  return (
    <>
      <PageSky />
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-[960px] flex-col gap-16 px-4 pb-20 pt-9 sm:px-6">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            <h1 className="font-serif text-page font-bold leading-[1.05] sm:text-page-lg">About Open Sun</h1>
            <VineRule className="hidden sm:flex" />
          </div>
          <p className="max-w-[40rem] font-serif text-heading leading-snug text-ink">
            A free, public library of open access writing about solarpunk and the ideas around it: solar power and energy justice, living land and multispecies cities, the
            commons, and hopeful futures.
          </p>
          <p className="max-w-[38rem] text-lede leading-normal text-body">
            <span className="num">{items}</span> readings, <span className="num">{pathways}</span> guided pathways and a Field Guide of{' '}
            <span className="num">{terms}</span> ideas, each chosen by a person and explained in plain language. Everything here is free to read.
          </p>
        </header>

        {/* The page's one framed moment: what solarpunk is, on the forest panel. */}
        <section aria-labelledby="what" className="nouveau on-forest relative flex flex-col gap-5 rounded-[28px] bg-forest px-6 pb-8 pt-12 text-on-forest sm:px-12 sm:pb-10">
          <NouveauCorners />
          <h2 id="what" className="font-serif text-section font-semibold leading-tight">
            What is solarpunk?
          </h2>
          <p className="max-w-[40rem] font-serif text-heading leading-snug text-on-forest">
            Solarpunk imagines a future powered by the sun, woven into living ecosystems, and built around community instead of profit.
          </p>
          <p className="max-w-[38rem] text-lede leading-normal text-on-forest-muted">
            It began as an internet word around <span className="num">2008</span> and has grown into fiction, art, design, scholarship, and activism. Five families of ideas
            run through the library:
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Families of ideas">
            {(Object.keys(FAMILIES) as Family[]).map((f) => (
              <li key={f} className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-small font-bold text-ink" style={{ background: FAMILIES[f].tint }}>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: FAMILIES[f].dot }} />
                {FAMILIES[f].label}
              </li>
            ))}
          </ul>
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/pathways/what-is-solarpunk"
              className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-bold text-[#1E3328] no-underline hover:text-[#1E3328]"
            >
              Start with the What Is Solarpunk? pathway
            </Link>
            <Link href="/field-guide" className="font-bold text-on-forest-gold underline">
              Browse the Field Guide
            </Link>
          </div>
        </section>

        <section aria-labelledby="ways" className="flex flex-col gap-6">
          <SectionHeading id="ways">Ways to explore</SectionHeading>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(168px,1fr))] sm:gap-4">
            {WAYS.map((w) => (
              <li key={w.href} className="last:col-span-2 sm:last:col-span-1">
                <Link
                  href={w.href}
                  className="card arch nouveau flex h-full flex-col items-center gap-2 px-4 pb-5 pt-7 text-center text-ink no-underline hover:text-ink"
                  style={{ background: FAMILIES[w.family].tint }}
                >
                  <PathwayGlyph slug={w.glyph} className="h-10 w-10 text-leaf-ink" />
                  <h3 className="font-serif text-title font-bold leading-tight">{w.title}</h3>
                  <span className="text-small leading-snug text-body">{w.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="chosen" className="flex flex-col gap-6">
          <SectionHeading id="chosen">How readings are chosen</SectionHeading>
          {/* A library slip: criteria on ruled lines, under a dashed tear line. */}
          <div className="nouveau relative rounded-[24px] border border-line bg-card px-6 pb-4 pt-10 sm:px-9">
            <NouveauCorners />
            <p className="border-b-2 border-dashed border-line-strong pb-3 font-serif text-title font-semibold" aria-hidden="true">
              Selection slip
            </p>
            <dl className="divide-y divide-dashed divide-line">
              {CRITERIA.map(([term, text]) => (
                <div key={term} className="grid gap-1 py-4 sm:grid-cols-[170px_1fr] sm:gap-6">
                  <dt className="font-bold text-ink">
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="mr-2 inline h-4 w-4 align-[-2px] text-leaf" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5 6.5 12 13 4.5" />
                    </svg>
                    {term}
                  </dt>
                  <dd className="text-copy leading-normal text-body">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="found" className="flex flex-col gap-6">
          <SectionHeading id="found">How new readings arrive</SectionHeading>
          <ol className="relative grid gap-6 md:grid-cols-3 md:gap-8">
            {/* The vine that links the three stops. */}
            <span aria-hidden="true" className="absolute bottom-4 left-[19px] top-4 w-0.5 rounded bg-leaf/40 md:bottom-auto md:left-[16%] md:right-[16%] md:top-[19px] md:h-0.5 md:w-auto" />
            {STEPS.map(([title, text], k) => (
              <li key={title} className="relative flex gap-4 md:flex-col md:gap-3">
                <span
                  aria-hidden="true"
                  className="num relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-[50%_50%_50%_6px] border-2 border-leaf bg-leaf text-copy font-bold text-white md:mx-auto"
                >
                  {k + 1}
                </span>
                <div className="flex flex-col gap-1 md:text-center">
                  <h3 className="font-serif text-title font-semibold">{title}</h3>
                  <p className="text-copy leading-normal text-body">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-copy text-body">
            Know something that belongs here?{' '}
            <Link href="/suggest" className="font-bold">
              Suggest a resource
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="puzzle" className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-4">
            <SectionHeading id="puzzle">The daily puzzle</SectionHeading>
            <p className="text-lede leading-normal text-body">
              Microgrid is a three-minute daily puzzle: keep a small solar neighborhood lit for all <span className="num">24</span> hours with sun, wind, batteries and gardens.
              Everyone gets the same grid each day, with three tries to solve it.
            </p>
            <p className="text-copy leading-normal text-body">
              There are no rewards to chase. Your result is your own play, your streak counts the days in a row you finish, and missing a day ends it. Reading has its own
              quiet record: the garden on the home page grows with every page you read.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/microgrid" className="inline-flex min-h-12 items-center rounded-full bg-leaf px-6 font-bold text-white no-underline hover:text-white">
                Play today’s puzzle
              </Link>
              <Link href="/microgrid#tutorial" className="font-bold">
                Watch the tutorial
              </Link>
            </div>
          </div>
          <SolvedBoard />
        </section>

        <section aria-labelledby="privacy" className="flex flex-col gap-4">
          <SectionHeading id="privacy">Your privacy</SectionHeading>
          <p className="max-w-[40rem] text-lede leading-normal text-body">
            Your progress, streak and garden are saved only in your own browser. Open Sun has no accounts, no ads, and no tracking cookies.
          </p>
          <p className="max-w-[40rem] text-copy leading-normal text-body">
            Suggestions are the one exception: they’re posted to a public review list on GitHub, so please leave out anything private.
          </p>
        </section>

        <section aria-labelledby="who" className="flex flex-col gap-4">
          <SectionHeading id="who">Who runs Open Sun</SectionHeading>
          {/* Add a sentence or two here about who runs the site, why it exists, and how to reach you. */}
          <p className="max-w-[40rem] text-lede leading-normal text-body">Open Sun is an independent, non-commercial project.</p>
        </section>

        <section aria-labelledby="accessibility" className="flex scroll-mt-6 flex-col gap-4">
          <SectionHeading id="accessibility">Accessibility</SectionHeading>
          <p className="max-w-[40rem] text-copy leading-normal text-body">
            Open Sun aims to meet WCAG <span className="num">2.2</span> AA. The site works with a keyboard and screen readers, respects your device’s “reduce motion” setting, and
            never uses color as the only signal. The puzzle describes every result in words as well as pictures. If something doesn’t work for you, please{' '}
            <a href="https://github.com/HB-Papa/open-sun/issues/new">tell us on GitHub</a> (you’ll need a free GitHub account) and we’ll fix it.
          </p>
        </section>
      </main>
    </>
  );
}

/** The tutorial's example grid, solved and lit: a glimpse of the puzzle. */
function SolvedBoard() {
  const p = TUTORIAL_PUZZLE;
  return (
    <figure className="m-0 flex flex-col items-center gap-2">
      <div className="grid w-full max-w-[280px] grid-cols-5 gap-1.5 rounded-[18px] p-2.5" style={{ background: 'var(--board)' }} aria-hidden="true">
        {p.terrain.map((t, i) => {
          const part = p.solution[i];
          return (
            <div key={i} className="relative flex aspect-square items-center justify-center rounded-lg" style={{ background: part ? PART_BG[part] : TERRAIN_BG[t] }}>
              {t === 'ridge' && <RidgeMark />}
              {t === 'home' && <HomeIcon lit />}
              {t === 'tree' && <TreeIcon />}
              {t === 'pond' && <PondIcon />}
              {t === 'rock' && <RockIcon />}
              {part === 'solar' && <SolarIcon />}
              {part === 'wind' && <WindIcon />}
              {part === 'battery' && <BatteryIcon />}
              {part === 'garden' && <GardenIcon />}
            </div>
          );
        })}
      </div>
      <figcaption className="text-small text-muted">A solved grid, every home lit.</figcaption>
    </figure>
  );
}

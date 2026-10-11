// Botanical and Art Nouveau ornaments. All decorative (aria-hidden).

/** A whiplash curl with two leaves, for the top corners of framed panels. */
export function NouveauCorner({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`pointer-events-none absolute top-[6px] h-14 w-14 ${flip ? 'right-[6px] -scale-x-100' : 'left-[6px]'} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M6 58 C6 30 18 10 46 6 C56 5 60 10 58 16 C56 22 48 22 46 17 C44 12 50 10 52 13" />
      <path d="M14 34 C20 30 26 31 28 36 C22 39 17 38 14 34Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M26 16 C30 12 36 12 38 16 C33 20 28 20 26 16Z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function NouveauCorners({ className = 'text-sun' }: { className?: string }) {
  return (
    <>
      <NouveauCorner className={className} />
      <NouveauCorner flip className={className} />
    </>
  );
}

/** A thin vine that runs beside a section heading and ends in a leafy sprig. */
export function VineRule({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex min-w-[48px] flex-1 items-center text-leaf-ink ${className}`}>
      <svg viewBox="0 0 400 16" preserveAspectRatio="none" className="h-4 w-full">
        <path d="M0 9 C50 3 100 15 150 9 S250 3 300 9 S370 13 400 8" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg viewBox="0 0 40 24" className="-ml-1 h-6 w-10 shrink-0">
        <path d="M0 15 C10 14 20 12 34 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M14 13 C14 6 20 3 26 3 C25 9 20 13 14 13Z" fill="currentColor" fillOpacity="0.7" />
        <path d="M22 11 C26 13 30 18 29 22 C24 21 21 16 22 11Z" fill="currentColor" fillOpacity="0.45" />
        <circle cx="35" cy="5.5" r="2.4" fill="var(--sun)" />
      </svg>
    </span>
  );
}

/** A section heading with a vine running out to the right (and an optional link after it). */
export function SectionHeading({ id, children, action }: { id: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <h2 id={id} className="font-serif text-[30px] font-semibold leading-tight sm:text-[34px]">
        {children}
      </h2>
      <VineRule className="hidden sm:flex" />
      {action}
    </div>
  );
}

const GLYPHS: Record<string, React.ReactNode> = {
  // What is solarpunk: a sun rising out of a leaf.
  'what-is-solarpunk': (
    <>
      <circle cx="24" cy="20" r="7" />
      <path d="M24 6v3M13 10l2 2M35 10l-2 2M9 20h3M39 20h-3" />
      <path d="M8 34 C16 26 32 26 40 34 C32 42 16 42 8 34Z" />
      <path d="M12 34 H36" />
    </>
  ),
  // Power from the sun: a panel with a vine.
  'power-from-the-sun': (
    <>
      <path d="M8 30 L14 14 H40 L34 30 Z" />
      <path d="M21 14 L17 30 M30 14 L26 30 M11 22 H37" />
      <path d="M10 38 C16 34 20 40 26 36 S34 34 38 38" />
      <path d="M18 37 C18 33 21 32 23 33" />
    </>
  ),
  // Living land: a fern frond.
  'living-land': (
    <>
      <path d="M24 42 C24 30 26 18 32 8" />
      <path d="M24.5 34 C19 33 15 30 13 26 M25 27 C20 25 18 22 17 18 M27 20 C23 17 22 14 22 11" />
      <path d="M24.5 34 C29 32 33 29 35 25 M25.5 27 C30 25 32 21 33 18 M28 19 C31 17 32 14 33 12" />
    </>
  ),
  // Libraries and the commons: an open book with a sprout.
  'libraries-and-the-commons': (
    <>
      <path d="M6 18 C14 15 20 16 24 20 C28 16 34 15 42 18 V38 C34 35 28 36 24 40 C20 36 14 35 6 38 Z" />
      <path d="M24 20 V40" />
      <path d="M24 14 V8 M24 11 C20 11 18 8 18 5 C21 5 24 7 24 11 M24 9 C27 9 30 7 30 4 C27 4 24 6 24 9" />
    </>
  ),
  // Imagining futures: a crescent and stars over hills.
  'imagining-futures': (
    <>
      <path d="M30 8 A10 10 0 1 0 38 24 A8 8 0 0 1 30 8Z" />
      <path d="M12 10 v4 M10 12 h4 M18 20 v3 M16.5 21.5 h3" />
      <path d="M4 40 C12 32 20 32 26 38 C32 33 40 33 44 40" />
    </>
  ),
  // Solarpunk fiction: a quill.
  'solarpunk-fiction': (
    <>
      <path d="M12 40 C16 26 26 12 40 6 C38 20 28 32 14 38" />
      <path d="M12 40 L30 18" />
      <path d="M8 42 H22" />
    </>
  ),
  // Fair energy transitions: balanced scales with a leaf.
  'fair-energy-transitions': (
    <>
      <path d="M24 8 V40 M14 40 H34 M10 14 H38" />
      <path d="M10 14 L5 26 H15 Z M38 14 L33 26 H43 Z" />
      <path d="M24 8 C27 4 31 4 33 6 C30 9 27 9 24 8" />
    </>
  ),
  // Under debate: two speech leaves.
  'solarpunk-under-debate': (
    <>
      <path d="M6 22 C6 13 13 8 22 8 C24 16 20 24 10 26 L6 32 Z" />
      <path d="M42 26 C42 17 35 12 26 12 C24 20 28 28 38 30 L42 36 Z" />
    </>
  ),
};

/** A line glyph for each pathway, set in the crown of its arched window. */
export function PathwayGlyph({ slug, className = 'h-12 w-12' }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {GLYPHS[slug] ?? GLYPHS['what-is-solarpunk']}
    </svg>
  );
}

const TERM_GLYPHS: [RegExp, React.ReactNode][] = [
  [/microgrid/, <path key="g" d="M8 8h32v32H8Z M18.7 8v32 M29.3 8v32 M8 18.7h32 M8 29.3h32 M24 24l-4 6h8l-4 6" />],
  [/agrivoltaic/, GLYPHS['power-from-the-sun']],
  [/multispecies/, GLYPHS['living-land']],
  [/justice/, GLYPHS['fair-energy-transitions']],
  [/democracy|prosumer|community/, <path key="p" d="M14 20a5 5 0 1 0 0-.1M34 20a5 5 0 1 0 0-.1M24 14a5 5 0 1 0 0-.1M6 40c0-6 4-10 8-10s6 2 7 4M42 40c0-6-4-10-8-10s-6 2-7 4M16 40c0-6 4-11 8-11s8 5 8 11" />],
  [/battery/, <path key="b" d="M14 12h20v30H14Z M20 8h8 M26 18l-5 8h6l-5 8" />],
  [/wind/, <path key="w" d="M24 24v18 M24 24V6 M24 24 9 33 M24 24l15 9 M18 42h12" />],
  [/degrowth/, <path key="d" d="M24 42V24 M24 30c-8 0-12-6-12-12 6 0 12 4 12 12Z M24 24c0-7 5-12 12-12 0 7-5 12-12 12Z M14 42h20" />],
  [/commons|library/, GLYPHS['libraries-and-the-commons']],
  [/resilience/, <path key="r" d="M8 22 24 8l16 14 M12 19v21h24V19 M20 40V30h8v10 M30 12V6h5v10" />],
  [/wildlife/, <path key="c" d="M4 34c8-12 32-12 40 0 M10 30v10 M38 30v10 M4 40h40 M20 22c0-3 2-5 4-5s4 2 4 5 M18 16l2 2 M30 16l-2 2" />],
  [/solarity|solarpunk/, GLYPHS['what-is-solarpunk']],
  [/low-tech/, <path key="l" d="M10 38 28 20 M26 12a8 8 0 0 0 10 10l-4-4 2-4 4-2 4 4a8 8 0 0 0-10-10Z M8 40l4-4" />],
  [/speculative/, GLYPHS['solarpunk-fiction']],
  [/indigenous|futuris/, GLYPHS['imagining-futures']],
];

/** A line glyph for a Field Guide term, matched by keyword. */
export function TermGlyph({ slug, className = 'h-10 w-10' }: { slug: string; className?: string }) {
  const g = TERM_GLYPHS.find(([re]) => re.test(slug))?.[1] ?? GLYPHS['living-land'];
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {g}
    </svg>
  );
}

/** A small sun-ray crown for the top of an arch. */
export function ArchRays({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" aria-hidden="true" className={`pointer-events-none ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {Array.from({ length: 9 }, (_, k) => {
        const a = Math.PI + (Math.PI * (k + 1)) / 10;
        const x1 = Math.round((60 + Math.cos(a) * 30) * 10) / 10;
        const y1 = Math.round((40 + Math.sin(a) * 30) * 10) / 10;
        const x2 = Math.round((60 + Math.cos(a) * 38) * 10) / 10;
        const y2 = Math.round((40 + Math.sin(a) * 38) * 10) / 10;
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </svg>
  );
}

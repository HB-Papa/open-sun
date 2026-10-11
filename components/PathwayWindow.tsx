import Link from 'next/link';
import type { Pathway } from '@/lib/types';
import { ArchRays, PathwayGlyph } from './Ornaments';

/** A pathway as an arched, stained-glass window. */
export function PathwayWindow({
  pathway,
  headingLevel = 3,
  featured = false,
  children,
}: {
  pathway: Pick<Pathway, 'slug' | 'title' | 'blurb' | 'color' | 'steps'>;
  headingLevel?: 2 | 3;
  /** The pathway newcomers should begin with. */
  featured?: boolean;
  children?: React.ReactNode;
}) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <Link
      href={`/pathways/${pathway.slug}`}
      className={`card arch nouveau flex h-full min-h-[300px] flex-col items-center gap-2 px-6 pb-6 pt-7 text-center text-ink no-underline hover:text-ink ${
        featured ? 'ring-2 ring-sun ring-offset-2 ring-offset-paper' : ''
      }`}
      style={{ background: pathway.color }}
    >
      <span className="relative mb-1 flex h-[72px] w-[120px] items-end justify-center text-leaf-ink">
        <ArchRays className="absolute inset-x-0 top-0 h-10 w-[120px] text-sun" />
        <PathwayGlyph slug={pathway.slug} className="relative h-12 w-12" />
      </span>
      <H className="font-serif text-[23px] font-bold leading-tight text-balance">{pathway.title}</H>
      <span className="text-[15px] leading-snug text-body">{pathway.blurb}</span>
      <span className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-3 text-[14px] text-body">
        {featured && <span className="rounded-full bg-sun px-2.5 py-0.5 font-bold text-[#1E3328]">Start here</span>}
        <span>
          <span className="num">{pathway.steps.length}</span> readings
        </span>
      </span>
      {children}
    </Link>
  );
}

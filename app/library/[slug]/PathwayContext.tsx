import Link from 'next/link';
import { getItem } from '@/lib/content';
import type { Pathway } from '@/lib/types';
import { PathwayGlyph } from '@/components/Ornaments';
import { PathwayEnd } from '@/app/pathways/PathwayProgress';
import { StopDots } from './StopDots';

export interface Membership {
  pathway: Pathway;
  index: number;
  next?: Pathway;
}

/** Where this reading sits on a pathway, with a way back to the route. */
export function PathwayStrip({ m }: { m: Membership }) {
  const total = m.pathway.steps.length;
  return (
    <Link
      href={`/pathways/${m.pathway.slug}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-4 py-2.5 text-ink no-underline hover:text-ink"
      style={{ background: m.pathway.color }}
    >
      <PathwayGlyph slug={m.pathway.slug} className="h-7 w-7 shrink-0 text-leaf-ink" />
      <span className="text-[15px]">
        <span className="font-bold">{m.pathway.title}</span>
        <span className="text-body">
          {' '}
          · Stop <span className="num">{m.index + 1}</span> of <span className="num">{total}</span>
        </span>
      </span>
      <StopDots slugs={m.pathway.steps.map((s) => s.slug)} current={m.index} />
    </Link>
  );
}

/** After the reading (and its field note): the next stop, or the end of the pathway. */
export function NextStop({ m }: { m: Membership }) {
  const steps = m.pathway.steps;
  const nextStep = steps[m.index + 1];
  const nextItem = nextStep ? getItem(nextStep.slug) : undefined;
  if (!nextItem) {
    return (
      <PathwayEnd
        slugs={steps.map((s) => s.slug)}
        next={m.next ? { slug: m.next.slug, title: m.next.title, blurb: m.next.blurb } : undefined}
      />
    );
  }
  return (
    <Link
      href={`/library/${nextItem.slug}`}
      className="card nouveau flex flex-col gap-1.5 rounded-[22px] px-6 py-5 text-ink no-underline hover:text-ink sm:px-8"
      style={{ background: m.pathway.color }}
    >
      <span className="text-[15px] text-body">
        Next stop on <strong className="text-ink">{m.pathway.title}</strong> · <span className="num">{m.index + 2}</span> of{' '}
        <span className="num">{steps.length}</span>
      </span>
      <span className="font-serif text-[22px] font-semibold leading-snug">{nextItem.title}</span>
      {nextStep.note && <span className="text-[16px] text-body">{nextStep.note}</span>}
    </Link>
  );
}

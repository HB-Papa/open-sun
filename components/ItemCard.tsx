import Link from 'next/link';
import { yearText, type ItemCard as Card } from '@/lib/types';
import { topicLabel, TYPE_COLORS, LANGUAGES } from '@/lib/topics';
import { naturalName } from '@/lib/cite';
import { LeafSprout } from './icons';

export function authorsLine(item: Pick<Card, 'authors' | 'edited'>): string {
  const a = item.authors.map(naturalName);
  let s = a.length <= 3 ? a.join(', ').replace(/, ([^,]*)$/, a.length > 2 ? ', and $1' : ' and $1') : `${a[0]} and ${a.length - 1} others`;
  if (item.edited) s += a.length > 1 ? ' (eds.)' : ' (ed.)';
  return s;
}

export function ItemCardView({ item, headingLevel = 3, compact = false }: { item: Card; headingLevel?: 2 | 3; compact?: boolean }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <Link
      href={`/library/${item.slug}`}
      className="card flex h-full flex-col gap-2.5 rounded-[18px] border border-line bg-card p-5 text-ink no-underline hover:text-ink"
    >
      <LeafSprout />
      <div className="flex flex-wrap gap-2 pr-6">
        <span className="rounded-full px-2.5 py-1 text-[13px] font-bold" style={{ background: TYPE_COLORS[item.type] ?? 'var(--chip)' }}>
          {item.type}
        </span>
        <span className="rounded-full bg-chip px-2.5 py-1 text-[13px] text-body">{yearText(item.year)}</span>
        {item.topics[0] && <span className="rounded-full bg-chip px-2.5 py-1 text-[13px] text-body">{topicLabel(item.topics[0])}</span>}
        {item.language !== 'en' && <span className="rounded-full bg-chip px-2.5 py-1 text-[13px] text-body">{LANGUAGES[item.language] ?? item.language}</span>}
      </div>
      <H className="font-serif text-[20px] font-semibold leading-tight">{item.title}</H>
      <p className="text-[15px] text-muted">{authorsLine(item)}</p>
      {!compact && <p className="line-clamp-4 text-[15px] leading-normal text-body">{item.summary}</p>}
      <span className="mt-auto text-[14px] font-bold text-leaf-ink">Free to read</span>
    </Link>
  );
}

export function ItemRow({ item }: { item: Card }) {
  return (
    <Link href={`/library/${item.slug}`} className="flex flex-col gap-1 rounded-[14px] border border-line bg-card px-5 py-4 text-ink no-underline hover:border-leaf hover:text-ink">
      <span className="font-serif text-[19px] font-semibold leading-snug">{item.title}</span>
      <span className="text-[14px] text-muted">
        {authorsLine(item)} · {yearText(item.year)} · {item.type}
        {item.language !== 'en' ? ` · ${LANGUAGES[item.language] ?? item.language}` : ''}
      </span>
    </Link>
  );
}

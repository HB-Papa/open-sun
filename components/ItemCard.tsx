import Link from 'next/link';
import { yearText, type ItemCard as Card } from '@/lib/types';
import { topicLabel, TYPE_COLORS, LANGUAGES } from '@/lib/topics';
import { naturalName } from '@/lib/cite';
import { LeafSprout } from './icons';
import { Nums } from '@/lib/nums';

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
      {/* Tags stay on one line; a long topic name shortens with an ellipsis rather than wrapping. */}
      <div className="flex min-w-0 gap-2 pr-6">
        <span className="shrink-0 rounded-full px-2.5 py-1 text-caption font-bold" style={{ background: TYPE_COLORS[item.type] ?? 'var(--chip)' }}>
          {item.type}
        </span>
        {item.language !== 'en' ? (
          <span className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-caption text-body">{LANGUAGES[item.language] ?? item.language}</span>
        ) : (
          item.topics[0] && (
            <span className="min-w-0 truncate rounded-full bg-chip px-2.5 py-1 text-caption text-body" title={topicLabel(item.topics[0])}>
              {topicLabel(item.topics[0])}
            </span>
          )
        )}
      </div>
      <H className="font-serif text-title font-semibold leading-tight">{item.title}</H>
      {/* The year joins the byline, which leaves the tag row room for the topic. */}
      <p className="text-small text-muted">
        {authorsLine(item)} · <span className="num">{yearText(item.year)}</span>
      </p>
      {!compact && (
        <p className="line-clamp-4 text-small leading-normal text-body">
          <Nums text={item.summary} />
        </p>
      )}
    </Link>
  );
}

export function ItemRow({ item }: { item: Card }) {
  return (
    <Link href={`/library/${item.slug}`} className="flex flex-col gap-1 rounded-[14px] border border-line bg-card px-5 py-4 text-ink no-underline hover:border-leaf hover:text-ink">
      <span className="font-serif text-lede font-semibold leading-snug">{item.title}</span>
      <span className="text-small text-muted">
        {authorsLine(item)} · <span className="num">{yearText(item.year)}</span> · {item.type}
        {item.language !== 'en' ? ` · ${LANGUAGES[item.language] ?? item.language}` : ''}
      </span>
    </Link>
  );
}

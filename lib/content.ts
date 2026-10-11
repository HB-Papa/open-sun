import 'server-only';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import type { GlossaryTerm, ItemCard, LibraryItem, Pathway } from './types';

const ROOT = join(process.cwd(), 'content');

// Give headings ids so pages can link to sections (e.g. /about#accessibility).
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = text
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
  },
});

const asDate = (v: unknown): string => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v ? String(v) : '';
};
const asStr = (v: unknown): string | undefined => (v === undefined || v === null || v === '' ? undefined : String(v));

function stripMarkdown(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let itemsCache: LibraryItem[] | null = null;

export function getAllItems(): LibraryItem[] {
  if (itemsCache && process.env.NODE_ENV === 'production') return itemsCache;
  const dir = join(ROOT, 'library');
  const items = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => parseItem(file.replace(/\.md$/, ''), readFileSync(join(dir, file), 'utf8')))
    // Items marked `reviewed: false` (fresh from the update agent) only show up locally.
    .filter((i) => i.reviewed || process.env.NODE_ENV !== 'production')
    .sort((a, b) => (a.dateAdded === b.dateAdded ? b.year - a.year : b.dateAdded.localeCompare(a.dateAdded)));
  itemsCache = items;
  return items;
}

function parseItem(slug: string, raw: string): LibraryItem {
  const { data, content } = matter(raw);
  const [summaryMd, whyMd = ''] = content.split(/\*\*Why it matters:?\*\*:?/i);
  const fn = data.field_note;
  return {
    slug,
    title: String(data.title),
    citationTitle: asStr(data.citation_title),
    authors: (data.authors ?? []).map(String),
    organization: !!data.organization,
    edited: !!data.edited,
    editors: data.editors?.map(String),
    year: Number(data.year),
    type: String(data.type ?? 'Article'),
    venue: String(data.venue ?? ''),
    volume: asStr(data.volume),
    issue: asStr(data.issue),
    pages: asStr(data.pages),
    doi: asStr(data.doi),
    url: String(data.url),
    license: String(data.license ?? 'Free to read'),
    language: String(data.language ?? 'en'),
    topics: (data.topics ?? []).map(String),
    dateAdded: asDate(data.date_added),
    source: data.source === 'agent' ? 'agent' : 'curated',
    reviewed: data.reviewed !== false,
    summaryStatus: data.summary_status === 'edited' ? 'edited' : 'draft',
    summary: stripMarkdown(summaryMd),
    summaryHtml: marked.parse(summaryMd.trim(), { async: false }) as string,
    why: stripMarkdown(whyMd),
    fieldNote:
      fn && Array.isArray(fn.options) && fn.question
        ? { question: String(fn.question), options: fn.options.map(String), answer: Number(fn.answer ?? 0) }
        : undefined,
  };
}

export function getItem(slug: string): LibraryItem | undefined {
  return getAllItems().find((i) => i.slug === slug);
}

export function toCard(i: LibraryItem): ItemCard {
  return {
    slug: i.slug,
    title: i.title,
    authors: i.authors,
    year: i.year,
    type: i.type,
    topics: i.topics,
    language: i.language,
    license: i.license,
    dateAdded: i.dateAdded,
    summary: i.summary,
    edited: i.edited,
    organization: i.organization,
  };
}

/** Items sharing the most topics with this one. */
export function relatedItems(item: LibraryItem, n = 3): LibraryItem[] {
  return getAllItems()
    .filter((i) => i.slug !== item.slug)
    .map((i) => ({ i, score: i.topics.filter((t) => item.topics.includes(t)).length + (i.type === item.type ? 0.1 : 0) }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score || b.i.year - a.i.year)
    .slice(0, n)
    .map((x) => x.i);
}

export function getPathways(): Pathway[] {
  const dir = join(ROOT, 'pathways');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const { data, content } = matter(readFileSync(join(dir, file), 'utf8'));
      return {
        slug: file.replace(/\.md$/, ''),
        title: String(data.title),
        blurb: String(data.blurb ?? ''),
        color: String(data.color ?? 'var(--color-pale-sun)'),
        order: Number(data.order ?? 99),
        introHtml: marked.parse(content.trim(), { async: false }) as string,
        steps: (data.steps ?? []).map((s: { slug: string; note?: string }) => ({ slug: String(s.slug), note: String(s.note ?? '') })),
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getPathway(slug: string): Pathway | undefined {
  return getPathways().find((p) => p.slug === slug);
}

export function getGlossary(): GlossaryTerm[] {
  const file = join(ROOT, 'field-guide.md');
  if (!existsSync(file)) return [];
  const { data } = matter(readFileSync(file, 'utf8'));
  return (data.terms ?? [])
    .map((t: { term: string; definition: string; related?: string[] }) => ({
      slug: String(t.term).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      term: String(t.term),
      definition: String(t.definition),
      related: (t.related ?? []).map(String),
    }))
    .sort((a: GlossaryTerm, b: GlossaryTerm) => a.term.localeCompare(b.term));
}

export function getPage(name: string): { title: string; html: string; data: Record<string, unknown> } {
  const { data, content } = matter(readFileSync(join(ROOT, 'pages', `${name}.md`), 'utf8'));
  return { title: String(data.title ?? name), html: marked.parse(content.trim(), { async: false }) as string, data };
}

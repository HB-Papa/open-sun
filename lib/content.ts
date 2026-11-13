import 'server-only';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { parseRights } from './rights';
import type { GlossaryTerm, Guide, Lesson, ItemCard, LibraryItem, Pathway, Policy } from './types';

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
    .sort((a, b) => (a.dateAdded === b.dateAdded ? (b.year ?? 0) - (a.year ?? 0) : b.dateAdded.localeCompare(a.dateAdded)));
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
    year: data.year == null || data.year === '' ? null : Number(data.year),
    type: String(data.type ?? 'Article'),
    venue: String(data.venue ?? ''),
    volume: asStr(data.volume),
    issue: asStr(data.issue),
    pages: asStr(data.pages),
    doi: asStr(data.doi),
    url: String(data.url),
    // Throws, and so stops the build, when a rights field holds a value outside its controlled list.
    ...parseRights(data, `content/library/${slug}.md`),
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
    .sort((a, b) => b.score - a.score || (b.i.year ?? 0) - (a.i.year ?? 0))
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

function mdFiles(folder: string) {
  const dir = join(ROOT, folder);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((file) => ({ slug: file.replace(/\.md$/, ''), ...matter(readFileSync(join(dir, file), 'utf8')) }));
}
const slugList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/** Research guides, in their set order. Links to pathways or items that don't exist are dropped. */
export function getGuides(): Guide[] {
  const pathways = new Set(getPathways().map((p) => p.slug));
  return mdFiles('guides')
    .map(({ slug, data, content }) => ({
      slug,
      title: String(data.title),
      blurb: String(data.blurb ?? ''),
      family: String(data.family ?? 'sun'),
      order: Number(data.order ?? 99),
      lastReviewed: asDate(data.last_reviewed),
      html: marked.parse(content.trim(), { async: false }) as string,
      relatedPathways: slugList(data.related_pathways).filter((s) => pathways.has(s)),
      relatedItems: slugList(data.related_items).filter((s) => getItem(s)),
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getGuide(slug: string): Guide | undefined {
  return getGuides().find((g) => g.slug === slug);
}

/** Information-literacy lesson plans, in their set order. Links to guides or items that don't exist are dropped. */
export function getLessons(): Lesson[] {
  const guides = new Set(getGuides().map((g) => g.slug));
  return mdFiles('lessons')
    .map(({ slug, data, content }) => ({
      slug,
      title: String(data.title),
      blurb: String(data.blurb ?? ''),
      order: Number(data.order ?? 99),
      level: String(data.level ?? ''),
      duration: String(data.duration ?? ''),
      format: String(data.format ?? ''),
      frames: slugList(data.frames),
      outcomes: slugList(data.outcomes),
      lastReviewed: asDate(data.last_reviewed),
      html: marked.parse(content.trim(), { async: false }) as string,
      relatedGuides: slugList(data.related_guides).filter((s) => guides.has(s)),
      relatedItems: slugList(data.related_items).filter((s) => getItem(s)),
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getLesson(slug: string): Lesson | undefined {
  return getLessons().find((l) => l.slug === slug);
}

/** Published policies and statements about how the library is run. */
export function getPolicies(): Policy[] {
  return mdFiles('policies')
    .map(({ slug, data, content }) => ({
      slug,
      title: String(data.title),
      blurb: String(data.blurb ?? ''),
      lastReviewed: asDate(data.last_reviewed),
      html: marked.parse(content.trim(), { async: false }) as string,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getPolicy(slug: string): Policy | undefined {
  return getPolicies().find((p) => p.slug === slug);
}

export function getGlossary(): GlossaryTerm[] {
  const file = join(ROOT, 'field-guide.md');
  if (!existsSync(file)) return [];
  const { data } = matter(readFileSync(file, 'utf8'));
  return (data.terms ?? [])
    .map((t: { term: string; definition: string; related?: string[]; family?: GlossaryTerm['family'] }) => ({
      slug: String(t.term).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      term: String(t.term),
      definition: String(t.definition),
      related: (t.related ?? []).map(String),
      family: t.family ?? 'sun',
    }))
    .sort((a: GlossaryTerm, b: GlossaryTerm) => a.term.localeCompare(b.term));
}


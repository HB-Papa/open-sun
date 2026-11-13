// Machine-readable metadata for item pages: schema.org JSON-LD, Highwire Press
// (Google Scholar style) citation_* tags and a small set of Dublin Core tags.
// Pure functions with no Node or Next imports, so the tests can load this file.
// The field-by-field mapping is written up in docs/metadata/application-profile.md.
import type { LibraryItem } from './types.ts';
import { topicLabel } from './topics.ts';
import { licenseUrl, rightsStatement } from './rights.ts';

export { licenseUrl };

/** The fields these functions read. A full LibraryItem fits. */
export type MetaItem = Pick<
  LibraryItem,
  | 'slug' | 'title' | 'authors' | 'organization' | 'edited' | 'editors' | 'year' | 'type' | 'venue'
  | 'volume' | 'issue' | 'pages' | 'doi' | 'url' | 'license' | 'rightsStatus' | 'version' | 'accessNote'
  | 'language' | 'topics' | 'summary'
>;

type Json = { [key: string]: unknown };

/** "Roscam Abbing, Roel" -> "Roel Roscam Abbing". Group names are never reordered, since they may hold a comma. */
export function displayName(name: string, organization = false): string {
  if (organization || !name.includes(',')) return name.trim();
  const [family, given = ''] = name.split(',').map((s) => s.trim());
  return given ? `${given} ${family}` : family;
}

const SCHEMA_TYPE: Record<string, string> = {
  Article: 'ScholarlyArticle',
  Preprint: 'ScholarlyArticle',
  Essay: 'Article',
  Book: 'Book',
  Chapter: 'Chapter',
  Report: 'Report',
  Thesis: 'Thesis',
  Journal: 'Periodical',
};
/** The schema.org type for a record's `type`. Fiction, Guide and anything unknown fall back to CreativeWork. */
export const schemaType = (type: string): string => SCHEMA_TYPE[type] ?? 'CreativeWork';

/** First and last page when `pages` is a range ("717–733"). A single value is an article number, so nothing is returned. */
export function pageRange(pages?: string): { first: string; last: string } | undefined {
  const m = pages?.trim().match(/^([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)$/);
  return m ? { first: m[1], last: m[2] } : undefined;
}

// `venue` holds journals, publishers, series, degrees and notes. These two tests say when it is safe to reuse.
const plain = (venue: string) => venue !== '' && !/[()]/.test(venue);
/** A journal title: an Article with a volume or issue number and no bracketed note in the venue. */
export const journalTitle = (item: Pick<MetaItem, 'type' | 'venue' | 'volume' | 'issue'>): string | undefined =>
  item.type === 'Article' && (item.volume || item.issue) && plain(item.venue) ? item.venue : undefined;
/** A single publisher: a group that published its own work, or a Book whose venue is one plain name. */
export function publisherName(item: Pick<MetaItem, 'type' | 'venue' | 'authors' | 'organization'>): string | undefined {
  if (item.organization && item.authors.length === 1 && item.authors[0] === item.venue) return item.venue;
  return item.type === 'Book' && plain(item.venue) && !/,| and | & /.test(item.venue) ? item.venue : undefined;
}

const doiUrl = (doi: string) => `https://doi.org/${doi}`;
const agent = (name: string, organization: boolean): Json => ({
  '@type': organization ? 'Organization' : 'Person',
  name: displayName(name, organization),
});

/**
 * Authors and editors, sorted out. With `edited: true` the names in `authors` are the editors, and they
 * follow the organization flag. Names in `editors` are always people.
 */
function roles(item: Pick<MetaItem, 'authors' | 'edited' | 'editors' | 'organization'>) {
  const org = !!item.organization;
  const own = item.authors.map((name) => ({ name, org }));
  const extra = (item.editors ?? []).map((name) => ({ name, org: false }));
  return item.edited ? { authors: [], editors: [...own, ...extra] } : { authors: own, editors: extra };
}

/** A schema.org description of the work, for a <script type="application/ld+json"> on the item's page. */
export function jsonLd(item: MetaItem, siteUrl: string): Json {
  const { authors, editors } = roles(item);
  const page = `${siteUrl.replace(/\/+$/, '')}/library/${item.slug}`;
  const out: Json = { '@context': 'https://schema.org', '@type': schemaType(item.type), name: item.title };
  if (authors.length) out.author = authors.map((a) => agent(a.name, a.org));
  if (editors.length) out.editor = editors.map((e) => agent(e.name, e.org));
  if (item.year) out.datePublished = String(item.year);
  if (item.language) out.inLanguage = item.language;

  const journal = journalTitle(item);
  if (journal) {
    let part: Json = { '@type': 'Periodical', name: journal };
    if (item.volume) part = { '@type': 'PublicationVolume', volumeNumber: item.volume, isPartOf: part };
    if (item.issue) part = { '@type': 'PublicationIssue', issueNumber: item.issue, isPartOf: part };
    out.isPartOf = part;
  }
  const range = pageRange(item.pages);
  if (range && ['Article', 'Preprint', 'Essay', 'Chapter'].includes(item.type)) {
    out.pageStart = range.first;
    out.pageEnd = range.last;
  }
  const publisher = publisherName(item);
  if (publisher) out.publisher = { '@type': 'Organization', name: publisher };

  if (item.doi) out.identifier = { '@type': 'PropertyValue', propertyID: 'DOI', value: item.doi };
  out.url = page;
  const same = [...new Set([item.doi ? doiUrl(item.doi) : '', item.url].filter(Boolean))];
  if (same.length) out.sameAs = same;
  const license = licenseUrl(item.license);
  if (license) out.license = license;
  out.isAccessibleForFree = true;
  if (item.topics.length) out.keywords = item.topics.map(topicLabel).join(', ');
  // The summary is Open Sun's own plain-language text, not the author's abstract, so it is a description.
  if (item.summary) out.description = item.summary;
  return out;
}

/**
 * Meta tags for the page head, as { name: content } with arrays for repeated names (the shape of the `other`
 * field in Next's Metadata). A tag is left out when the record does not support it.
 */
export function citationMeta(item: MetaItem): Record<string, string | string[]> {
  const { authors, editors } = roles(item);
  const authorNames = authors.map((a) => displayName(a.name, a.org));
  const editorNames = editors.map((e) => displayName(e.name, e.org));
  const tags: Record<string, string | string[]> = {};
  const set = (name: string, value?: string | string[] | null) => {
    if (value && value.length) tags[name] = value;
  };

  set('citation_title', item.title);
  set('citation_author', authorNames);
  if (item.year) set('citation_publication_date', String(item.year));
  const journal = journalTitle(item);
  if (journal) {
    set('citation_journal_title', journal);
    set('citation_volume', item.volume);
    set('citation_issue', item.issue);
  }
  const range = pageRange(item.pages);
  set('citation_firstpage', range?.first);
  set('citation_lastpage', range?.last);
  set('citation_doi', item.doi);
  set('citation_language', item.language);

  set('DC.title', item.title);
  set('DC.creator', authorNames);
  set('DC.contributor', editorNames);
  if (item.year) set('DC.date', String(item.year));
  set('DC.type', 'Text'); // DCMI Type Vocabulary. Every item in the library is a written work.
  set('DC.language', item.language);
  set('DC.identifier', item.doi ? doiUrl(item.doi) : item.url);
  // The license deed when there is one; otherwise a plain statement ("Public domain", or in copyright and free to read).
  set('DC.rights', licenseUrl(item.license) ?? rightsStatement(item));
  return tags;
}

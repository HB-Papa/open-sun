// Citation and data exports: RIS and BibTeX for one item, CSV for the whole collection.
// Pure functions with no Node or Next imports, so the tests can load this file. The route handlers in
// app/library/[slug]/cite.ris, app/library/[slug]/cite.bib and app/data/ serve the output as static files.
// The mappings are written up under "Data and exports" in docs/metadata/application-profile.md.
import type { LibraryItem } from './types.ts';
import { splitName } from './cite.ts';
import { topicLabel } from './topics.ts';
import { licenseUrl, termsLabel, versionLabel } from './rights.ts';

/** The fields the exports read. A full LibraryItem fits. */
export type ExportItem = Pick<
  LibraryItem,
  | 'slug' | 'title' | 'authors' | 'organization' | 'edited' | 'editors' | 'year' | 'type' | 'venue'
  | 'volume' | 'issue' | 'pages' | 'doi' | 'url' | 'license' | 'rightsStatus' | 'version' | 'accessNote'
  | 'language' | 'topics' | 'summary' | 'dateAdded'
>;

// ---------- shared rules ----------

// `venue` holds journals, publishers, series, websites, degrees and notes (Known issue 1 in the profile).
// These rules say what each export may safely call it.
const plain = (venue: string) => venue !== '' && !/[()]/.test(venue);

/** The journal title, when the record shows it is one: an Article or Essay with a volume or issue and a plain venue. */
export function journalOf(item: Pick<ExportItem, 'type' | 'venue' | 'volume' | 'issue'>): string | undefined {
  return ['Article', 'Essay'].includes(item.type) && (item.volume || item.issue) && plain(item.venue) ? item.venue : undefined;
}

/** A chapter's venue is "Book title (Publisher)", by the entry rule for `venue`. */
export function chapterHost(venue: string): { book: string; publisher?: string } {
  const m = venue.match(/^(.*\S)\s*\(([^()]+)\)$/);
  return m ? { book: m[1], publisher: m[2] } : { book: venue };
}

/**
 * A book's venue is its publisher, sometimes with a note in brackets: "University of Minnesota Press (Forerunners)".
 * The note may be a series or another name, so it is dropped from the publisher name.
 */
export const bookPublisher = (venue: string): string => venue.replace(/\s*\([^()]*\)$/, '');

/** A thesis venue such as "Master's thesis, Stockholm Resilience Centre, Stockholm University". */
export function thesisParts(venue: string): { degree: 'masters' | 'phd'; label: string; school: string } | undefined {
  const m = venue.match(/^((Master['’]s|PhD|Ph\.D\.|Doctoral) (?:thesis|dissertation)),\s*(.+)$/i);
  if (!m) return undefined;
  return { degree: /^master/i.test(m[2]) ? 'masters' : 'phd', label: m[1], school: m[3] };
}

/** "848–855" -> { first, last }. A single value is an article number. */
function pageParts(pages?: string): { first: string; last?: string } | undefined {
  if (!pages) return undefined;
  const m = pages.trim().match(/^([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)$/);
  return m ? { first: m[1], last: m[2] } : { first: pages.trim() };
}

/** Names in the "Family, Given" form that citation managers expect. Group names are kept whole. */
export function invertedName(name: string, organization = false): string {
  if (organization) return name.trim();
  const n = splitName(name);
  return n.given.length ? `${n.family}, ${n.given.join(' ')}` : n.family;
}

/** Authors and editors, sorted out the same way as lib/metadata.ts. */
function roles(item: Pick<ExportItem, 'authors' | 'edited' | 'editors' | 'organization'>) {
  const org = !!item.organization;
  const own = item.authors.map((name) => ({ name, org }));
  const extra = (item.editors ?? []).map((name) => ({ name, org: false }));
  return item.edited ? { authors: [], editors: [...own, ...extra] } : { authors: own, editors: extra };
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

// ---------- RIS ----------

/** The RIS reference type. Types that the record cannot pin down fall back to GEN (generic). */
export function risType(item: ExportItem): string {
  if (journalOf(item)) return 'JOUR';
  switch (item.type) {
    case 'Book':
      return 'BOOK';
    case 'Fiction':
      return item.edited ? 'BOOK' : 'GEN';
    case 'Chapter':
      return 'CHAP';
    case 'Report':
      return 'RPRT';
    case 'Thesis':
      return 'THES';
    case 'Preprint':
      return 'UNPB';
    case 'Essay':
    case 'Guide':
      return 'ELEC';
    case 'Journal':
      return 'JFULL';
    default:
      return 'GEN';
  }
}

/** One RIS record, with CRLF line endings as the format expects. */
export function toRis(item: ExportItem): string {
  const lines: string[] = [];
  const tag = (t: string, v?: string | null) => {
    if (v && oneLine(v)) lines.push(`${t}  - ${oneLine(v)}`);
  };
  const ty = risType(item);
  tag('TY', ty);
  const { authors, editors } = roles(item);
  authors.forEach((a) => tag('AU', invertedName(a.name, a.org)));
  editors.forEach((e) => tag('ED', invertedName(e.name, e.org)));
  tag('TI', item.title);

  if (ty === 'JOUR') tag('T2', item.venue);
  else if (ty === 'CHAP') {
    const host = chapterHost(item.venue);
    tag('T2', host.book);
    tag('PB', host.publisher);
  } else if (ty === 'BOOK') tag('PB', bookPublisher(item.venue));
  else if (ty === 'THES' && thesisParts(item.venue)) {
    const t = thesisParts(item.venue)!;
    tag('PB', t.school);
    tag('M3', t.label);
  } else tag('T2', item.venue);

  if (item.year) tag('PY', String(item.year));
  tag('VL', item.volume);
  tag('IS', item.issue);
  const pp = pageParts(item.pages);
  tag('SP', pp?.first);
  tag('EP', pp?.last);
  tag('DO', item.doi);
  tag('UR', item.url);
  tag('LA', item.language);
  item.topics.forEach((t) => tag('KW', topicLabel(t)));
  const version = versionLabel(item.version);
  tag('N1', [`Rights: ${termsLabel(item)}`, version && `Version: ${version}`, item.accessNote && `Copy: ${item.accessNote}`].filter(Boolean).join('. '));
  lines.push('ER  - ');
  return `${lines.join('\r\n')}\r\n`;
}

// ---------- BibTeX ----------

const BIB_SPECIAL: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};
/** Escapes the characters that are special in BibTeX and LaTeX. URLs and DOIs are left as they are. */
export function bibEscape(s: string): string {
  return s.replace(/[\\&%$#_{}~^]/g, (c) => BIB_SPECIAL[c] ?? `\\${c}`);
}

const bibNames = (list: { name: string; org: boolean }[]) =>
  list.map((p) => (p.org ? `{${bibEscape(p.name)}}` : bibEscape(invertedName(p.name)))).join(' and ');

/** The BibTeX entry type. */
export function bibType(item: ExportItem): string {
  if (journalOf(item)) return 'article';
  if (item.type === 'Book' || (item.type === 'Fiction' && item.edited)) return 'book';
  if (item.type === 'Chapter') return 'incollection';
  if (item.type === 'Thesis') {
    const t = thesisParts(item.venue);
    if (t) return t.degree === 'masters' ? 'mastersthesis' : 'phdthesis';
  }
  return 'misc';
}

/** One BibTeX entry. The citation key is the record's slug, which is unique in the library. */
export function toBibtex(item: ExportItem): string {
  const type = bibType(item);
  const fields: [string, string][] = [];
  const add = (k: string, v?: string | null, raw = false) => {
    if (v && oneLine(v)) fields.push([k, raw ? oneLine(v) : bibEscape(oneLine(v))]);
  };
  const { authors, editors } = roles(item);
  if (authors.length) fields.push(['author', bibNames(authors)]);
  if (editors.length) fields.push(['editor', bibNames(editors)]);
  // Double braces keep the title's capitals as the work gives them.
  fields.push(['title', `{${bibEscape(oneLine(item.title))}}`]);

  if (type === 'article') add('journal', item.venue);
  else if (type === 'incollection') {
    const host = chapterHost(item.venue);
    add('booktitle', host.book);
    add('publisher', host.publisher);
  } else if (type === 'book') add('publisher', bookPublisher(item.venue));
  else if (type === 'mastersthesis' || type === 'phdthesis') add('school', thesisParts(item.venue)!.school);
  else add('howpublished', item.venue);

  if (item.year) add('year', String(item.year));
  add('volume', item.volume);
  add('number', item.issue);
  const pp = pageParts(item.pages);
  // A single value is an article number, which biblatex calls eid. Classic BibTeX styles ignore it.
  if (pp?.last) add('pages', `${pp.first}--${pp.last}`);
  else if (pp) add('eid', pp.first);
  add('doi', item.doi, true);
  add('url', item.url, true);
  // Which copy the link leads to, when it is not the published version ("Author manuscript", "Preprint").
  add('note', versionLabel(item.version));
  if (item.topics.length) add('keywords', item.topics.map(topicLabel).join(', '));
  const width = Math.max(...fields.map(([k]) => k.length));
  return `@${type}{${item.slug},\n${fields.map(([k, v]) => `  ${k.padEnd(width)} = {${v}}`).join(',\n')}\n}\n`;
}

// ---------- CSV ----------

export const CSV_COLUMNS = [
  'id', 'open_sun_url', 'title', 'authors', 'authors_are', 'authors_are_editors', 'editors', 'year', 'type', 'venue',
  'volume', 'issue', 'pages', 'doi', 'url', 'license', 'license_url', 'rights_status', 'version', 'access_note',
  'language', 'topics', 'date_added', 'summary',
] as const;

/** One CSV field, quoted when it holds a comma, quote or line break (RFC 4180). */
export function csvField(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** The whole collection as CSV, UTF-8 with CRLF line endings and a header row. Lists are joined with "; ". */
export function toCsv(items: ExportItem[], siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, '');
  const rows = items.map((i) => {
    const row: Record<(typeof CSV_COLUMNS)[number], string> = {
      id: i.slug,
      open_sun_url: `${base}/library/${i.slug}`,
      title: i.title,
      authors: i.authors.join('; '),
      authors_are: i.organization ? 'organizations' : 'people',
      authors_are_editors: i.edited ? 'yes' : 'no',
      editors: (i.editors ?? []).join('; '),
      year: i.year ? String(i.year) : '',
      type: i.type,
      venue: i.venue,
      volume: i.volume ?? '',
      issue: i.issue ?? '',
      pages: i.pages ?? '',
      doi: i.doi ?? '',
      url: i.url,
      license: i.license,
      license_url: licenseUrl(i.license) ?? '',
      rights_status: i.rightsStatus,
      version: i.version ?? '',
      access_note: i.accessNote ?? '',
      language: i.language,
      topics: i.topics.join('; '),
      date_added: i.dateAdded,
      summary: oneLine(i.summary),
    };
    return CSV_COLUMNS.map((c) => csvField(row[c])).join(',');
  });
  return `${[CSV_COLUMNS.join(','), ...rows].join('\r\n')}\r\n`;
}

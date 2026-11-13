// MARC 21 bibliographic records for the collection, written as MARCXML (the MARC21slim schema).
// Pure functions with no Node or Next imports, so the tests can load this file. app/data/open-sun-marc.xml
// serves the output as a static file. The field-by-field crosswalk, and the parts not yet checked against
// a library system, are under "Data and exports" in docs/metadata/application-profile.md.
//
// These are brief records built from Open Sun's own data, not full catalog records. Names are not checked
// against an authority file, so the leader says "abbreviated level" (Leader/17 = 3). Data is not in ISBD
// form and subfields carry no ending punctuation (Leader/18 = n).
import type { License } from './rights.ts';
import { licenseName, licenseUrl } from './rights.ts';
import { splitName } from './cite.ts';
import { topicLabel } from './topics.ts';
import { bookPublisher, chapterHost, invertedName, type ExportItem } from './exports.ts';

export interface MarcControlField {
  tag: string;
  value: string;
}
export interface MarcDataField {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: [string, string][];
}
export interface MarcRecord {
  leader: string;
  controlfields: MarcControlField[];
  datafields: MarcDataField[];
}

// ---------- coded values ----------

/** ISO 639-1 -> MARC Code List for Languages (which uses the bibliographic forms, e.g. "fre", "ger", "chi"). */
const MARC_LANGUAGE: Record<string, string> = {
  af: 'afr', ar: 'ara', bg: 'bul', bn: 'ben', ca: 'cat', cs: 'cze', cy: 'wel', da: 'dan', de: 'ger', el: 'gre',
  en: 'eng', eo: 'epo', es: 'spa', et: 'est', eu: 'baq', fa: 'per', fi: 'fin', fr: 'fre', ga: 'gle', gd: 'gla',
  gl: 'glg', ha: 'hau', he: 'heb', hi: 'hin', hr: 'hrv', hu: 'hun', id: 'ind', ig: 'ibo', is: 'ice', it: 'ita',
  ja: 'jpn', ko: 'kor', la: 'lat', lt: 'lit', lv: 'lav', mi: 'mao', ms: 'may', nl: 'dut', no: 'nor', pl: 'pol',
  pt: 'por', ro: 'rum', ru: 'rus', sk: 'slo', sl: 'slv', sr: 'srp', sv: 'swe', sw: 'swa', th: 'tha', tl: 'tgl',
  tr: 'tur', uk: 'ukr', ur: 'urd', vi: 'vie', yo: 'yor', zh: 'chi', zu: 'zul',
};
/** The three-letter MARC language code for a two-letter code, or "und" (undetermined). */
export const marcLanguage = (code: string): string => MARC_LANGUAGE[code.toLowerCase()] ?? 'und';

/** Initial articles by language, for the 245 nonfiling indicator. Elided forms ("l'") take no space. */
const ARTICLES: Record<string, string[]> = {
  en: ['the', 'a', 'an'],
  es: ['el', 'la', 'lo', 'los', 'las', 'un', 'una', 'unos', 'unas'],
  pt: ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas'],
  fr: ['le', 'la', 'les', 'un', 'une', "l'", 'l’'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', "l'", 'l’'],
  de: ['der', 'die', 'das', 'ein', 'eine'],
  nl: ['de', 'het', 'een'],
};

/**
 * The number of characters to skip when filing a title: an initial article, the space after it, and any
 * quotation marks or other marks before it. Marks before a title with no article are not counted.
 */
export function nonfilingCount(title: string, language: string): number {
  const lead = title.match(/^[^\p{L}\p{N}]*/u)![0];
  const rest = title.slice(lead.length);
  for (const art of ARTICLES[language] ?? []) {
    const elided = /['’]$/.test(art);
    const head = rest.slice(0, art.length);
    if (head.toLowerCase() !== art) continue;
    if (elided && rest.length > art.length) return Math.min(9, lead.length + art.length);
    if (!elided && rest[art.length] === ' ') return Math.min(9, lead.length + art.length + 1);
  }
  return 0;
}

/** Bibliographic level: a part of a larger work (a), a whole monograph (m) or a serial (s). */
export function bibLevel(type: string): 'a' | 'm' | 's' {
  if (['Article', 'Essay', 'Chapter'].includes(type)) return 'a';
  return type === 'Journal' ? 's' : 'm';
}

/** Leader: new record, language material, Unicode, abbreviated level, non-ISBD with no ending punctuation. */
export function leader(type: string): string {
  // 00-04 length, 05 status n, 06 type a, 07 level, 08 control blank, 09 a = UCS/Unicode, 10-11 counts,
  // 12-16 base address, 17 encoding level 3, 18 descriptive form n, 19 blank, 20-23 entry map.
  const out = `00000na${bibLevel(type)} a22000003n 4500`;
  if (out.length !== 24) throw new Error(`leader is ${out.length} characters, not 24`);
  return out;
}

/** Field 008 (fixed-length data elements), 40 characters. */
export function field008(item: Pick<ExportItem, 'type' | 'year' | 'language' | 'dateAdded'>): string {
  const d = item.dateAdded.match(/^\d{2}(\d{2})-(\d{2})-(\d{2})$/);
  const entered = d ? `${d[1]}${d[2]}${d[3]}` : '||||||';
  const level = bibLevel(item.type);
  const year = item.year ? String(item.year).padStart(4, '0').slice(0, 4) : '';
  // 06 type of date, 07-10 date 1, 11-14 date 2. Serials: status unknown. Others: single date, or no date known.
  const dates = level === 's' ? `u${year || 'uuuu'}uuuu` : year ? `s${year}    ` : 'nuuuu    ';
  const place = 'xx '; // 15-17: no place, unknown, or undetermined
  // 18-34. Books: illustrations, audience, form of item (o = online), nature of contents, government
  // publication, conference, festschrift, index, undefined, literary form, biography.
  // Continuing resources: frequency, regularity, undefined, type, form of original, form of item (o), ...
  const thesis = item.type === 'Thesis' ? 'm|||' : '||||';
  const literary = item.type === 'Fiction' ? '1' : '0';
  const material = level === 's' ? '|| ||o||||||   ||' : `|||||o${thesis}|||| ${literary}|`;
  const out = `${entered}${dates}${place}${material}${marcLanguage(item.language)} d`;
  if (out.length !== 40) throw new Error(`008 for ${item.type} is ${out.length} characters, not 40`);
  return out;
}

// ---------- rights ----------

const CC_FULL: Record<Exclude<License, 'none'>, string> = {
  'CC-BY-4.0': 'Creative Commons Attribution 4.0 International License',
  'CC-BY-SA-4.0': 'Creative Commons Attribution-ShareAlike 4.0 International License',
  'CC-BY-NC-4.0': 'Creative Commons Attribution-NonCommercial 4.0 International License',
  'CC-BY-ND-4.0': 'Creative Commons Attribution-NoDerivatives 4.0 International License',
  'CC-BY-NC-SA-4.0': 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License',
  'CC-BY-NC-ND-4.0': 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License',
  'CC0-1.0': 'Creative Commons CC0 1.0 Universal Public Domain Dedication',
};

/** Field 540, following the Library of Congress examples for a Creative Commons license and for public domain. */
function field540(item: Pick<ExportItem, 'license' | 'rightsStatus'>): MarcDataField {
  const sf: [string, string][] = [];
  if (item.license !== 'none') sf.push(['a', CC_FULL[item.license]], ['f', licenseName(item.license)!], ['2', 'cc'], ['0', licenseUrl(item.license)!]);
  else if (item.rightsStatus === 'public-domain')
    sf.push(['a', 'This work is in the public domain'], ['f', 'public domain'], ['2', 'wikidata'], ['1', 'http://www.wikidata.org/entity/Q19652']);
  else sf.push(['a', 'In copyright. Free to read online, with no open license']);
  return { tag: '540', ind1: ' ', ind2: ' ', subfields: sf };
}

const VERSION_NOTE: Record<string, string> = {
  AO: "Author's original (preprint), before peer review",
  SMUR: 'Submitted manuscript under review',
  AM: 'Accepted manuscript (author manuscript)',
  P: 'Proof',
  CVoR: 'Corrected version of record',
  EVoR: 'Enhanced version of record',
};

// ---------- the record ----------

const field = (tag: string, ind1: string, ind2: string, ...subfields: [string, string | undefined | null][]): MarcDataField | null => {
  const sf = subfields.filter((s): s is [string, string] => !!s[1] && !!s[1].trim()).map(([c, v]) => [c, v.replace(/\s+/g, ' ').trim()] as [string, string]);
  return sf.length ? { tag, ind1, ind2, subfields: sf } : null;
};

/** A personal name for 100 or 700: "Family, Given", first indicator 1 (surname) or 0 (forename only). */
function personField(tag: '100' | '700', name: string, role: string): MarcDataField {
  const hasGiven = splitName(name).given.length > 0;
  return field(tag, hasGiven ? '1' : '0', ' ', ['a', invertedName(name)], ['e', role])!;
}
/** A group name for 110 or 710, in direct order (first indicator 2). An initial "The" is dropped, as in name headings. */
function groupField(tag: '110' | '710', name: string, role: string): MarcDataField {
  return field(tag, '2', ' ', ['a', name.replace(/^The\s+/, '')], ['e', role])!;
}

/** "Vol. 2, no. 9 (2019), p. 848-855", for 773 $g. */
export function hostParts(item: Pick<ExportItem, 'volume' | 'issue' | 'pages' | 'year'>): string | undefined {
  const enumeration = [item.volume && `Vol. ${item.volume}`, item.issue && `no. ${item.issue}`].filter(Boolean).join(', ');
  const date = item.year ? (enumeration ? `(${item.year})` : String(item.year)) : '';
  const head = [enumeration, date].filter(Boolean).join(' ');
  const range = item.pages?.trim().match(/^([A-Za-z]?\d+)\s*[-–—]\s*([A-Za-z]?\d+)$/);
  const pages = item.pages ? (range ? `p. ${range[1]}-${range[2]}` : `article ${item.pages.trim()}`) : '';
  if (!enumeration && !pages) return undefined;
  return [head, pages].filter(Boolean).join(', ');
}

/** The MARC 21 record for one item. */
export function marcRecord(item: ExportItem, siteUrl: string): MarcRecord {
  const level = bibLevel(item.type);
  const org = !!item.organization;
  const lang = marcLanguage(item.language);
  const controlfields: MarcControlField[] = [
    { tag: '001', value: item.slug },
    { tag: '007', value: 'cr |||||||||||' }, // electronic resource, remote
    { tag: '008', value: field008(item) },
  ];
  const df: (MarcDataField | null)[] = [];

  if (item.doi) df.push(field('024', '7', ' ', ['a', item.doi], ['2', 'doi']));
  if (lang !== 'und') df.push(field('041', ' ', ' ', ['a', lang]));

  // Main entry: the first author, unless the names are editors (then the title is the main entry).
  const names = item.edited ? [] : item.authors;
  const main = names[0];
  if (main) df.push(org ? groupField('110', main, 'author') : personField('100', main, 'author'));

  // 245: title proper in $a, subtitle in $b, split at the first colon.
  const cut = item.title.indexOf(': ');
  const [proper, rest] = cut > 0 ? [item.title.slice(0, cut), item.title.slice(cut + 2)] : [item.title, undefined];
  df.push(field('245', main ? '1' : '0', String(nonfilingCount(item.title, item.language)), ['a', proper], ['b', rest]));

  // 264: publication. A publisher only where the venue is known to be one: a book, an edited anthology, or a
  // group that published its own work. For parts of larger works the publisher belongs to the host (773).
  const selfPublished = org && item.authors.length === 1 && item.authors[0] === item.venue;
  const publisher = level === 'm' && (item.type === 'Book' || (item.type === 'Fiction' && item.edited) || selfPublished) ? bookPublisher(item.venue) : undefined;
  df.push(field('264', ' ', '1', ['b', publisher], ['c', item.year ? String(item.year) : undefined]));

  df.push(field('300', ' ', ' ', ['a', '1 online resource']));
  df.push(field('336', ' ', ' ', ['a', 'text'], ['b', 'txt'], ['2', 'rdacontent']));
  df.push(field('337', ' ', ' ', ['a', 'computer'], ['b', 'c'], ['2', 'rdamedia']));
  df.push(field('338', ' ', ' ', ['a', 'online resource'], ['b', 'cr'], ['2', 'rdacarrier']));

  // The venue as recorded, when no other field holds all of it safely.
  if (level === 'm' && publisher !== item.venue && item.type !== 'Thesis' && item.venue) df.push(field('500', ' ', ' ', ['a', `Source: ${item.venue}`]));
  if (item.version && VERSION_NOTE[item.version]) df.push(field('500', ' ', ' ', ['a', `Version: ${VERSION_NOTE[item.version]}`]));
  if (item.type === 'Thesis') df.push(field('502', ' ', ' ', ['a', item.venue]));
  df.push(field('506', '0', ' ', ['a', 'Open access'], ['f', 'Unrestricted online access'], ['2', 'star']));
  // Open Sun wrote the summary, so 520 names Open Sun as the assigning source.
  df.push(field('520', ' ', ' ', ['a', item.summary], ['c', 'Open Sun']));
  df.push(field540(item));
  for (const t of item.topics) df.push(field('653', ' ', '0', ['a', topicLabel(t)]));

  // Added entries: the other authors, then editors.
  for (const name of names.slice(1)) df.push(org ? groupField('710', name, 'author') : personField('700', name, 'author'));
  if (item.edited) for (const name of item.authors) df.push(org ? groupField('710', name, 'editor') : personField('700', name, 'editor'));
  for (const name of item.editors ?? []) df.push(personField('700', name, 'editor'));

  // 773: the host item for a part of a larger work.
  if (level === 'a' && item.venue) {
    if (item.type === 'Chapter') {
      const host = chapterHost(item.venue);
      df.push(field('773', '0', ' ', ['t', host.book], ['d', [host.publisher, item.year].filter(Boolean).join(', ')], ['g', hostParts({ ...item, year: null })]));
    } else df.push(field('773', '0', ' ', ['t', item.venue], ['g', hostParts(item)]));
  }

  df.push(field('856', '4', '0', ['u', item.url], ['z', item.accessNote]));
  df.push(field('856', '4', '2', ['u', `${siteUrl.replace(/\/+$/, '')}/library/${item.slug}`], ['z', 'Summary and record on Open Sun']));

  const datafields = df.filter((f): f is MarcDataField => f !== null);
  // Keep fields in tag order, and keep the order within a tag as written.
  datafields.sort((a, b) => a.tag.localeCompare(b.tag));
  return { leader: leader(item.type), controlfields, datafields };
}

// ---------- MARCXML ----------

// Characters XML 1.0 does not allow are dropped, then the five special characters are escaped.
const xml = (s: string) =>
  s
    .replace(/[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function recordXml(r: MarcRecord): string {
  const lines = ['  <record type="Bibliographic">', `    <leader>${xml(r.leader)}</leader>`];
  for (const c of r.controlfields) lines.push(`    <controlfield tag="${c.tag}">${xml(c.value)}</controlfield>`);
  for (const d of r.datafields) {
    lines.push(`    <datafield tag="${d.tag}" ind1="${d.ind1}" ind2="${d.ind2}">`);
    for (const [code, value] of d.subfields) lines.push(`      <subfield code="${code}">${xml(value)}</subfield>`);
    lines.push('    </datafield>');
  }
  lines.push('  </record>');
  return lines.join('\n');
}

/** A MARCXML collection of every item, valid against MARC21slim.xsd. */
export function toMarcXml(items: ExportItem[], siteUrl: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<collection xmlns="http://www.loc.gov/MARC21/slim" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd">',
    ...items.map((i) => recordXml(marcRecord(i, siteUrl))),
    '</collection>',
    '',
  ].join('\n');
}

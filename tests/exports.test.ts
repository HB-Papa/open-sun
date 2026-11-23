import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { bibEscape, bibType, csvField, risType, toBibtex, toCsv, toRis, CSV_COLUMNS, type ExportItem } from '../lib/exports.ts';
import { field008, leader, marcLanguage, marcRecord, nonfilingCount, toMarcXml, type MarcDataField } from '../lib/marc.ts';
import { parseRights } from '../lib/rights.ts';

const SITE = 'https://example.org';
const DIR = join(process.cwd(), 'content', 'library');

/** A real record from content/library, read the way lib/content.ts reads it. */
function load(slug: string): ExportItem {
  const { data, content } = matter(readFileSync(join(DIR, `${slug}.md`), 'utf8'));
  const str = (v: unknown) => (v === undefined || v === null || v === '' ? undefined : String(v));
  return {
    slug,
    title: String(data.title),
    authors: (data.authors ?? []).map(String),
    organization: !!data.organization,
    edited: !!data.edited,
    editors: data.editors?.map(String),
    year: data.year == null || data.year === '' ? null : Number(data.year),
    type: String(data.type ?? 'Article'),
    venue: String(data.venue ?? ''),
    volume: str(data.volume),
    issue: str(data.issue),
    pages: str(data.pages),
    doi: str(data.doi),
    url: String(data.url),
    ...parseRights(data, slug),
    language: String(data.language ?? 'en'),
    topics: (data.topics ?? []).map(String),
    summary: content.split(/\*\*Why it matters/i)[0].replace(/\s+/g, ' ').trim(),
    dateAdded: data.date_added instanceof Date ? data.date_added.toISOString().slice(0, 10) : String(data.date_added),
  };
}
const all = () => readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => load(f.replace(/\.md$/, '')));

/** RIS lines as [tag, value] pairs. */
const risLines = (ris: string) => ris.split('\r\n').slice(0, -1); // the record ends with CRLF
const risTags = (ris: string) => risLines(ris).map((l) => [l.slice(0, 2), l.slice(6)] as const);
const risAll = (ris: string, tag: string) => risTags(ris).filter(([t]) => t === tag).map(([, v]) => v);

// ---------- RIS ----------

test('RIS: a journal article', () => {
  const ris = toRis(load('barron-gafford-2019-agrivoltaics'));
  assert.match(ris, /^TY {2}- JOUR\r\n/);
  assert.match(ris, /\r\nER {2}- \r\n$/);
  assert.doesNotMatch(ris.replace(/\r\n/g, ''), /\n/); // CRLF only
  for (const line of risLines(ris)) assert.match(line, /^[A-Z][A-Z0-9] {2}- /);
  const authors = risAll(ris, 'AU');
  assert.equal(authors.length, 11);
  assert.equal(authors[0], 'Barron-Gafford, Greg A.');
  assert.deepEqual(risAll(ris, 'T2'), ['Nature Sustainability']);
  assert.deepEqual(risAll(ris, 'SP'), ['848']);
  assert.deepEqual(risAll(ris, 'EP'), ['855']);
  assert.deepEqual(risAll(ris, 'DO'), ['10.1038/s41893-019-0364-5']);
  assert.deepEqual(risAll(ris, 'UR'), ['https://www.osti.gov/servlets/purl/1567040']);
  assert.match(risAll(ris, 'N1')[0], /Version: Author manuscript/);
});

test('RIS: editors, chapters, theses and the generic fallback', () => {
  const book = toRis(load('kothari-2019-pluriverse'));
  assert.equal(risType(load('kothari-2019-pluriverse')), 'BOOK');
  assert.equal(risAll(book, 'AU').length, 0);
  assert.equal(risAll(book, 'ED')[0], 'Kothari, Ashish');
  assert.deepEqual(risAll(book, 'PB'), ['Tulika Books and Authorsupfront']);

  // A group author with separate editors, and a bracketed series note kept out of the publisher.
  const oil = toRis(load('after-oil-2022-solarities-energy-justice'));
  assert.deepEqual(risAll(oil, 'AU'), ['After Oil Collective']);
  assert.deepEqual(risAll(oil, 'ED'), ['Vemuri, Ayesha', 'Barney, Darin']);
  assert.deepEqual(risAll(oil, 'PB'), ['University of Minnesota Press']);

  const chap = toRis(load('silva-2025-libraries-of-things-sharing-economies'));
  assert.equal(risTags(chap)[0][1], 'CHAP');
  assert.deepEqual(risAll(chap, 'T2'), ['Understanding the Urban Sharing Economy']);
  assert.deepEqual(risAll(chap, 'PB'), ['Edward Elgar']);

  const thesis = toRis(load('rossi-2023-pathways-multispecies-cities'));
  assert.equal(risTags(thesis)[0][1], 'THES');
  assert.deepEqual(risAll(thesis, 'M3'), ["Master's thesis"]);
  assert.deepEqual(risAll(thesis, 'PB'), ['Stockholm Resilience Centre, Stockholm University']);

  // A conference paper typed Article has no volume or issue, so it is not claimed as a journal article.
  assert.equal(risType(load('alipio-2024-indigenous-data-sovereignty-solarpunk')), 'GEN');
  assert.equal(risType(load('tricase-2025-contesting-ai-futures')), 'UNPB');
  assert.equal(risType(load('hamilton-2017-solarpunk-optimistic-radical')), 'ELEC');
  // An essay in a journal issue is a journal article.
  assert.equal(risType(load('gillam-2023-solarpunk-manifesto')), 'JOUR');
});

test('RIS: an undated work has no PY, and every record is well formed', () => {
  assert.equal(risAll(toRis(load('sli-sustainable-library-certification')), 'PY').length, 0);
  for (const item of all()) {
    const ris = toRis(item);
    assert.match(ris, /^TY {2}- [A-Z]+\r\n[\s\S]*\r\nER {2}- \r\n$/, item.slug);
    assert.equal(risAll(ris, 'TI').length, 1, item.slug);
  }
});

// ---------- BibTeX ----------

test('BibTeX: entry types, names and fields', () => {
  const art = toBibtex(load('barron-gafford-2019-agrivoltaics'));
  assert.match(art, /^@article\{barron-gafford-2019-agrivoltaics,\n/);
  assert.match(art, /author +=  ?\{Barron-Gafford, Greg A\. and Pavao-Zuckerman, Mitchell A\. and /);
  assert.match(art, /pages += \{848--855\}/);
  assert.match(art, /note += \{Author manuscript\}/);
  assert.match(art, /\n\}\n$/);

  // An article number is not a page range.
  const baden = toBibtex(load('baden-2020-libraries-of-things'));
  assert.match(baden, /eid += \{7180\}/);
  assert.doesNotMatch(baden, /pages/);

  // Group names are braced so BibTeX does not split them into given and family names.
  assert.match(toBibtex(load('ala-2024-core-values')), /author += \{\{American Library Association\}\}/);
  assert.match(toBibtex(load('umich-css-2026-us-renewable-energy-factsheet')), /author += \{\{Center for Sustainable Systems, University of Michigan\}\}/);

  const ed = toBibtex(load('kothari-2019-pluriverse'));
  assert.match(ed, /^@book\{/);
  assert.match(ed, /editor += \{Kothari, Ashish and Salleh, Ariel/);
  assert.doesNotMatch(ed, /author/);

  assert.equal(bibType(load('silva-2025-libraries-of-things-sharing-economies')), 'incollection');
  assert.equal(bibType(load('rossi-2023-pathways-multispecies-cities')), 'mastersthesis');
  assert.equal(bibType(load('tricase-2025-contesting-ai-futures')), 'misc');
  assert.match(toBibtex(load('rossi-2023-pathways-multispecies-cities')), /school += \{Stockholm Resilience Centre, Stockholm University\}/);
});

test('BibTeX: special characters are escaped, but not in URLs and DOIs', () => {
  assert.equal(bibEscape('Food & Fuel: 100% {new} #1_a ~^\\'), 'Food \\& Fuel: 100\\% \\{new\\} \\#1\\_a \\textasciitilde{}\\textasciicircum{}\\textbackslash{}');
  const bib = toBibtex(load('hoicka-2021-reconciliation-renewable-energy'));
  assert.match(bib, /journal += \{Energy Research \\& Social Science\}/);
  const jenkins = toBibtex(load('jenkins-2016-energy-justice-review'));
  assert.match(jenkins, /url += \{https:\/\/cris\.brighton\.ac\.uk\/ws\/files\/484712\/Energy%20Justice/);
  // Every entry has balanced braces and a unique key.
  const keys = new Set<string>();
  for (const item of all()) {
    const b = toBibtex(item).replace(/\\[{}]/g, '');
    assert.equal((b.match(/\{/g) ?? []).length, (b.match(/\}/g) ?? []).length, item.slug);
    keys.add(b.match(/^@\w+\{([^,]+),/)![1]);
  }
  assert.equal(keys.size, all().length);
});

// ---------- CSV ----------

test('CSV: a header row, one row per item and RFC 4180 quoting', () => {
  assert.equal(csvField('plain'), 'plain');
  assert.equal(csvField('a, b'), '"a, b"');
  assert.equal(csvField('say "hi"'), '"say ""hi"""');
  const items = all();
  const csv = toCsv(items, `${SITE}/`);
  const lines = csv.trimEnd().split('\r\n');
  assert.equal(lines[0], CSV_COLUMNS.join(','));
  assert.equal(lines.length, items.length + 1); // summaries are on one line, so no row spans lines
  const jenkins = lines.find((l) => l.startsWith('jenkins-2016-energy-justice-review,'))!;
  assert.match(jenkins, /,CC-BY-NC-ND-4\.0,https:\/\/creativecommons\.org\/licenses\/by-nc-nd\/4\.0\/,open-license,AM,University of Brighton repository,en,/);
  assert.ok(jenkins.includes(`${SITE}/library/jenkins-2016-energy-justice-review`));
});

// ---------- MARC ----------

const fieldsOf = (slug: string) => marcRecord(load(slug), SITE).datafields;
const one = (fields: MarcDataField[], tag: string) => {
  const found = fields.filter((f) => f.tag === tag);
  assert.equal(found.length, 1, `expected one ${tag}`);
  return found[0];
};
const sub = (f: MarcDataField, code: string) => f.subfields.filter(([c]) => c === code).map(([, v]) => v);

test('MARC: leader and 008 are the right length and coded for the type', () => {
  assert.equal(leader('Article'), '00000naa a22000003n 4500');
  assert.equal(leader('Book'), '00000nam a22000003n 4500');
  assert.equal(leader('Journal'), '00000nas a22000003n 4500');
  for (const item of [...all(), { ...load('kothari-2019-pluriverse'), type: 'Journal' }]) {
    const f = field008(item);
    assert.equal(f.length, 40, item.slug);
    assert.equal(f.slice(0, 6), item.dateAdded.slice(2).replace(/-/g, ''), item.slug); // date entered: yymmdd from date_added
    assert.equal(f.slice(35, 38), marcLanguage(item.language));
    assert.equal(f[23], 'o'); // online
    assert.equal(f[39], 'd');
  }
  assert.equal(field008(load('barron-gafford-2019-agrivoltaics')).slice(6, 15), 's2019    ');
  assert.equal(field008(load('sli-sustainable-library-certification')).slice(6, 15), 'nuuuu    ');
  assert.equal(field008(load('eschrich-miller-2021-cities-of-light'))[33], '1'); // fiction
});

test('MARC: languages use three-letter codes in 008 and 041', () => {
  assert.equal(marcLanguage('en'), 'eng');
  assert.equal(marcLanguage('es'), 'spa');
  assert.equal(marcLanguage('pt'), 'por');
  assert.equal(marcLanguage('pl'), 'pol');
  assert.equal(marcLanguage('fr'), 'fre'); // MARC uses the bibliographic code
  assert.equal(marcLanguage('xx'), 'und');
  const es = fieldsOf('rivero-vadillo-2022-tecnofilia-solarpunk');
  assert.deepEqual(sub(one(es, '041'), 'a'), ['spa']);
  assert.equal(marcRecord(load('rivero-vadillo-2022-tecnofilia-solarpunk'), SITE).controlfields.find((c) => c.tag === '008')!.value.slice(35, 38), 'spa');
});

test('MARC: 100 and 700 for people, 110 and 710 for groups, no 1XX for an edited book', () => {
  const art = fieldsOf('barron-gafford-2019-agrivoltaics');
  const main = one(art, '100');
  assert.equal(main.ind1, '1');
  assert.deepEqual(sub(main, 'a'), ['Barron-Gafford, Greg A.']);
  assert.deepEqual(sub(main, 'e'), ['author']);
  assert.equal(art.filter((f) => f.tag === '700').length, 10);
  assert.equal(one(art, '245').ind1, '1');

  const doe = fieldsOf('doe-nrel-2021-solar-futures-study');
  assert.equal(one(doe, '110').ind1, '2');
  assert.deepEqual(sub(one(doe, '710'), 'a'), ['National Renewable Energy Laboratory']);
  assert.equal(doe.filter((f) => f.tag === '100' || f.tag === '700').length, 0);
  // An initial article is dropped from a group name heading.
  assert.deepEqual(sub(one(fieldsOf('pew-2026-wildlife-crossings'), '110'), 'a'), ['Pew Charitable Trusts']);

  const ed = fieldsOf('kothari-2019-pluriverse');
  assert.equal(ed.filter((f) => /^1/.test(f.tag)).length, 0);
  assert.equal(one(ed, '245').ind1, '0');
  const editors = ed.filter((f) => f.tag === '700');
  assert.equal(editors.length, 5);
  assert.ok(editors.every((f) => sub(f, 'e')[0] === 'editor'));

  const oil = fieldsOf('after-oil-2022-solarities-energy-justice');
  assert.deepEqual(sub(one(oil, '110'), 'a'), ['After Oil Collective']);
  assert.deepEqual(oil.filter((f) => f.tag === '700').map((f) => sub(f, 'a')[0]), ['Vemuri, Ayesha', 'Barney, Darin']);
});

test('MARC: 245 nonfiling characters and title parts', () => {
  assert.equal(nonfilingCount('The Sustainable Library: A Retrospective Case Study', 'en'), 4);
  assert.equal(nonfilingCount('A Pluriverse of Local Worlds', 'en'), 2);
  assert.equal(nonfilingCount('An Example', 'en'), 3);
  assert.equal(nonfilingCount('“The Quoted”', 'en'), 5);
  assert.equal(nonfilingCount('‘This Shining Confluence’', 'en'), 0);
  assert.equal(nonfilingCount('Anthropocene Futures', 'en'), 0);
  assert.equal(nonfilingCount('La tecnofilia', 'es'), 3);
  assert.equal(nonfilingCount('La tecnofilia', 'en'), 0);
  assert.equal(nonfilingCount("L'avenir", 'fr'), 2);

  const t = one(fieldsOf('mathiasson-2024-sustainable-library-sharing'), '245');
  assert.equal(t.ind2, '4');
  assert.deepEqual(sub(t, 'a'), ['The Sustainable Library']);
  assert.deepEqual(sub(t, 'b'), ['A Retrospective Case Study of a Public Library Sharing Initiative']);
  assert.deepEqual(one(fieldsOf('doe-nrel-2021-solar-futures-study'), '245').subfields, [['a', 'Solar Futures Study']]);
});

test('MARC: publication, host item, link, access and license fields', () => {
  const art = fieldsOf('barron-gafford-2019-agrivoltaics');
  assert.deepEqual(one(art, '264').subfields, [['c', '2019']]);
  assert.equal(one(art, '264').ind2, '1');
  const host = one(art, '773');
  assert.deepEqual(sub(host, 't'), ['Nature Sustainability']);
  assert.deepEqual(sub(host, 'g'), ['Vol. 2, no. 9 (2019), p. 848-855']);
  assert.deepEqual(sub(one(art, '024'), 'a'), ['10.1038/s41893-019-0364-5']);
  const links = art.filter((f) => f.tag === '856');
  assert.deepEqual(links.map((f) => f.ind1 + f.ind2), ['40', '42']);
  assert.deepEqual(sub(links[0], 'u'), ['https://www.osti.gov/servlets/purl/1567040']);
  assert.deepEqual(sub(links[0], 'z'), ['OSTI, U.S. Department of Energy']);
  assert.deepEqual(sub(one(art, '540'), 'a'), ['In copyright. Free to read online, with no open license']);
  assert.ok(art.some((f) => f.tag === '500' && sub(f, 'a')[0].startsWith('Version: Accepted manuscript')));
  assert.deepEqual(one(art, '506').subfields, [['a', 'Open access'], ['f', 'Unrestricted online access'], ['2', 'star']]);

  const cc = one(fieldsOf('kothari-2019-pluriverse'), '540');
  assert.deepEqual(cc.subfields, [
    ['a', 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License'],
    ['f', 'CC BY-NC-SA 4.0'],
    ['2', 'cc'],
    ['0', 'https://creativecommons.org/licenses/by-nc-sa/4.0/'],
  ]);
  // A book's publisher, with a bracketed note left out; no 773 for a whole book.
  const oil = fieldsOf('after-oil-2022-solarities-energy-justice');
  assert.deepEqual(sub(one(oil, '264'), 'b'), ['University of Minnesota Press']);
  assert.equal(oil.filter((f) => f.tag === '773').length, 0);

  const chap = one(fieldsOf('silva-2025-libraries-of-things-sharing-economies'), '773');
  assert.deepEqual(chap.subfields, [['t', 'Understanding the Urban Sharing Economy'], ['d', 'Edward Elgar, 2025'], ['g', 'p. 42-64']]);
  assert.deepEqual(sub(one(fieldsOf('baden-2020-libraries-of-things'), '773'), 'g'), ['Vol. 12, no. 17 (2020), article 7180']);
  assert.deepEqual(sub(one(fieldsOf('rossi-2023-pathways-multispecies-cities'), '502'), 'a'), ["Master's thesis, Stockholm Resilience Centre, Stockholm University"]);
  // An undated page from a group that published it itself: a publisher but no date.
  assert.deepEqual(one(fieldsOf('sli-sustainable-library-certification'), '264').subfields, [['b', 'Sustainable Libraries Initiative']]);
  // A report whose venue may be a series or a note keeps it in a 500 note, not as the publisher.
  const doe = fieldsOf('doe-nrel-2021-solar-futures-study');
  assert.deepEqual(one(doe, '264').subfields, [['c', '2021']]);
  assert.ok(doe.some((f) => f.tag === '500' && sub(f, 'a')[0] === 'Source: U.S. Department of Energy'));
});

test('MARC: fields are in tag order and the XML is well formed', () => {
  for (const item of all()) {
    const tags = marcRecord(item, SITE).datafields.map((f) => f.tag);
    assert.deepEqual(tags, [...tags].sort(), item.slug);
    assert.ok(tags.includes('245') && tags.includes('856'), item.slug);
  }
  const xml = toMarcXml([load('hoicka-2021-reconciliation-renewable-energy')], SITE);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<collection xmlns="http:\/\/www\.loc\.gov\/MARC21\/slim"/);
  assert.match(xml, /<leader>00000naa a22000003n 4500<\/leader>/);
  assert.match(xml, /<subfield code="t">Energy Research &amp; Social Science<\/subfield>/);
  assert.doesNotMatch(xml.replace(/&(amp|lt|gt|quot);/g, ''), /&/);
  assert.equal((xml.match(/<record /g) ?? []).length, 1);
  assert.equal((xml.match(/<datafield /g) ?? []).length, (xml.match(/<\/datafield>/g) ?? []).length);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { citationMeta, displayName, jsonLd, licenseUrl, pageRange, schemaType, type MetaItem } from '../lib/metadata.ts';

const SITE = 'https://example.org';

/** A real record from content/library, read the way lib/content.ts reads it. */
function load(slug: string): MetaItem {
  const { data, content } = matter(readFileSync(join(process.cwd(), 'content', 'library', `${slug}.md`), 'utf8'));
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
    license: String(data.license ?? 'Free to read'),
    language: String(data.language ?? 'en'),
    topics: (data.topics ?? []).map(String),
    summary: content.split(/\*\*Why it matters/i)[0].replace(/\s+/g, ' ').trim(),
  };
}

test('a journal article with a DOI gets full citation tags and JSON-LD', () => {
  const item = load('barron-gafford-2019-agrivoltaics');
  const tags = citationMeta(item);
  assert.equal(tags.citation_title, item.title);
  assert.deepEqual(tags.citation_author, item.authors);
  assert.equal((tags.citation_author as string[]).length, 11);
  assert.equal(tags.citation_publication_date, '2019');
  assert.equal(tags.citation_journal_title, 'Nature Sustainability');
  assert.equal(tags.citation_volume, item.volume);
  assert.equal(tags.citation_firstpage, '848');
  assert.equal(tags.citation_lastpage, '855');
  assert.equal(tags.citation_doi, '10.1038/s41893-019-0364-5');
  assert.equal(tags['DC.identifier'], 'https://doi.org/10.1038/s41893-019-0364-5');
  assert.equal(tags['DC.type'], 'Text');

  const ld = jsonLd(item, `${SITE}/`) as Record<string, any>;
  assert.equal(ld['@context'], 'https://schema.org');
  assert.equal(ld['@type'], 'ScholarlyArticle');
  assert.equal(ld.url, `${SITE}/library/${item.slug}`);
  assert.deepEqual(ld.author[0], { '@type': 'Person', name: 'Greg A. Barron-Gafford' });
  assert.deepEqual(ld.identifier, { '@type': 'PropertyValue', propertyID: 'DOI', value: item.doi });
  assert.ok(ld.sameAs.includes(`https://doi.org/${item.doi}`));
  assert.equal(ld.isAccessibleForFree, true);
  assert.equal(ld.datePublished, '2019');
  assert.ok(ld.description.length > 40);
  assert.match(ld.keywords, /Food and farming/);
  // The journal sits at the end of the isPartOf chain.
  let part = ld.isPartOf;
  while (part.isPartOf) part = part.isPartOf;
  assert.deepEqual(part, { '@type': 'Periodical', name: 'Nature Sustainability' });
  // Nothing undefined or empty is written out.
  assert.doesNotMatch(JSON.stringify(ld), /undefined|null|""|\[\]/);
});

test('an article number is not treated as a page range', () => {
  const tags = citationMeta(load('baden-2020-libraries-of-things'));
  assert.equal(tags.citation_firstpage, undefined);
  assert.equal(tags.citation_lastpage, undefined);
  assert.equal(pageRange('7180'), undefined);
  assert.equal(pageRange('e1603021'), undefined);
  assert.deepEqual(pageRange('717–733'), { first: '717', last: '733' });
  assert.deepEqual(pageRange('42-64'), { first: '42', last: '64' });
});

test('an edited volume lists its editors as editors, not authors', () => {
  const item = load('kothari-2019-pluriverse');
  const ld = jsonLd(item, SITE) as Record<string, any>;
  assert.equal(ld['@type'], 'Book');
  assert.equal(ld.author, undefined);
  assert.equal(ld.editor.length, 5);
  assert.deepEqual(ld.editor[0], { '@type': 'Person', name: 'Ashish Kothari' });
  assert.equal(ld.license, 'https://creativecommons.org/licenses/by-nc-sa/4.0/');
  // Two publishers in one venue string: not safe to state as one publisher.
  assert.equal(ld.publisher, undefined);
  assert.equal(ld.isPartOf, undefined);
  assert.equal(ld.identifier, undefined);
  assert.deepEqual(ld.sameAs, [item.url]);

  const tags = citationMeta(item);
  assert.equal(tags.citation_author, undefined);
  assert.equal(tags['DC.creator'], undefined);
  assert.deepEqual(tags['DC.contributor'], item.authors);
  assert.equal(tags.citation_journal_title, undefined);
  assert.equal(tags.citation_doi, undefined);
  assert.equal(tags['DC.identifier'], item.url);
  assert.equal(tags['DC.rights'], 'https://creativecommons.org/licenses/by-nc-sa/4.0/');
});

test('a book with one plain publisher name gets a publisher', () => {
  const ld = jsonLd(load('bollier-2019-free-fair-alive'), SITE) as Record<string, any>;
  assert.deepEqual(ld.publisher, { '@type': 'Organization', name: 'New Society Publishers' });
  assert.equal(ld.license, undefined); // "Free to read online" is not a license
});

test('authors and separate editors are both kept', () => {
  const item = load('after-oil-2022-solarities-energy-justice');
  const ld = jsonLd(item, SITE) as Record<string, any>;
  assert.deepEqual(ld.author, [{ '@type': 'Organization', name: 'After Oil Collective' }]);
  assert.deepEqual(ld.editor, [
    { '@type': 'Person', name: 'Ayesha Vemuri' },
    { '@type': 'Person', name: 'Darin Barney' },
  ]);
  assert.deepEqual(citationMeta(item)['DC.contributor'], ['Ayesha Vemuri', 'Darin Barney']);
});

test('an organization author is an Organization and its name is never reordered', () => {
  const ala = jsonLd(load('ala-2024-core-values'), SITE) as Record<string, any>;
  assert.deepEqual(ala.author, [{ '@type': 'Organization', name: 'American Library Association' }]);

  const umich = load('umich-css-2026-us-renewable-energy-factsheet');
  assert.deepEqual(citationMeta(umich).citation_author, ['Center for Sustainable Systems, University of Michigan']);
  assert.equal((jsonLd(umich, SITE) as Record<string, any>).author[0]['@type'], 'Organization');
});

test('a non-English item carries its language and an issue without a volume', () => {
  const item = load('rivero-vadillo-2022-tecnofilia-solarpunk');
  const tags = citationMeta(item);
  assert.equal(tags.citation_language, 'es');
  assert.equal(tags['DC.language'], 'es');
  assert.equal(tags.citation_issue, '76');
  assert.equal(tags.citation_volume, undefined);
  const ld = jsonLd(item, SITE) as Record<string, any>;
  assert.equal(ld.inLanguage, 'es');
  assert.deepEqual(ld.isPartOf, { '@type': 'PublicationIssue', issueNumber: '76', isPartOf: { '@type': 'Periodical', name: 'Nueva Revista del Pacífico' } });
  assert.equal(ld.license, 'https://creativecommons.org/licenses/by-nc-sa/4.0/');
});

test('names, types and licenses map only when the mapping is certain', () => {
  assert.equal(displayName('Roscam Abbing, Roel'), 'Roel Roscam Abbing');
  assert.equal(displayName('Laura Pereira'), 'Laura Pereira');
  assert.deepEqual(citationMeta(load('de-decker-2018-low-tech-website')).citation_author, ['Kris De Decker', 'Marie Otsuka', 'Roel Roscam Abbing']);

  assert.equal(schemaType('Thesis'), 'Thesis');
  assert.equal(schemaType('Chapter'), 'Chapter');
  assert.equal(schemaType('Report'), 'Report');
  assert.equal(schemaType('Guide'), 'CreativeWork');
  assert.equal(schemaType('Something new'), 'CreativeWork');

  assert.equal(licenseUrl('CC BY 4.0'), 'https://creativecommons.org/licenses/by/4.0/');
  assert.equal(licenseUrl('CC BY-NC-ND 4.0 (author manuscript)'), 'https://creativecommons.org/licenses/by-nc-nd/4.0/');
  assert.equal(licenseUrl('CC BY 3.0'), undefined);
  for (const l of ['Free to read', 'Free to read (U.S. government work)', 'Free to read (Elsevier open archive)']) assert.equal(licenseUrl(l), undefined);

  // A conference paper typed Article with no volume or issue gets no journal title.
  const conf = citationMeta(load('alipio-2024-indigenous-data-sovereignty-solarpunk'));
  assert.equal(conf.citation_journal_title, undefined);
  assert.equal(conf.citation_firstpage, '717');
});

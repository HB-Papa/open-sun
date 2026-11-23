import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { licenseGroup, licenseName, licenseUrl, LICENSES, parseRights, rightsLabel, rightsStatement, termsLabel } from '../lib/rights.ts';

const DIR = join(process.cwd(), 'content', 'library');

test('every library record has valid rights fields', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));
  assert.ok(files.length > 0);
  for (const f of files) {
    const { data } = matter(readFileSync(join(DIR, f), 'utf8'));
    assert.doesNotThrow(() => parseRights(data, f), f);
    // Versions are only recorded for journal articles, which Open Sun types as Article or Essay.
    if (data.version) assert.ok(['Article', 'Essay'].includes(data.type), `${f}: version on a ${data.type}`);
  }
});

test('labels read naturally', () => {
  assert.equal(rightsLabel({ license: 'CC-BY-4.0', rightsStatus: 'open-license', version: 'VoR' }), 'CC BY 4.0');
  assert.equal(rightsLabel({ license: 'CC-BY-NC-ND-4.0', rightsStatus: 'open-license', version: 'AM' }), 'CC BY-NC-ND 4.0 · Author manuscript');
  assert.equal(rightsLabel({ license: 'none', rightsStatus: 'in-copyright-free-to-read' }), 'Free to read');
  assert.equal(rightsLabel({ license: 'none', rightsStatus: 'in-copyright-free-to-read', version: 'AO' }), 'Free to read · Preprint');
  assert.equal(rightsLabel({ license: 'none', rightsStatus: 'public-domain' }), 'Public domain');
  assert.equal(termsLabel({ license: 'CC0-1.0', rightsStatus: 'public-domain' }), 'CC0 1.0');
  assert.equal(licenseName('CC-BY-SA-4.0'), 'CC BY-SA 4.0');
  assert.equal(licenseName('none'), undefined);
});

test('every license except none has a Creative Commons URL', () => {
  for (const l of LICENSES) {
    const url = licenseUrl(l);
    if (l === 'none') assert.equal(url, undefined);
    else assert.match(url!, /^https:\/\/creativecommons\.org\/(licenses\/[a-z-]+\/4\.0|publicdomain\/zero\/1\.0)\/$/);
  }
  assert.equal(rightsStatement({ license: 'CC-BY-4.0', rightsStatus: 'open-license' }), 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)');
});

test('the library filter groups licenses as before', () => {
  assert.equal(licenseGroup('CC-BY-4.0'), 'cc-by');
  assert.equal(licenseGroup('CC-BY-NC-ND-4.0'), 'cc');
  assert.equal(licenseGroup('CC0-1.0'), 'cc');
  assert.equal(licenseGroup('none'), 'other');
});

test('bad values stop with a clear error', () => {
  assert.throws(() => parseRights({ license: 'CC BY 4.0', rights_status: 'open-license' }, 'x.md'), /x\.md: license "CC BY 4\.0" is not one of .*old free-text form/);
  assert.throws(() => parseRights({ rights_status: 'open-license' }, 'x.md'), /license null/);
  assert.throws(() => parseRights({ license: 'none', rights_status: 'free' }, 'x.md'), /rights_status "free"/);
  assert.throws(() => parseRights({ license: 'none', rights_status: 'open-license' }, 'x.md'), /license is none/);
  assert.throws(() => parseRights({ license: 'CC-BY-4.0', rights_status: 'public-domain' }, 'x.md'), /needs rights_status open-license/);
  assert.throws(() => parseRights({ license: 'none', rights_status: 'in-copyright-free-to-read', version: 'postprint' }, 'x.md'), /version "postprint"/);
  assert.deepEqual(parseRights({ license: 'none', rights_status: 'in-copyright-free-to-read', version: 'AM', access_note: ' PubMed Central ' }, 'x.md'), {
    license: 'none',
    rightsStatus: 'in-copyright-free-to-read',
    version: 'AM',
    accessNote: 'PubMed Central',
  });
});

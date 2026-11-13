// Audits every library item: link, required fields, controlled lists (topics,
// type and the four rights fields), duplicates, unfinished drafts and field
// notes. Prints a Markdown report.
// Usage: npm run audit              (checks links too)
//        npm run audit -- --no-links   (offline: skips the network checks)
// Environment:
//   AUDIT_REPORT   optional path to also write the report to
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
// The controlled lists and checks for license, rights_status, version and access_note. Node runs the .ts file directly.
import { parseRights } from '../lib/rights.ts';

const ROOT = process.cwd();
const DIR = join(ROOT, 'content', 'library');
const NO_LINKS = process.argv.includes('--no-links');
const UA = 'Mozilla/5.0 (compatible; OpenSunLinkCheck/1.0; +https://github.com/)';
const REQUIRED = ['title', 'authors', 'year', 'type', 'url', 'license', 'rights_status', 'language', 'topics', 'date_added'];

// Fallback copies, used only if lib/topics.ts can't be parsed. Keep in sync with it.
const FALLBACK_TOPICS = [
  'solarpunk', 'fiction', 'climate-futures', 'community-energy', 'energy-justice', 'degrowth', 'ecology', 'multispecies',
  'agriculture', 'urban', 'design', 'technology', 'indigenous-futures', 'commons', 'libraries', 'resilience', 'education',
  'justice', 'governance',
];
const FALLBACK_TYPES = ['Article', 'Book', 'Chapter', 'Essay', 'Fiction', 'Guide', 'Report', 'Journal', 'Thesis', 'Preprint'];

// Reads the topic keys and the type list straight from lib/topics.ts.
function controlledLists() {
  const notes = [];
  let topics = FALLBACK_TOPICS;
  let types = FALLBACK_TYPES;
  try {
    const src = readFileSync(join(ROOT, 'lib', 'topics.ts'), 'utf8');
    const block = src.match(/export const TOPICS\s*=\s*\{([\s\S]*?)\}\s*as const/);
    const keys = block ? [...block[1].matchAll(/^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:/gm)].map((m) => m[1] || m[2] || m[3]) : [];
    if (keys.length) topics = keys;
    else notes.push('Could not read TOPICS from lib/topics.ts, so the copy inside scripts/collection-audit.mjs was used.');
    const arr = src.match(/export const TYPES\s*=\s*\[([^\]]*)\]/);
    const vals = arr ? [...arr[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]) : [];
    if (vals.length) types = vals;
    else notes.push('Could not read TYPES from lib/topics.ts, so the copy inside scripts/collection-audit.mjs was used.');
  } catch {
    notes.push('Could not open lib/topics.ts, so the copies inside scripts/collection-audit.mjs were used.');
  }
  return { topics, types, notes };
}

// Same approach as scripts/check-links.mjs: try HEAD, then GET.
async function checkLink(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return { ok: true, status: res.status };
      // Some publishers reject HEAD or bots (403) but work in a browser.
      if (method === 'GET') return { ok: false, status: res.status };
    } catch (e) {
      if (method === 'GET') return { ok: false, status: String(e.cause?.code || e.cause?.message || e.name) };
    }
  }
}
// Blocked bots (403), servers with incomplete certificate chains, and
// cookie-based redirects usually still open fine in a browser, so they are
// warnings rather than failures.
const isLinkWarning = (status) => status === 403 || /CERT|VERIFY|SELF_SIGNED|redirect count/i.test(String(status));

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
const cleanDoi = (d) => String(d).trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '');
const normTitle = (t) => String(t ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
const dateText = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? ''));

function tally(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}
function countLines(map, byKey = false) {
  const rows = [...map.entries()].sort((a, b) => (byKey ? String(a[0]).localeCompare(String(b[0])) : b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))));
  return rows.map(([k, n]) => `- ${k}: ${n}`);
}

const { topics: TOPICS, types: TYPES, notes } = controlledLists();
const files = readdirSync(DIR).filter((f) => f.endsWith('.md')).sort();
const failures = [];
const warnings = notes.map((n) => `Audit script: ${n}`);
const fail = (f, msg) => failures.push(`\`${f}\`: ${msg}`);
const warn = (f, msg) => warnings.push(`\`${f}\`: ${msg}`);

const items = [];
for (const f of files) {
  const raw = readFileSync(join(DIR, f), 'utf8');
  let data;
  try {
    data = matter(raw).data;
  } catch (e) {
    fail(f, `front matter can't be read (${String(e.reason || e.message).split('\n')[0]})`);
    continue;
  }
  items.push({ f, data });

  // `year: null` is how an undated source is recorded on purpose, so it is a
  // warning to confirm. A year that is absent altogether is a failure.
  const undated = 'year' in data && data.year === null;
  const missing = REQUIRED.filter((k) => isEmpty(data[k]) && !(k === 'year' && undated));
  if (missing.length) fail(f, `missing required field(s): ${missing.join(', ')}`);
  if (undated) warn(f, '`year` is set to null. Confirm the source really has no date');

  if (!isEmpty(data.topics)) {
    const list = Array.isArray(data.topics) ? data.topics : [data.topics];
    const bad = list.filter((t) => !TOPICS.includes(t));
    if (bad.length) fail(f, `topic(s) not in lib/topics.ts: ${bad.join(', ')}`);
  }
  if (!isEmpty(data.type) && !TYPES.includes(data.type)) fail(f, `type "${data.type}" is not in the TYPES list`);
  if (!isEmpty(data.date_added) && !/^\d{4}-\d{2}-\d{2}$/.test(dateText(data.date_added))) fail(f, `date_added "${dateText(data.date_added)}" is not YYYY-MM-DD`);

  // Rights: the same check that stops the site build. A missing license or rights_status is reported above.
  if (!isEmpty(data.license) && !isEmpty(data.rights_status)) {
    try {
      parseRights(data, f);
    } catch (e) {
      fail(f, String(e.message).replace(`${f}: `, '').replace(/ See docs\/metadata\/application-profile\.md\.$/, ''));
    }
  }
  if (data.version && !['Article', 'Essay'].includes(data.type)) warn(f, `\`version\` is ${data.version}, but NISO versions are for journal articles and this is a ${data.type}`);
  if (typeof data.access_note === 'string' && /needs? check/i.test(data.access_note)) warn(f, `rights not yet confirmed: "${data.access_note}"`);

  if (data.reviewed !== true) warn(f, '`reviewed` is not true, so the item is hidden on the live site');
  if (data.summary_status !== 'edited') warn(f, `summary_status is "${data.summary_status ?? 'missing'}", not "edited"`);
  if (/\bTODO\b/.test(raw)) fail(f, 'contains leftover "TODO" text');

  if (data.field_note !== undefined) {
    const n = data.field_note ?? {};
    const problems = [];
    if (isEmpty(n.question)) problems.push('no question');
    if (!Array.isArray(n.options) || n.options.length !== 3) problems.push(`needs exactly three options (has ${Array.isArray(n.options) ? n.options.length : 0})`);
    else if (n.options.some(isEmpty)) problems.push('has an empty option');
    if (!Number.isInteger(n.answer) || n.answer < 0 || n.answer > 2) problems.push(`answer must be 0, 1 or 2 (is ${JSON.stringify(n.answer)})`);
    if (problems.length) fail(f, `field_note: ${problems.join(', ')}`);
  }
}

// Duplicates across the collection.
function duplicates(keyOf, label) {
  const seen = new Map();
  for (const { f, data } of items) {
    const k = keyOf(data);
    if (!k) continue;
    seen.set(k, [...(seen.get(k) ?? []), f]);
  }
  for (const [k, fs] of seen) if (fs.length > 1) failures.push(`Duplicate ${label} "${k}": ${fs.map((x) => `\`${x}\``).join(', ')}`);
}
duplicates((d) => (d.doi ? cleanDoi(d.doi) : ''), 'DOI');
duplicates((d) => normTitle(d.title), 'title');

// Links.
let linksChecked = 0;
if (!NO_LINKS) {
  const results = await Promise.all(
    items.filter(({ data }) => !isEmpty(data.url)).map(async ({ f, data }) => ({ f, url: String(data.url), ...(await checkLink(String(data.url))) })),
  );
  linksChecked = results.length;
  for (const r of results) {
    if (r.ok) continue;
    // One slower second try, so a brief outage or dropped connection isn't reported as a dead link.
    if (!isLinkWarning(r.status)) {
      await new Promise((done) => setTimeout(done, 5000));
      const again = await checkLink(r.url);
      if (again.ok) continue;
      r.status = again.status;
    }
    if (isLinkWarning(r.status)) warn(r.f, `link could not be checked automatically (${r.status}). Open it in a browser: ${r.url}`);
    else fail(r.f, `link is broken (${r.status}): ${r.url}`);
  }
}

// Counts.
const byType = new Map();
const byLanguage = new Map();
const byLicense = new Map();
const byRights = new Map();
const byVersion = new Map();
const byYearAdded = new Map();
for (const { data } of items) {
  tally(byType, isEmpty(data.type) ? '(missing)' : String(data.type));
  tally(byLanguage, isEmpty(data.language) ? '(missing)' : String(data.language));
  tally(byLicense, isEmpty(data.license) ? '(missing)' : String(data.license));
  tally(byRights, isEmpty(data.rights_status) ? '(missing)' : String(data.rights_status));
  tally(byVersion, isEmpty(data.version) ? '(not recorded)' : String(data.version));
  tally(byYearAdded, dateText(data.date_added).slice(0, 4) || '(missing)');
}

const today = new Date().toISOString().slice(0, 10);
failures.sort();
warnings.sort();
const report = [
  `# Collection audit: ${today}`,
  '',
  `**${failures.length} failure${failures.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}** across ${files.length} items. ${
    NO_LINKS ? 'Links were not checked (`--no-links`).' : `${linksChecked} links checked.`
  }`,
  '',
  '## Failures',
  '',
  ...(failures.length ? failures.map((x) => `- ${x}`) : ['None.']),
  '',
  '## Warnings',
  '',
  ...(warnings.length ? warnings.map((x) => `- ${x}`) : ['None.']),
  '',
  '## Collection counts',
  '',
  `Total items: ${files.length}`,
  '',
  '### By type',
  '',
  ...countLines(byType),
  '',
  '### By language',
  '',
  ...countLines(byLanguage),
  '',
  '### By license',
  '',
  ...countLines(byLicense),
  '',
  '### By rights status',
  '',
  ...countLines(byRights),
  '',
  '### By version',
  '',
  ...countLines(byVersion),
  '',
  '### By year added',
  '',
  ...countLines(byYearAdded, true),
  '',
  'How to act on this report: `docs/procedures/collection-audit.md`.',
  '',
].join('\n');

console.log(report);
if (process.env.AUDIT_REPORT) writeFileSync(process.env.AUDIT_REPORT, report);
process.exit(failures.length ? 1 : 0);

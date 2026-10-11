// Open Sun update agent.
//
// Finds newly published open access work in OpenAlex, DOAJ and Crossref, drops
// duplicates and off-topic results, asks Claude for a first-draft summary, and
// writes one Markdown file per candidate into content/library/ marked
//   summary_status: draft   reviewed: false   source: agent
// The GitHub workflow then opens a pull request for a person to review.
// Items with `reviewed: false` never appear on the live site.
//
// Environment:
//   OPENALEX_API_KEY   free key from openalex.org (recommended)
//   ANTHROPIC_API_KEY  for draft summaries (optional; without it, drafts hold the abstract only)
//   SINCE              YYYY-MM-DD to search from (default: 14 days ago)
//   MAX_NEW            most items to add per run (default: 12)
//   CONTACT_EMAIL      sent to OpenAlex/Crossref as a courtesy (optional)

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const LIB = join(ROOT, 'content', 'library');
const REPORT = join(ROOT, '.update-agent-report.md');
const today = new Date().toISOString().slice(0, 10);
const since = process.env.SINCE || new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
const MAX_NEW = Number(process.env.MAX_NEW || 12);
const mailto = process.env.CONTACT_EMAIL || '';
const UA = `OpenSunUpdateAgent/1.0${mailto ? ` (mailto:${mailto})` : ''}`;

// Keep in sync with lib/topics.ts.
const TOPICS = [
  'solarpunk', 'fiction', 'climate-futures', 'community-energy', 'energy-justice', 'degrowth', 'ecology', 'multispecies',
  'agriculture', 'urban', 'design', 'technology', 'indigenous-futures', 'commons', 'libraries', 'resilience', 'education',
  'justice', 'governance',
];
const TYPES = ['Article', 'Book', 'Chapter', 'Essay', 'Fiction', 'Guide', 'Report', 'Journal', 'Thesis', 'Preprint'];

// Searches sent to each database.
const QUERIES = [
  'solarpunk',
  '"energy justice"',
  '"energy democracy"',
  '"community solar"',
  'agrivoltaics',
  'degrowth',
  '"multispecies justice"',
  '"library of things"',
  '"resilience hub"',
  '"climate fiction"',
  '"Indigenous futurism"',
  '"low-tech" sustainability',
  '"utopian" climate futures',
];

// Simple relevance scoring before anything is sent to Claude.
const SIGNALS = [
  [/solarpunk/i, 10],
  [/energy (justice|democracy|commons|sovereignty)/i, 5],
  [/community (solar|energy|owned)/i, 5],
  [/agrivoltaic/i, 5],
  [/degrowth|post-?growth/i, 4],
  [/multispecies|more-than-human/i, 4],
  [/librar(y|ies) of things|tool librar/i, 5],
  [/resilience hub/i, 5],
  [/climate fiction|cli-?fi|speculative fiction|utopia/i, 3],
  [/indigenous futur|decolonial futur/i, 4],
  [/solar (power|energy|panel|photovoltaic)/i, 2],
  [/commons/i, 2],
  [/low-?tech|permacomput/i, 3],
  [/rewild|urban ecology|wildlife crossing/i, 2],
];

// ---------- helpers ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normTitle = (t) => String(t || '').toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const cleanDoi = (d) => (d ? String(d).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase() : '');
const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function getJson(url, label) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
      if (res.ok) return await res.json();
      if (res.status === 429) {
        // Rate limited: wait as long as the server asks (or 10 s), then retry.
        await sleep((Number(res.headers.get('retry-after')) || 10) * 1000);
        continue;
      }
      console.warn(`${label}: HTTP ${res.status}`);
      if (res.status === 400 || res.status === 404) return null;
    } catch (e) {
      console.warn(`${label}: ${e.message}`);
    }
    await sleep(1500 * (attempt + 1));
  }
  return null;
}

/** "cc-by-nc", "CC BY-NC", or a creativecommons.org URL -> "CC BY-NC 4.0". */
function licenseLabel(raw) {
  const s = String(raw || '').toLowerCase();
  if (!s) return 'Free to read';
  if (/public-?domain|cc0|zero\//.test(s)) return 'CC0 (public domain)';
  const m = s.match(/(?:licenses\/|cc[-_ ])(by(?:[-_ ](?:nc|sa|nd))*)(?:\/(\d\.\d))?/);
  if (!m) return 'Free to read';
  return `CC ${m[1].replace(/[_ ]/g, '-').toUpperCase()} ${m[2] || '4.0'}`;
}

function relevance(text) {
  return SIGNALS.reduce((sum, [re, w]) => sum + (re.test(text) ? w : 0), 0);
}

// ---------- sources ----------

async function fromOpenAlex() {
  const out = [];
  const key = process.env.OPENALEX_API_KEY ? `&api_key=${encodeURIComponent(process.env.OPENALEX_API_KEY)}` : '';
  const select = 'doi,title,publication_year,type,open_access,primary_location,best_oa_location,language,authorships,biblio,abstract_inverted_index';
  for (const q of QUERIES) {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=is_oa:true,from_publication_date:${since}&per_page=25&select=${select}${key}${mailto ? `&mailto=${encodeURIComponent(mailto)}` : ''}`;
    const data = await getJson(url, `OpenAlex "${q}"`);
    for (const w of data?.results ?? []) {
      let abstract = '';
      if (w.abstract_inverted_index) {
        const pairs = [];
        for (const [word, idxs] of Object.entries(w.abstract_inverted_index)) for (const i of idxs) pairs.push([i, word]);
        abstract = pairs.sort((a, b) => a[0] - b[0]).map((p) => p[1]).join(' ');
      }
      out.push({
        source: 'OpenAlex',
        doi: cleanDoi(w.doi),
        title: stripTags(w.title),
        authors: (w.authorships || []).map((a) => a.raw_author_name || a.author?.display_name).filter(Boolean),
        year: w.publication_year,
        oaType: w.type,
        venue: w.primary_location?.source?.display_name || w.primary_location?.source?.host_organization_name || '',
        volume: w.biblio?.volume,
        issue: w.biblio?.issue,
        pages: w.biblio?.first_page ? [w.biblio.first_page, w.biblio.last_page].filter(Boolean).join('–') : undefined,
        url: w.doi || w.best_oa_location?.landing_page_url || w.open_access?.oa_url,
        license: licenseLabel(w.best_oa_location?.license),
        isOa: !!w.open_access?.is_oa,
        language: w.language || 'en',
        abstract,
      });
    }
    await sleep(300);
  }
  return out;
}

async function fromDoaj() {
  const out = [];
  for (const q of QUERIES) {
    // DOAJ allows only simple Lucene queries; date ranges must use the ">" form.
    const query = `${q} AND created_date:>${since}`;
    const data = await getJson(`https://doaj.org/api/v4/search/articles/${encodeURIComponent(query)}?pageSize=25`, `DOAJ "${q}"`);
    for (const r of data?.results ?? []) {
      const b = r.bibjson || {};
      const doi = (b.identifier || []).find((i) => i.type?.toLowerCase() === 'doi')?.id;
      const link = (b.link || []).find((l) => l.type === 'fulltext')?.url;
      out.push({
        source: 'DOAJ',
        doi: cleanDoi(doi),
        title: stripTags(b.title),
        authors: (b.author || []).map((a) => a.name).filter(Boolean),
        year: Number(b.year) || undefined,
        oaType: 'article',
        venue: b.journal?.title || '',
        volume: b.journal?.volume,
        issue: b.journal?.number,
        pages: b.start_page ? [b.start_page, b.end_page].filter(Boolean).join('–') : undefined,
        url: doi ? `https://doi.org/${doi}` : link,
        license: licenseLabel(b.journal?.license?.[0]?.type || 'cc-by'),
        isOa: true, // every DOAJ journal is open access
        // DOAJ lists the journal's languages, not the article's; prefer English when listed.
        language: (b.journal?.language?.includes('EN') ? 'EN' : b.journal?.language?.[0] || 'EN').slice(0, 2).toLowerCase(),
        abstract: stripTags(b.abstract),
      });
    }
    await sleep(300);
  }
  return out;
}

async function fromCrossref() {
  const out = [];
  for (const q of QUERIES) {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(q.replace(/"/g, ''))}&filter=from-pub-date:${since},has-license:true,has-abstract:true&rows=25${mailto ? `&mailto=${encodeURIComponent(mailto)}` : ''}`;
    const data = await getJson(url, `Crossref "${q}"`);
    for (const w of data?.message?.items ?? []) {
      // Crossref has no open access flag; keep only works under a Creative Commons license.
      const lic = (w.license || []).map((l) => l.URL).find((u) => /creativecommons\.org/i.test(u));
      if (!lic) continue;
      const year = w.issued?.['date-parts']?.[0]?.[0];
      out.push({
        source: 'Crossref',
        doi: cleanDoi(w.DOI),
        title: stripTags(w.title?.[0]),
        authors: (w.author || []).map((a) => [a.given, a.family].filter(Boolean).join(' ') || a.name).filter(Boolean),
        year,
        oaType: w.type,
        venue: w['container-title']?.[0] || w.publisher || '',
        volume: w.volume,
        issue: w.issue,
        pages: w.page?.replace('-', '–'),
        url: `https://doi.org/${w.DOI}`,
        license: licenseLabel(lic),
        isOa: true,
        language: w.language || 'en',
        abstract: stripTags(w.abstract),
      });
    }
    await sleep(1200); // Crossref asks for gentle pacing
  }
  return out;
}

// ---------- Claude drafts ----------

let anthropic = null;
let schema = null;
async function setupClaude() {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod');
  const { z } = await import('zod');
  anthropic = new Anthropic();
  schema = betaZodOutputFormat(
    z.object({
      relevant: z.boolean().describe('True only if the work is substantively about solarpunk or one of the listed topics.'),
      type: z.enum(TYPES),
      topics: z.array(z.enum(TOPICS)).describe('One to four topics from the fixed list, most relevant first.'),
      summary: z.string().describe('Two or three plain-language sentences.'),
      why: z.string().describe('One sentence on why it matters to Open Sun readers.'),
      field_note: z.object({
        question: z.string(),
        options: z.array(z.string()).describe('Exactly three short options.'),
        answer: z.number().int().describe('Index (0-2) of the correct option.'),
      }),
    }),
  );
  return true;
}

const SYSTEM = `You help edit Open Sun, a free library of open access writing about solarpunk and related ideas (${TOPICS.join(', ')}).
For each candidate you receive, decide whether it belongs and draft its library entry. A human editor rewrites every draft before publication.

Rules:
- Use only what the title and abstract say. Never invent findings, numbers, places, or methods. If the abstract is thin, keep the summary short and general.
- Write for curious non-specialists: short sentences, no jargon, present tense, no hype. Do not start with "This article".
- "relevant" is false for work that only mentions a topic in passing, or is about an unrelated field (for example "solar" in astrophysics or dermatology).
- The field note is one multiple-choice question that someone who read your summary can answer. Exactly three options, one correct.`;

async function draft(c) {
  const prompt = `Title: ${c.title}
Authors: ${c.authors.join(', ') || 'unknown'}
Venue: ${c.venue || 'unknown'} (${c.year || 'year unknown'})
Work type from the database: ${c.oaType || 'unknown'}
Language: ${c.language}

Abstract:
${c.abstract || '(no abstract available)'}`;
  try {
    const res = await anthropic.beta.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: schema },
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });
    if (res.stop_reason === 'refusal') {
      console.warn(`Claude declined to summarise "${c.title}"; keeping the abstract only.`);
      return null;
    }
    return res.parsed_output ?? null;
  } catch (e) {
    console.warn(`Claude draft failed for "${c.title}": ${e.message}`);
    return null;
  }
}

// ---------- files ----------

function slugFor(c, taken) {
  const fam = (c.authors[0] || 'anon').split(/\s+/).pop().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '') || 'anon';
  const words = normTitle(c.title)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(' ')
    .filter((w) => w.length > 3 && !['with', 'from', 'that', 'this', 'into', 'their', 'toward', 'towards', 'about'].includes(w))
    .slice(0, 3)
    .join('-');
  let slug = `${fam}-${c.year || 'nd'}-${words || 'untitled'}`.slice(0, 80);
  let n = 2;
  while (taken.has(slug)) slug = `${slug.replace(/-\d+$/, '')}-${n++}`;
  taken.add(slug);
  return slug;
}

const yaml = (s) => JSON.stringify(String(s));

function fileFor(c, d) {
  const fm = ['---', `title: ${yaml(c.title)}`, `authors: [${c.authors.map(yaml).join(', ')}]`, `year: ${c.year || 'null'}`, `type: ${d?.type || 'Article'}`, `venue: ${yaml(c.venue)}`];
  if (c.volume) fm.push(`volume: ${yaml(c.volume)}`);
  if (c.issue) fm.push(`issue: ${yaml(c.issue)}`);
  if (c.pages) fm.push(`pages: ${yaml(c.pages)}`);
  if (c.doi) fm.push(`doi: ${c.doi}`);
  fm.push(`url: ${c.url}`, `license: ${yaml(c.license)}`, `language: ${c.language}`);
  fm.push(`topics: [${(d?.topics?.length ? d.topics : c.guessTopics).join(', ')}]`);
  fm.push(`date_added: ${today}`, 'source: agent', 'reviewed: false', 'summary_status: draft');
  if (d?.field_note && d.field_note.options.length === 3 && d.field_note.answer >= 0 && d.field_note.answer <= 2) {
    fm.push('field_note:', `  question: ${yaml(d.field_note.question)}`, `  options: [${d.field_note.options.map(yaml).join(', ')}]`, `  answer: ${d.field_note.answer}`);
  }
  fm.push('---');
  const summary = d?.summary || 'TODO: write a two- or three-sentence summary in plain language.';
  const why = d?.why || 'TODO: one sentence on why this matters.';
  const abstract = c.abstract ? `\n<!--\nAbstract from ${c.source} (for reference; not shown on the site):\n${c.abstract.replace(/-->/g, '- ->')}\n-->\n` : '';
  return `${fm.join('\n')}\n${abstract}\n${summary}\n\n**Why it matters:** ${why}\n`;
}

function guessTopics(text) {
  const map = [
    [/solarpunk/i, 'solarpunk'], [/fiction|story|stories|novel/i, 'fiction'], [/energy justice|just transition/i, 'energy-justice'],
    [/community (solar|energy)|energy democracy|prosumer/i, 'community-energy'], [/degrowth|post-?growth/i, 'degrowth'],
    [/multispecies|more-than-human/i, 'multispecies'], [/agri|farm|food/i, 'agriculture'], [/urban|city|cities/i, 'urban'],
    [/indigenous|decolonial/i, 'indigenous-futures'], [/commons|sharing/i, 'commons'], [/librar/i, 'libraries'],
    [/resilien/i, 'resilience'], [/educat|teach|classroom/i, 'education'], [/low-?tech|comput/i, 'technology'],
  ];
  const t = map.filter(([re]) => re.test(text)).map(([, v]) => v);
  return t.length ? t.slice(0, 4) : ['climate-futures'];
}

// ---------- main ----------

async function main() {
  mkdirSync(LIB, { recursive: true });
  const existing = readdirSync(LIB).filter((f) => f.endsWith('.md'));
  const seenDoi = new Set();
  const seenTitle = new Set();
  const taken = new Set(existing.map((f) => f.replace(/\.md$/, '')));
  for (const f of existing) {
    const { data } = matter(readFileSync(join(LIB, f), 'utf8'));
    if (data.doi) seenDoi.add(cleanDoi(data.doi));
    seenTitle.add(normTitle(data.title));
  }
  // Also skip anything a reviewer already rejected (listed one DOI or title per line).
  const rejectFile = join(ROOT, 'content', 'rejected.txt');
  if (existsSync(rejectFile)) {
    for (const line of readFileSync(rejectFile, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
      if (/^10\./.test(cleanDoi(line))) seenDoi.add(cleanDoi(line));
      else seenTitle.add(normTitle(line));
    }
  }

  console.log(`Searching for open access work published since ${since}…`);
  const all = [...(await fromOpenAlex()), ...(await fromDoaj()), ...(await fromCrossref())];
  console.log(`Found ${all.length} raw results.`);

  const candidates = [];
  const batchDoi = new Set();
  const batchTitle = new Set();
  for (const c of all) {
    if (!c.title || !c.url || !c.isOa) continue;
    // Skip self-deposited uploads (Zenodo, figshare, ResearchGate, OSF), items with
    // no real abstract, and shouty all-caps titles: mostly unreviewed material.
    if (/^10\.(5281|6084|13140|31219|17605)\//.test(c.doi)) continue;
    if ((c.abstract || '').length < 300) continue;
    if (c.title === c.title.toUpperCase() || /title pending/i.test(c.title)) continue;
    if (c.oaType && !/article|book|chapter|review|proceedings|report/.test(c.oaType)) continue;
    const t = normTitle(c.title);
    if ((c.doi && (seenDoi.has(c.doi) || batchDoi.has(c.doi))) || seenTitle.has(t) || batchTitle.has(t)) continue;
    const score = relevance(`${c.title} ${c.abstract}`);
    if (score < 4) continue;
    if (c.doi) batchDoi.add(c.doi);
    batchTitle.add(t);
    candidates.push({ ...c, score, guessTopics: guessTopics(`${c.title} ${c.abstract}`) });
  }
  candidates.sort((a, b) => b.score - a.score || (b.abstract?.length || 0) - (a.abstract?.length || 0));
  console.log(`${candidates.length} new, on-topic candidates.`);

  const useClaude = await setupClaude();
  if (!useClaude) console.log('ANTHROPIC_API_KEY not set: drafts will contain the abstract only.');

  const added = [];
  const skipped = [];
  for (const c of candidates) {
    if (added.length >= MAX_NEW) break;
    const d = useClaude ? await draft(c) : null;
    if (d && !d.relevant) {
      skipped.push(c);
      continue;
    }
    const slug = slugFor(c, taken);
    writeFileSync(join(LIB, `${slug}.md`), fileFor(c, d));
    added.push({ slug, c, drafted: !!d });
  }

  const lines = [
    `## ${added.length} new item${added.length === 1 ? '' : 's'} for review`,
    '',
    `Open access work published since ${since}, found in OpenAlex, DOAJ, and Crossref.`,
    '',
    '**Before merging, for each file:**',
    '1. Open the link and check it is free to read and on topic. Delete the file if not (and add its DOI to `content/rejected.txt` so it isn’t suggested again).',
    '2. Rewrite the summary and “Why it matters” in your own words, then set `summary_status: edited`.',
    '3. Check the field note question, then set `reviewed: true`. Items stay hidden on the live site until you do.',
    '',
    ...added.map(({ slug, c, drafted }) => `- [ ] \`content/library/${slug}.md\`: [${c.title}](${c.url}) (${c.source}${drafted ? '' : ', no draft summary'})`),
  ];
  if (skipped.length) lines.push('', `<details><summary>${skipped.length} result(s) judged off-topic and skipped</summary>`, '', ...skipped.map((c) => `- [${c.title}](${c.url})`), '', '</details>');
  writeFileSync(REPORT, lines.join('\n') + '\n');
  console.log(`Added ${added.length} draft item(s). Report written to .update-agent-report.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

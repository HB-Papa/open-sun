import type { LibraryItem } from './types';

const PARTICLES = new Set(['de', 'van', 'von', 'der', 'den', 'du', 'da', 'del', 'la', 'le', 'di', 'dos', 'das']);

interface Name {
  given: string[];
  family: string;
}

/**
 * Authors are written in natural order ("Rhys Williams"). For family names the
 * rules can't guess, write "Family, Given" instead ("Weik von Mossner, Alexa").
 */
function splitName(full: string): Name {
  if (full.includes(',')) {
    const [family, given] = full.split(',').map((s) => s.trim());
    return { given: given ? given.split(/\s+/) : [], family };
  }
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { given: [], family: parts[0] };
  // "Julia van Velden": the family name starts at the first particle.
  let start = parts.length - 1;
  for (let i = 1; i < parts.length - 1; i++) {
    if (PARTICLES.has(parts[i].toLowerCase())) {
      start = i;
      break;
    }
  }
  return { given: parts.slice(0, start), family: parts.slice(start).join(' ') };
}

/** "Weik von Mossner, Alexa" -> "Alexa Weik von Mossner"; other names unchanged. */
export function naturalName(full: string): string {
  if (!full.includes(',')) return full;
  const n = splitName(full);
  return [...n.given, n.family].join(' ');
}

const initials = (given: string[]) =>
  given
    .map((g) =>
      g
        .split('-')
        .map((p) => (p.endsWith('.') && p.length <= 2 ? p : `${p[0]}.`))
        .join('-'),
    )
    .join(' ');

function apaName(full: string, org: boolean) {
  if (org) return full;
  const n = splitName(full);
  return n.given.length ? `${n.family}, ${initials(n.given)}` : n.family;
}

/** The author part of an APA reference, ending in a period: "Gillam, W. J." */
function apaAuthors(item: LibraryItem): string {
  const names = item.authors.map((a) => apaName(a, !!item.organization));
  let s: string;
  if (names.length === 1) s = names[0];
  else if (names.length <= 20) s = `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
  else s = `${names.slice(0, 19).join(', ')}, . . . ${names[names.length - 1]}`;
  if (item.edited) s += names.length > 1 ? ' (Eds.)' : ' (Ed.)';
  return s.endsWith('.') ? s : `${s}.`;
}

// Proper nouns that often appear in titles but not in summaries.
const ALWAYS_CAPITAL = new Set([
  'African', 'Africa', 'American', 'America', 'Americas', 'Asian', 'Asia', 'European', 'Europe', 'Latin', 'Indigenous',
  'English', 'Spanish', 'Portuguese', 'French', 'German', 'Chinese', 'Arabic', 'United', 'States', 'Canada', 'Canadian',
  'Mexico', 'Brazil', 'India', 'Nigeria', 'Nigerian', 'UK', 'US', 'UN', 'Anthropocene', 'Global', 'South', 'North',
]);

const bare = (w: string) => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '').replace(/’s$|'s$/, '');

/** Words written with a capital in the middle of a sentence of the summary: proper nouns. */
function properNouns(text: string): Set<string> {
  const set = new Set<string>();
  for (const sentence of text.split(/(?<=[.!?:])\s+/)) {
    sentence
      .split(/\s+/)
      .slice(1)
      .forEach((w) => {
        for (const seg of w.split(/[-–—]/)) {
          const b = bare(seg);
          if (/^\p{Lu}/u.test(b)) set.add(b);
        }
      });
  }
  return set;
}

/**
 * APA wants sentence case for titles. A word keeps its capital when it starts
 * the title (or follows a colon), has more than one capital (acronyms), is a
 * common proper noun, or appears capitalised mid-sentence in the summary.
 * Set `citation_title` in the front matter to override.
 */
function sentenceCase(item: LibraryItem) {
  if (item.citationTitle) return item.citationTitle;
  const keep = properNouns(`${item.summary} ${item.why}`);
  const isProper = (seg: string) => {
    const b = bare(seg);
    return /\p{Lu}.*\p{Lu}/u.test(b) || keep.has(b) || ALWAYS_CAPITAL.has(b);
  };
  let first = true;
  return item.title
    .split(' ')
    .map((w) => {
      // Treat each part of "Solarpunk-Based" or "Cost–Benefit" on its own.
      const out = w
        .split(/([-–—])/)
        .map((seg, k) => {
          if (seg === '-' || seg === '–' || seg === '—') return seg;
          if (first && k === 0) return seg.replace(/^(\P{L}*)(\p{Ll})/u, (_, pre, c) => pre + c.toUpperCase());
          return isProper(seg) ? seg : seg.toLowerCase();
        })
        .join('');
      first = /[:?!—]$/.test(w) || w === '—';
      return out;
    })
    .join(' ');
}

/** End with a period unless the text already ends a sentence. */
const dot = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`);

const link = (item: LibraryItem) => (item.doi ? `https://doi.org/${item.doi}` : item.url);
const BOOK_LIKE = ['Book', 'Fiction', 'Guide', 'Report', 'Thesis'];

export function apa(item: LibraryItem): { text: string; html: string } {
  const authors = apaAuthors(item);
  const title = dot(sentenceCase(item));
  const url = link(item);
  if (BOOK_LIKE.includes(item.type)) {
    // Skip the publisher when it's the same as the group author.
    const pub = item.organization && item.authors[0] === item.venue ? '' : ` ${dot(item.venue)}`;
    return {
      text: `${authors} (${item.year}). ${title}${pub} ${url}`,
      html: `${esc(authors)} (${item.year}). <em>${esc(title)}</em>${esc(pub)} ${esc(url)}`,
    };
  }
  if (!item.volume && !item.issue) {
    return {
      text: `${authors} (${item.year}). ${title} ${dot(item.venue)} ${url}`,
      html: `${esc(authors)} (${item.year}). ${esc(title)} <em>${esc(item.venue)}</em>. ${esc(url)}`,
    };
  }
  let tail = '';
  let tailHtml = '';
  if (item.volume) {
    tail += `, ${item.volume}`;
    tailHtml += `, <em>${esc(item.volume)}</em>`;
  }
  if (item.issue) {
    // With no volume, the issue number stands alone: "Text Matters, 12".
    tail += item.volume ? `(${item.issue})` : `, ${item.issue}`;
    tailHtml += item.volume ? `(${esc(item.issue)})` : `, ${esc(item.issue)}`;
  }
  if (item.pages) {
    // A single number is an article number, not a page range.
    const pg = /^\d+$/.test(item.pages) ? `Article ${item.pages}` : item.pages;
    tail += `, ${pg}`;
    tailHtml += `, ${esc(pg)}`;
  }
  return {
    text: `${authors} (${item.year}). ${title} ${item.venue}${tail}. ${url}`,
    html: `${esc(authors)} (${item.year}). ${esc(title)} <em>${esc(item.venue)}</em>${tailHtml}. ${esc(url)}`,
  };
}

function chicagoAuthors(item: LibraryItem): string {
  if (item.organization) return item.authors.join(', ');
  const [first, ...rest] = item.authors;
  const f = splitName(first);
  const firstStr = f.given.length ? `${f.family}, ${f.given.join(' ')}` : f.family;
  let s: string;
  if (!rest.length) s = firstStr;
  else if (item.authors.length > 10) s = `${[firstStr, ...rest.slice(0, 6).map(naturalName)].join(', ')}, et al.`;
  else s = `${[firstStr, ...rest.slice(0, -1).map(naturalName)].join(', ')}, and ${naturalName(rest[rest.length - 1])}`;
  if (item.edited) s += item.authors.length > 1 ? ', eds.' : ', ed.';
  return s;
}

export function chicago(item: LibraryItem): { text: string; html: string } {
  const authors = dot(chicagoAuthors(item));
  const url = link(item);
  if (BOOK_LIKE.includes(item.type)) {
    return {
      text: `${authors} ${dot(item.title)} ${item.venue}, ${item.year}. ${url}.`,
      html: `${esc(authors)} <em>${esc(dot(item.title))}</em> ${esc(item.venue)}, ${item.year}. ${esc(url)}.`,
    };
  }
  let vol = '';
  if (item.volume) vol += ` ${item.volume}`;
  if (item.issue) vol += `${item.volume ? ',' : ''} no. ${item.issue}`;
  const pages = item.pages ? `: ${item.pages}` : '';
  const yearPart = item.volume || item.issue ? ` (${item.year})${pages}` : `, ${item.year}`;
  return {
    text: `${authors} “${dot(item.title)}” ${item.venue}${vol}${yearPart}. ${url}.`,
    html: `${esc(authors)} “${esc(dot(item.title))}” <em>${esc(item.venue)}</em>${esc(vol)}${esc(yearPart)}. ${esc(url)}.`,
  };
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function shortAuthors(item: Pick<LibraryItem, 'authors' | 'organization'>): string {
  const a = item.authors;
  const fam = (n: string) => (item.organization ? n : splitName(n).family);
  if (a.length === 1) return fam(a[0]);
  if (a.length === 2) return `${fam(a[0])} and ${fam(a[1])}`;
  return `${fam(a[0])} et al.`;
}

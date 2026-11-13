// Suggestion report: checks the 14-day decision standard for suggestions.
// Lists open issues labelled "suggestion" that are older than 14 days, and counts
// open suggestions, suggestions closed in the last 30 days and the median days to
// close over the last 90 days. Procedure: docs/procedures/suggestions.md
//
// Usage: npm run suggestions               (needs GITHUB_TOKEN)
//        npm run suggestions -- --public   (no token: reads the public issue list, low rate limit)
// Environment:
//   GITHUB_TOKEN       token that can read issues on the repository
//   GITHUB_REPOSITORY  owner/name, defaults to HB-Papa/open-sun
//   AUDIT_REPORT       optional path to append the report to
//
// It reads only. It never fails the run: every problem is reported and it exits 0.
import { appendFileSync } from 'node:fs';

const DECISION_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;
const MAX_PAGES = 10; // 1,000 issues per query is far more than the queue holds

const PUBLIC = process.argv.includes('--public');
const token = process.env.GITHUB_TOKEN?.trim();
const repo = process.env.GITHUB_REPOSITORY?.trim() || 'HB-Papa/open-sun';

function output(text) {
  console.log(text);
  if (process.env.AUDIT_REPORT) {
    try {
      appendFileSync(process.env.AUDIT_REPORT, `\n${text}\n`);
    } catch (err) {
      console.log(`Could not append to AUDIT_REPORT: ${err.message}`);
    }
  }
}

// Issue titles come from the public form. Keep them from pinging people or loading images in the report.
const safe = (s) => String(s).replace(/@/g, '@​').replace(/!\[/g, '[').replace(/[\r\n]+/g, ' ');

async function listIssues(params) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'open-sun-suggestion-report' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const query = new URLSearchParams({ labels: 'suggestion', per_page: '100', page: String(page), ...params });
    const res = await fetch(`https://api.github.com/repos/${repo}/issues?${query}`, { headers, signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      const limited = res.headers.get('x-ratelimit-remaining') === '0';
      throw new Error(limited ? `GitHub rate limit reached (HTTP ${res.status}). Try again in an hour, or use a token.` : `GitHub answered HTTP ${res.status}.`);
    }
    const batch = await res.json();
    all.push(...batch.filter((i) => !i.pull_request)); // the issues API also returns pull requests
    if (batch.length < 100) break;
  }
  return all;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const days = (n) => `${n} day${n === 1 ? '' : 's'}`;

async function main() {
  if (!token && !PUBLIC) {
    output('Suggestion report skipped: no GITHUB_TOKEN set. (Run with --public to read the public issue list without one.)');
    return;
  }

  const now = Date.now();
  const since90 = new Date(now - 90 * DAY).toISOString();
  const open = await listIssues({ state: 'open', sort: 'created', direction: 'asc' });
  // "since" filters on last update, which is never earlier than closing, so this catches every issue closed in the last 90 days.
  const closed = (await listIssues({ state: 'closed', since: since90 })).filter((i) => i.closed_at && Date.parse(i.closed_at) >= now - 90 * DAY);

  const overdue = open
    .map((i) => ({ issue: i, ageMs: now - Date.parse(i.created_at) }))
    .filter((x) => x.ageMs > DECISION_DAYS * DAY)
    .sort((a, b) => b.ageMs - a.ageMs);
  const closed30 = closed.filter((i) => Date.parse(i.closed_at) >= now - 30 * DAY);
  const closeDays = closed.map((i) => (Date.parse(i.closed_at) - Date.parse(i.created_at)) / DAY);
  const med = median(closeDays);

  const lines = [
    '## Suggestions',
    '',
    `Standard: every suggestion gets a decision within ${DECISION_DAYS} days. Checked ${new Date(now).toISOString().slice(0, 10)} against ${repo}${token ? '' : ' (public read, no token)'}.`,
    '',
    `- Open suggestions: ${open.length}`,
    `- Closed in the last 30 days: ${closed30.length}`,
    `- Median days to close, last 90 days: ${med === null ? 'none closed' : `${med.toFixed(1)} (from ${closeDays.length} closed)`}`,
    '',
    `### Open longer than ${DECISION_DAYS} days`,
    '',
    ...(overdue.length
      ? overdue.map(({ issue, ageMs }) => `- ${safe(issue.title)}: open ${days(Math.floor(ageMs / DAY))}. ${issue.html_url}`)
      : ['None.']),
    '',
    'How to act on this: `docs/procedures/suggestions.md`.',
  ];
  output(lines.join('\n'));
}

try {
  await main();
} catch (err) {
  output(`## Suggestions\n\nThe suggestion report could not run: ${err?.message ?? err}`);
}
process.exit(0);

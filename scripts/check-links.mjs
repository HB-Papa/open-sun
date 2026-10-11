// Checks that every library item's link still opens.
// Usage: npm run check-links
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const DIR = join(process.cwd(), 'content', 'library');
const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));
const UA = 'Mozilla/5.0 (compatible; OpenSunLinkCheck/1.0; +https://github.com/)';

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return { ok: true, status: res.status, final: res.url };
      // Some publishers reject HEAD or bots (403) but work in a browser.
      if (method === 'GET') return { ok: false, status: res.status, final: res.url };
    } catch (e) {
      if (method === 'GET') return { ok: false, status: String(e.cause?.code || e.name), final: url };
    }
  }
}

let failed = 0;
const results = await Promise.all(
  files.map(async (f) => {
    const { data } = matter(readFileSync(join(DIR, f), 'utf8'));
    const r = await check(data.url);
    return { f, url: data.url, ...r };
  }),
);
// Blocked bots (403) and servers with incomplete certificate chains usually
// still open fine in a browser, so they are warnings rather than failures.
const isWarning = (r) => r.status === 403 || /CERT|VERIFY|SELF_SIGNED/.test(String(r.status));
for (const r of results.sort((a, b) => a.f.localeCompare(b.f))) {
  const mark = r.ok ? 'ok  ' : isWarning(r) ? 'warn' : 'BAD ';
  if (!r.ok && !isWarning(r)) failed++;
  console.log(`${mark}  ${r.f}  ${r.url}${r.ok ? '' : `  (${r.status})`}`);
}
console.log(`\n${results.length} links checked, ${failed} broken. ("warn" = the site blocked the automated check; open it in a browser to confirm.)`);
process.exit(failed ? 1 : 0);

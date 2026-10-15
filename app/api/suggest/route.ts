// Turns a suggestion into a GitHub issue labelled "suggestion" in the site's
// repository, which is the review queue. Needs two environment variables in Vercel:
//   GITHUB_REPO   e.g. "your-name/open-sun"
//   GITHUB_TOKEN  a fine-grained token with "Issues: Read and write" on that repo only
import { NextResponse } from 'next/server';

const recent = new Map<string, number[]>(); // simple per-instance rate limit

export async function POST(req: Request) {
  const repo = process.env.GITHUB_REPO?.trim();
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!repo || !token) {
    return NextResponse.json({ error: 'Suggestions aren’t switched on yet. Please check back soon.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'That didn’t look like a form submission.' }, { status: 400 });
  }
  const str = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
  if (str(body.website, 200)) return NextResponse.json({ ok: true }); // spam trap

  const url = str(body.url, 1000);
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
  } catch {
    return NextResponse.json({ error: 'Please enter a full link, starting with https://' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  if (times.length >= 5) return NextResponse.json({ error: 'Thanks! You’ve sent several suggestions already. Please try again later.' }, { status: 429 });
  recent.set(ip, [...times, now]);

  const title = str(body.title, 300);
  const why = str(body.why, 2000);
  const name = str(body.name, 100);
  // Neutralise @mentions and markdown images so the issue body can't ping people or load trackers.
  const safe = (s: string) => s.replace(/@/g, '@​').replace(/!\[/g, '[');

  const issue = {
    title: `Suggestion: ${safe(title || url).slice(0, 200)}`,
    labels: ['suggestion'],
    body: [
      `**Link:** ${safe(url)}`,
      title && `**Title:** ${safe(title)}`,
      why && `**Why it belongs:**\n\n${safe(why)}`,
      name && `**Suggested by:** ${safe(name)}`,
      '',
      '_Sent from the Suggest a Resource form. To add it, create a file in `content/library/` (see the README)._',
    ]
      .filter(Boolean)
      .join('\n\n'),
  };

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'open-sun' },
    body: JSON.stringify(issue),
  });
  if (!res.ok) {
    console.error('GitHub issue failed', res.status, await res.text());
    return NextResponse.json({ error: 'We couldn’t add your suggestion to the review list just now. Please try again in a few minutes.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

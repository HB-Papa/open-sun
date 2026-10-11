import { getAllItems } from '@/lib/content';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const items = getAllItems().slice(0, 50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(SITE.name)}: new arrivals</title>
<link>${SITE.url}/new</link>
<atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
<description>${esc(SITE.description)}</description>
<language>en</language>
${items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${SITE.url}/library/${i.slug}</link>
<guid isPermaLink="true">${SITE.url}/library/${i.slug}</guid>
<pubDate>${new Date(`${i.dateAdded}T12:00:00Z`).toUTCString()}</pubDate>
<description>${esc(`${i.authors.join(', ')} (${i.year}). ${i.summary}`)}</description>
</item>`,
  )
  .join('\n')}
</channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

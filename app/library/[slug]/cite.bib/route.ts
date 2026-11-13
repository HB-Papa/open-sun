// /library/<slug>/cite.bib: the item as a BibTeX entry, for LaTeX and reference managers.
// Built once per item at build time, like the item pages.
import { getAllItems, getItem } from '@/lib/content';
import { toBibtex } from '@/lib/exports';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getAllItems().map((i) => ({ slug: i.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) return new Response('Not found', { status: 404 });
  return new Response(toBibtex(item), {
    headers: {
      'Content-Type': 'application/x-bibtex; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.bib"`,
    },
  });
}

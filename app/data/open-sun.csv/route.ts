// /data/open-sun.csv: every published item as one CSV file (UTF-8, CRLF, header row).
// A downloadable dataset built at build time. The columns are listed in docs/metadata/application-profile.md.
import { getAllItems } from '@/lib/content';
import { toCsv } from '@/lib/exports';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
  return new Response(toCsv(getAllItems(), SITE.url), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8; header=present',
      'Content-Disposition': 'attachment; filename="open-sun.csv"',
    },
  });
}

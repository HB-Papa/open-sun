// /data/open-sun-marc.xml: every published item as a MARC 21 bibliographic record, in one MARCXML file.
// A downloadable dataset built at build time, not an OAI-PMH service. The crosswalk is in
// docs/metadata/application-profile.md under "Data and exports".
import { getAllItems } from '@/lib/content';
import { toMarcXml } from '@/lib/marc';
import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
  return new Response(toMarcXml(getAllItems(), SITE.url), {
    headers: {
      'Content-Type': 'application/marcxml+xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="open-sun-marc.xml"',
    },
  });
}

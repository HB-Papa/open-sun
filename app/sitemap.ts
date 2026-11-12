import type { MetadataRoute } from 'next';
import { getAllItems, getGuides, getPathways, getPolicies } from '@/lib/content';
import { SITE } from '@/lib/site';

// Every public page, for search engines. Whether crawlers may visit at all is decided in app/robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/+$/, '');
  const page = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    ...(lastModified && /^\d{4}-\d{2}-\d{2}$/.test(lastModified) ? { lastModified } : {}),
  });
  return [
    ...['', '/library', '/pathways', '/field-guide', '/new', '/about', '/suggest', '/microgrid', '/guides', '/policies'].map((p) => page(p)),
    ...getAllItems().map((i) => page(`/library/${i.slug}`, i.dateAdded)),
    ...getPathways().map((p) => page(`/pathways/${p.slug}`)),
    ...getGuides().map((g) => page(`/guides/${g.slug}`, g.lastReviewed)),
    ...getPolicies().map((p) => page(`/policies/${p.slug}`, p.lastReviewed)),
  ];
}

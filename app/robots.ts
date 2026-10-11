import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// Until launch (SITE_PUBLIC=true), ask every crawler to stay away.
export default function robots(): MetadataRoute.Robots {
  if (!SITE.public) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: ['/dev/', '/api/'] } };
}

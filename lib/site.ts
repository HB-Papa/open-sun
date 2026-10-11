export const SITE = {
  name: 'Open Sun',
  description:
    'A free library of open access writing on solarpunk, solar power, living land, and the commons, with a daily Microgrid puzzle.',
  // Set NEXT_PUBLIC_SITE_URL in Vercel once you know your address (e.g. https://open-sun.vercel.app).
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  // Search engines are asked to stay away until launch. To launch, set
  // SITE_PUBLIC=true in Vercel and turn off Deployment Protection (see README).
  public: process.env.SITE_PUBLIC === 'true',
};

export const NAV = [
  { href: '/', label: 'Today' },
  { href: '/library', label: 'Library' },
  { href: '/pathways', label: 'Pathways' },
  { href: '/play', label: 'Play' },
  { href: '/field-guide', label: 'Field Guide' },
  { href: '/about', label: 'About' },
];

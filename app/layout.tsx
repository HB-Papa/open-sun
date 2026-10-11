import type { Metadata, Viewport } from 'next';
import { Fraunces, Atkinson_Hyperlegible } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SITE } from '@/lib/site';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-fraunces', display: 'swap' });
const atkinson = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-atkinson', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: a free solarpunk library`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  alternates: { types: { 'application/rss+xml': [{ url: '/rss.xml', title: `${SITE.name}: new arrivals` }] } },
  openGraph: { siteName: SITE.name, type: 'website' },
  robots: SITE.public ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffdf7' },
    { media: '(prefers-color-scheme: dark)', color: '#142219' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${atkinson.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <div className="flex-1">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Library Markdown files are read at build time from content/.
  outputFileTracingIncludes: {
    '/**': ['./content/**/*'],
  },
  // Coding agents get nudged when a Next.js security upgrade is available.
  experimental: {
    agentUpgrade: 'security',
  },
  // The game moved from /play to /microgrid; old and shared links still land on it.
  async redirects() {
    return [{ source: '/play', destination: '/microgrid', permanent: true }];
  },
};

export default nextConfig;

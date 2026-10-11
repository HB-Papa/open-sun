import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Library Markdown files are read at build time from content/.
  outputFileTracingIncludes: {
    '/**': ['./content/**/*'],
  },
};

export default nextConfig;

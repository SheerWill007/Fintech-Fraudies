const API = process.env.API_URL ?? 'http://127.0.0.1:8000';
const isDev = process.env.NODE_ENV !== 'production';

// Dev: proxy /api, /docs and /openapi.json to the local FastAPI server (no CORS setup needed).
// Production (Vercel): the browser calls NEXT_PUBLIC_API_URL (the Render backend) directly — see lib/api.ts.
/** @type {import('next').NextConfig} */
const config = isDev
  ? {
      async rewrites() {
        return [
          { source: '/api/:path*', destination: `${API}/api/:path*` },
          { source: '/docs', destination: `${API}/docs` },
          { source: '/openapi.json', destination: `${API}/openapi.json` },
        ];
      },
    }
  : {};

export default config;

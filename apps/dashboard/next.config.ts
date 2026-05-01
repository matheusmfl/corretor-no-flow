import type { NextConfig } from "next";

function normalizeBaseUrl(value: string | undefined) {
  return (value ?? '').trim().replace(/\/+$/, '')
}

function parseAllowedDevOrigins(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

const allowedDevOrigins = [
  '*.trycloudflare.com',
  ...parseAllowedDevOrigins(process.env.NEXT_ALLOWED_DEV_ORIGINS),
]

const nextConfig: NextConfig = {
  allowedDevOrigins,

  async rewrites() {
    const apiUrl = normalizeBaseUrl(process.env.API_INTERNAL_URL) || 'http://127.0.0.1:3001'

    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ],
    }
  },
};

export default nextConfig;

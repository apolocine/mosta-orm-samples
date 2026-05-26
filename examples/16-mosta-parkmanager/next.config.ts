import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  serverExternalPackages: [
    '@mostajs/orm',
    '@mostajs/data-plug',
    'oracledb',
    'better-sqlite3',
    'mongoose',
    'mysql2',
    'mariadb',
    'pg',
    'mssql',
    'ibm_db',
    '@sap/hana-client',
    '@google-cloud/spanner',
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:4567', '192.168.1.3:4567'],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig

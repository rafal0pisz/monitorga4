/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // alertga4.bettersteps.pl is the current production domain; the old
    // monitor.bettersteps.pl is kept alongside it in case anything still
    // resolves there during the migration.
    serverActions: { allowedOrigins: ['alertga4.bettersteps.pl', 'monitor.bettersteps.pl', 'localhost:3000'] }
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16.4+ auto-writes an AGENTS.md at the repo root on every dev/build
  // run — not something we want tracked or regenerated unexpectedly.
  agentRules: false,
  experimental: {
    // alertga4.pl is the current production domain; the previous domains
    // are kept alongside it in case anything still resolves there during
    // the migration.
    serverActions: { allowedOrigins: ['alertga4.pl', 'alertga4.bettersteps.pl', 'monitor.bettersteps.pl', 'localhost:3000'] }
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

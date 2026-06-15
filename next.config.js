/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['monitor.bettersteps.pl', 'localhost:3000'] }
  },
  serverExternalPackages: ['@supabase/supabase-js'],
}

module.exports = nextConfig

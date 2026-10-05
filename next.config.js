/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // mysql2 harus jalan sebagai package Node biasa (jangan di-bundle)
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'bcryptjs'],
  },
};

module.exports = nextConfig;

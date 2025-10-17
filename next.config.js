/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  outputFileTracingRoot: process.cwd()
}

module.exports = nextConfig

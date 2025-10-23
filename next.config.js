/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'soap'],
  outputFileTracingRoot: process.cwd()
}

module.exports = nextConfig

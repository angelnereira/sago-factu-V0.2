/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'soap'],
  outputFileTracingRoot: process.cwd(),
  eslint: {
    // Permitir warnings pero no ignorar errores
    ignoreDuringBuilds: false,
    // Solo fallar en errores, no en warnings
    dirs: ['app', 'components', 'lib'],
  },
  typescript: {
    // No ignorar errores de TypeScript
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'soap'],
  outputFileTracingRoot: process.cwd(),
  eslint: {
    // ⚠️ TEMPORAL: Ignorar errores de ESLint durante builds
    // Esto permite deployar mientras limpiamos el código gradualmente
    // El linting sigue disponible con: npm run lint
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib'],
  },
  typescript: {
    // No ignorar errores de TypeScript (estos sí son críticos)
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig

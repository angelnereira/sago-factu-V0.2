import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed simple de la base de datos...')

  // Crear organización de ejemplo
  const organization = await prisma.organization.upsert({
    where: { ruc: '123456789-1' },
    update: {},
    create: {
      slug: 'empresa-demo',
      name: 'Empresa Demo S.A.',
      ruc: '123456789-1',
      dv: '1',
      email: 'demo@empresa.com',
      phone: '+507 1234-5678',
      address: 'Panamá, Panamá',
      hkaEnabled: true,
      maxUsers: 10,
      maxFolios: 1000,
      isActive: true,
      metadata: JSON.stringify({
        theme: 'light',
        timezone: 'America/Panama',
        currency: 'PAB',
        language: 'es'
      })
    },
  })

  console.log('✅ Organización creada:', organization.name)

  // Crear Super Admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@sagofactu.com'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123'
  
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      name: 'Super Admin',
      password: await bcrypt.hash(superAdminPassword, 12),
      role: 'SUPER_ADMIN',
      isActive: true,
      organizationId: organization.id,
    },
  })

  console.log('✅ Super Admin creado:', superAdmin.email)
  console.log('🔑 Contraseña:', superAdminPassword)

  // Crear usuario de prueba
  const testUser = await prisma.user.upsert({
    where: { email: 'usuario@empresa.com' },
    update: {},
    create: {
      email: 'usuario@empresa.com',
      name: 'Usuario Demo',
      password: await bcrypt.hash('usuario123', 12),
      role: 'USER',
      organizationId: organization.id,
      isActive: true,
    },
  })

  console.log('✅ Usuario de prueba creado:', testUser.email)

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

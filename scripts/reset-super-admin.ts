/**
 * Script para resetear la contraseña del Super Admin
 * 
 * USO:
 *   npx tsx scripts/reset-super-admin.ts
 *   npx tsx scripts/reset-super-admin.ts <nueva-contraseña>
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetSuperAdmin() {
  try {
    console.log('🔐 Reseteando contraseña del Super Admin...\n')

    // Obtener contraseña de argumentos o usar la del .env
    const newPassword = process.argv[2] || process.env.SUPER_ADMIN_PASSWORD || 'Admin123!'
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@sagofactu.com'

    // Buscar Super Admin
    const superAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN',
        email: email,
      },
    })

    if (!superAdmin) {
      console.log('❌ No se encontró Super Admin con email:', email)
      console.log('📋 Creando nuevo Super Admin...\n')

      // Crear organización si no existe
      let organization = await prisma.organization.findFirst()
      
      if (!organization) {
        organization = await prisma.organization.create({
          data: {
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
          },
        })
        console.log('✅ Organización creada:', organization.name)
      }

      // Crear Super Admin
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      const newSuperAdmin = await prisma.user.create({
        data: {
          email: email,
          name: 'Super Admin',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          organizationId: organization.id,
        },
      })

      console.log('✅ Super Admin creado exitosamente!')
      console.log('\n📋 Credenciales:')
      console.log('   Email:', newSuperAdmin.email)
      console.log('   Contraseña:', newPassword)
      console.log('\n🔐 Hash almacenado:', hashedPassword.substring(0, 20) + '...')
    } else {
      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      
      await prisma.user.update({
        where: { id: superAdmin.id },
        data: {
          password: hashedPassword,
          isActive: true,
        },
      })

      console.log('✅ Contraseña reseteada exitosamente!')
      console.log('\n📋 Credenciales:')
      console.log('   Email:', superAdmin.email)
      console.log('   Contraseña:', newPassword)
      console.log('\n🔐 Hash almacenado:', hashedPassword.substring(0, 20) + '...')
    }

    // Verificar que el hash es correcto
    const updatedUser = await prisma.user.findUnique({
      where: { email: email },
    })

    if (updatedUser && updatedUser.password) {
      const isValid = await bcrypt.compare(newPassword, updatedUser.password)
      console.log('\n✅ Verificación de hash:', isValid ? 'CORRECTO ✓' : 'INCORRECTO ✗')
      
      if (!isValid) {
        console.log('⚠️  ADVERTENCIA: El hash no coincide con la contraseña!')
      }
    }

    console.log('\n🔗 Puedes iniciar sesión en:')
    console.log('   http://localhost:3000/auth/signin')

  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetSuperAdmin()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })


/**
 * Script para resetear contraseña del Super Admin EN VERCEL/NEON
 * 
 * Este script se puede ejecutar como API route en Vercel o localmente
 * apuntando a la BD de producción en Neon.
 * 
 * USO LOCAL (apuntando a Neon):
 *   npx tsx scripts/reset-password-vercel.ts
 * 
 * USO EN VERCEL:
 *   Crear un endpoint temporal en /api/admin/reset-password
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPasswordInProduction() {
  try {
    console.log('🔐 RESETEAR CONTRASEÑA EN PRODUCCIÓN (NEON)')
    console.log('═'.repeat(60))
    
    // IMPORTANTE: Usar una contraseña FUERTE en producción
    const email = 'admin@sagofactu.com'
    const newPassword = 'SagoAdmin2025!'  // Cambia esto por una contraseña segura
    
    console.log('📧 Email:', email)
    console.log('🔑 Nueva contraseña:', newPassword)
    console.log('\n⚠️  IMPORTANTE: Esta es la contraseña para PRODUCCIÓN en Vercel')
    console.log('═'.repeat(60))

    // Buscar Super Admin
    const superAdmin = await prisma.user.findFirst({
      where: {
        email: email,
        role: 'SUPER_ADMIN',
      },
    })

    if (!superAdmin) {
      console.log('\n❌ Super Admin no encontrado')
      console.log('\n📋 Usuarios disponibles:')
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          role: true,
          isActive: true,
        },
        take: 10,
      })
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.role}) ${u.isActive ? '✓' : '✗'}`)
      })
      process.exit(1)
    }

    console.log('\n✅ Super Admin encontrado')
    console.log('   ID:', superAdmin.id)
    console.log('   Email:', superAdmin.email)
    console.log('   Rol:', superAdmin.role)

    // Hash de la nueva contraseña
    console.log('\n🔨 Generando hash de la contraseña...')
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    console.log('✅ Hash generado:', hashedPassword.substring(0, 30) + '...')

    // Actualizar en la base de datos
    console.log('\n💾 Actualizando en base de datos...')
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: {
        password: hashedPassword,
        isActive: true, // Asegurarse de que esté activo
      },
    })

    console.log('✅ Contraseña actualizada en la base de datos')

    // Verificar que funcionó
    console.log('\n🧪 Verificando hash...')
    const updatedUser = await prisma.user.findUnique({
      where: { id: superAdmin.id },
    })

    if (updatedUser && updatedUser.password) {
      const isValid = await bcrypt.compare(newPassword, updatedUser.password)
      console.log('✅ Verificación:', isValid ? 'CORRECTA ✓' : 'INCORRECTA ✗')
      
      if (!isValid) {
        console.log('\n❌ ERROR: El hash no coincide!')
        process.exit(1)
      }
    }

    console.log('\n' + '═'.repeat(60))
    console.log('🎉 CONTRASEÑA RESETEADA EXITOSAMENTE')
    console.log('═'.repeat(60))
    console.log('\n📋 CREDENCIALES PARA VERCEL:')
    console.log('   Email:', email)
    console.log('   Contraseña:', newPassword)
    console.log('\n🔗 URL de Vercel:')
    console.log('   https://tu-app.vercel.app/auth/signin')
    console.log('\n⚠️  GUARDA ESTAS CREDENCIALES EN UN LUGAR SEGURO')
    console.log('═'.repeat(60))

  } catch (error) {
    console.error('\n❌ ERROR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetPasswordInProduction()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })


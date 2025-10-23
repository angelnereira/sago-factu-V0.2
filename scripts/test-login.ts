/**
 * Script para probar el flujo completo de login
 * Simula exactamente lo que hace NextAuth
 */

import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  try {
    const email = process.argv[2] || 'admin@sagofactu.com'
    const password = process.argv[3] || 'Admin123!'

    console.log('🧪 SIMULACIÓN DE LOGIN COMPLETA\n')
    console.log('═'.repeat(60))
    console.log('📧 Email:', email)
    console.log('🔑 Password:', '*'.repeat(password.length))
    console.log('═'.repeat(60))

    // PASO 1: Buscar usuario
    console.log('\n📋 PASO 1: Buscar usuario en base de datos...')
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    })

    if (!user) {
      console.log('❌ FALLO: Usuario no encontrado')
      console.log('\n📋 Usuarios disponibles:')
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true },
      })
      allUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`))
      process.exit(1)
    }

    console.log('✅ Usuario encontrado')
    console.log('   ID:', user.id)
    console.log('   Nombre:', user.name)
    console.log('   Email:', user.email)
    console.log('   Rol:', user.role)
    console.log('   Activo:', user.isActive)
    console.log('   Org:', user.organization?.name || 'N/A')

    // PASO 2: Verificar que tiene password
    console.log('\n📋 PASO 2: Verificar password hash...')
    
    if (!user.password) {
      console.log('❌ FALLO: Usuario no tiene password configurado')
      process.exit(1)
    }

    console.log('✅ Password hash existe')
    console.log('   Hash (primeros 30 chars):', user.password.substring(0, 30) + '...')
    console.log('   Longitud del hash:', user.password.length)
    console.log('   Empieza con $2b$12$:', user.password.startsWith('$2b$12$') ? 'Sí ✓' : 'No ✗')

    // PASO 3: Comparar passwords
    console.log('\n📋 PASO 3: Comparar password con bcryptjs...')
    console.log('   Password ingresado:', password)
    console.log('   Longitud:', password.length)
    console.log('   Caracteres:', password.split('').map(c => c.charCodeAt(0)).join(','))
    
    const startTime = Date.now()
    const passwordsMatch = await compare(password, user.password)
    const compareTime = Date.now() - startTime
    
    console.log('   Tiempo de comparación:', compareTime, 'ms')
    console.log('   Resultado:', passwordsMatch ? '✅ COINCIDE' : '❌ NO COINCIDE')

    if (!passwordsMatch) {
      console.log('\n⚠️  FALLO EN COMPARACIÓN DE PASSWORD')
      console.log('\n🔧 Posibles causas:')
      console.log('   1. Password incorrecta')
      console.log('   2. Hash corrupto')
      console.log('   3. Problema con bcryptjs')
      console.log('\n💡 Solución: Ejecuta npm run admin:reset Admin123!')
      process.exit(1)
    }

    // PASO 4: Verificar que está activo
    console.log('\n📋 PASO 4: Verificar que el usuario está activo...')
    
    if (!user.isActive) {
      console.log('❌ FALLO: Usuario inactivo')
      process.exit(1)
    }

    console.log('✅ Usuario activo')

    // PASO 5: Simular respuesta de NextAuth
    console.log('\n📋 PASO 5: Generar datos de sesión (como NextAuth)...')
    
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    }

    console.log('✅ Datos de sesión generados:')
    console.log(JSON.stringify(sessionData, null, 2))

    // RESUMEN FINAL
    console.log('\n' + '═'.repeat(60))
    console.log('✅ LOGIN EXITOSO - TODOS LOS PASOS PASARON')
    console.log('═'.repeat(60))
    console.log('\n🎯 CONCLUSIÓN: El login debería funcionar en la aplicación')
    console.log('\n📝 Si aún falla en la app:')
    console.log('   1. Verificar logs de NextAuth en la consola del servidor')
    console.log('   2. Verificar variables de entorno (NEXTAUTH_SECRET)')
    console.log('   3. Limpiar cookies del navegador')
    console.log('   4. Verificar que no hay errores de CORS')

  } catch (error) {
    console.error('\n❌ ERROR INESPERADO:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()


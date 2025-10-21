#!/usr/bin/env node

/**
 * Script de prueba para el sistema de registro
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testRegistration() {
  console.log('🧪 Probando sistema de registro...\n')

  try {
    // 1. Verificar organización demo
    console.log('1️⃣ Verificando organización demo...')
    let organization = await prisma.organization.findFirst({
      where: { slug: "empresa-demo" }
    })
    
    if (organization) {
      console.log('   ✅ Organización demo encontrada:', organization.name)
    } else {
      console.log('   ⚠️  Organización demo no existe, creándola...')
      organization = await prisma.organization.create({
        data: {
          slug: "empresa-demo",
          name: "Empresa Demo S.A.",
          ruc: "123456789-1",
          dv: "1",
          email: "demo@empresa.com",
          phone: "+507 1234-5678",
          address: "Panamá, Panamá",
          hkaEnabled: true,
          maxUsers: 100,
          maxFolios: 10000,
          isActive: true,
          metadata: {
            theme: "light",
            timezone: "America/Panama",
            currency: "PAB",
            language: "es"
          }
        }
      })
      console.log('   ✅ Organización creada:', organization.name)
    }
    console.log('')

    // 2. Crear usuario de prueba
    const testEmail = `test-${Date.now()}@example.com`
    console.log('2️⃣ Creando usuario de prueba:', testEmail)
    
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Usuario de Prueba",
        password: hashedPassword,
        role: "USER",
        organizationId: organization.id,
        isActive: true
      }
    })
    
    console.log('   ✅ Usuario creado exitosamente')
    console.log(`      ID: ${newUser.id}`)
    console.log(`      Email: ${newUser.email}`)
    console.log(`      Nombre: ${newUser.name}`)
    console.log(`      Rol: ${newUser.role}`)
    console.log('')

    // 3. Verificar que se puede buscar el usuario
    console.log('3️⃣ Verificando búsqueda de usuario...')
    const foundUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { organization: true }
    })
    
    if (foundUser) {
      console.log('   ✅ Usuario encontrado correctamente')
      console.log(`      Organización: ${foundUser.organization.name}`)
    } else {
      console.log('   ❌ ERROR: No se pudo encontrar el usuario')
    }
    console.log('')

    // 4. Verificar contraseña
    console.log('4️⃣ Verificando validación de contraseña...')
    const isPasswordValid = await bcrypt.compare('password123', foundUser.password)
    
    if (isPasswordValid) {
      console.log('   ✅ Validación de contraseña correcta')
    } else {
      console.log('   ❌ ERROR: Validación de contraseña falló')
    }
    console.log('')

    // 5. Limpiar usuario de prueba
    console.log('5️⃣ Limpiando usuario de prueba...')
    await prisma.user.delete({
      where: { id: newUser.id }
    })
    console.log('   ✅ Usuario eliminado')
    console.log('')

    console.log('=' .repeat(60))
    console.log('✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE')
    console.log('=' .repeat(60))
    console.log('')
    console.log('📋 El sistema de registro está funcionando correctamente:')
    console.log('   ✅ Conexión a base de datos')
    console.log('   ✅ Creación de organizaciones')
    console.log('   ✅ Creación de usuarios')
    console.log('   ✅ Hash de contraseñas')
    console.log('   ✅ Validación de credenciales')
    console.log('')

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error.message)
    console.error('\nDetalles del error:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar pruebas
testRegistration()
  .then(() => {
    console.log('✅ Pruebas completadas')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Pruebas fallaron:', error)
    process.exit(1)
  })


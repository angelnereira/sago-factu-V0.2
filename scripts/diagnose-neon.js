#!/usr/bin/env node

/**
 * Script de diagnóstico para Neon PostgreSQL
 * Verifica el estado de la base de datos en producción
 */

const { PrismaClient } = require('@prisma/client')

// Usar DATABASE_URL del ambiente (.env)
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está configurada en .env')
  console.error('   Por favor, configura DATABASE_URL en tu archivo .env')
  process.exit(1)
}

async function diagnose() {
  console.log('🔍 Iniciando diagnóstico de Neon PostgreSQL...\n')

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL
      }
    },
    log: ['error', 'warn']
  })

  try {
    // 1. Probar conexión
    console.log('1️⃣ Probando conexión a la base de datos...')
    await prisma.$connect()
    console.log('   ✅ Conexión exitosa\n')

    // 2. Verificar tablas
    console.log('2️⃣ Verificando tablas existentes...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    
    if (tables.length === 0) {
      console.log('   ❌ No hay tablas en la base de datos')
      console.log('   ⚠️  Necesitas ejecutar: npx prisma db push\n')
    } else {
      console.log(`   ✅ Tablas encontradas: ${tables.length}`)
      tables.forEach(t => console.log(`      - ${t.table_name}`))
      console.log('')
    }

    // 3. Verificar organizaciones
    console.log('3️⃣ Verificando organizaciones...')
    const orgCount = await prisma.organization.count()
    console.log(`   📊 Total organizaciones: ${orgCount}`)
    
    if (orgCount > 0) {
      const orgs = await prisma.organization.findMany({
        select: { id: true, slug: true, name: true, isActive: true }
      })
      orgs.forEach(org => {
        console.log(`      - ${org.name} (${org.slug}) - ${org.isActive ? '✅ Activa' : '❌ Inactiva'}`)
      })
    } else {
      console.log('   ⚠️  No hay organizaciones creadas')
    }
    console.log('')

    // 4. Verificar usuarios
    console.log('4️⃣ Verificando usuarios...')
    const userCount = await prisma.user.count()
    console.log(`   📊 Total usuarios: ${userCount}`)
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { 
          id: true, 
          email: true, 
          name: true, 
          role: true, 
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      console.log('   📋 Últimos 10 usuarios:')
      users.forEach(user => {
        console.log(`      - ${user.email} (${user.name}) - Rol: ${user.role} - ${user.isActive ? '✅' : '❌'}`)
      })
    } else {
      console.log('   ⚠️  No hay usuarios creados')
      console.log('   💡 Ejecuta el seed: npm run db:seed')
    }
    console.log('')

    // 5. Verificar Super Admin
    console.log('5️⃣ Verificando Super Admin...')
    const superAdmin = await prisma.user.findFirst({
      where: { 
        email: 'admin@sagofactu.com'
      }
    })
    
    if (superAdmin) {
      console.log('   ✅ Super Admin encontrado')
      console.log(`      Email: ${superAdmin.email}`)
      console.log(`      Nombre: ${superAdmin.name}`)
      console.log(`      Rol: ${superAdmin.role}`)
      console.log(`      Activo: ${superAdmin.isActive ? '✅ Sí' : '❌ No'}`)
    } else {
      console.log('   ❌ Super Admin NO encontrado')
      console.log('   💡 Ejecuta el seed para crearlo')
    }
    console.log('')

    // 6. Resumen
    console.log('=' .repeat(60))
    console.log('📊 RESUMEN:')
    console.log('=' .repeat(60))
    console.log(`Conexión: ✅ OK`)
    console.log(`Tablas: ${tables.length > 0 ? '✅ Sí' : '❌ No'}`)
    console.log(`Organizaciones: ${orgCount}`)
    console.log(`Usuarios: ${userCount}`)
    console.log(`Super Admin: ${superAdmin ? '✅ Sí' : '❌ No'}`)
    console.log('')

    if (tables.length === 0) {
      console.log('🚨 ACCIÓN REQUERIDA:')
      console.log('   1. Ejecuta: npx prisma db push')
      console.log('   2. Ejecuta: npm run db:seed')
      console.log('')
    } else if (userCount === 0) {
      console.log('⚠️  ACCIÓN RECOMENDADA:')
      console.log('   Ejecuta: npm run db:seed')
      console.log('')
    } else {
      console.log('✅ Todo parece estar en orden!')
      console.log('')
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    
    if (error.code === 'P1001') {
      console.error('\n🚨 No se puede conectar a la base de datos')
      console.error('   Verifica:')
      console.error('   1. DATABASE_URL está correctamente configurada')
      console.error('   2. Tu IP está permitida en Neon')
      console.error('   3. Las credenciales son correctas')
    } else if (error.code === 'P2021') {
      console.error('\n🚨 La tabla no existe')
      console.error('   Ejecuta: npx prisma db push')
    }
    
    console.error('\nError completo:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar diagnóstico
diagnose()
  .then(() => {
    console.log('✅ Diagnóstico completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Diagnóstico falló:', error)
    process.exit(1)
  })


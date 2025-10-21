/**
 * Test de registro directo
 * Para diagnosticar el error exacto
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada')
  process.exit(1)
}

// Usar PrismaClient básico SIN extensiones
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
})

async function testRegistration() {
  console.log('🧪 Probando registro de usuario...\n')

  try {
    // 1. Verificar organización
    console.log('1️⃣  Buscando organización demo...')
    let organization = await prisma.organization.findFirst({
      where: { slug: 'empresa-demo' }
    })

    if (!organization) {
      console.log('   ⚠️  No existe, creando...')
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
          maxUsers: 100,
          maxFolios: 10000,
          isActive: true,
          metadata: {
            theme: 'light',
            timezone: 'America/Panama',
            currency: 'PAB',
            language: 'es'
          }
        }
      })
      console.log('   ✅ Organización creada')
    } else {
      console.log('   ✅ Organización encontrada:', organization.id)
    }

    // 2. Verificar si el usuario ya existe
    const testEmail = `test-${Date.now()}@ejemplo.com`
    console.log(`\n2️⃣  Creando usuario: ${testEmail}`)
    
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })

    if (existingUser) {
      console.log('   ⚠️  Usuario ya existe')
      return
    }

    // 3. Crear usuario
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Usuario de Prueba',
        password: hashedPassword,
        role: 'USER',
        organizationId: organization.id,
        isActive: true
      }
    })

    console.log('   ✅ Usuario creado exitosamente!')
    console.log('   ID:', newUser.id)
    console.log('   Email:', newUser.email)
    console.log('   Organización:', newUser.organizationId)

    // 4. Verificar que se creó correctamente
    const verifyUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        organization: {
          select: { name: true, slug: true }
        }
      }
    })

    console.log('\n3️⃣  Verificación:')
    console.log('   ✅ Usuario encontrado en BD')
    console.log('   ✅ Organización:', verifyUser.organization.name)

    // 5. Verificar password
    const passwordMatch = await bcrypt.compare('password123', verifyUser.password)
    console.log('   ✅ Password hash correcto:', passwordMatch)

    console.log('\n✅ ===========================')
    console.log('   REGISTRO FUNCIONAL')
    console.log('   ===========================\n')

  } catch (error) {
    console.error('\n❌ ERROR EN REGISTRO:')
    console.error('Tipo:', error.constructor.name)
    console.error('Mensaje:', error.message)
    if (error.code) console.error('Código:', error.code)
    if (error.meta) console.error('Meta:', JSON.stringify(error.meta, null, 2))
    console.error('\nStack completo:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testRegistration()


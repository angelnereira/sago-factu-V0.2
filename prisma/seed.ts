import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

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
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || '72bb9e47a5373f74cb1e31b065aaec45'
  
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

  // Crear pool de folios
  const folioPool = await prisma.folioPool.upsert({
    where: { batchNumber: 'BATCH-001' },
    update: {},
    create: {
      batchNumber: 'BATCH-001',
      provider: 'HKA',
      totalFolios: 1000,
      availableFolios: 1000,
      assignedFolios: 0,
      consumedFolios: 0,
      purchaseAmount: 1000.00,
      hkaInvoiceNumber: 'HKA-INV-001',
      folioStart: 'FOL-000001',
      folioEnd: 'FOL-001000',
      isActive: true,
      metadata: JSON.stringify({
        purchaseDate: new Date().toISOString(),
        provider: 'HKA'
      })
    }
  })

  console.log('✅ Pool de folios creado:', folioPool.batchNumber)

  // Asignar folios a la organización
  const folioAssignment = await prisma.folioAssignment.upsert({
    where: { 
      folioPoolId_organizationId: {
        folioPoolId: folioPool.id,
        organizationId: organization.id
      }
    },
    update: {},
    create: {
      folioPoolId: folioPool.id,
      organizationId: organization.id,
      assignedAmount: 100,
      consumedAmount: 0,
      alertThreshold: 10,
      assignedBy: superAdmin.id,
      notes: 'Asignación inicial de folios para demo'
    }
  })

  console.log('✅ Asignación de folios creada:', folioAssignment.id)

  // Crear algunas facturas de ejemplo
  for (let i = 1; i <= 5; i++) {
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: organization.id,
        createdBy: testUser.id,
        clientReferenceId: `REF-${String(i).padStart(4, '0')}`,
        issuerRuc: organization.ruc || "000000000000",
        issuerDv: organization.dv || "00",
        issuerName: organization.name,
        issuerAddress: organization.address || "N/A",
        issuerEmail: organization.email || "no-email@example.com",
        issuerPhone: organization.phone || "N/A",
        receiverType: 'CONTRIBUTOR',
        receiverRuc: `12345678-${i}`,
        receiverDv: String(i),
        receiverName: `Cliente ${i}`,
        receiverEmail: `cliente${i}@email.com`,
        receiverPhone: `+507 1234-${String(i).padStart(4, '0')}`,
        receiverAddress: `Dirección Cliente ${i}`,
        documentType: 'FACTURA',
        subtotal: 100.00,
        discount: 0,
        subtotalAfterDiscount: 100.00,
        itbms: 7.00,
        total: 107.00,
        currency: 'PAB',
        status: 'DRAFT',
        notes: `Factura de prueba ${i}`,
        internalNotes: `Notas internas para factura ${i}`
      }
    })

    // Crear items para la factura
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        lineNumber: 1,
        code: `PROD-${String(i).padStart(3, '0')}`,
        description: `Producto/Servicio ${i}`,
        quantity: 1,
        unitPrice: 100.00,
        unit: 'UND',
        discount: 0,
        discountRate: 0,
        taxRate: 7,
        taxCode: '01',
        taxAmount: 7.00,
        subtotal: 100.00,
        total: 107.00
      }
    })

    // Crear log inicial
    await prisma.invoiceLog.create({
      data: {
        invoiceId: invoice.id,
        action: 'CREATED',
        message: `Factura ${i} creada por usuario demo`,
        userId: testUser.id,
        userEmail: testUser.email
      }
    })
  }

  console.log('✅ 5 facturas de ejemplo creadas con items y logs')

  // Crear notificaciones de ejemplo
  await prisma.notification.createMany({
    data: [
      {
        userId: superAdmin.id,
        type: 'SYSTEM_ALERT',
        title: 'Bienvenido a SAGO-FACTU',
        message: 'Sistema configurado exitosamente. Puedes comenzar a crear facturas.',
        link: '/dashboard'
      },
      {
        userId: testUser.id,
        type: 'FOLIOS_ASSIGNED',
        title: 'Folios Asignados',
        message: 'Se han asignado 100 folios a tu organización.',
        link: '/dashboard/folios'
      }
    ]
  })

  console.log('✅ Notificaciones de ejemplo creadas')

  // Crear configuración del sistema
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'app_name',
        value: 'SAGO-FACTU',
        description: 'Nombre de la aplicación'
      },
      {
        key: 'app_version',
        value: '1.0.0',
        description: 'Versión de la aplicación'
      },
      {
        key: 'hka_environment',
        value: process.env.HKA_ENV || 'demo',
        description: 'Entorno de HKA (demo/production)'
      },
      {
        key: 'email_notifications_enabled',
        value: (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true').toString(),
        description: 'Habilitar notificaciones por email'
      }
    ]
  })

  console.log('✅ Configuración del sistema creada')

  console.log('🎉 Seed completado exitosamente!')
  console.log('\n📋 Credenciales de acceso:')
  console.log(`Super Admin: ${superAdminEmail} / ${superAdminPassword}`)
  console.log('Usuario Demo: usuario@empresa.com / usuario123')
  console.log('\n🔗 URLs importantes:')
  console.log('- Dashboard: http://localhost:3000/dashboard')
  console.log('- Prisma Studio: npm run db:studio')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

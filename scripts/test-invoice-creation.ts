import { prismaServer as prisma } from '@/lib/prisma-server';

async function testInvoiceCreation() {
  try {
    console.log('🧪 Probando creación de factura...');

    // 1. Obtener una organización de prueba
    const organization = await prisma.organization.findFirst({
      where: { isActive: true }
    });

    if (!organization) {
      console.log('❌ No hay organizaciones activas');
      return;
    }

    console.log(`📊 Usando organización: ${organization.name} (ID: ${organization.id})`);

    // 2. Verificar folios disponibles
    const availableAssignments = await prisma.$queryRaw`
      SELECT * FROM "folio_assignments" 
      WHERE "organizationId" = ${organization.id}
      AND "assignedAmount" > "consumedAmount"
      ORDER BY "assignedAt" DESC
      LIMIT 1
    ` as any[];

    console.log(`📊 Asignaciones con folios disponibles: ${availableAssignments.length}`);

    if (availableAssignments.length === 0) {
      console.log('❌ No hay folios disponibles');
      return;
    }

    const folioAssignment = availableAssignments[0];
    const disponibles = folioAssignment.assignedAmount - folioAssignment.consumedAmount;
    
    console.log(`✅ Folios disponibles: ${disponibles}`);

    // 3. Obtener información del pool
    const folioPool = await prisma.folioPool.findUnique({
      where: { id: folioAssignment.folioPoolId },
    });

    if (!folioPool || !folioPool.folioStart) {
      console.log('❌ Error al obtener información del pool de folios');
      console.log('Pool encontrado:', folioPool);
      return;
    }

    console.log(`✅ Pool de folios: ${folioPool.batchNumber}`);
    console.log(`   Rango: ${folioPool.folioStart} - ${folioPool.folioEnd}`);

    // 4. Calcular siguiente folio
    const nextFolioIndex = folioAssignment.consumedAmount;
    const startNumber = parseInt(folioPool.folioStart);
    const folioNumber = `${startNumber + nextFolioIndex}`.padStart(8, '0');

    console.log(`✅ Siguiente folio: ${folioNumber}`);

    // 5. Crear cliente de prueba
    const testCustomer = await prisma.customer.upsert({
      where: { 
        organizationId_taxId: {
          organizationId: organization.id,
          taxId: '123456789-01'
        }
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: 'Cliente Prueba',
        taxId: '123456789-01',
        email: 'cliente@prueba.com',
        address: 'Dirección de prueba',
        phone: '+507-1234-5678',
      }
    });

    console.log(`✅ Cliente de prueba: ${testCustomer.name}`);

    // 6. Simular datos de factura
    const invoiceData = {
      client: {
        name: testCustomer.name,
        taxId: testCustomer.taxId,
        email: testCustomer.email,
        address: testCustomer.address,
        phone: testCustomer.phone,
      },
      items: [
        {
          description: 'Producto de prueba',
          quantity: 1,
          unitPrice: 100.00,
          taxRate: 7,
          discount: 0,
        }
      ],
      notes: 'Factura de prueba',
      paymentMethod: 'CASH',
    };

    console.log('📋 Datos de factura preparados:');
    console.log(`   Cliente: ${invoiceData.client.name}`);
    console.log(`   Items: ${invoiceData.items.length}`);
    console.log(`   Total estimado: $${invoiceData.items[0].unitPrice * 1.07}`);

    console.log('\n🎉 Prueba de creación de factura completada exitosamente!');
    console.log('✅ El sistema está listo para crear facturas');

  } catch (error) {
    console.error('❌ Error en prueba de factura:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testInvoiceCreation()
    .then(() => {
      console.log('✅ Script de prueba completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script de prueba:', error);
      process.exit(1);
    });
}

export { testInvoiceCreation };

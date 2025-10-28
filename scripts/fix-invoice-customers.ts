import { prismaServer as prisma } from '@/lib/prisma-server';

async function fixInvoiceCustomers() {
  try {
    console.log('🔧 Corrigiendo clientes de facturas...');

    // 1. Obtener todas las facturas con clientReferenceId problemático
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'DRAFT',
        clientReferenceId: {
          startsWith: 'CLIENT-'
        }
      },
      include: {
        organization: true
      }
    });

    console.log(`📊 Facturas con clientReferenceId problemático: ${invoices.length}`);

    for (const invoice of invoices) {
      console.log(`\n🔧 Corrigiendo factura: ${invoice.invoiceNumber || invoice.id}`);
      
      // Buscar un cliente real en la organización
      const customer = await prisma.customer.findFirst({
        where: { 
          organizationId: invoice.organizationId,
          isActive: true
        }
      });

      if (!customer) {
        console.log(`   ⚠️  No hay clientes en la organización ${invoice.organization.name}`);
        
        // Crear un cliente de prueba
        const testCustomer = await prisma.customer.create({
          data: {
            organizationId: invoice.organizationId,
            name: 'Cliente Prueba',
            ruc: '123456789',
            dv: '01',
            email: 'cliente@prueba.com',
            address: 'Dirección de prueba',
            phone: '+507-1234-5678',
            countryCode: 'PA',
            clientType: 'CONTRIBUTOR',
            rucType: 'NATURAL',
            isActive: true,
          }
        });

        console.log(`   ✅ Cliente de prueba creado: ${testCustomer.name}`);
        
        // Actualizar la factura
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            clientReferenceId: testCustomer.id,
            receiverRuc: testCustomer.ruc,
            receiverDv: testCustomer.dv,
            receiverName: testCustomer.name,
            receiverEmail: testCustomer.email,
            receiverAddress: testCustomer.address,
          }
        });

        console.log(`   ✅ Factura actualizada con cliente: ${testCustomer.name}`);
      } else {
        console.log(`   ✅ Cliente encontrado: ${customer.name}`);
        
        // Actualizar la factura
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            clientReferenceId: customer.id,
            receiverRuc: customer.ruc,
            receiverDv: customer.dv,
            receiverName: customer.name,
            receiverEmail: customer.email,
            receiverAddress: customer.address,
          }
        });

        console.log(`   ✅ Factura actualizada con cliente: ${customer.name}`);
      }
    }

    // 2. Verificar que todas las facturas DRAFT tienen clientes válidos
    const fixedInvoices = await prisma.invoice.findMany({
      where: { status: 'DRAFT' },
      include: {
        organization: true,
        customer: true
      }
    });

    console.log('\n📋 Estado final de facturas DRAFT:');
    fixedInvoices.forEach(invoice => {
      const hasValidCustomer = invoice.customer && invoice.clientReferenceId === invoice.customer.id;
      console.log(`   ${hasValidCustomer ? '✅' : '❌'} ${invoice.invoiceNumber || invoice.id}: ${hasValidCustomer ? invoice.customer.name : 'Sin cliente válido'}`);
    });

    console.log('\n🎉 Corrección de clientes completada exitosamente!');

  } catch (error) {
    console.error('❌ Error corrigiendo clientes:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixInvoiceCustomers()
    .then(() => {
      console.log('✅ Script de corrección completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script de corrección:', error);
      process.exit(1);
    });
}

export { fixInvoiceCustomers };

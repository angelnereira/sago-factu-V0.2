import { prismaServer as prisma } from '@/lib/prisma-server';
import { processInvoiceDirectly } from '@/lib/workers/invoice-processor';

async function testInvoiceProcessing() {
  try {
    console.log('🧪 Probando procesamiento de facturas...');

    // 1. Buscar una factura DRAFT para procesar
    const draftInvoice = await prisma.invoice.findFirst({
      where: { status: 'DRAFT' },
      include: {
        organization: true,
        items: true,
        user: true,
        customer: true,
      }
    });

    if (!draftInvoice) {
      console.log('❌ No hay facturas DRAFT para procesar');
      
      // Crear una factura de prueba
      console.log('🔧 Creando factura de prueba...');
      
      const organization = await prisma.organization.findFirst({
        where: { isActive: true }
      });

      if (!organization) {
        console.log('❌ No hay organizaciones activas');
        return;
      }

      const customer = await prisma.customer.findFirst({
        where: { organizationId: organization.id }
      });

      if (!customer) {
        console.log('❌ No hay clientes en la organización');
        return;
      }

      const testInvoice = await prisma.invoice.create({
        data: {
          organizationId: organization.id,
          createdBy: 'system',
          clientReferenceId: customer.id,
          invoiceNumber: 'TEST-001',
          issuerRuc: organization.ruc || '123456789',
          issuerDv: organization.dv || '01',
          issuerName: organization.name,
          issuerAddress: organization.address || 'Dirección de prueba',
          issuerEmail: organization.email || 'test@empresa.com',
          receiverRuc: customer.taxId,
          receiverDv: '01',
          receiverName: customer.name,
          receiverEmail: customer.email,
          receiverAddress: customer.address,
          subtotal: 100.00,
          discount: 0,
          subtotalAfterDiscount: 100.00,
          itbms: 7.00,
          total: 107.00,
          currency: 'PAB',
          issueDate: new Date(),
          status: 'DRAFT',
        }
      });

      // Crear item de prueba
      await prisma.invoiceItem.create({
        data: {
          invoiceId: testInvoice.id,
          lineNumber: 1,
          code: 'ITEM001',
          description: 'Producto de prueba',
          quantity: 1,
          unitPrice: 100.00,
          discount: 0,
          subtotal: 100.00,
          taxRate: 7,
          taxAmount: 7.00,
          total: 107.00,
        }
      });

      console.log(`✅ Factura de prueba creada: ${testInvoice.id}`);
      
      // Procesar la factura de prueba
      console.log('\n🔄 Procesando factura de prueba...');
      const result = await processInvoiceDirectly(testInvoice.id, {
        sendToHKA: false, // No enviar a HKA para evitar errores de conexión
        sendEmail: false,
      });

      console.log('\n📊 Resultado del procesamiento:');
      console.log(`   Éxito: ${result.success}`);
      console.log(`   XML Generado: ${result.xmlGenerated}`);
      console.log(`   Enviado a HKA: ${result.sentToHKA}`);
      console.log(`   Email Enviado: ${result.emailSent}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.cufe) {
        console.log(`   CUFE: ${result.cufe}`);
      }

      return;
    }

    console.log(`📋 Factura encontrada: ${draftInvoice.invoiceNumber}`);
    console.log(`   ID: ${draftInvoice.id}`);
    console.log(`   Organización: ${draftInvoice.organization.name}`);
    console.log(`   Items: ${draftInvoice.items.length}`);
    console.log(`   Total: $${Number(draftInvoice.total).toFixed(2)}`);

    // 2. Procesar la factura
    console.log('\n🔄 Procesando factura...');
    const result = await processInvoiceDirectly(draftInvoice.id, {
      sendToHKA: false, // No enviar a HKA para evitar errores de conexión
      sendEmail: false,
    });

    console.log('\n📊 Resultado del procesamiento:');
    console.log(`   Éxito: ${result.success}`);
    console.log(`   XML Generado: ${result.xmlGenerated}`);
    console.log(`   Enviado a HKA: ${result.sentToHKA}`);
    console.log(`   Email Enviado: ${result.emailSent}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.cufe) {
      console.log(`   CUFE: ${result.cufe}`);
    }

    // 3. Verificar estado en BD
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: draftInvoice.id }
    });

    console.log(`\n📊 Estado actualizado en BD:`);
    console.log(`   Status: ${updatedInvoice?.status}`);
    console.log(`   CUFE: ${updatedInvoice?.cufe || 'N/A'}`);
    console.log(`   XML Content: ${updatedInvoice?.xmlContent ? 'SÍ' : 'NO'}`);

  } catch (error) {
    console.error('❌ Error en prueba de procesamiento:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testInvoiceProcessing()
    .then(() => {
      console.log('\n✅ Prueba de procesamiento completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en prueba:', error);
      process.exit(1);
    });
}

export { testInvoiceProcessing };

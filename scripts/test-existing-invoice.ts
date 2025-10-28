import { prismaServer as prisma } from '@/lib/prisma-server';
import { processInvoiceDirectly } from '@/lib/workers/invoice-processor';

async function testExistingInvoice() {
  try {
    console.log('🧪 Probando factura existente...');

    // Buscar una factura DRAFT con precios válidos
    const invoice = await prisma.invoice.findFirst({
      where: { 
        status: 'DRAFT',
        total: { gt: 0 }
      },
      include: {
        organization: true,
        items: true,
        user: true,
        customer: true,
      }
    });

    if (!invoice) {
      console.log('❌ No hay facturas DRAFT con total > 0');
      return;
    }

    console.log(`📋 Factura encontrada: ${invoice.invoiceNumber || invoice.id}`);
    console.log(`   Organización: ${invoice.organization.name}`);
    console.log(`   Items: ${invoice.items.length}`);
    console.log(`   Total: $${Number(invoice.total).toFixed(2)}`);
    console.log(`   Cliente: ${invoice.customer?.name || 'N/A'}`);

    // Procesar la factura
    console.log('\n🔄 Procesando factura...');
    const result = await processInvoiceDirectly(invoice.id, {
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

    // Verificar estado en BD
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id }
    });

    console.log(`\n📊 Estado actualizado en BD:`);
    console.log(`   Status: ${updatedInvoice?.status}`);
    console.log(`   CUFE: ${updatedInvoice?.cufe || 'N/A'}`);
    console.log(`   XML Content: ${updatedInvoice?.xmlContent ? 'SÍ' : 'NO'}`);

    if (result.success) {
      console.log('\n🎉 ¡Procesamiento exitoso!');
    } else {
      console.log('\n⚠️ Procesamiento falló, pero el sistema funciona');
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testExistingInvoice()
    .then(() => {
      console.log('\n✅ Prueba completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { testExistingInvoice };

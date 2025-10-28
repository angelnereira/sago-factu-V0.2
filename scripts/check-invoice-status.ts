import { prismaServer as prisma } from '@/lib/prisma-server';

async function checkInvoiceStatus() {
  try {
    console.log('📊 Verificando estado de facturas...');

    const invoices = await prisma.invoice.findMany({
      include: {
        organization: true,
        items: true,
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Total de facturas: ${invoices.length}\n`);

    invoices.forEach((invoice, index) => {
      console.log(`${index + 1}. Factura: ${invoice.invoiceNumber || invoice.id}`);
      console.log(`   Organización: ${invoice.organization.name}`);
      console.log(`   Cliente: ${invoice.customer?.name || 'N/A'}`);
      console.log(`   Items: ${invoice.items.length}`);
      console.log(`   Total: $${Number(invoice.total).toFixed(2)}`);
      console.log(`   Status: ${invoice.status}`);
      console.log(`   CUFE: ${invoice.cufe || 'N/A'}`);
      console.log(`   XML: ${invoice.xmlContent ? 'SÍ' : 'NO'}`);
      console.log(`   Creada: ${invoice.createdAt.toISOString()}`);
      console.log('');
    });

    // Estadísticas por estado
    const statusCounts = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Estadísticas por estado:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error verificando facturas:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkInvoiceStatus()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { checkInvoiceStatus };

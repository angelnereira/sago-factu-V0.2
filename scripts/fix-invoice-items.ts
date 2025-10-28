import { prismaServer as prisma } from '@/lib/prisma-server';

async function fixInvoiceItems() {
  try {
    console.log('🔧 Corrigiendo precios de items de facturas...');

    // 1. Buscar items con precio 0
    const itemsWithZeroPrice = await prisma.invoiceItem.findMany({
      where: {
        unitPrice: 0
      },
      include: {
        invoice: {
          include: { organization: true }
        }
      }
    });

    console.log(`📊 Items con precio 0: ${itemsWithZeroPrice.length}`);

    for (const item of itemsWithZeroPrice) {
      console.log(`\n🔧 Corrigiendo item: ${item.description}`);
      console.log(`   Factura: ${item.invoice.invoiceNumber || item.invoice.id}`);
      console.log(`   Precio actual: $${Number(item.unitPrice).toFixed(2)}`);
      
      // Asignar un precio de prueba
      const testPrice = 100.00;
      
      await prisma.invoiceItem.update({
        where: { id: item.id },
        data: {
          unitPrice: testPrice,
          subtotal: testPrice * Number(item.quantity),
          total: testPrice * Number(item.quantity) * (1 + Number(item.taxRate) / 100),
        }
      });

      console.log(`   ✅ Precio actualizado: $${testPrice.toFixed(2)}`);
    }

    // 2. Recalcular totales de las facturas afectadas
    const affectedInvoices = await prisma.invoice.findMany({
      where: {
        id: {
          in: [...new Set(itemsWithZeroPrice.map(item => item.invoiceId))]
        }
      },
      include: {
        items: true
      }
    });

    console.log(`\n🔧 Recalculando totales de ${affectedInvoices.length} facturas...`);

    for (const invoice of affectedInvoices) {
      let subtotal = 0;
      let totalTax = 0;
      let total = 0;

      for (const item of invoice.items) {
        const itemSubtotal = Number(item.unitPrice) * Number(item.quantity);
        const itemTax = itemSubtotal * (Number(item.taxRate) / 100);
        const itemTotal = itemSubtotal + itemTax;

        subtotal += itemSubtotal;
        totalTax += itemTax;
        total += itemTotal;
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: subtotal,
          subtotalAfterDiscount: subtotal, // Sin descuentos por ahora
          itbms: totalTax,
          total: total,
        }
      });

      console.log(`   ✅ Factura ${invoice.invoiceNumber || invoice.id}: $${total.toFixed(2)}`);
    }

    console.log('\n🎉 Corrección de precios completada exitosamente!');

  } catch (error) {
    console.error('❌ Error corrigiendo precios:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixInvoiceItems()
    .then(() => {
      console.log('✅ Script de corrección completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en script de corrección:', error);
      process.exit(1);
    });
}

export { fixInvoiceItems };

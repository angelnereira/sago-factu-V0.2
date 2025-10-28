import { prismaServer as prisma } from '@/lib/prisma-server';

async function fixSpecificInvoice() {
  try {
    console.log('🔧 Corrigiendo factura específica...');

    const invoiceId = 'cmhaqbyih0003ju04oertcc40';
    
    // Obtener la factura
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { organization: true }
    });

    if (!invoice) {
      console.log('❌ Factura no encontrada');
      return;
    }

    console.log(`📋 Factura encontrada: ${invoice.invoiceNumber || invoice.id}`);
    console.log(`   Organización: ${invoice.organization.name}`);
    console.log(`   ClientReferenceId actual: ${invoice.clientReferenceId}`);

    // Buscar o crear un cliente
    let customer = await prisma.customer.findFirst({
      where: { 
        organizationId: invoice.organizationId,
        isActive: true
      }
    });

    if (!customer) {
      console.log('🔧 Creando cliente de prueba...');
      customer = await prisma.customer.create({
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
      console.log(`✅ Cliente creado: ${customer.name}`);
    } else {
      console.log(`✅ Cliente encontrado: ${customer.name}`);
    }

    // Actualizar la factura
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        clientReferenceId: customer.id,
        receiverRuc: customer.ruc,
        receiverDv: customer.dv,
        receiverName: customer.name,
        receiverEmail: customer.email,
        receiverAddress: customer.address,
      }
    });

    console.log(`✅ Factura actualizada con cliente: ${customer.name}`);

    // Verificar la corrección
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });

    console.log(`\n📊 Estado final:`);
    console.log(`   ClientReferenceId: ${updatedInvoice?.clientReferenceId}`);
    console.log(`   Cliente: ${updatedInvoice?.customer?.name || 'N/A'}`);
    console.log(`   RUC: ${updatedInvoice?.receiverRuc}-${updatedInvoice?.receiverDv}`);

  } catch (error) {
    console.error('❌ Error corrigiendo factura:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixSpecificInvoice()
    .then(() => {
      console.log('✅ Corrección completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { fixSpecificInvoice };

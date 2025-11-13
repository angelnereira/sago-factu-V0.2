import { prismaServer } from '@/lib/prisma-server';

async function main() {
  const id = process.argv[2];

  if (!id) {
    console.error('Uso: npx tsx scripts/dump-invoice-xml.ts <invoiceId>');
    process.exit(1);
  }

  const prisma = await prismaServer;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      hkaStatus: true,
      hkaMessage: true,
      xmlContent: true,
      rawXml: true,
      organization: {
        select: {
          name: true,
          hkaEnvironment: true,
        },
      },
      items: {
        select: {
          description: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          subtotal: true,
          taxAmount: true,
          total: true,
        },
      },
    },
  });

  if (!invoice) {
    console.error(`No se encontró factura con id ${id}`);
    process.exit(1);
  }

  console.log(`Factura ${invoice.id} (${invoice.status})`);
  console.log(`Org: ${invoice.organization?.name ?? 'N/A'} | Ambiente: ${invoice.organization?.hkaEnvironment ?? 'N/A'}`);
  console.log(`HKA Status: ${invoice.hkaStatus ?? 'N/A'}`);
  console.log(`HKA Mensaje: ${invoice.hkaMessage ?? 'N/A'}`);
  console.log('--- ITEMS ---');
  console.log(JSON.stringify(invoice.items, null, 2));
  console.log('--- XML ---');
  console.log(invoice.rawXml ?? invoice.xmlContent ?? '[Sin XML almacenado]');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



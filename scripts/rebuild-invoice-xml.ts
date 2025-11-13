import { prismaServer } from '@/lib/prisma-server';
import { transformInvoiceToXMLInput, InvoiceWithRelations } from '@/lib/hka/transformers/invoice-to-xml';
import { generarFacturaXML } from '@/lib/hka/xml/generator';

async function main() {
  const id = process.argv[2];

  if (!id) {
    console.error('Uso: npx tsx scripts/rebuild-invoice-xml.ts <invoiceId>');
    process.exit(1);
  }

  const prisma = await prismaServer;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      organization: true,
      items: true,
      customer: true,
    },
  });

  if (!invoice) {
    console.error(`No se encontró factura con id ${id}`);
    process.exit(1);
  }

  const xmlInput = transformInvoiceToXMLInput(invoice as InvoiceWithRelations, invoice.customer || undefined);
  const xml = generarFacturaXML(xmlInput);

  console.log('Totales calculados:', xmlInput.totales);
  console.log('--- XML generado con código actual ---');
  console.log(xml);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



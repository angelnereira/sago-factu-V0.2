import fs from 'fs';

import { XMLSigner } from '@/lib/certificates/xml-signer';

async function main() {
  try {
    const orgId = process.argv[2];
    const xmlPath = process.argv[3] ?? '/tmp/test-invoice.xml';

    if (!orgId) {
      console.error('❌ Debes proporcionar un organizationId como primer argumento');
      process.exit(1);
    }

    if (!fs.existsSync(xmlPath)) {
      console.error(`❌ No se encontró el archivo XML en ${xmlPath}`);
      process.exit(1);
    }

    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    const signer = new XMLSigner();

    const signedXml = await signer.signXML(xmlContent, orgId);
    const outputPath = `/tmp/signed-invoice-${Date.now()}.xml`;
    fs.writeFileSync(outputPath, signedXml, 'utf-8');

    console.log('✅ XML firmado correctamente');
    console.log(`   Archivo firmado: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error al firmar XML:', error);
    process.exit(1);
  }
}

main();


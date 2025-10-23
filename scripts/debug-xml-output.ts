/**
 * DEBUG: Ver XML generado completo
 */

import { prisma } from '../lib/db';
import { generateXMLFromInvoice } from '../lib/hka/transformers/invoice-to-xml';
import fs from 'fs';

async function debugXML() {
  try {
    // Obtener invoice de prueba
    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: 'TEST-' } },
      include: { organization: true, items: true },
    });

    if (!invoice) {
      console.error('❌ No se encontró invoice de prueba');
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: invoice.clientReferenceId },
    });

    if (!customer) {
      console.error('❌ No se encontró customer');
      return;
    }

    // Generar XML
    const { xml, cufe, errores } = await generateXMLFromInvoice(invoice as any, customer);

    if (errores.length > 0) {
      console.error('❌ Errores de validación:');
      errores.forEach(e => console.error(`   - ${e}`));
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('XML GENERADO COMPLETO');
    console.log('='.repeat(80) + '\n');
    console.log(xml);
    console.log('\n' + '='.repeat(80));
    console.log(`CUFE: ${cufe}`);
    console.log(`Longitud: ${xml.length} caracteres`);
    console.log('='.repeat(80) + '\n');

    // Guardar a archivo
    const filename = `xml-debug-${Date.now()}.xml`;
    fs.writeFileSync(filename, xml);
    console.log(`✅ XML guardado en: ${filename}\n`);

    // Buscar sección de ITBMS
    console.log('\n📊 ANÁLISIS DE ITBMS:');
    console.log('─'.repeat(80));
    
    const itbmsMatches = xml.matchAll(/<gITBMSItem>([\s\S]*?)<\/gITBMSItem>/g);
    let itemNum = 1;
    for (const match of itbmsMatches) {
      const content = match[1];
      const tasaMatch = content.match(/<dTasaITBMS>(.*?)<\/dTasaITBMS>/);
      const valorMatch = content.match(/<dValITBMS>(.*?)<\/dValITBMS>/);
      
      console.log(`\nItem ${itemNum}:`);
      console.log(`  Tasa ITBMS:  ${tasaMatch ? tasaMatch[1] : 'N/A'}`);
      console.log(`  Valor ITBMS: ${valorMatch ? valorMatch[1] : 'N/A'}`);
      
      // Verificar consistencia
      const tasa = tasaMatch ? tasaMatch[1] : '';
      const valor = valorMatch ? parseFloat(valorMatch[1]) : 0;
      
      if (tasa === '00' && valor !== 0) {
        console.log(`  ⚠️  INCONSISTENCIA: Tasa EXENTO pero valor = ${valor}`);
      } else {
        console.log(`  ✅ Consistente`);
      }
      
      itemNum++;
    }
    
    console.log('\n' + '─'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugXML();


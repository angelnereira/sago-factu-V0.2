/**
 * TEST: Diferentes formatos de envío XML a HKA
 * 
 * Prueba 4 variantes basadas en la documentación de node-soap
 */

import { getHKAClient } from '../lib/hka/soap/client';
import { prisma } from '../lib/db';
import { generateXMLFromInvoice } from '../lib/hka/transformers/invoice-to-xml';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function testXMLFormats() {
  try {
    console.log('\n' + '='.repeat(60));
    log('🧪', 'TEST: Formatos de envío XML a HKA', colors.blue);
    console.log('='.repeat(60) + '\n');

    // Obtener invoice de prueba
    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: 'TEST-' } },
      include: { organization: true, items: true },
    });

    if (!invoice) {
      log('❌', 'No se encontró invoice de prueba', colors.red);
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: invoice.clientReferenceId },
    });

    if (!customer) {
      log('❌', 'No se encontró customer', colors.red);
      return;
    }

    // Generar XML
    const { xml } = await generateXMLFromInvoice(invoice as any, customer);
    
    // Remover declaración XML
    let xmlLimpio = xml.trim();
    if (xmlLimpio.startsWith('<?xml')) {
      const endOfDeclaration = xmlLimpio.indexOf('?>');
      if (endOfDeclaration !== -1) {
        xmlLimpio = xmlLimpio.substring(endOfDeclaration + 2).trim();
      }
    }

    const hkaClient = getHKAClient();
    const credentials = hkaClient.getCredentials();

    console.log('');
    log('📋', 'XML preparado:', colors.cyan);
    log('ℹ️ ', `Longitud: ${xmlLimpio.length} caracteres`);
    log('ℹ️ ', `Primeros 100 chars: ${xmlLimpio.substring(0, 100)}...`);
    console.log('');

    // ============================================
    // VARIANTE 1: Usar $xml (MÁS RECOMENDADO)
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('🧪', 'VARIANTE 1: Usando $xml', colors.yellow);
    console.log('─'.repeat(60));

    try {
      const params1 = {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        documento: {
          $xml: xmlLimpio  // ← Envía XML sin escapar
        }
      };

      log('📤', 'Enviando con formato $xml...', colors.cyan);
      const response1 = await hkaClient.invoke('Enviar', params1);
      
      log('✅', 'VARIANTE 1: ¡ÉXITO!', colors.green);
      log('🎉', `CUFE: ${response1.dCufe}`, colors.green);
      log('🎉', `Código: ${response1.dCodRes}`, colors.green);
      log('🎉', `Mensaje: ${response1.dMsgRes}`, colors.green);
      
      // Si llegamos aquí, esta variante funcionó
      return;
    } catch (error1) {
      log('❌', `VARIANTE 1 falló: ${error1.message?.substring(0, 200)}`, colors.red);
    }

    // ============================================
    // VARIANTE 2: Usar _xml (ALTERNATIVA)
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('🧪', 'VARIANTE 2: Usando _xml', colors.yellow);
    console.log('─'.repeat(60));

    try {
      const params2 = {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        documento: {
          _xml: xmlLimpio  // ← Alternativa a $xml
        }
      };

      log('📤', 'Enviando con formato _xml...', colors.cyan);
      const response2 = await hkaClient.invoke('Enviar', params2);
      
      log('✅', 'VARIANTE 2: ¡ÉXITO!', colors.green);
      log('🎉', `CUFE: ${response2.dCufe}`, colors.green);
      log('🎉', `Código: ${response2.dCodRes}`, colors.green);
      
      return;
    } catch (error2) {
      log('❌', `VARIANTE 2 falló: ${error2.message?.substring(0, 200)}`, colors.red);
    }

    // ============================================
    // VARIANTE 3: CDATA
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('🧪', 'VARIANTE 3: Usando CDATA', colors.yellow);
    console.log('─'.repeat(60));

    try {
      const params3 = {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        documento: `<![CDATA[${xmlLimpio}]]>`
      };

      log('📤', 'Enviando con formato CDATA...', colors.cyan);
      const response3 = await hkaClient.invoke('Enviar', params3);
      
      log('✅', 'VARIANTE 3: ¡ÉXITO!', colors.green);
      log('🎉', `CUFE: ${response3.dCufe}`, colors.green);
      
      return;
    } catch (error3) {
      log('❌', `VARIANTE 3 falló: ${error3.message?.substring(0, 200)}`, colors.red);
    }

    // ============================================
    // VARIANTE 4: XML plano con escapeXML: false
    // ============================================
    console.log('\n' + '─'.repeat(60));
    log('🧪', 'VARIANTE 4: XML plano (escapeXML: false ya configurado)', colors.yellow);
    console.log('─'.repeat(60));

    try {
      const params4 = {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        documento: xmlLimpio  // ← XML plano, sin escapar
      };

      log('📤', 'Enviando XML plano...', colors.cyan);
      const response4 = await hkaClient.invoke('Enviar', params4);
      
      log('✅', 'VARIANTE 4: ¡ÉXITO!', colors.green);
      log('🎉', `CUFE: ${response4.dCufe}`, colors.green);
      
      return;
    } catch (error4) {
      log('❌', `VARIANTE 4 falló: ${error4.message?.substring(0, 200)}`, colors.red);
    }

    // Si llegamos aquí, ninguna variante funcionó
    console.log('\n' + '='.repeat(60));
    log('❌', 'NINGUNA VARIANTE FUNCIONÓ', colors.red);
    console.log('='.repeat(60));
    log('💡', 'Recomendación: Revisar los REQUEST XML capturados arriba', colors.yellow);
    log('💡', 'Contactar soporte de HKA con los XMLs generados', colors.yellow);

  } catch (error) {
    console.error('\n');
    log('❌', 'ERROR GENERAL:', colors.red);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
testXMLFormats();


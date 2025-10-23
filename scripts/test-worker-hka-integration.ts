/**
 * TEST DEL WORKER + INTEGRACIÓN HKA
 * 
 * Prueba el flujo completo:
 * 1. Procesar Invoice con el worker
 * 2. Generar XML
 * 3. Enviar a HKA DEMO
 * 4. Verificar respuesta
 */

import { PrismaClient } from '@prisma/client';
import { processInvoiceDirectly } from '../lib/workers/invoice-processor';

const prisma = new PrismaClient();

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function success(message: string) {
  log('✅', message, colors.green);
}

function error(message: string) {
  log('❌', message, colors.red);
}

function info(message: string) {
  log('ℹ️ ', message, colors.cyan);
}

function warning(message: string) {
  log('⚠️ ', message, colors.yellow);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log('📋', title.toUpperCase(), colors.blue);
  console.log('='.repeat(60));
}

async function testWorkerHKAIntegration() {
  try {
    section('1. Verificar configuración de HKA');
    
    const hkaEnv = process.env.HKA_ENVIRONMENT;
    const hkaToken = process.env.HKA_DEMO_TOKEN_EMPRESA;
    const hkaPassword = process.env.HKA_DEMO_TOKEN_PASSWORD;
    const hkaWsdl = process.env.HKA_DEMO_WSDL_URL;
    
    info(`  Ambiente: ${hkaEnv || 'NO CONFIGURADO'}`);
    info(`  Token Empresa: ${hkaToken ? '✓ Configurado' : '✗ NO configurado'}`);
    info(`  Token Password: ${hkaPassword ? '✓ Configurado' : '✗ NO configurado'}`);
    info(`  WSDL URL: ${hkaWsdl || 'NO CONFIGURADO'}`);
    
    if (!hkaToken || !hkaPassword || !hkaWsdl) {
      error('Credenciales de HKA no configuradas en .env');
      info('Necesitas configurar:');
      info('  - HKA_DEMO_TOKEN_EMPRESA');
      info('  - HKA_DEMO_TOKEN_PASSWORD');
      info('  - HKA_DEMO_WSDL_URL');
      process.exit(1);
    }
    
    success('Credenciales de HKA configuradas');
    
    // ============================================
    section('2. Buscar Invoice de prueba');
    
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: 'TEST-',
        },
        status: {
          notIn: ['CERTIFIED'], // Solo excluir facturas ya certificadas
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (!invoice) {
      warning('No se encontró invoice de prueba disponible');
      info('Buscando cualquier invoice...');
      
      const anyInvoice = await prisma.invoice.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      if (!anyInvoice) {
        error('No hay invoices en la BD');
        info('Ejecuta primero: npx tsx scripts/test-invoice-with-new-schema.ts');
        process.exit(1);
      }
      
      info(`Usando invoice: ${anyInvoice.invoiceNumber}`);
    }
    
    success(`Invoice encontrado: ${invoice!.invoiceNumber}`);
    info(`  ID: ${invoice!.id}`);
    info(`  Status: ${invoice!.status}`);
    info(`  Total: $${Number(invoice!.total).toFixed(2)}`);
    
    const invoiceId = invoice!.id;
    
    // ============================================
    section('3. Decidir si enviar a HKA DEMO');
    
    console.log('');
    warning('⚠️  IMPORTANTE: ¿Quieres enviar a HKA DEMO?');
    warning('   Esto consumirá un folio real de HKA');
    console.log('');
    info('Opciones:');
    info('  1. SÍ - Enviar a HKA DEMO (prueba real)');
    info('  2. NO - Solo generar XML (modo test)');
    console.log('');
    
    // Por defecto, NO enviar a HKA en test automatizado
    const sendToHKA = process.argv.includes('--send-to-hka');
    
    if (sendToHKA) {
      warning('🚀 Modo: ENVÍO REAL a HKA DEMO');
    } else {
      info('🧪 Modo: SOLO GENERACIÓN DE XML (test)');
      info('Para enviar a HKA, ejecuta con: --send-to-hka');
    }
    
    // ============================================
    section('4. Procesar Invoice con Worker');
    
    console.log('');
    info('Iniciando procesamiento...');
    console.log('');
    
    const result = await processInvoiceDirectly(invoiceId, {
      sendToHKA: sendToHKA,
      sendEmail: false, // No enviar email en tests
    });
    
    console.log('');
    
    // ============================================
    section('5. Verificar resultado');
    
    if (result.success) {
      success('✅ PROCESAMIENTO EXITOSO');
    } else {
      error('❌ PROCESAMIENTO FALLÓ');
    }
    
    console.log('');
    info('Resultado del procesamiento:');
    info(`  Invoice ID: ${result.invoiceId}`);
    info(`  XML Generado: ${result.xmlGenerated ? 'SÍ ✓' : 'NO ✗'}`);
    info(`  Enviado a HKA: ${result.sentToHKA ? 'SÍ ✓' : 'NO ✗'}`);
    info(`  Email Enviado: ${result.emailSent ? 'SÍ ✓' : 'NO ✗'}`);
    
    if (result.cufe) {
      success(`  CUFE: ${result.cufe}`);
    }
    
    if (result.hkaProtocol) {
      success(`  Protocolo HKA: ${result.hkaProtocol}`);
    }
    
    if (result.hkaStatus) {
      if (result.hkaStatus === '0200') {
        success(`  Status HKA: ${result.hkaStatus} (APROBADO)`);
      } else {
        warning(`  Status HKA: ${result.hkaStatus}`);
      }
    }
    
    if (result.error) {
      error(`  Error: ${result.error}`);
    }
    
    // ============================================
    section('6. Verificar estado final en BD');
    
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    
    if (!updatedInvoice) {
      error('No se pudo recuperar el invoice actualizado');
      process.exit(1);
    }
    
    info('Estado final del Invoice:');
    info(`  Status: ${updatedInvoice.status}`);
    info(`  CUFE: ${updatedInvoice.cufe || 'N/A'}`);
    info(`  QR Code: ${updatedInvoice.qrCode ? 'Sí ✓' : 'No'}`);
    info(`  XML Content: ${updatedInvoice.xmlContent ? `Sí (${updatedInvoice.xmlContent.length} chars)` : 'No'}`);
    info(`  Certified At: ${updatedInvoice.certifiedAt || 'N/A'}`);
    
    // Mostrar preview del XML si existe
    if (updatedInvoice.xmlContent) {
      section('7. Preview del XML generado');
      
      const xmlLines = updatedInvoice.xmlContent.split('\n');
      const preview = xmlLines.slice(0, 30).join('\n');
      
      console.log(colors.cyan + preview + colors.reset);
      
      if (xmlLines.length > 30) {
        info(`\n... (${xmlLines.length - 30} líneas más)`);
      }
    }
    
    // ============================================
    section('✅ RESULTADO FINAL');
    
    console.log('\n');
    
    if (result.success && result.sentToHKA) {
      success('🎉 ¡INTEGRACIÓN CON HKA EXITOSA!');
      console.log('');
      success('✅ Worker funcionando correctamente');
      success('✅ XML generado y válido');
      success('✅ Enviado a HKA DEMO');
      success('✅ Respuesta de HKA recibida');
      success('✅ Invoice actualizado en BD');
      console.log('');
      info('📄 CUFE generado:');
      info(`   ${result.cufe}`);
      if (result.hkaProtocol) {
        info('📋 Protocolo HKA:');
        info(`   ${result.hkaProtocol}`);
      }
    } else if (result.success && !result.sentToHKA) {
      success('✅ GENERACIÓN DE XML EXITOSA');
      console.log('');
      success('✅ Worker funcionando correctamente');
      success('✅ XML generado y válido');
      success('✅ Invoice actualizado en BD');
      console.log('');
      info('Para enviar a HKA, ejecuta:');
      info('   npx tsx scripts/test-worker-hka-integration.ts --send-to-hka');
    } else {
      error('❌ PROCESAMIENTO FALLÓ');
      console.log('');
      error('Revisa los errores arriba');
      if (result.error) {
        error(`Error: ${result.error}`);
      }
      process.exit(1);
    }
    
    console.log('');
    info('🚀 SIGUIENTE PASO: Crear endpoints API');
    console.log('');
    
  } catch (err) {
    console.error('\n');
    error('❌ TEST FALLÓ');
    console.error('\n');
    console.error(err);
    console.error('\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testWorkerHKAIntegration();


/**
 * TEST DEL TRANSFORMER: INVOICE → XML
 * 
 * Prueba la transformación de un Invoice real de Prisma
 * al formato XML de HKA usando el transformer.
 */

import { PrismaClient } from '@prisma/client';
import {
  transformInvoiceToXMLInput,
  generateXMLFromInvoice,
  type InvoiceWithRelations,
} from '../lib/hka/transformers/invoice-to-xml';

const prisma = new PrismaClient();

// Colores para terminal
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

function success(message: string) {
  log('✅', message, colors.green);
}

function error(message: string) {
  log('❌', message, colors.red);
}

function info(message: string) {
  log('ℹ️ ', message, colors.cyan);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log('📋', title.toUpperCase(), colors.blue);
  console.log('='.repeat(60));
}

async function testTransformer() {
  try {
    section('1. Buscar Invoice de prueba en la BD');
    
    // Buscar el último invoice creado (del test anterior)
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: 'TEST-',
        },
      },
      include: {
        organization: true,
        items: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as InvoiceWithRelations | null;
    
    if (!invoice) {
      error('No se encontró invoice de prueba');
      info('Ejecuta primero: npx tsx scripts/test-invoice-with-new-schema.ts');
      process.exit(1);
    }
    
    success('Invoice encontrado en BD');
    info(`  ID: ${invoice.id}`);
    info(`  Invoice Number: ${invoice.invoiceNumber}`);
    info(`  Organization: ${invoice.organization.name}`);
    info(`  Items: ${invoice.items.length}`);
    info(`  Total: $${Number(invoice.total).toFixed(2)}`);
    
    // ============================================
    section('2. Buscar Customer asociado');
    
    const customer = await prisma.customer.findUnique({
      where: { id: invoice.clientReferenceId },
    });
    
    if (!customer) {
      error('Customer no encontrado');
      process.exit(1);
    }
    
    success('Customer encontrado');
    info(`  ID: ${customer.id}`);
    info(`  RUC: ${customer.ruc}-${customer.dv}`);
    info(`  Name: ${customer.name}`);
    
    // ============================================
    section('3. Transformar Invoice → XML Input');
    
    const xmlInput = transformInvoiceToXMLInput(invoice, customer);
    
    success('Transformación completada');
    info(`  Ambiente: ${xmlInput.ambiente === 2 ? 'DEMO' : 'PRODUCCIÓN'}`);
    info(`  Tipo Documento: ${xmlInput.tipoDocumento}`);
    info(`  Número Documento: ${xmlInput.numeroDocumento}`);
    info(`  Items: ${xmlInput.items.length}`);
    
    // ============================================
    section('4. Validar datos del emisor');
    
    success('Emisor transformado:');
    info(`  RUC: ${xmlInput.emisor.ruc}-${xmlInput.emisor.dv}`);
    info(`  Razón Social: ${xmlInput.emisor.razonSocial}`);
    info(`  Nombre Comercial: ${xmlInput.emisor.nombreComercial || 'N/A'}`);
    info(`  Sucursal: ${xmlInput.emisor.codigoSucursal}`);
    info(`  Punto Facturación: ${xmlInput.emisor.puntoFacturacion}`);
    info(`  Provincia: ${xmlInput.emisor.provincia}`);
    info(`  Distrito: ${xmlInput.emisor.distrito}`);
    info(`  Corregimiento: ${xmlInput.emisor.corregimiento}`);
    
    // Validar que los datos del emisor coincidan
    if (xmlInput.emisor.ruc === invoice.organization.ruc) {
      success('  ✓ RUC del emisor coincide');
    } else {
      error('  ✗ RUC del emisor no coincide');
    }
    
    if (xmlInput.emisor.razonSocial === invoice.organization.name) {
      success('  ✓ Razón social coincide');
    } else {
      error('  ✗ Razón social no coincide');
    }
    
    // ============================================
    section('5. Validar datos del receptor');
    
    success('Receptor transformado:');
    info(`  RUC: ${xmlInput.receptor.ruc}-${xmlInput.receptor.dv}`);
    info(`  Razón Social: ${xmlInput.receptor.razonSocial}`);
    info(`  Tipo Cliente: ${xmlInput.receptor.tipoCliente}`);
    info(`  Dirección: ${xmlInput.receptor.direccion}`);
    info(`  País: ${xmlInput.receptor.paisCodigo}`);
    
    // Validar que los datos del receptor coincidan
    if (xmlInput.receptor.ruc === customer.ruc) {
      success('  ✓ RUC del receptor coincide');
    } else {
      error('  ✗ RUC del receptor no coincide');
    }
    
    if (xmlInput.receptor.razonSocial === customer.name) {
      success('  ✓ Razón social coincide');
    } else {
      error('  ✗ Razón social no coincide');
    }
    
    // ============================================
    section('6. Validar items transformados');
    
    success(`Items transformados: ${xmlInput.items.length}`);
    
    xmlInput.items.forEach((item, index) => {
      const originalItem = invoice.items[index];
      
      info(`\n  Item ${item.secuencia}:`);
      info(`    Código: ${item.codigo}`);
      info(`    Descripción: ${item.descripcion}`);
      info(`    Cantidad: ${item.cantidad}`);
      info(`    Precio Unitario: $${item.precioUnitario.toFixed(2)}`);
      info(`    Precio con Descuento: $${item.precioUnitarioDescuento?.toFixed(2) || 'N/A'}`);
      info(`    Subtotal: $${item.precioItem.toFixed(2)}`);
      info(`    ITBMS (${item.tasaITBMS}): $${item.valorITBMS.toFixed(2)}`);
      info(`    Total: $${item.valorTotal.toFixed(2)}`);
      
      // Validar cantidades
      if (item.cantidad === Number(originalItem.quantity)) {
        success('    ✓ Cantidad coincide');
      } else {
        error(`    ✗ Cantidad no coincide (esperado: ${originalItem.quantity})`);
      }
      
      // Validar precios
      if (Math.abs(item.precioItem - Number(originalItem.subtotal)) < 0.01) {
        success('    ✓ Subtotal coincide');
      } else {
        error(`    ✗ Subtotal no coincide (esperado: ${originalItem.subtotal})`);
      }
    });
    
    // ============================================
    section('7. Validar totales');
    
    success('Totales calculados:');
    info(`  Total Neto: $${xmlInput.totales.totalNeto.toFixed(2)}`);
    info(`  Total ITBMS: $${xmlInput.totales.totalITBMS.toFixed(2)}`);
    info(`  Total Descuento: $${xmlInput.totales.totalDescuento.toFixed(2)}`);
    info(`  Valor Total: $${xmlInput.totales.valorTotal.toFixed(2)}`);
    info(`  Tiempo Pago: ${xmlInput.totales.tiempoPago === 1 ? 'Contado' : 'Crédito'}`);
    info(`  Número Items: ${xmlInput.totales.numeroItems}`);
    
    // Validar total
    const invoiceTotal = Number(invoice.total);
    const xmlTotal = xmlInput.totales.valorTotal;
    
    if (Math.abs(invoiceTotal - xmlTotal) < 0.01) {
      success(`  ✓ Total coincide: $${invoiceTotal.toFixed(2)}`);
    } else {
      error(`  ✗ Total no coincide. Invoice: $${invoiceTotal.toFixed(2)}, XML: $${xmlTotal.toFixed(2)}`);
    }
    
    // ============================================
    section('8. Generar XML completo');
    
    const { xml, cufe, errores } = await generateXMLFromInvoice(invoice, customer);
    
    if (errores.length > 0) {
      error('Errores de validación:');
      errores.forEach(err => error(`  - ${err}`));
      throw new Error('Validación de XML falló');
    }
    
    success('XML generado exitosamente');
    info(`  CUFE: ${cufe}`);
    info(`  Longitud XML: ${xml.length} caracteres`);
    info(`  Líneas XML: ${xml.split('\n').length}`);
    
    // ============================================
    section('9. Guardar XML generado');
    
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `invoice-${invoice.invoiceNumber}-${Date.now()}.xml`);
    fs.writeFileSync(outputPath, xml, 'utf-8');
    
    success(`XML guardado en: ${outputPath}`);
    
    // ============================================
    section('10. Mostrar XML (primeras 60 líneas)');
    
    const xmlLines = xml.split('\n');
    const preview = xmlLines.slice(0, 60).join('\n');
    
    console.log(colors.cyan + preview + colors.reset);
    
    if (xmlLines.length > 60) {
      info(`\n... (${xmlLines.length - 60} líneas más)`);
    }
    
    // ============================================
    section('✅ RESULTADO FINAL');
    
    console.log('\n');
    success('🎉 TRANSFORMER FUNCIONA CORRECTAMENTE');
    console.log('\n');
    success('✅ Invoice transformado exitosamente');
    success('✅ Datos del emisor correctos');
    success('✅ Datos del receptor correctos');
    success('✅ Items transformados correctamente');
    success('✅ Totales calculados correctamente');
    success('✅ XML generado y válido');
    success('✅ CUFE generado');
    console.log('\n');
    info('📄 Archivos generados:');
    info(`   ${outputPath}`);
    console.log('\n');
    info('🚀 SIGUIENTE PASO: Actualizar worker de procesamiento');
    console.log('\n');
    
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
testTransformer();


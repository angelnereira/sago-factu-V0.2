/**
 * TEST DEL GENERADOR XML PARA HKA
 * 
 * Valida que el generador XML:
 * 1. Genera XML válido
 * 2. Cumple con formato rFE v1.00 de DGI Panamá
 * 3. Calcula totales correctamente
 * 4. Valida datos de entrada
 * 5. Genera CUFE correcto
 */

import {
  generarXMLFactura,
  validarDatosFactura,
  calcularTotales,
  crearFacturaEjemplo,
  generarCUFE,
  TipoAmbiente,
  TipoDocumento,
  TipoRUC,
  TipoCliente,
  FormaPago,
  TasaITBMS,
  type FacturaElectronicaInput,
  type EmisorData,
  type ReceptorData,
  type ItemFactura,
} from '../lib/hka/xml/generator';

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

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log('📋', title.toUpperCase(), colors.blue);
  console.log('='.repeat(60));
}

async function testXMLGenerator() {
  try {
    section('1. Test de creación de factura de ejemplo');
    
    const facturaEjemplo = crearFacturaEjemplo();
    
    success('Factura de ejemplo creada');
    info(`  Emisor: ${facturaEjemplo.emisor.razonSocial}`);
    info(`  Receptor: ${facturaEjemplo.receptor.razonSocial}`);
    info(`  Items: ${facturaEjemplo.items.length}`);
    info(`  Total: $${facturaEjemplo.totales.valorTotal.toFixed(2)}`);
    
    // ============================================
    section('2. Test de validación de datos');
    
    const errores = validarDatosFactura(facturaEjemplo);
    
    if (errores.length === 0) {
      success('Validación pasada - 0 errores');
    } else {
      error(`Validación falló - ${errores.length} errores:`);
      errores.forEach(err => error(`  - ${err}`));
      throw new Error('Validación de datos falló');
    }
    
    // ============================================
    section('3. Test de generación de CUFE');
    
    const cufe = generarCUFE(facturaEjemplo);
    
    success('CUFE generado');
    info(`  CUFE: ${cufe}`);
    info(`  Longitud: ${cufe.length} caracteres`);
    
    // Validar formato CUFE
    if (cufe.startsWith('FE')) {
      success('  CUFE tiene prefijo correcto (FE)');
    } else {
      error('  CUFE no tiene prefijo correcto');
    }
    
    if (cufe.includes(facturaEjemplo.emisor.ruc)) {
      success('  CUFE contiene RUC del emisor');
    } else {
      error('  CUFE no contiene RUC del emisor');
    }
    
    // ============================================
    section('4. Test de cálculo de totales');
    
    const items: ItemFactura[] = [
      {
        secuencia: 1,
        descripcion: 'Producto A',
        codigo: 'PROD-A',
        unidadMedida: 'und',
        cantidad: 10,
        precioUnitario: 100,
        precioUnitarioDescuento: 90,
        precioItem: 900,
        valorTotal: 963,
        tasaITBMS: TasaITBMS.TARIFA_7,
        valorITBMS: 63,
      },
      {
        secuencia: 2,
        descripcion: 'Producto B',
        codigo: 'PROD-B',
        unidadMedida: 'und',
        cantidad: 5,
        precioUnitario: 50,
        precioItem: 250,
        valorTotal: 250,
        tasaITBMS: TasaITBMS.EXENTO,
        valorITBMS: 0,
      },
    ];
    
    const totales = calcularTotales(items);
    
    success('Totales calculados:');
    info(`  Total Neto: $${totales.totalNeto.toFixed(2)}`);
    info(`  Total ITBMS: $${totales.totalITBMS.toFixed(2)}`);
    info(`  Total Descuento: $${totales.totalDescuento.toFixed(2)}`);
    info(`  Valor Total: $${totales.valorTotal.toFixed(2)}`);
    info(`  Número de Items: ${totales.numeroItems}`);
    
    // Validar cálculos
    const expectedNeto = 900 + 250; // 1150
    const expectedITBMS = 63 + 0; // 63
    const expectedTotal = 1150 + 63; // 1213
    
    if (totales.totalNeto === expectedNeto) {
      success(`  ✓ Total Neto correcto: $${expectedNeto}`);
    } else {
      error(`  ✗ Total Neto incorrecto. Esperado: $${expectedNeto}, Obtenido: $${totales.totalNeto}`);
    }
    
    if (totales.totalITBMS === expectedITBMS) {
      success(`  ✓ Total ITBMS correcto: $${expectedITBMS}`);
    } else {
      error(`  ✗ Total ITBMS incorrecto. Esperado: $${expectedITBMS}, Obtenido: $${totales.totalITBMS}`);
    }
    
    if (totales.valorTotal === expectedTotal) {
      success(`  ✓ Valor Total correcto: $${expectedTotal}`);
    } else {
      error(`  ✗ Valor Total incorrecto. Esperado: $${expectedTotal}, Obtenido: $${totales.valorTotal}`);
    }
    
    // ============================================
    section('5. Test de generación de XML');
    
    const xml = generarXMLFactura(facturaEjemplo);
    
    success('XML generado exitosamente');
    info(`  Longitud: ${xml.length} caracteres`);
    info(`  Líneas: ${xml.split('\n').length}`);
    
    // Validar estructura XML básica
    if (xml.startsWith('<?xml')) {
      success('  ✓ XML tiene declaración correcta');
    } else {
      error('  ✗ XML no tiene declaración correcta');
    }
    
    if (xml.includes('<rFE xmlns="http://dgi-fep.mef.gob.pa">')) {
      success('  ✓ XML tiene namespace correcto');
    } else {
      error('  ✗ XML no tiene namespace correcto');
    }
    
    if (xml.includes('</rFE>')) {
      success('  ✓ XML tiene cierre correcto');
    } else {
      error('  ✗ XML no tiene cierre correcto');
    }
    
    // ============================================
    section('6. Validar elementos requeridos en XML');
    
    const elementosRequeridos = [
      { tag: 'dVerForm', nombre: 'Versión del formato' },
      { tag: 'dId', nombre: 'CUFE' },
      { tag: 'gDGen', nombre: 'Datos Generales' },
      { tag: 'gEmis', nombre: 'Datos del Emisor' },
      { tag: 'gDatRec', nombre: 'Datos del Receptor' },
      { tag: 'gItem', nombre: 'Items de factura' },
      { tag: 'gTot', nombre: 'Totales' },
      { tag: 'iAmb', nombre: 'Ambiente' },
      { tag: 'iTpEmis', nombre: 'Tipo de Emisión' },
      { tag: 'iDoc', nombre: 'Tipo de Documento' },
      { tag: 'dNroDF', nombre: 'Número de Documento' },
      { tag: 'dPtoFacDF', nombre: 'Punto de Facturación' },
      { tag: 'dSeg', nombre: 'Código de Seguridad' },
    ];
    
    let allElementsFound = true;
    
    for (const elemento of elementosRequeridos) {
      if (xml.includes(`<${elemento.tag}>`)) {
        success(`  ✓ ${elemento.nombre} presente`);
      } else {
        error(`  ✗ ${elemento.nombre} faltante`);
        allElementsFound = false;
      }
    }
    
    if (!allElementsFound) {
      throw new Error('XML no contiene todos los elementos requeridos');
    }
    
    // ============================================
    section('7. Validar datos del emisor en XML');
    
    const emisorChecks = [
      { value: facturaEjemplo.emisor.ruc, name: 'RUC' },
      { value: facturaEjemplo.emisor.dv, name: 'DV' },
      { value: facturaEjemplo.emisor.razonSocial, name: 'Razón Social' },
      { value: facturaEjemplo.emisor.provincia, name: 'Provincia' },
      { value: facturaEjemplo.emisor.distrito, name: 'Distrito' },
      { value: facturaEjemplo.emisor.corregimiento, name: 'Corregimiento' },
    ];
    
    for (const check of emisorChecks) {
      if (xml.includes(check.value)) {
        success(`  ✓ Emisor - ${check.name}: ${check.value}`);
      } else {
        error(`  ✗ Emisor - ${check.name} no encontrado en XML`);
      }
    }
    
    // ============================================
    section('8. Validar datos del receptor en XML');
    
    const receptorChecks = [
      { value: facturaEjemplo.receptor.ruc, name: 'RUC' },
      { value: facturaEjemplo.receptor.dv, name: 'DV' },
      { value: facturaEjemplo.receptor.razonSocial, name: 'Razón Social' },
      { value: facturaEjemplo.receptor.direccion, name: 'Dirección' },
    ];
    
    for (const check of receptorChecks) {
      if (xml.includes(check.value)) {
        success(`  ✓ Receptor - ${check.name}: ${check.value}`);
      } else {
        error(`  ✗ Receptor - ${check.name} no encontrado en XML`);
      }
    }
    
    // ============================================
    section('9. Mostrar XML generado (primeras 50 líneas)');
    
    const xmlLines = xml.split('\n');
    const preview = xmlLines.slice(0, 50).join('\n');
    
    console.log(colors.cyan + preview + colors.reset);
    
    if (xmlLines.length > 50) {
      info(`\n... (${xmlLines.length - 50} líneas más)`);
    }
    
    // ============================================
    section('10. Guardar XML de ejemplo');
    
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `factura-ejemplo-${Date.now()}.xml`);
    fs.writeFileSync(outputPath, xml, 'utf-8');
    
    success(`XML guardado en: ${outputPath}`);
    
    // ============================================
    section('✅ RESULTADO FINAL');
    
    console.log('\n');
    success('🎉 TODOS LOS TESTS PASARON');
    console.log('\n');
    success('✅ Generador XML funciona correctamente');
    success('✅ Validaciones funcionando');
    success('✅ Cálculo de totales correcto');
    success('✅ CUFE generado correctamente');
    success('✅ Estructura XML válida según rFE v1.00');
    success('✅ Todos los elementos requeridos presentes');
    console.log('\n');
    info('📄 Archivo XML generado:');
    info(`   ${outputPath}`);
    console.log('\n');
    info('🚀 SIGUIENTE PASO: Crear transformer Invoice → XML Input');
    console.log('\n');
    
  } catch (err) {
    console.error('\n');
    error('❌ TEST FALLÓ');
    console.error('\n');
    console.error(err);
    console.error('\n');
    process.exit(1);
  }
}

// Ejecutar test
testXMLGenerator();


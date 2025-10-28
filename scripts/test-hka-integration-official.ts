#!/usr/bin/env tsx

/**
 * Script de Prueba para Integración HKA con Credenciales Oficiales
 * 
 * Este script prueba:
 * 1. Validación de RUCs panameños
 * 2. Modo de prueba vs modo real
 * 3. Envío de documentos a HKA
 * 4. Corrección de estado ERROR
 */

import { PrismaClient } from '@prisma/client';
import { enviarDocumento } from '../lib/hka/methods/enviar-documento';
import { validarRUCCompleto, generarRUCPrueba, getRUCsValidosDemo } from '../lib/hka/utils/ruc-validator';
import { hkaTestModeWrapper } from '../lib/hka/utils/test-mode';
import { generateXMLFromInvoice } from '../lib/hka/transformers/invoice-to-xml';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 INICIANDO PRUEBAS DE INTEGRACIÓN HKA');
  console.log('=====================================\n');

  try {
    // 1. Probar validación de RUCs
    await probarValidacionRUCs();
    
    // 2. Probar modo de prueba
    await probarModoPrueba();
    
    // 3. Probar envío real con credenciales oficiales
    await probarEnvioReal();
    
    // 4. Corregir facturas con estado ERROR
    await corregirFacturasError();
    
    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function probarValidacionRUCs() {
  console.log('1️⃣ PROBANDO VALIDACIÓN DE RUCS');
  console.log('-------------------------------');
  
  // RUCs de prueba
  const rucsPrueba = [
    '123456789-1-2023-45', // Válido
    '123456789-1-2023-99', // DV incorrecto
    '123456789-6-2023-45', // Tipo RUC inválido
    '123456789-1-1999-45', // Año inválido
    generarRUCPrueba(), // Generado automáticamente
  ];
  
  for (const ruc of rucsPrueba) {
    const validation = validarRUCCompleto(ruc);
    console.log(`RUC: ${ruc}`);
    console.log(`  Válido: ${validation.isValid ? '✅' : '❌'}`);
    if (!validation.isValid) {
      console.log(`  Errores: ${validation.errors.join(', ')}`);
    }
    console.log('');
  }
  
  // Mostrar RUCs válidos para demo
  console.log('RUCs válidos para ambiente demo:');
  getRUCsValidosDemo().forEach(ruc => {
    console.log(`  ✅ ${ruc}`);
  });
  console.log('');
}

async function probarModoPrueba() {
  console.log('2️⃣ PROBANDO MODO DE PRUEBA');
  console.log('---------------------------');
  
  const config = hkaTestModeWrapper.getConfig();
  console.log(`Modo de prueba habilitado: ${config.enabled ? '✅' : '❌'}`);
  console.log(`Simular errores: ${config.simulateErrors ? '✅' : '❌'}`);
  console.log(`Tasa de error: ${config.errorRate * 100}%`);
  console.log(`Delay de respuesta: ${config.responseDelay}ms`);
  console.log('');
  
  // Probar envío en modo de prueba
  if (config.enabled) {
    console.log('Probando envío en modo de prueba...');
    try {
      const xmlPrueba = generarXMLPrueba();
      const response = await enviarDocumento(xmlPrueba, 'test-invoice-id');
      console.log(`✅ Respuesta de prueba: ${response.dMsgRes}`);
      console.log(`   CUFE: ${response.dCufe}`);
      console.log(`   Protocolo: ${response.dProtocolo}`);
    } catch (error) {
      console.log(`❌ Error en modo de prueba: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  console.log('');
}

async function probarEnvioReal() {
  console.log('3️⃣ PROBANDO ENVÍO REAL CON CREDENCIALES OFICIALES');
  console.log('------------------------------------------------');
  
  // Verificar configuración de HKA
  const config = hkaTestModeWrapper.getConfig();
  if (config.enabled) {
    console.log('⚠️ Modo de prueba está habilitado. Deshabilitando para prueba real...');
    // En producción, esto se haría cambiando la variable de entorno
    console.log('Para probar envío real, establecer HKA_MODO_PRUEBA=false en .env');
    return;
  }
  
  try {
    // Buscar una factura DRAFT para probar
    const invoice = await prisma.invoice.findFirst({
      where: { status: 'DRAFT' },
      include: {
        organization: true,
        customer: true,
        items: true
      }
    });
    
    if (!invoice) {
      console.log('❌ No se encontraron facturas DRAFT para probar');
      return;
    }
    
    console.log(`📄 Probando con factura: ${invoice.id}`);
    console.log(`   Organización: ${invoice.organization.name}`);
    console.log(`   Cliente: ${invoice.customer?.name || 'N/A'}`);
    console.log(`   Total: $${invoice.total}`);
    
    // Generar XML
    const xmlResult = await generateXMLFromInvoice(invoice);
    if (xmlResult.errores.length > 0) {
      console.log(`⚠️ Errores en XML: ${xmlResult.errores.join(', ')}`);
      return;
    }
    
    console.log(`📤 Enviando XML a HKA...`);
    console.log(`   Longitud XML: ${xmlResult.xml.length} caracteres`);
    console.log(`   CUFE generado: ${xmlResult.cufe}`);
    
    // Enviar a HKA
    const response = await enviarDocumento(xmlResult.xml, invoice.id);
    
    console.log(`✅ Respuesta de HKA:`);
    console.log(`   Código: ${response.dCodRes}`);
    console.log(`   Mensaje: ${response.dMsgRes}`);
    console.log(`   CUFE: ${response.dCufe}`);
    console.log(`   Protocolo: ${response.dProtocolo}`);
    
  } catch (error) {
    console.log(`❌ Error en envío real: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
  console.log('');
}

async function corregirFacturasError() {
  console.log('4️⃣ CORRIGIENDO FACTURAS CON ESTADO ERROR');
  console.log('----------------------------------------');
  
  // Buscar facturas con estado ERROR
  const facturasError = await prisma.invoice.findMany({
    where: { status: 'ERROR' },
    include: {
      organization: true,
      customer: true,
      items: true
    }
  });
  
  console.log(`Encontradas ${facturasError.length} facturas con estado ERROR`);
  
  for (const factura of facturasError) {
    console.log(`\n📄 Procesando factura: ${factura.id}`);
    console.log(`   Organización: ${factura.organization.name}`);
    console.log(`   Total: $${factura.total}`);
    
    try {
      // Generar XML corregido
      const xmlResult = await generateXMLFromInvoice(factura);
      
      if (xmlResult.errores.length > 0) {
        console.log(`   ⚠️ Errores en XML: ${xmlResult.errores.join(', ')}`);
        continue;
      }
      
      // Probar envío
      console.log(`   📤 Reenviando a HKA...`);
      const response = await enviarDocumento(xmlResult.xml, factura.id);
      
      console.log(`   ✅ Nuevo estado: ${response.dCodRes === '0200' ? 'CERTIFIED' : 'REJECTED'}`);
      console.log(`   📋 Mensaje: ${response.dMsgRes}`);
      
    } catch (error) {
      console.log(`   ❌ Error al procesar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  console.log('\n✅ Corrección de facturas completada');
}

function generarXMLPrueba(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dVerForm>1.00</dVerForm>
  <dId>FE0120000123456789-1-2023-450020251022TEST-1761155910643001294480738</dId>
  <gEmis>
    <gRucEmi>
      <dTipoRuc>2</dTipoRuc>
      <dRuc>123456789-1-2023</dRuc>
      <dDV>45</dDV>
    </gRucEmi>
    <dNombEm>Test HKA Organization</dNombEm>
  </gEmis>
  <gItem>
    <dTasaITBMS>04</dTasaITBMS>
    <dValITBMS>6.30</dValITBMS>
  </gItem>
  <gTot>
    <dTotNeto>100.00</dTotNeto>
    <dTotITBMS>7.00</dTotITBMS>
    <dVTot>107.00</dVTot>
  </gTot>
</rFE>`;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as testHKAIntegration };

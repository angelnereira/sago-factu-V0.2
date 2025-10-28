#!/usr/bin/env tsx

/**
 * Script para Corregir Facturas con Estado ERROR
 * 
 * Este script:
 * 1. Actualiza las organizaciones con datos reales de UBICSYS
 * 2. Corrige facturas con estado ERROR usando RUC oficial
 * 3. Reenvía las facturas a HKA con datos correctos
 */

import { PrismaClient } from '@prisma/client';
import { generateXMLFromInvoice } from '../lib/hka/transformers/invoice-to-xml';
import { enviarDocumento } from '../lib/hka/methods/enviar-documento';
import { getDatosEmisorUBICSYS, getRUCUBICSYSCompleto, verificarCertificadoUBICSYS } from '../lib/hka/config/ubicsys-config';
import { validarRUCCompleto } from '../lib/hka/utils/ruc-validator';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 CORRIGIENDO FACTURAS CON ESTADO ERROR');
  console.log('=======================================\n');

  try {
    // 1. Verificar certificado UBICSYS
    await verificarCertificadoUBICSYS();
    
    // 2. Actualizar organizaciones con datos reales
    await actualizarOrganizacionesUBICSYS();
    
    // 3. Corregir facturas con estado ERROR
    await corregirFacturasError();
    
    // 4. Verificar resultados
    await verificarResultados();
    
    console.log('\n✅ CORRECCIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error en la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function verificarCertificadoUBICSYS() {
  console.log('1️⃣ VERIFICANDO CERTIFICADO UBICSYS');
  console.log('----------------------------------');
  
  const certificado = verificarCertificadoUBICSYS();
  const datosUBICSYS = getDatosEmisorUBICSYS();
  
  console.log(`RUC UBICSYS: ${datosUBICSYS.ruc}-${datosUBICSYS.dv}`);
  console.log(`Razón Social: ${datosUBICSYS.razonSocial}`);
  console.log(`Nombre Comercial: ${datosUBICSYS.nombreComercial}`);
  console.log(`Certificado vigente: ${certificado.vigente ? '✅' : '❌'}`);
  console.log(`Días restantes: ${certificado.diasRestantes}`);
  
  if (!certificado.vigente) {
    console.log('⚠️ ADVERTENCIA: El certificado de UBICSYS ha expirado');
  }
  
  // Validar RUC oficial
  const rucCompleto = getRUCUBICSYSCompleto();
  const validation = validarRUCCompleto(rucCompleto);
  console.log(`RUC válido: ${validation.isValid ? '✅' : '❌'}`);
  if (!validation.isValid) {
    console.log(`Errores: ${validation.errors.join(', ')}`);
  }
  console.log('');
}

async function actualizarOrganizacionesUBICSYS() {
  console.log('2️⃣ ACTUALIZANDO ORGANIZACIONES CON DATOS UBICSYS');
  console.log('-----------------------------------------------');
  
  const datosUBICSYS = getDatosEmisorUBICSYS();
  
  // Buscar organizaciones que necesiten actualización
  const organizaciones = await prisma.organization.findMany({
    where: {
      OR: [
        { ruc: { contains: '123456789' } }, // RUCs de prueba
        { ruc: { contains: '987654321' } }, // RUCs de prueba alternativos
        { ruc: null },
        { ruc: '' }
      ]
    }
  });
  
  console.log(`Encontradas ${organizaciones.length} organizaciones para actualizar`);
  
  for (const org of organizaciones) {
    console.log(`\n📄 Actualizando organización: ${org.name} (${org.id})`);
    console.log(`   RUC anterior: ${org.ruc || 'N/A'}`);
    
    try {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          ruc: datosUBICSYS.ruc,
          dv: datosUBICSYS.dv,
          name: datosUBICSYS.razonSocial,
          tradeName: datosUBICSYS.nombreComercial,
          email: datosUBICSYS.email,
          phone: datosUBICSYS.telefono,
          address: datosUBICSYS.direccion,
          province: datosUBICSYS.provincia,
          district: datosUBICSYS.distrito,
          corregimiento: datosUBICSYS.corregimiento
        }
      });
      
      console.log(`   ✅ RUC actualizado: ${datosUBICSYS.ruc}-${datosUBICSYS.dv}`);
      
    } catch (error) {
      console.log(`   ❌ Error al actualizar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  console.log('\n✅ Actualización de organizaciones completada');
}

async function corregirFacturasError() {
  console.log('\n3️⃣ CORRIGIENDO FACTURAS CON ESTADO ERROR');
  console.log('----------------------------------------');
  
  // Buscar facturas con estado ERROR
  const facturasError = await prisma.invoice.findMany({
    where: { status: 'ERROR' },
    include: {
      organization: true,
      customer: true,
      items: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Encontradas ${facturasError.length} facturas con estado ERROR`);
  
  let corregidas = 0;
  let errores = 0;
  
  for (const factura of facturasError) {
    console.log(`\n📄 Procesando factura: ${factura.id}`);
    console.log(`   Organización: ${factura.organization.name}`);
    console.log(`   Cliente: ${factura.customer?.name || 'N/A'}`);
    console.log(`   Total: $${factura.total}`);
    console.log(`   Creada: ${factura.createdAt.toISOString()}`);
    
    try {
      // Verificar que la organización tenga datos correctos
      if (!factura.organization.ruc || factura.organization.ruc.includes('123456789')) {
        console.log(`   ⚠️ Organización necesita datos UBICSYS`);
        continue;
      }
      
      // Generar XML corregido
      console.log(`   🔧 Generando XML corregido...`);
      const xmlResult = await generateXMLFromInvoice(factura);
      
      if (xmlResult.errores.length > 0) {
        console.log(`   ❌ Errores en XML: ${xmlResult.errores.join(', ')}`);
        errores++;
        continue;
      }
      
      console.log(`   📤 XML generado: ${xmlResult.xml.length} caracteres`);
      console.log(`   🔑 CUFE: ${xmlResult.cufe}`);
      
      // Reenviar a HKA
      console.log(`   📤 Reenviando a HKA...`);
      const response = await enviarDocumento(xmlResult.xml, factura.id);
      
      const nuevoEstado = response.dCodRes === '0200' ? 'CERTIFIED' : 'REJECTED';
      console.log(`   ✅ Nuevo estado: ${nuevoEstado}`);
      console.log(`   📋 Código HKA: ${response.dCodRes}`);
      console.log(`   📋 Mensaje: ${response.dMsgRes}`);
      
      if (response.dCufe) {
        console.log(`   🔑 CUFE HKA: ${response.dCufe}`);
      }
      
      corregidas++;
      
    } catch (error) {
      console.log(`   ❌ Error al procesar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      errores++;
    }
  }
  
  console.log(`\n📊 RESUMEN DE CORRECCIÓN:`);
  console.log(`   ✅ Facturas corregidas: ${corregidas}`);
  console.log(`   ❌ Facturas con errores: ${errores}`);
  console.log(`   📄 Total procesadas: ${facturasError.length}`);
}

async function verificarResultados() {
  console.log('\n4️⃣ VERIFICANDO RESULTADOS');
  console.log('-------------------------');
  
  // Contar facturas por estado
  const estados = await prisma.invoice.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  
  console.log('Estado actual de las facturas:');
  estados.forEach(estado => {
    const icono = estado.status === 'CERTIFIED' ? '✅' : 
                  estado.status === 'ERROR' ? '❌' : 
                  estado.status === 'DRAFT' ? '📄' : '⚠️';
    console.log(`   ${icono} ${estado.status}: ${estado._count.status}`);
  });
  
  // Mostrar últimas facturas procesadas
  const ultimasFacturas = await prisma.invoice.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: {
      organization: true,
      customer: true
    }
  });
  
  console.log('\nÚltimas 5 facturas procesadas:');
  ultimasFacturas.forEach(factura => {
    const icono = factura.status === 'CERTIFIED' ? '✅' : 
                  factura.status === 'ERROR' ? '❌' : 
                  factura.status === 'DRAFT' ? '📄' : '⚠️';
    console.log(`   ${icono} ${factura.id} - ${factura.status} - $${factura.total}`);
  });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as corregirFacturasError };

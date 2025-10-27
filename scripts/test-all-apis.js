#!/usr/bin/env node

/**
 * Script exhaustivo para probar TODAS las APIs del proyecto
 * Captura detalles completos de requests y responses
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

let results = {
  success: 0,
  failed: 0,
  authErrors: 0,
  total: 0,
  details: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(name, method, endpoint, body = null, needsAuth = true) {
  results.total++;
  const url = `${API_BASE}${endpoint}`;
  
  log(`\n[${results.total}] ${name}`, 'cyan');
  log(`   ${method} ${endpoint}`, 'blue');
  
  const startTime = Date.now();
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      log(`   Body: ${JSON.stringify(body).substring(0, 100)}...`, 'gray');
    }
    
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { rawResponse: text.substring(0, 200) };
    }
    
    const isSuccess = response.ok;
    
    if (isSuccess) {
      log(`   ✅ Status: ${response.status} (${duration}ms)`, 'green');
      results.success++;
    } else {
      if (response.status === 401 || response.status === 403) {
        log(`   ⚠️  Status: ${response.status} - ${needsAuth ? 'Auth requerida (esperado)' : 'Error inesperado'}`, 'yellow');
        results.authErrors++;
      } else {
        log(`   ❌ Status: ${response.status}`, 'red');
        results.failed++;
      }
    }
    
    // Detalles técnicos
    const detail = {
      name,
      endpoint,
      method,
      status: response.status,
      duration,
      success: isSuccess,
      needsAuth,
      responseSize: JSON.stringify(data).length,
      headers: Object.fromEntries(response.headers.entries()),
      data: JSON.stringify(data).substring(0, 500)
    };
    
    results.details.push(detail);
    
    // Mostrar respuesta (limitada)
    const dataStr = JSON.stringify(data, null, 2).substring(0, 300);
    log(`   Response: ${dataStr}${dataStr.length >= 300 ? '...' : ''}`, 'gray');
    
    if (response.status >= 500) {
      log(`   ⚠️  ERROR DEL SERVIDOR`, 'red');
    }
    
    return detail;
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    results.failed++;
    
    results.details.push({
      name,
      endpoint,
      method,
      status: 0,
      duration: Date.now() - startTime,
      success: false,
      needsAuth,
      error: error.message
    });
    
    return null;
  }
}

async function main() {
  log('\n🧪 SAGO-FACTU - TESTING EXHAUSTIVO DE TODAS LAS APIs', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // CATEGORÍA 1: AUTHENTICATION
  log('\n📋 CATEGORÍA 1: Autenticación', 'cyan');
  await testAPI('NextAuth Handler', 'GET', '/api/auth/[...nextauth]', null, false);
  
  // CATEGORÍA 2: HKA INTEGRATION
  log('\n📋 CATEGORÍA 2: Integración HKA', 'cyan');
  await testAPI('Test HKA Connection', 'GET', '/api/hka/test-connection', null, false);
  
  // CATEGORÍA 3: FOLIOS
  log('\n📋 CATEGORÍA 3: Gestión de Folios', 'cyan');
  await testAPI('Folios Disponibles', 'GET', '/api/folios/available', null, true);
  await testAPI('Comprar Folios', 'POST', '/api/folios/purchase', {
    amount: 100,
    organizationId: 'test'
  }, true);
  await testAPI('Sincronizar Folios', 'POST', '/api/folios/sincronizar', null, true);
  await testAPI('Folios Tiempo Real', 'GET', '/api/folios/tiempo-real', null, true);
  
  // CATEGORÍA 4: FACTURAS
  log('\n📋 CATEGORÍA 4: Gestión de Facturas', 'cyan');
  await testAPI('Crear Factura', 'POST', '/api/invoices/create', {
    receiverName: 'Test Client',
    receiverRuc: '123456789-1-2023',
    total: 100.00
  }, true);
  
  // CATEGORÍA 5: DOCUMENTOS HKA
  log('\n📋 CATEGORÍA 5: Documentos HKA', 'cyan');
  await testAPI('Enviar Documento', 'POST', '/api/documentos/enviar', null, true);
  await testAPI('Consultar Documento', 'POST', '/api/documentos/consultar', null, true);
  await testAPI('Anular Documento', 'POST', '/api/documentos/anular', null, true);
  
  // CATEGORÍA 6: NOTIFICACIONES
  log('\n📋 CATEGORÍA 6: Notificaciones', 'cyan');
  await testAPI('Obtener Notificaciones', 'GET', '/api/notifications', null, true);
  await testAPI('Crear Notificación', 'POST', '/api/notifications', {
    type: 'info',
    title: 'Test',
    message: 'Test notification'
  }, true);
  
  // CATEGORÍA 7: CONFIGURACIÓN
  log('\n📋 CATEGORÍA 7: Configuración', 'cyan');
  await testAPI('Test HKA Config', 'GET', '/api/configuration/test-hka-connection', null, true);
  await testAPI('Org Settings', 'PUT', '/api/configuration/organization', null, true);
  await testAPI('Invoice Settings', 'PUT', '/api/configuration/invoice-settings', null, true);
  await testAPI('Notification Settings', 'PUT', '/api/configuration/notifications', null, true);
  await testAPI('Security Settings', 'PUT', '/api/configuration/security', null, true);
  
  // CATEGORÍA 8: ADMIN
  log('\n📋 CATEGORÍA 8: Admin (SUPER_ADMIN)', 'cyan');
  await testAPI('Admin Folios Assign', 'POST', '/api/admin/folios/assign', null, true);
  await testAPI('Admin Organizations', 'GET', '/api/admin/organizations', null, true);
  await testAPI('Admin Users Create', 'POST', '/api/admin/users/create', null, true);
  
  // RESUMEN
  log('\n' + '='.repeat(80), 'magenta');
  log('📊 RESUMEN COMPLETO DE PRUEBAS', 'magenta');
  log('='.repeat(80), 'magenta');
  
  log(`\nTotal APIs probadas: ${results.total}`, 'cyan');
  log(`✅ Exitosas: ${results.success}`, 'green');
  log(`❌ Fallidas: ${results.failed}`, 'red');
  log(`🔒 Auth Requerida: ${results.authErrors}`, 'yellow');
  log(`Porcentaje: ${((results.success / results.total) * 100).toFixed(1)}%`, 'cyan');
  
  // Detalles técnicos
  log('\n📋 DETALLES TÉCNICOS:', 'cyan');
  log('-'.repeat(80), 'gray');
  
  results.details.forEach((detail, index) => {
    log(`\n${index + 1}. ${detail.name}`, 'cyan');
    log(`   Endpoint: ${detail.method} ${detail.endpoint}`, 'gray');
    log(`   Status: ${detail.status} | Duración: ${detail.duration}ms | Size: ${detail.responseSize}B`, 'gray');
    log(`   Auth: ${detail.needsAuth ? 'Requerida' : 'No requerida'}`, 'gray');
  });
  
  // Exportar resultados
  const fs = require('fs');
  fs.writeFileSync('reports/api-test-detailed.json', JSON.stringify(results, null, 2));
  log('\n💾 Resultados guardados en: reports/api-test-detailed.json', 'green');
  
  if (results.failed > 0) {
    log('\n⚠️  Algunas APIs fallaron. Revisa los detalles arriba.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ Todas las APIs probadas correctamente!', 'green');
    process.exit(0);
  }
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});


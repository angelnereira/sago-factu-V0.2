#!/usr/bin/env node

/**
 * Script para probar todas las APIs del proyecto
 * Uso: node scripts/test-apis.js
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

let results = {
  success: 0,
  failed: 0,
  total: 0,
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(name, method, endpoint, body = null) {
  results.total++;
  const url = `${API_BASE}${endpoint}`;
  
  log(`\n[${results.total}] Testing: ${name}`, 'cyan');
  log(`   ${method} ${endpoint}`, 'blue');
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`   ✅ Status: ${response.status}`, 'green');
      results.success++;
    } else {
      log(`   ❌ Status: ${response.status}`, 'red');
      log(`   Error: ${data.error || 'Unknown error'}`, 'red');
      results.failed++;
    }
    
    // Mostrar respuesta (limitada)
    const dataStr = JSON.stringify(data, null, 2).substring(0, 500);
    log(`   Response: ${dataStr}${dataStr.length >= 500 ? '...' : ''}`, 'yellow');
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    results.failed++;
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n🧪 SAGO-FACTU API TESTING SUITE', 'magenta');
  log('='.repeat(60), 'magenta');
  
  // 1. Test HKA Connection (sin auth)
  log('\n📋 SECTION 1: HKA Integration', 'cyan');
  await testAPI('HKA Test Connection', 'GET', '/api/hka/test-connection');
  
  // 2. Test Notifications (requiere auth)
  log('\n📋 SECTION 2: Notifications', 'cyan');
  await testAPI('Get Notifications', 'GET', '/api/notifications');
  
  // 3. Test Folios (requiere auth)
  log('\n📋 SECTION 3: Folios', 'cyan');
  await testAPI('Available Folios', 'GET', '/api/folios/available');
  
  // 4. Resumen
  log('\n' + '='.repeat(60), 'magenta');
  log('📊 RESUMEN DE PRUEBAS', 'magenta');
  log('='.repeat(60), 'magenta');
  log(`Total: ${results.total}`, 'cyan');
  log(`✅ Exitosos: ${results.success}`, 'green');
  log(`❌ Fallidos: ${results.failed}`, 'red');
  log(`Porcentaje: ${((results.success / results.total) * 100).toFixed(1)}%`, 'cyan');
  
  if (results.failed > 0) {
    log('\n⚠️  Algunas APIs fallaron. Revisa los logs arriba.', 'yellow');
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


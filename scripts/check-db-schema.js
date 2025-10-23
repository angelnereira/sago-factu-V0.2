// Script para verificar el estado actual del schema en la BD
const { Pool } = require('pg');

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verificando estado del schema en Neon PostgreSQL...\n');

    // 1. Listar todas las tablas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 TABLAS EXISTENTES:');
    console.log('─'.repeat(50));
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    console.log('');

    // 2. Verificar columnas de organizations
    console.log('🏢 COLUMNAS EN "organizations":');
    console.log('─'.repeat(50));
    const orgColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'organizations'
      ORDER BY ordinal_position;
    `);

    const orgColumns = orgColumnsResult.rows.map(r => r.column_name);
    console.log(`Total: ${orgColumns.length} columnas`);
    
    const newOrgFields = [
      'rucType', 'tradeName', 'branchCode', 'locationCode',
      'province', 'district', 'corregimiento',
      'autoSendToHKA', 'requireApproval', 'emailOnCertification',
      'emailOnError', 'lowFoliosThreshold'
    ];

    console.log('\n✅ Campos nuevos para HKA:');
    newOrgFields.forEach(field => {
      const exists = orgColumns.includes(field);
      console.log(`  ${exists ? '✓' : '✗'} ${field} ${exists ? '(existe)' : '(FALTA)'}`);
    });

    // 3. Verificar columnas de invoices
    console.log('\n📄 COLUMNAS EN "invoices":');
    console.log('─'.repeat(50));
    const invColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'invoices'
      ORDER BY ordinal_position;
    `);

    const invColumns = invColumnsResult.rows.map(r => r.column_name);
    console.log(`Total: ${invColumns.length} columnas`);

    const newInvFields = [
      'pointOfSale', 'securityCode', 'deliveryDate',
      'paymentMethod', 'paymentTerm', 'xmlContent'
    ];

    console.log('\n✅ Campos nuevos para XML:');
    newInvFields.forEach(field => {
      const exists = invColumns.includes(field);
      console.log(`  ${exists ? '✓' : '✗'} ${field} ${exists ? '(existe)' : '(FALTA)'}`);
    });

    // 4. Verificar si existe tabla customers
    console.log('\n👥 TABLA "customers":');
    console.log('─'.repeat(50));
    const customerTableExists = tablesResult.rows.some(r => r.table_name === 'customers');
    console.log(`  ${customerTableExists ? '✓ EXISTE' : '✗ NO EXISTE (FALTA CREAR)'}`);

    if (customerTableExists) {
      const custColumnsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.columns 
        WHERE table_name = 'customers';
      `);
      console.log(`  Columnas: ${custColumnsResult.rows[0].count}`);
    }

    // 5. Verificar invoice_items
    console.log('\n📦 COLUMNAS EN "invoice_items":');
    console.log('─'.repeat(50));
    const itemColumnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'invoice_items'
      ORDER BY ordinal_position;
    `);

    const itemColumns = itemColumnsResult.rows.map(r => r.column_name);
    const hasDiscountedPrice = itemColumns.includes('discountedPrice');
    console.log(`  ${hasDiscountedPrice ? '✓' : '✗'} discountedPrice ${hasDiscountedPrice ? '(existe)' : '(FALTA)'}`);

    // 6. Resumen
    console.log('\n' + '═'.repeat(50));
    console.log('📊 RESUMEN:');
    console.log('═'.repeat(50));

    const missingOrgFields = newOrgFields.filter(f => !orgColumns.includes(f));
    const missingInvFields = newInvFields.filter(f => !invColumns.includes(f));

    if (missingOrgFields.length === 0 && 
        missingInvFields.length === 0 && 
        customerTableExists && 
        hasDiscountedPrice) {
      console.log('✅ SCHEMA COMPLETO - Todos los campos existen');
      console.log('   Puedes continuar con el generador XML');
    } else {
      console.log('⚠️  SCHEMA INCOMPLETO - Faltan campos/tablas:');
      if (missingOrgFields.length > 0) {
        console.log(`   - Organization: ${missingOrgFields.length} campos faltantes`);
      }
      if (missingInvFields.length > 0) {
        console.log(`   - Invoice: ${missingInvFields.length} campos faltantes`);
      }
      if (!customerTableExists) {
        console.log(`   - Customer: tabla completa faltante`);
      }
      if (!hasDiscountedPrice) {
        console.log(`   - InvoiceItem: campo discountedPrice faltante`);
      }
      console.log('\n   🔧 ACCIÓN REQUERIDA: Ejecutar "npx prisma db push"');
    }

  } catch (error) {
    console.error('❌ Error al verificar schema:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();


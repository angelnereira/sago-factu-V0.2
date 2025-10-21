const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf-8');

// Detectar el proveedor actual
const isSQLite = schema.includes('provider = "sqlite"') || schema.includes('provider  = "sqlite"');
const isPostgreSQL = schema.includes('provider = "postgresql"') || schema.includes('provider  = "postgresql"');

// Detectar si estamos en Vercel por la DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || '';
const shouldBePostgreSQL = databaseUrl.startsWith('postgres');

console.log('🔍 Verificando proveedor de base de datos...');
console.log(`   - Proveedor actual: ${isSQLite ? 'SQLite' : isPostgreSQL ? 'PostgreSQL' : 'Desconocido'}`);
console.log(`   - DATABASE_URL empieza con: ${databaseUrl.substring(0, 10)}...`);
console.log(`   - Debería ser: ${shouldBePostgreSQL ? 'PostgreSQL' : 'SQLite'}`);

if (shouldBePostgreSQL && isSQLite) {
  console.log('🔄 Cambiando a PostgreSQL para Vercel...');
  
  // Cambiar provider a postgresql
  let newSchema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  
  // Cambiar String a Json para metadata
  newSchema = newSchema.replace(/metadata\s+String\?\s+\/\/ JSON como string para SQLite/g, 'metadata Json?');
  
  // Cambiar Float a Decimal para montos
  newSchema = newSchema.replace(/purchaseAmount\s+Float/g, 'purchaseAmount Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/subtotal\s+Float/g, 'subtotal Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/discount\s+Float/g, 'discount Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/subtotalAfterDiscount\s+Float/g, 'subtotalAfterDiscount Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/itbms\s+Float/g, 'itbms Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/total\s+Float/g, 'total Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/quantity\s+Float/g, 'quantity Decimal @db.Decimal(12, 4)');
  newSchema = newSchema.replace(/unitPrice\s+Float/g, 'unitPrice Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/taxRate\s+Float/g, 'taxRate Decimal @db.Decimal(5, 2)');
  newSchema = newSchema.replace(/taxAmount\s+Float/g, 'taxAmount Decimal @db.Decimal(12, 2)');
  newSchema = newSchema.replace(/discountRate\s+Float/g, 'discountRate Decimal @db.Decimal(5, 2)');
  
  fs.writeFileSync(schemaPath, newSchema);
  console.log('✅ Schema actualizado a PostgreSQL');
} else if (!shouldBePostgreSQL && isPostgreSQL) {
  console.log('ℹ️  PostgreSQL detectado pero DATABASE_URL es SQLite - manteniendo PostgreSQL');
  console.log('   (Esto es normal en desarrollo local antes de generar el cliente)');
} else {
  console.log('✅ Proveedor correcto, no se necesitan cambios');
}


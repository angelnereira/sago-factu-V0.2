const { PrismaClient } = require('@prisma/client');

async function testNeonConnection() {
  console.log('🧪 Probando conexión a Neon...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Probar conexión básica
    await prisma.$connect();
    console.log('✅ Conexión a Neon exitosa!');
    
    // Probar que podemos hacer queries
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de prueba exitosa:', result);
    
    // Verificar que las tablas existen
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Tablas en la base de datos:', tables);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('💡 Asegúrate de que DATABASE_URL esté configurada correctamente');
  } finally {
    await prisma.$disconnect();
  }
}

testNeonConnection();

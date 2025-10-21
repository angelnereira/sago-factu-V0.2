const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Configurando base de datos...\n');

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // Crear organización de ejemplo
    const organization = await prisma.organization.upsert({
      where: { ruc: '123456789-1' },
      update: {},
      create: {
        slug: 'empresa-demo',
        name: 'Empresa Demo S.A.',
        ruc: '123456789-1',
        dv: '1',
        email: 'demo@empresa.com',
        phone: '+507 1234-5678',
        address: 'Panamá, Panamá',
        hkaEnabled: true,
        maxUsers: 100,
        maxFolios: 10000,
        isActive: true,
        metadata: JSON.stringify({
          theme: 'light',
          timezone: 'America/Panama',
          currency: 'PAB',
          language: 'es'
        })
      },
    });

    console.log('✅ Organización creada:', organization.name);

    // Crear Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@sagofactu.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    
    const superAdmin = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {},
      create: {
        email: superAdminEmail,
        name: 'Super Admin',
        password: await bcrypt.hash(superAdminPassword, 12),
        role: 'SUPER_ADMIN',
        isActive: true,
        organizationId: organization.id,
      },
    });

    console.log('✅ Super Admin creado:', superAdmin.email);
    console.log('🔑 Contraseña:', superAdminPassword);

    // Crear usuario de prueba
    const testUser = await prisma.user.upsert({
      where: { email: 'usuario@empresa.com' },
      update: {},
      create: {
        email: 'usuario@empresa.com',
        name: 'Usuario Demo',
        password: await bcrypt.hash('usuario123', 12),
        role: 'USER',
        organizationId: organization.id,
        isActive: true,
      },
    });

    console.log('✅ Usuario de prueba creado:', testUser.email);
    console.log('\n🎉 Base de datos configurada exitosamente!');

  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

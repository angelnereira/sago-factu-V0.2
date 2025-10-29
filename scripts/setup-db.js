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
    // Buscar por RUC primero, si no existe, buscar por slug
    let organization = await prisma.organization.findUnique({
      where: { ruc: '123456789-1' },
    });

    if (!organization) {
      // Si no existe por RUC, verificar si existe por slug
      organization = await prisma.organization.findUnique({
        where: { slug: 'empresa-demo' },
      });

      if (organization) {
        // Si existe por slug pero con diferente RUC, actualizar el RUC
        try {
          organization = await prisma.organization.update({
            where: { slug: 'empresa-demo' },
            data: {
              ruc: '123456789-1',
              dv: '1',
            },
          });
          console.log('✅ Organización actualizada:', organization.name);
        } catch (updateError) {
          // Si falla la actualización, continuar con la organización existente
          console.log('⚠️  Organización existe con diferente RUC, continuando...');
        }
      } else {
        // Crear nueva organización solo si no existe
        try {
          organization = await prisma.organization.create({
            data: {
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
        } catch (createError) {
          // Si falla por unique constraint, intentar obtener la existente
          if (createError.code === 'P2002') {
            console.log('⚠️  Organización ya existe, obteniendo existente...');
            organization = await prisma.organization.findFirst({
              where: {
                OR: [
                  { ruc: '123456789-1' },
                  { slug: 'empresa-demo' }
                ]
              },
            });
            if (organization) {
              console.log('✅ Organización encontrada:', organization.name);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }
    } else {
      console.log('✅ Organización ya existe:', organization.name);
    }

    if (!organization) {
      throw new Error('No se pudo crear o encontrar la organización');
    }

    // Crear Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@sagofactu.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SagoAdmin2025!';
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });
    
    let superAdmin;
    if (existingUser) {
      // Si ya existe, solo asegurar que esté activo, NO cambiar la contraseña
      superAdmin = await prisma.user.update({
        where: { email: superAdminEmail },
        data: {
          isActive: true,
        },
      });
      console.log('✅ Super Admin ya existe:', superAdmin.email);
      console.log('   (Contraseña NO modificada)');
    } else {
      // Solo crear si no existe
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
      superAdmin = await prisma.user.create({
        data: {
          email: superAdminEmail,
          name: 'Super Admin',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          organizationId: organization.id,
        },
      });
      console.log('✅ Super Admin creado:', superAdmin.email);
      console.log('🔑 Contraseña:', superAdminPassword);
    }

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

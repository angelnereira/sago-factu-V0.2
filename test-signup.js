const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testSignup() {
  console.log('🧪 Probando registro de usuario...\n');
  
  try {
    const email = 'test@test.com';
    const name = 'Usuario Test';
    const password = 'test123';

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  Usuario ya existe, eliminándolo...');
      await prisma.user.delete({ where: { email } });
    }

    // Buscar la organización
    let organization = await prisma.organization.findFirst({
      where: { slug: "empresa-demo" }
    });

    if (!organization) {
      console.log('📝 Creando organización demo...');
      organization = await prisma.organization.create({
        data: {
          slug: "empresa-demo",
          name: "Empresa Demo S.A.",
          ruc: "123456789-1",
          dv: "1",
          email: "demo@empresa.com",
          phone: "+507 1234-5678",
          address: "Panamá, Panamá",
          hkaEnabled: true,
          maxUsers: 100,
          maxFolios: 10000,
          isActive: true,
          metadata: JSON.stringify({
            theme: "light",
            timezone: "America/Panama",
            currency: "PAB",
            language: "es"
          })
        }
      });
      console.log('✅ Organización creada');
    } else {
      console.log('✅ Organización encontrada:', organization.name);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "USER",
        organizationId: organization.id,
        isActive: true
      }
    });

    console.log('\n✅ Usuario creado exitosamente:');
    console.log('   - Email:', user.email);
    console.log('   - Nombre:', user.name);
    console.log('   - Rol:', user.role);
    console.log('   - Organización:', organization.name);
    
  } catch (error) {
    console.error('\n❌ Error durante el registro:');
    console.error('   - Mensaje:', error.message);
    console.error('   - Código:', error.code);
    console.error('   - Meta:', error.meta);
    if (error.stack) {
      console.error('\n📋 Stack trace:');
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSignup();

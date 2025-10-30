import { PrismaClient, OrganizationPlan, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encryptToken } from '../lib/utils/encryption';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Verificando/Creando usuario Plan Simple...');
  console.log('');

  // Buscar o crear organización Plan Simple
  let org = await prisma.organization.findUnique({
    where: { slug: 'demo-plan-simple' }
  });

  if (!org) {
    // Crear organización
    org = await prisma.organization.create({
      data: {
        name: 'Demo Plan Simple',
        slug: 'demo-plan-simple',
        plan: OrganizationPlan.SIMPLE,
        email: 'simple@demo.com',
        address: 'Panamá, Panamá',
        // Credenciales de demo de HKA
        hkaTokenUser: 'walgofugiitj_ws_tfhka',
        hkaTokenPassword: encryptToken('Octopusp1oQs5'),
        hkaEnvironment: 'demo',
      }
    });
    console.log(`✅ Organización creada: ${org.id}`);
  } else {
    console.log(`⚠️  Organización ya existe: ${org.id}`);
  }
  
  console.log(`   Nombre: ${org.name}`);
  console.log(`   Plan: ${org.plan}`);
  console.log('');

  // Buscar o crear usuario
  let user = await prisma.user.findUnique({
    where: { email: 'simple@test.com' }
  });

  if (!user) {
    // Crear usuario
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    user = await prisma.user.create({
      data: {
        email: 'simple@test.com',
        password: hashedPassword,
        name: 'Usuario Simple Demo',
        role: UserRole.SIMPLE_USER,
        organizationId: org.id,
        emailNotifications: true,
      }
    });
    console.log(`✅ Usuario creado: ${user.id}`);
  } else {
    console.log(`⚠️  Usuario ya existe: ${user.id}`);
    console.log(`   Actualizando información...`);
    
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        role: UserRole.SIMPLE_USER,
      }
    });
  }
  
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log('');

  console.log('📋 Credenciales de acceso:');
  console.log('   Email: simple@test.com');
  console.log('   Password: Password123!');
  console.log('');
  console.log('✨ Puedes iniciar sesión y probar el Plan Simple');
  console.log('   Accede a: http://localhost:3000/');
  console.log('   Después del login, serás redirigido a: http://localhost:3000/simple');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


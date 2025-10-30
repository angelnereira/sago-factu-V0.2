import { PrismaClient, OrganizationPlan, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encryptToken } from '../lib/utils/encryption';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando usuario Plan Simple...');
  console.log('');

  // Crear organización Plan Simple
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Plan Simple',
      slug: 'demo-plan-simple',
      plan: OrganizationPlan.SIMPLE,
      email: 'simple@demo.com',
      address: 'Panamá, Panamá',
      // Credenciales de demo de HKA (las que ya tienes configuradas en .env)
      hkaTokenUser: 'walgofugiitj_ws_tfhka',
      hkaTokenPassword: encryptToken('Octopusp1oQs5'), // Encriptar password
      hkaEnvironment: 'demo',
    }
  });

  console.log(`✅ Organización creada: ${org.id}`);
  console.log(`   Nombre: ${org.name}`);
  console.log(`   Plan: ${org.plan}`);
  console.log('');

  // Crear usuario
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const user = await prisma.user.create({
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


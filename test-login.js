const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🧪 Probando login...\n');
  
  try {
    // 1. Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: 'admin@sagofactu.com' },
      include: { organization: true }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', user.email);
    console.log('   - Nombre:', user.name);
    console.log('   - Rol:', user.role);
    console.log('   - Activo:', user.isActive);
    console.log('   - Organización:', user.organization?.name);
    
    // 2. Verificar contraseña
    const password = 'admin123';
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    console.log('\n🔐 Verificación de contraseña:');
    console.log('   - Contraseña probada:', password);
    console.log('   - Resultado:', isValidPassword ? '✅ VÁLIDA' : '❌ INVÁLIDA');
    
    if (isValidPassword) {
      console.log('\n🎉 LOGIN EXITOSO - El usuario puede autenticarse');
      console.log('   - Email:', user.email);
      console.log('   - Contraseña:', password);
    } else {
      console.log('\n❌ LOGIN FALLIDO - Contraseña incorrecta');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

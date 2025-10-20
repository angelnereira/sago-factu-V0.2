const { signIn } = require('./lib/auth');

async function testNextAuth() {
  console.log('🧪 Probando NextAuth...\n');
  
  try {
    const result = await signIn('credentials', {
      email: 'admin@sagofactu.com',
      password: 'admin123',
      redirect: false
    });
    
    console.log('📋 Resultado de signIn:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result?.error) {
      console.log('\n❌ Error en NextAuth:', result.error);
    } else {
      console.log('\n✅ NextAuth funcionando correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba de NextAuth:', error.message);
    console.error('Stack:', error.stack);
  }
}

testNextAuth();

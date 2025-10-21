/**
 * Test del formulario de signup completo
 * Simula exactamente lo que hace el navegador
 */

const http = require('http')

const testData = {
  name: `Test User ${Date.now()}`,
  email: `test${Date.now()}@ejemplo.com`,
  password: 'password123',
  confirmPassword: 'password123'
}

console.log('🧪 Probando formulario de registro...\n')
console.log('Datos de prueba:')
console.log('  Nombre:', testData.name)
console.log('  Email:', testData.email)
console.log('  Password:', testData.password)
console.log('\n🌐 Enviando POST a /auth/signup...\n')

// Crear FormData como string (application/x-www-form-urlencoded)
const formData = Object.keys(testData)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(testData[key])}`)
  .join('&')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(formData),
  }
}

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`)
  console.log(`📋 Headers:`, res.headers)
  
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('\n📄 Respuesta completa:')
    console.log(data.substring(0, 500))
    
    if (res.statusCode === 302 || res.statusCode === 307) {
      console.log('\n✅ Redirección detectada')
      console.log('   Location:', res.headers.location)
      
      if (res.headers.location.includes('error=')) {
        const errorMatch = res.headers.location.match(/error=([^&]+)/)
        if (errorMatch) {
          console.log('\n❌ ERROR ENCONTRADO:', errorMatch[1])
        }
      } else if (res.headers.location.includes('signin')) {
        console.log('\n✅ ¡REGISTRO EXITOSO! Redirigiendo a login')
      }
    } else {
      console.log('\n⚠️  Status inesperado:', res.statusCode)
    }
  })
})

req.on('error', (error) => {
  console.error('\n❌ ERROR EN REQUEST:')
  console.error(error)
})

req.write(formData)
req.end()

// Timeout de seguridad
setTimeout(() => {
  console.log('\n⏱️  Test completado')
  process.exit(0)
}, 5000)


#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Configurando SAGO-FACTU...\n');

// Generar NEXTAUTH_SECRET
const nextAuthSecret = crypto.randomBytes(32).toString('base64');

// Generar contraseña para Super Admin
const superAdminPassword = crypto.randomBytes(16).toString('hex');

// Leer template de .env
const envTemplate = fs.readFileSync(path.join(__dirname, '../env.example'), 'utf8');

// Reemplazar valores
const envContent = envTemplate
  .replace('generate-with-openssl-rand-base64-32', nextAuthSecret)
  .replace('SUPER_ADMIN_PASSWORD="" # CONFIGURAR', `SUPER_ADMIN_PASSWORD="${superAdminPassword}"`);

// Escribir .env
fs.writeFileSync(path.join(__dirname, '../.env'), envContent);

console.log('✅ Archivo .env creado con configuración inicial');
console.log(`🔑 NEXTAUTH_SECRET generado automáticamente`);
console.log(`👤 Super Admin Password: ${superAdminPassword}`);
console.log('\n📋 Próximos pasos:');
console.log('1. Configurar DATABASE_URL con tus credenciales de PostgreSQL');
console.log('2. Configurar AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY');
console.log('3. Configurar RESEND_API_KEY o SENDGRID_API_KEY para emails');
console.log('4. Ejecutar: npm run db:migrate');
console.log('5. Ejecutar: npm run db:seed');
console.log('6. Ejecutar: npm run dev');
console.log('\n🎉 ¡Configuración completada!');

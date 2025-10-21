#!/bin/bash

# Script de build para Vercel
echo "🚀 Iniciando build para Vercel..."

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está configurada"
    exit 1
fi

echo "📋 DATABASE_URL configurada: ${DATABASE_URL:0:30}..."

# Cambiar el proveedor de BD si es necesario
echo "🔄 Verificando proveedor de base de datos..."
node scripts/switch-db-provider.js

# Generar Prisma Client
echo "📦 Generando Prisma Client..."
npx prisma generate

# Hacer push del schema a la base de datos
echo "🗄️ Aplicando schema a la base de datos..."
npx prisma db push --accept-data-loss

# Poblar la base de datos con datos de prueba
echo "🌱 Configurando base de datos..."
node scripts/setup-db.js

# Build de Next.js
echo "🏗️ Construyendo aplicación..."
npx next build --no-lint

echo "✅ Build completado exitosamente!"

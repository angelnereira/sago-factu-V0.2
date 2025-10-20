#!/bin/bash

# Script de build para Vercel
echo "🚀 Iniciando build para Vercel..."

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está configurada"
    exit 1
fi

# Generar Prisma Client
echo "📦 Generando Prisma Client..."
npx prisma generate

# Hacer push del schema a la base de datos
echo "🗄️ Aplicando schema a la base de datos..."
npx prisma db push

# Poblar la base de datos con datos de prueba
echo "🌱 Poblando base de datos..."
npx tsx prisma/seed-simple.ts

# Build de Next.js
echo "🏗️ Construyendo aplicación..."
npx next build --no-lint

echo "✅ Build completado exitosamente!"

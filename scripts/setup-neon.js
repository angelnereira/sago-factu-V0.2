#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupNeon() {
  console.log('🚀 Configurando base de datos Neon...');
  
  // Crear cliente de Neon
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Crear tabla de usuarios si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        "emailVerified" TIMESTAMP,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        image TEXT,
        "organizationId" TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        "emailNotifications" BOOLEAN DEFAULT true,
        language TEXT DEFAULT 'es',
        timezone TEXT DEFAULT 'America/Panama',
        "isActive" BOOLEAN DEFAULT true,
        "lastLoginAt" TIMESTAMP,
        "lastLoginIp" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Crear tabla de organizaciones si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        ruc TEXT UNIQUE NOT NULL,
        dv TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT NOT NULL,
        "hkaEnabled" BOOLEAN DEFAULT true,
        "hkaTokenUser" TEXT,
        "maxUsers" INTEGER DEFAULT 10,
        "maxFolios" INTEGER,
        "isActive" BOOLEAN DEFAULT true,
        "suspendedAt" TIMESTAMP,
        "suspendReason" TEXT,
        metadata JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Crear super admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Crear organización por defecto
    const orgId = 'org_' + Date.now();
    await sql`
      INSERT INTO organizations (id, slug, name, ruc, dv, email, address, "hkaEnabled", "maxUsers", "isActive")
      VALUES (${orgId}, 'sago-factu', 'SAGO-FACTU', '123456789', '1', 'admin@sagofactu.com', 'Panamá, Panamá', true, 100, true)
      ON CONFLICT (id) DO NOTHING
    `;
    
    // Crear super admin
    await sql`
      INSERT INTO users (id, email, password, name, "organizationId", role, "isActive")
      VALUES ('admin_' + ${Date.now()}, 'admin@sagofactu.com', ${hashedPassword}, 'Super Admin', ${orgId}, 'SUPER_ADMIN', true)
      ON CONFLICT (email) DO NOTHING
    `;
    
    console.log('✅ Base de datos configurada correctamente');
    console.log('📧 Email: admin@sagofactu.com');
    console.log('🔑 Contraseña: admin123');
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    process.exit(1);
  }
}

setupNeon();


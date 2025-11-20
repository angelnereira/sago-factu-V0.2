# 📋 DOCUMENTACIÓN TÉCNICA COMPLETA - SAGO-FACTU

**Proyecto:** Sistema de Facturación Electrónica Multi-Tenant para Panamá  
**Versión:** 0.2.0  
**Fecha:** 21 de Octubre, 2025  
**Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL (Neon)

---

## 🎯 PROBLEMA ACTUAL

### **Síntoma:**
Al intentar registrar un usuario desde el formulario `/auth/signup`, se muestra el error:
```
"Error en el servidor. Intenta de nuevo."
```

### **Estado:**
- ✅ La base de datos PostgreSQL (Neon) está conectada y funcionando
- ✅ Los scripts de prueba directos funcionan correctamente
- ✅ El usuario se puede crear usando `PrismaClient` básico
- ❌ El formulario web de registro falla con "ServerError"
- ⚠️  Posible conflicto entre Prisma Extensions y Next.js 15 Server Actions

### **Testing Realizado:**
```bash
# Este script funciona ✅
node scripts/test-signup-direct.js
# Resultado: Usuario creado exitosamente en BD

# El formulario web falla ❌
http://localhost:3000/auth/signup
# Resultado: "Error en el servidor"
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
sago-factu/
├── app/                          # Next.js 15 App Router
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts      # NextAuth.js API Route
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx          # Página de Login
│   │   └── signup/
│   │       └── page.tsx          # Página de Registro (PROBLEMA AQUÍ)
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard principal
│   ├── test-signup/
│   │   └── page.tsx              # Página de prueba de registro
│   ├── layout.tsx                # Layout raíz
│   ├── page.tsx                  # Página de inicio
│   └── middleware.ts             # Middleware de autenticación
│
├── lib/                          # Bibliotecas compartidas
│   ├── auth.ts                   # Configuración de NextAuth.js
│   ├── prisma.ts                 # Prisma Client CON extensiones (lectura)
│   ├── prisma-server.ts          # Prisma Client SIN extensiones (escritura)
│   ├── prisma-utils.ts           # Utilidades de Prisma
│   ├── examples/
│   │   └── optimized-queries.ts  # Ejemplos de queries optimizadas
│   └── README-PRISMA-CLIENTS.md  # Documentación de clientes Prisma
│
├── prisma/                       # Prisma ORM
│   ├── schema.prisma             # Schema de la base de datos
│   └── seed.ts                   # Script de seed
│
├── scripts/                      # Scripts de utilidad
│   ├── diagnose-neon.js          # Diagnóstico de BD
│   ├── setup-db.js               # Setup de base de datos
│   ├── test-signup-direct.js     # Test de registro directo ✅
│   └── test-signup-form.js       # Test de formulario HTTP
│
├── .env                          # Variables de entorno
├── .env.example                  # Template de variables
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración TypeScript
├── next.config.js                # Configuración Next.js
├── tailwind.config.js            # Configuración Tailwind
└── vercel.json                   # Configuración Vercel

Documentación:
├── ARQUITECTURA-FINAL.md         # Arquitectura del sistema
├── PRISMA-OPTIMIZATIONS.md       # Optimizaciones de Prisma
├── RESUMEN-SESION-COMPLETA.md    # Resumen de cambios
├── SECURITY.md                   # Guía de seguridad
└── README.md                     # Inicio rápido
```

---

## 🔧 STACK TECNOLÓGICO

### **Frontend & Framework:**
```json
{
  "next": "15.5.6",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5"
}
```

### **Base de Datos:**
```json
{
  "@prisma/client": "^6.17.1",
  "prisma": "^6.17.1",
  "@prisma/extension-accelerate": "^2.1.1",
  "prisma-extension-pagination": "^0.8.4",
  "prisma-field-encryption": "^1.6.2"
}
```
- **Provider:** PostgreSQL
- **Host:** Neon (serverless PostgreSQL)
- **Connection:** Pooled
- **URL:** `postgresql://neondb_owner:***@ep-divine-field-ad26eaav-pooler.c-2.us-east-1.aws.neon.tech/neondb`

### **Autenticación:**
```json
{
  "next-auth": "^5.0.0-beta.25",
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6"
}
```
- **Estrategia:** JWT (sin base de datos de sesiones)
- **Provider:** Credentials (email + password)

### **UI/UX:**
```json
{
  "tailwindcss": "^4.0.14",
  "@radix-ui/react-icons": "^1.3.2",
  "@radix-ui/react-slot": "^1.1.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.5"
}
```

### **DevOps:**
```json
{
  "neonctl": "^2.5.1"
}
```

---

## 🗄️ SCHEMA DE BASE DE DATOS

### **Modelos Principales:**

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. ORGANIZACIONES (Multi-tenancy)
model Organization {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  ruc         String
  dv          String
  email       String
  phone       String?
  address     String?
  hkaEnabled  Boolean  @default(false)
  maxUsers    Int      @default(10)
  maxFolios   Int      @default(1000)
  isActive    Boolean  @default(true)
  metadata    Json?    // JSON nativo
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  users            User[]
  folios           FolioAssignment[]
  invoices         Invoice[]
  apiKeys          ApiKey[]
  
  @@index([slug])
  @@index([isActive])
}

// 2. USUARIOS
model User {
  id             String       @id @default(cuid())
  email          String       @unique
  password       String?
  name           String?
  role           UserRole     @default(USER)
  organizationId String
  isActive       Boolean      @default(true)
  lastLoginAt    DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relaciones
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  invoices     Invoice[]
  
  @@index([email])
  @@index([organizationId])
  @@index([role])
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  USER
}

// 3. POOLS DE FOLIOS
model FolioPool {
  id              String   @id @default(cuid())
  provider        String
  totalFolios     Int
  purchaseAmount  Decimal  @db.Decimal(12, 2)
  purchasedAt     DateTime @default(now())
  expiresAt       DateTime?
  isActive        Boolean  @default(true)
  metadata        Json?
  createdAt       DateTime @default(now())
  
  assignments FolioAssignment[]
  
  @@index([provider])
  @@index([isActive])
}

// 4. ASIGNACIONES DE FOLIOS
model FolioAssignment {
  id              String   @id @default(cuid())
  folioPoolId     String
  organizationId  String
  assignedAmount  Int
  consumedAmount  Int      @default(0)
  assignedAt      DateTime @default(now())
  notes           String?  @db.Text
  
  folioPool      FolioPool     @relation(fields: [folioPoolId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  consumptions   FolioConsumption[]
  
  @@index([folioPoolId])
  @@index([organizationId])
}

// 5. FACTURAS
model Invoice {
  id                    String         @id @default(cuid())
  organizationId        String
  userId                String
  invoiceNumber         String         @unique
  issueDate             DateTime
  dueDate               DateTime?
  
  // Receptor
  customerName          String
  customerRuc           String
  customerDv            String
  customerEmail         String?
  customerAddress       String?
  
  // Montos
  subtotal              Decimal        @db.Decimal(12, 2)
  discount              Decimal        @db.Decimal(12, 2) @default(0)
  subtotalAfterDiscount Decimal        @db.Decimal(12, 2)
  itbms                 Decimal        @db.Decimal(12, 2)
  total                 Decimal        @db.Decimal(12, 2)
  
  // Estado y HKA
  status                InvoiceStatus  @default(DRAFT)
  hkaFolioNumber        String?
  hkaProtocolNumber     String?
  hkaCufe               String?
  qrCode                String?        @db.Text
  
  // Metadatos
  notes                 String?        @db.Text
  internalNotes         String?        @db.Text
  hkaMessage            String?        @db.Text
  rejectionReason       String?        @db.Text
  rawXml                String?        @db.Text
  pdfUrl                String?
  xmlUrl                String?
  
  // Anulación
  isCancelled           Boolean        @default(false)
  cancelledAt           DateTime?
  cancellationReason    String?        @db.Text
  
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  
  // Relaciones
  organization   Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User               @relation(fields: [userId], references: [id])
  items          InvoiceItem[]
  logs           InvoiceLog[]
  folioConsumption FolioConsumption?
  
  @@index([organizationId])
  @@index([userId])
  @@index([status])
  @@index([issueDate])
  @@index([invoiceNumber])
}

enum InvoiceStatus {
  DRAFT
  QUEUED
  PROCESSING
  SENT_TO_HKA
  APPROVED
  REJECTED
  CANCELLED
}

// 6. ITEMS DE FACTURA
model InvoiceItem {
  id          String  @id @default(cuid())
  invoiceId   String
  lineNumber  Int
  code        String
  description String  @db.Text
  quantity    Decimal @db.Decimal(12, 4)
  unit        String
  unitPrice   Decimal @db.Decimal(12, 2)
  discount    Decimal @db.Decimal(12, 2) @default(0)
  discountRate Decimal @db.Decimal(5, 2) @default(0)
  taxRate     Decimal @db.Decimal(5, 2)
  taxCode     String
  taxAmount   Decimal @db.Decimal(12, 2)
  subtotal    Decimal @db.Decimal(12, 2)
  total       Decimal @db.Decimal(12, 2)
  
  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  @@index([invoiceId])
}

// ... más modelos (InvoiceLog, FolioConsumption, ApiKey, Notification, AuditLog, SystemConfig)
```

### **Total de Tablas:** 14
### **Total de Índices:** 40+
### **Total de Relaciones:** 25+

---

## 🔐 AUTENTICACIÓN

### **Configuración NextAuth.js:**

**Archivo:** `lib/auth.ts`

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prismaServer as prisma } from "./prisma-server"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
})
```

---

## ⚠️ PROBLEMA IDENTIFICADO: PRISMA CLIENTS

### **Situación Actual:**

El proyecto tiene **DOS clientes de Prisma**:

#### **1. `lib/prisma.ts` - CON Extensiones (Optimizado)**

```typescript
import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { pagination } from 'prisma-extension-pagination'
import { fieldEncryptionExtension } from 'prisma-field-encryption'

const logConfig: Prisma.LogLevel[] = 
  process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error']

function createPrismaClient() {
  const baseClient = new PrismaClient({
    log: logConfig,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  let client = baseClient
    .$extends(withAccelerate())      // ⚠️ Caché y pooling
    .$extends(pagination({           // ⚠️ Paginación
      pages: {
        limit: 20,
        includePageCount: true,
      },
    }))
  
  // Encriptación opcional
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32) {
    client = client.$extends(
      fieldEncryptionExtension({
        encryptionKey: process.env.ENCRYPTION_KEY,
      })
    ) as any
  }
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
```

**Problema:** Las extensiones añaden métodos que NO son serializables en Next.js 15 Server Actions.

#### **2. `lib/prisma-server.ts` - SIN Extensiones (Server Actions)**

```typescript
import { PrismaClient } from '@prisma/client'

export const prismaServer = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})
```

**Uso:** Este cliente debería usarse en Server Actions, pero puede estar causando conflictos.

---

## 📄 ARCHIVO PROBLEMÁTICO

### **`app/auth/signup/page.tsx`**

```typescript
import { redirect } from "next/navigation"
import Link from "next/link"
import { prismaServer as prisma } from "@/lib/prisma-server"  // ✅ Usando cliente correcto
import bcrypt from "bcryptjs"

async function handleSignUp(formData: FormData) {
  "use server"

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  console.log("🔍 [SIGNUP] Inicio del registro")
  console.log("📧 Email:", email)
  console.log("👤 Nombre:", name)

  try {
    // Validaciones
    if (!name || !email || !password || !confirmPassword) {
      console.log("❌ [SIGNUP] Campos faltantes")
      redirect("/auth/signup?error=MissingFields")
      return
    }

    if (password !== confirmPassword) {
      redirect("/auth/signup?error=PasswordMismatch")
      return
    }

    if (password.length < 6) {
      redirect("/auth/signup?error=PasswordTooShort")
      return
    }

    console.log("🔍 [SIGNUP] Verificando si usuario existe...")
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("❌ [SIGNUP] Usuario ya existe")
      redirect("/auth/signup?error=UserExists")
      return
    }

    console.log("✅ [SIGNUP] Usuario no existe, continuando...")
    console.log("🏢 [SIGNUP] Buscando organización demo...")
    
    let organization = await prisma.organization.findFirst({
      where: { slug: "empresa-demo" }
    })

    if (!organization) {
      console.log("⚠️  [SIGNUP] Organización no existe, creando...")
      
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
          metadata: {
            theme: "light",
            timezone: "America/Panama",
            currency: "PAB",
            language: "es"
          }
        }
      })
      
      console.log("✅ [SIGNUP] Organización creada:", organization.id)
    } else {
      console.log("✅ [SIGNUP] Organización encontrada:", organization.id)
    }

    console.log("🔐 [SIGNUP] Hasheando contraseña...")
    
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log("👤 [SIGNUP] Creando usuario...")
    
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "USER",
        organizationId: organization.id,
        isActive: true
      }
    })

    console.log("✅ [SIGNUP] Usuario creado exitosamente:", newUser.id)
    console.log("🔄 [SIGNUP] Redirigiendo a login...")

    redirect("/auth/signin?success=AccountCreated")
  } catch (error) {
    console.error("❌ [SIGNUP] Error en registro:", error)
    redirect("/auth/signup?error=ServerError")  // ⚠️ AQUÍ FALLA
  }
}

export default async function SignUpPage({ searchParams }: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const params = await searchParams
  const errorMessages = {
    MissingFields: "Todos los campos son obligatorios",
    PasswordMismatch: "Las contraseñas no coinciden",
    PasswordTooShort: "La contraseña debe tener al menos 6 caracteres",
    UserExists: "Este correo electrónico ya está registrado",
    ServerError: "Error en el servidor. Intenta de nuevo."  // ⚠️ ESTE MENSAJE APARECE
  }

  const error = params.error as keyof typeof errorMessages

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate en SAGO-FACTU
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {errorMessages[error] || "Error desconocido"}
                </h3>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" action={handleSignUp}>
          {/* Campos del formulario */}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña (mínimo 6 caracteres)"
              />
            </div>
            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Registrarse
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

## 🔬 SCRIPTS DE DIAGNÓSTICO

### **1. Script que FUNCIONA ✅**

**Archivo:** `scripts/test-signup-direct.js`

```javascript
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function testRegistration() {
  console.log('🧪 Probando registro de usuario...\n')

  try {
    // 1. Buscar organización
    let organization = await prisma.organization.findFirst({
      where: { slug: 'empresa-demo' }
    })

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          slug: 'empresa-demo',
          name: 'Empresa Demo S.A.',
          ruc: '123456789-1',
          dv: '1',
          email: 'demo@empresa.com',
          phone: '+507 1234-5678',
          address: 'Panamá, Panamá',
          hkaEnabled: true,
          maxUsers: 100,
          maxFolios: 10000,
          isActive: true,
          metadata: {
            theme: 'light',
            timezone: 'America/Panama',
            currency: 'PAB',
            language: 'es'
          }
        }
      })
    }

    // 2. Crear usuario
    const testEmail = `test-${Date.now()}@ejemplo.com`
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Usuario de Prueba',
        password: hashedPassword,
        role: 'USER',
        organizationId: organization.id,
        isActive: true
      }
    })

    console.log('✅ Usuario creado exitosamente!')
    console.log('   ID:', newUser.id)
    console.log('   Email:', newUser.email)

  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testRegistration()
```

**Resultado:**
```
✅ Usuario creado exitosamente!
   ID: cmh10x4e500012j7hop3rewum
   Email: test-1761078920899@ejemplo.com
```

### **2. Página de Test Creada**

**URL:** `http://localhost:3000/test-signup`

Esta página tiene logging detallado para capturar el error exacto.

---

## 🌐 VARIABLES DE ENTORNO

**Archivo:** `.env`

```bash
# Database
DATABASE_URL="postgresql://neondb_owner:npg_***@ep-divine-field-ad26eaav-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Encriptación (Opcional)
# ENCRYPTION_KEY="generar-con-openssl-rand-base64-32"

# HKA (The Factory) - Para futuro
# HKA_DEMO_ENDPOINT="https://api-demo.thefactoryhka.com.pa/fe/v1"
# HKA_DEMO_USERNAME="demo_user"
# HKA_DEMO_PASSWORD="demo_password"
```

---

## 🚀 COMANDOS DISPONIBLES

### **Desarrollo:**
```bash
npm run dev              # Servidor de desarrollo (puerto 3000)
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linter
```

### **Base de Datos:**
```bash
npx prisma generate      # Generar Prisma Client
npx prisma db push       # Aplicar schema a BD
npx prisma db seed       # Poblar BD con datos de prueba
npx prisma studio        # GUI de base de datos
```

### **Neon CLI:**
```bash
npm run neon:auth        # Autenticar con Neon
npm run neon:projects    # Listar proyectos
npm run neon:branches    # Listar branches
npm run neon:info        # Diagnóstico completo
```

### **Testing:**
```bash
node scripts/test-signup-direct.js     # Test de registro (funciona ✅)
node scripts/diagnose-neon.js          # Diagnóstico de BD
node scripts/test-signup-form.js       # Test de formulario HTTP
```

---

## 📊 ESTADO DE LA BASE DE DATOS

### **Conexión:**
```
✅ Conexión exitosa a PostgreSQL (Neon)
✅ 14 tablas creadas
✅ Índices aplicados
✅ Relaciones configuradas
```

### **Datos Actuales:**

```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 5;
```

**Resultado:**
```
1. test-1761078920899@ejemplo.com  | Usuario de Prueba | 2025-10-21
2. angelnereira15@gmail.com         | Ángel Nereira     | 2025-10-21
3. usuario@empresa.com              | Usuario Demo      | 2025-10-20
4. admin@sagofactu.com              | Super Admin       | 2025-10-20
```

---

## 🐛 POSIBLES CAUSAS DEL ERROR

### **Hipótesis 1: Serialización de Next.js 15**
- Next.js 15 Server Actions requieren serialización completa
- Las extensiones de Prisma pueden estar causando problemas
- **Evidencia:** El script directo funciona, pero el formulario no

### **Hipótesis 2: Conflicto de Tipos TypeScript**
- Los tipos extendidos de Prisma pueden no ser compatibles
- TypeScript compila, pero runtime falla
- **Evidencia:** Build pasa sin errores, pero runtime falla

### **Hipótesis 3: Error en el Catch Block**
- El error real se está capturando pero no se está loggeando
- `redirect()` puede estar lanzando un error no capturado
- **Evidencia:** Necesitamos ver los logs del servidor

### **Hipótesis 4: Problema con `redirect()` de Next.js**
- `redirect()` lanza un error `NEXT_REDIRECT` que debe propagarse
- Puede estar siendo capturado incorrectamente por el `catch`
- **Evidencia:** Comportamiento común en Next.js 15

---

## 🔍 PASOS PARA DEBUGGING

### **1. Ver Logs en Tiempo Real**
```bash
# Terminal 1: Arrancar servidor
npm run dev

# Terminal 2: Monitorear logs
tail -f /tmp/sago-dev.log
```

### **2. Probar Página de Test**
```
URL: http://localhost:3000/test-signup
```
Esta página tiene logging detallado y mostrará el error exacto.

### **3. Revisar Network Tab del Navegador**
- Abrir DevTools (F12)
- Ir a Network tab
- Registrar un usuario
- Ver request/response de POST

### **4. Probar Script Directo**
```bash
node scripts/test-signup-direct.js
```
**Esperado:** ✅ Funciona (ya confirmado)

### **5. Verificar Prisma Client**
```bash
# Regenerar cliente
npx prisma generate

# Verificar conexión
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect().then(() => console.log('✅ Conectado')).catch(e => console.error('❌', e));
"
```

---

## 📝 INFORMACIÓN ADICIONAL

### **Versiones:**
```json
{
  "node": "v18.19.1",
  "npm": "9.2.0",
  "next": "15.5.6",
  "prisma": "6.17.1",
  "typescript": "5.x"
}
```

### **URLs:**
- **Desarrollo:** http://localhost:3000
- **Producción:** https://sago-factu.vercel.app
- **Repositorio:** https://github.com/angelnereira/sago-factu-V0.2

### **Contacto del Proyecto:**
- **Desarrollador:** Sistema SAGO-FACTU
- **Email:** admin@sagofactu.com (demo)
- **Fecha Inicio:** Octubre 2025

---

## 🎯 PREGUNTAS CLAVE PARA EL INTEGRADOR

1. **¿Las extensiones de Prisma son compatibles con Next.js 15 Server Actions?**
   - Si no, ¿cómo debemos reestructurar el código?

2. **¿El error está en el `catch` block capturando `NEXT_REDIRECT`?**
   - ¿Debemos modificar el manejo de errores?

3. **¿Hay algún problema con la serialización de datos en Server Actions?**
   - ¿Qué se está intentando serializar que no puede?

4. **¿El problema está en el runtime de Vercel vs local?**
   - ¿Funciona localmente pero falla en producción?

5. **¿Necesitamos una arquitectura diferente para Server Actions?**
   - ¿API Routes en lugar de Server Actions?

---

## 📚 DOCUMENTACIÓN COMPLETA DISPONIBLE

1. **ARQUITECTURA-FINAL.md** - Arquitectura del sistema completo
2. **PRISMA-OPTIMIZATIONS.md** - Optimizaciones de Prisma
3. **lib/README-PRISMA-CLIENTS.md** - Guía de clientes Prisma
4. **RESUMEN-SESION-COMPLETA.md** - Historial de cambios
5. **SECURITY.md** - Guía de seguridad

---

## 🆘 AYUDA NECESARIA

**Problema Principal:**
Formulario de registro (`/auth/signup`) falla con "Error en el servidor" al usar Server Actions de Next.js 15.

**Lo que funciona:**
- ✅ Conexión a base de datos
- ✅ Scripts directos de Prisma
- ✅ Login con usuarios existentes
- ✅ Lectura de datos

**Lo que NO funciona:**
- ❌ Registro desde formulario web
- ❌ Server Actions con Prisma

**Necesitamos:**
1. Identificar la causa exacta del error
2. Solución para hacer compatible Prisma con Server Actions
3. Verificar si la arquitectura actual es correcta
4. Guía de mejores prácticas para Next.js 15 + Prisma + Server Actions

---

**Generado:** 21 de Octubre, 2025  
**Para:** Integrador Técnico  
**Por:** Equipo SAGO-FACTU


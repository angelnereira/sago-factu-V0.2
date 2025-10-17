# SAGO-FACTU - Plataforma Intermediaria PAC

Sistema Multi-Tenant de Facturación Electrónica para Panamá

## 📋 Información del Proyecto

- **Nombre**: SAGO-FACTU
- **Tipo**: SaaS Multi-Tenant
- **Stack**: Next.js 15 + TypeScript + Prisma ORM + PostgreSQL
- **PAC**: The Factory HKA (Panamá)

## 🎯 Descripción

Plataforma SaaS que actúa como intermediario entre clientes finales y The Factory HKA, permitiendo la gestión, distribución y monitoreo de folios de facturación electrónica en Panamá.

### Modelo de Negocio
```
The Factory HKA → SAGO-FACTU (Nosotros) → Clientes Finales
   [60,000 folios]    [Redistribución]      [Consumo]
```

### Roles de Usuario
- **Super Admin**: Gestión de plataforma y compra de folios a HKA
- **Admin Empresa**: Gestión de su organización y usuarios
- **Usuario Final**: Emisión y consulta de facturas

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend & Backend**: Next.js 15 (App Router), TypeScript 5+, React 19
- **Base de Datos**: PostgreSQL 15+, Prisma ORM 6+
- **Autenticación**: NextAuth.js v5, JWT + Session Tokens
- **UI/UX**: Tailwind CSS 4, shadcn/ui components
- **Integración HKA**: node-soap para SOAP client
- **Background Jobs**: BullMQ + Redis
- **Storage**: AWS S3 para XML/PDF
- **Email**: Resend para notificaciones

## 🚀 Configuración del Proyecto

### Prerrequisitos
- Node.js 18+ (recomendado 20+)
- PostgreSQL 15+
- Redis (para BullMQ)
- npm o yarn

### 1. Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd sago-factu

# Instalar dependencias
npm install
```

### 2. Configuración Inicial Automática
```bash
# Ejecutar script de configuración automática
npm run setup

# Esto generará automáticamente:
# - Archivo .env con NEXTAUTH_SECRET y SUPER_ADMIN_PASSWORD
# - Variables de entorno configuradas
```

### 3. Configuración Manual de Variables
Editar `.env` con tus credenciales específicas:
```bash
# Base de datos
DATABASE_URL="postgresql://user:password@host:5432/sagofactu?schema=public"

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"

# Email (opcional)
RESEND_API_KEY="tu-resend-key"
```

### 4. Configuración de Base de Datos
```bash
# Generar cliente de Prisma
npm run db:generate

# Aplicar migraciones
npm run db:migrate

# Poblar base de datos con datos iniciales
npm run db:seed
```

### 4. Variables de Entorno Requeridas

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sago_factu?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Redis (para BullMQ)
REDIS_URL="redis://localhost:6379"

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET="sago-factu-storage"

# Email Service
RESEND_API_KEY=""

# HKA Integration
HKA_SOAP_URL=""
HKA_CLIENT_ID=""
HKA_CLIENT_SECRET=""
HKA_ENVIRONMENT="sandbox"
```

### 5. Ejecutar el Proyecto
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📊 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción
npm run lint         # Linter

# Base de Datos
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Sincronizar esquema con DB
npm run db:migrate   # Ejecutar migraciones
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Poblar datos iniciales
```

## 🔐 Credenciales de Acceso (Desarrollo)

Después de ejecutar `npm run db:seed`:

- **Super Admin**: `admin@sago-factu.com` / `admin123`
- **Usuario Demo**: `usuario@empresa.com` / `usuario123`

## 📁 Estructura del Proyecto

```
sago-factu/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   └── globals.css        # Estilos globales
├── lib/                   # Utilidades y configuración
│   ├── auth.ts           # Configuración NextAuth
│   └── prisma.ts         # Cliente Prisma
├── prisma/               # Esquema y migraciones
│   ├── schema.prisma     # Esquema de base de datos
│   └── seed.ts           # Datos iniciales
├── types/                # Tipos TypeScript
└── middleware.ts         # Middleware de autenticación
```

## 🗄️ Esquema de Base de Datos

### Modelos Principales
- **User**: Usuarios del sistema
- **Organization**: Organizaciones multi-tenant
- **OrganizationMember**: Membresías de usuarios
- **Folio**: Folios de facturación
- **Invoice**: Facturas electrónicas
- **InvoiceItem**: Items de facturas
- **Notification**: Sistema de notificaciones

### Características Multi-Tenant
- Aislamiento completo por organización
- Roles y permisos granulares
- Configuración personalizada por tenant
- Folios y facturas segregados

## 🔄 Flujo de Emisión de Factura

1. **Usuario** llena formulario de factura
2. **Sistema** valida datos con Zod
3. **Sistema** verifica folios disponibles
4. **Sistema** crea invoice con status QUEUED
5. **Worker** procesa job en background
6. **Worker** envía XML a HKA via SOAP
7. **HKA** responde con CUFE y XML certificado
8. **Sistema** actualiza status a CERTIFIED
9. **Sistema** guarda archivos en S3
10. **Sistema** envía notificación por email

## 🛠️ Desarrollo

### Agregar Nuevas Funcionalidades
1. Crear migración de Prisma si es necesario
2. Actualizar esquema en `prisma/schema.prisma`
3. Ejecutar `npm run db:migrate`
4. Implementar lógica en Server Actions
5. Crear componentes UI con Tailwind

### Integración con HKA
- Configurar credenciales en variables de entorno
- Implementar cliente SOAP en `lib/hka-client.ts`
- Crear workers para procesamiento asíncrono
- Manejar respuestas y errores de HKA

## 📈 Monitoreo y Analytics

- **Error Tracking**: Sentry (opcional)
- **Analytics**: Vercel Analytics
- **Logs**: Console logs + Prisma logging
- **Métricas**: Folios usados, facturas procesadas, errores

## 🚀 Deployment

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Configurar PostgreSQL (Vercel Postgres o externo)
4. Configurar Redis (Upstash)
5. Configurar AWS S3

### Variables de Entorno de Producción
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="production-secret"
REDIS_URL="redis://..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
RESEND_API_KEY="..."
```

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para la facturación electrónica en Panamá**
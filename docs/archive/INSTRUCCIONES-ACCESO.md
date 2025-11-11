# 🔑 INSTRUCCIONES DE ACCESO - SAGO-FACTU

## 📍 REPOSITORIO

**URL:** https://github.com/angelnereira/sago-factu-V0.2  
**Branch Principal:** `main`  
**Última actualización:** 21 de Octubre, 2025

### Clonar el Proyecto:
```bash
git clone https://github.com/angelnereira/sago-factu-V0.2.git
cd sago-factu-V0.2
```

---

## 🔧 INSTALACIÓN LOCAL

### 1. Requisitos Previos:
```
Node.js: v18.19.1 o superior
npm: 9.2.0 o superior
PostgreSQL: No necesario (usamos Neon cloud)
```

### 2. Instalar Dependencias:
```bash
npm install
```

### 3. Configurar Variables de Entorno:

**Crear archivo `.env` en la raíz:**
```bash
cp .env.example .env
```

**Editar `.env` con estos valores:**
```env
# Base de Datos (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_JR48yletDImP@ep-divine-field-ad26eaav-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# Opcional (si quieres habilitar encriptación)
# ENCRYPTION_KEY="generar-con-openssl-rand-base64-32"
```

### 4. Generar Prisma Client:
```bash
npx prisma generate
```

### 5. Aplicar Schema a Base de Datos:
```bash
npx prisma db push
```

### 6. (Opcional) Poblar con Datos de Prueba:
```bash
npm run db:seed
```

### 7. Iniciar Servidor de Desarrollo:
```bash
npm run dev
```

**Servidor corriendo en:** http://localhost:3000

---

## 🌐 ACCESO A PRODUCCIÓN

**URL:** https://sago-factu-v0-2.vercel.app

### Usuarios de Prueba:

#### Super Admin:
```
Email: admin@sagofactu.com
Password: admin123
```

#### Usuario Demo:
```
Email: usuario@empresa.com
Password: usuario123
```

#### Usuario Test:
```
Email: angelnereira15@gmail.com
Password: password123
```

---

## 🗄️ BASE DE DATOS

### Neon PostgreSQL (Producción y Desarrollo):

**Dashboard:** https://console.neon.tech  
**Proyecto:** sago-factu  
**Base de Datos:** neondb  
**Región:** us-east-1 (N. Virginia)

### Connection Strings:

**Pooled (Recomendado):**
```
postgresql://neondb_owner:npg_JR48yletDImP@ep-divine-field-ad26eaav-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Direct (Para migraciones):**
```
postgresql://neondb_owner:npg_JR48yletDImP@ep-divine-field-ad26eaav.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Acceso con Cliente GUI:

**Usando Prisma Studio:**
```bash
npx prisma studio
```
Abre en: http://localhost:5555

**Usando pgAdmin / DBeaver / TablePlus:**
```
Host: ep-divine-field-ad26eaav-pooler.c-2.us-east-1.aws.neon.tech
Port: 5432
Database: neondb
User: neondb_owner
Password: npg_JR48yletDImP
SSL: Required
```

---

## 🧪 TESTING Y DEBUGGING

### Scripts Disponibles:

```bash
# Test de registro directo (FUNCIONA ✅)
node scripts/test-signup-direct.js

# Diagnóstico completo de BD
node scripts/diagnose-neon.js
npm run neon:info

# Ver usuarios en BD
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.findMany().then(console.log)"
```

### Páginas de Debug:

```
http://localhost:3000/test-signup - Test de registro con logs
```

### Ver Logs en Tiempo Real:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
tail -f /tmp/sago-dev.log
```

---

## 📂 ESTRUCTURA DEL PROYECTO

```
sago-factu/
├── app/                    # Next.js App Router
│   ├── auth/
│   │   ├── signin/        # Login ✅
│   │   └── signup/        # Registro ❌ (PROBLEMA AQUÍ)
│   ├── dashboard/         # Dashboard
│   └── test-signup/       # Debug page
│
├── lib/                   # Bibliotecas
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma CON extensiones
│   └── prisma-server.ts  # Prisma SIN extensiones
│
├── prisma/
│   └── schema.prisma     # Schema de BD (14 tablas)
│
├── scripts/              # Scripts de utilidad
│   ├── test-signup-direct.js  ✅
│   └── diagnose-neon.js       ✅
│
└── Documentación/
    ├── DOCUMENTACION-TECNICA-COMPLETA.md
    ├── RESUMEN-PARA-INTEGRADOR.md
    ├── ARCHIVOS-CLAVE.txt
    └── Este archivo
```

---

## 🐛 PROBLEMA ACTUAL

### Descripción:
El formulario de registro en `/auth/signup` falla con error "Error en el servidor"

### Qué funciona:
- ✅ Conexión a base de datos
- ✅ Scripts directos de Prisma
- ✅ Login con usuarios existentes
- ✅ Lectura de datos

### Qué NO funciona:
- ❌ Registro desde formulario web
- ❌ Server Action `handleSignUp`

### Para Reproducir:
1. Ir a: http://localhost:3000/auth/signup
2. Llenar formulario con datos válidos
3. Click en "Registrarse"
4. **Resultado:** Aparece mensaje "Error en el servidor"

### Logs:
```bash
npm run dev
# En otra terminal:
tail -f /tmp/sago-dev.log

# Luego intentar registrar un usuario
# Ver qué logs aparecen
```

---

## 📚 DOCUMENTACIÓN

### Documentos Disponibles:

1. **README.md** - Inicio rápido del proyecto
2. **DOCUMENTACION-TECNICA-COMPLETA.md** - Documentación técnica completa (30+ páginas)
3. **RESUMEN-PARA-INTEGRADOR.md** - Resumen ejecutivo del problema
4. **ARCHIVOS-CLAVE.txt** - Lista de archivos importantes
5. **ARQUITECTURA-FINAL.md** - Arquitectura del sistema
6. **PRISMA-OPTIMIZATIONS.md** - Optimizaciones de Prisma
7. **lib/README-PRISMA-CLIENTS.md** - Guía de clientes Prisma
8. **SECURITY.md** - Guía de seguridad

### Leer en este orden:
1. Este archivo (INSTRUCCIONES-ACCESO.md)
2. RESUMEN-PARA-INTEGRADOR.md
3. DOCUMENTACION-TECNICA-COMPLETA.md
4. Archivos específicos según necesidad

---

## 🔐 CREDENCIALES Y ACCESOS

### GitHub:
- Repositorio: https://github.com/angelnereira/sago-factu-V0.2
- Branch: main
- Acceso: Público

### Vercel:
- Dashboard: https://vercel.com/dashboard
- Proyecto: sago-factu-v0-2
- URL Producción: https://sago-factu-v0-2.vercel.app

### Neon Database:
- Console: https://console.neon.tech
- Proyecto: sago-factu
- Endpoint: ep-divine-field-ad26eaav

---

## 📞 CONTACTO

**Para consultas técnicas:**
- Ver documentación en el repositorio
- Revisar issues en GitHub
- Consultar logs del servidor

**URLs Importantes:**
- Repositorio: https://github.com/angelnereira/sago-factu-V0.2
- Producción: https://sago-factu-v0-2.vercel.app
- Test: http://localhost:3000/test-signup (local)

---

## ✅ CHECKLIST PARA INTEGRADOR

Antes de empezar:
- [ ] Clonar repositorio
- [ ] Instalar dependencias (`npm install`)
- [ ] Configurar `.env` con DATABASE_URL
- [ ] Generar Prisma Client (`npx prisma generate`)
- [ ] Iniciar servidor (`npm run dev`)
- [ ] Verificar conexión a BD (`npx prisma studio`)
- [ ] Probar script directo (`node scripts/test-signup-direct.js`)
- [ ] Reproducir error (ir a `/auth/signup` y llenar formulario)
- [ ] Ver logs (`tail -f /tmp/sago-dev.log`)
- [ ] Revisar documentación técnica

Archivos críticos a revisar:
- [ ] `app/auth/signup/page.tsx` (código problemático)
- [ ] `lib/prisma-server.ts` (cliente Prisma)
- [ ] `lib/auth.ts` (configuración NextAuth)
- [ ] `prisma/schema.prisma` (schema de BD)
- [ ] `.env` (variables de entorno)

---

**Generado:** 21 de Octubre, 2025  
**Para:** Integrador Técnico  
**Propósito:** Acceso completo al proyecto para debugging

---

## 🎯 OBJETIVO

**Identificar y solucionar** el error en el registro de usuarios desde el formulario web, manteniendo la arquitectura actual y las optimizaciones implementadas.

**Prioridad:** 🔴 ALTA - Bloqueador de producción


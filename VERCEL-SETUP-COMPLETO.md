# 🚀 Guía Completa: Despliegue en Vercel con Neon PostgreSQL

## ✅ Pre-requisitos completados:

- ✅ Proyecto Next.js configurado
- ✅ Prisma configurado
- ✅ @neondatabase/serverless instalado
- ✅ Scripts de build listos
- ✅ Registro de usuarios funcionando

---

## 📋 Paso 1: Crear cuenta en Neon

1. Ve a [neon.tech](https://neon.tech)
2. Regístrate con GitHub (recomendado)
3. Crea un nuevo proyecto:
   - **Name**: `sago-factu`
   - **Region**: US East (Ohio) - `us-east-2` (o la más cercana)
   - **Database**: `neondb` (default)

4. Copia la **Connection String** que aparece:
   ```
   postgresql://neondb_owner:[PASSWORD]@[HOST]/neondb?sslmode=require
   ```

---

## 📋 Paso 2: Configurar Vercel

### 2.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con GitHub
3. Autoriza Vercel para acceder a tus repositorios

### 2.2 Conectar tu repositorio

1. En el Dashboard de Vercel, haz clic en **"Add New Project"**
2. Selecciona tu repositorio: `sago-factu` (o como se llame)
3. Configura el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz)
   - **Build Command**: Automático (usa `npm run build:vercel` del vercel.json)
   - **Output Directory**: `.next`

### 2.3 Configurar Variables de Entorno

En la configuración del proyecto, ve a **"Environment Variables"** y agrega:

```bash
# ========================================
# OBLIGATORIAS - Base de datos
# ========================================
DATABASE_URL
postgresql://neondb_owner:TU_PASSWORD@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# ========================================
# OBLIGATORIAS - NextAuth
# ========================================
NEXTAUTH_URL
https://tu-proyecto.vercel.app

NEXTAUTH_SECRET
2KjMnkOzQCc/jOjSsr2VySk2MXLpidtsusbgWF29Aaw=

# ========================================
# OBLIGATORIAS - HKA Demo
# ========================================
HKA_ENV
demo

HKA_DEMO_SOAP_URL
https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc

HKA_DEMO_TOKEN_USER
walgofugiitj_ws_tfhka

HKA_DEMO_TOKEN_PASSWORD
Octopusp1oQs5

HKA_DEMO_REST_URL
https://demointegracion.thefactoryhka.com.pa

# ========================================
# OBLIGATORIAS - App Config
# ========================================
NEXT_PUBLIC_APP_NAME
SAGO-FACTU

NEXT_PUBLIC_APP_URL
https://tu-proyecto.vercel.app

NODE_ENV
production

# ========================================
# OBLIGATORIAS - Super Admin
# ========================================
SUPER_ADMIN_EMAIL
admin@sagofactu.com

SUPER_ADMIN_PASSWORD
admin123

# ========================================
# OPCIONALES - Features
# ========================================
ENABLE_EMAIL_NOTIFICATIONS
true

ENABLE_WEBHOOKS
false

ENABLE_API_KEYS
true
```

**⚠️ IMPORTANTE:**
- Reemplaza `TU_PASSWORD` con tu password real de Neon
- Reemplaza `ep-xxxxx` con tu endpoint real de Neon
- Reemplaza `tu-proyecto.vercel.app` con tu URL real de Vercel

---

## 📋 Paso 3: Desplegar

### 3.1 Hacer Deploy

1. En Vercel, haz clic en **"Deploy"**
2. Espera que termine el build (puede tomar 2-5 minutos)
3. Vercel automáticamente:
   - Instalará las dependencias
   - Generará Prisma Client
   - Creará las tablas en Neon
   - Poblará la base de datos
   - Construirá la aplicación

### 3.2 Verificar el Deploy

Durante el build verás:
```
🚀 Iniciando build para Vercel...
📋 DATABASE_URL configurada: postgresql://neondb_owner...
📦 Generando Prisma Client...
🗄️ Aplicando schema a la base de datos...
🌱 Configurando base de datos...
✅ Organización creada: Empresa Demo S.A.
✅ Super Admin creado: admin@sagofactu.com
✅ Usuario de prueba creado: usuario@empresa.com
🏗️ Construyendo aplicación...
✅ Build completado exitosamente!
```

---

## 📋 Paso 4: Probar la aplicación

### 4.1 Acceder a la aplicación

1. Una vez desplegado, Vercel te dará una URL: `https://tu-proyecto.vercel.app`
2. Visita la URL

### 4.2 Probar el Login

1. Ve a: `https://tu-proyecto.vercel.app/auth/signin`
2. Inicia sesión con:
   - **Email**: `admin@sagofactu.com`
   - **Contraseña**: `admin123`

### 4.3 Probar el Registro

1. Ve a: `https://tu-proyecto.vercel.app/auth/signup`
2. Regístrate con tus propios datos
3. Inicia sesión con tu nueva cuenta

---

## 🔍 Verificar la base de datos en Neon

1. Ve a tu proyecto en Neon
2. Haz clic en **"SQL Editor"**
3. Ejecuta:
   ```sql
   SELECT * FROM "User";
   ```
4. Deberías ver:
   - Super Admin
   - Usuario Demo
   - Cualquier usuario que hayas registrado

---

## ⚡ Deploys Automáticos

Una vez configurado:
1. Cada `git push` a tu rama `main` → Deploy automático
2. Cada Pull Request → Preview deployment
3. No necesitas hacer nada manual

---

## 🆘 Solución de problemas

### Error: "DATABASE_URL not configured"
- **Solución**: Verifica que agregaste `DATABASE_URL` en las variables de entorno de Vercel

### Error: "Invalid credentials"
- **Solución**: Verifica que la URL de Neon sea correcta y tenga el formato:
  ```
  postgresql://neondb_owner:PASSWORD@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
  ```

### Error: "Build failed"
- **Solución**: Revisa los logs del build en Vercel para ver el error específico

### La base de datos está vacía
- **Solución**: El script de setup debería ejecutarse automáticamente. Si no, puedes ejecutarlo manualmente desde Neon SQL Editor

---

## 📊 Monitoreo

### Vercel Dashboard
- **Deployments**: Ver historial de deployments
- **Analytics**: Tráfico y rendimiento
- **Logs**: Logs en tiempo real

### Neon Dashboard
- **Monitoring**: Uso de base de datos
- **SQL Editor**: Ejecutar queries
- **Branches**: Crear branches de base de datos

---

## 🎯 Próximos pasos

Una vez desplegado exitosamente:

1. ✅ Configura tu dominio personalizado
2. ✅ Habilita HTTPS (automático en Vercel)
3. ✅ Configura Production HKA credentials (cuando las tengas)
4. ✅ Implementa funcionalidades adicionales:
   - Dashboard completo
   - Gestión de folios
   - Emisión de facturas
   - Integración con HKA

---

## 📝 Resumen de archivos importantes

- `vercel.json` - Configuración de Vercel
- `vercel-build.sh` - Script de build
- `prisma/schema.prisma` - Schema de BD (se cambiará a PostgreSQL en Vercel)
- `scripts/setup-db.js` - Script de configuración de BD
- `.env` - Variables locales (NO subir a GitHub)

---

¿Listo para desplegar? 🚀

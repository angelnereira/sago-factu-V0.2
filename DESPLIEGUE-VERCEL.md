# 🚀 GUÍA DE DESPLIEGUE EN VERCEL

## 📋 Pre-requisitos

- [x] Cuenta en Vercel (https://vercel.com)
- [x] Repositorio Git (GitHub/GitLab/Bitbucket)
- [x] Cuenta en Neon (https://neon.tech) - Base de datos
- [x] Build local exitoso (`npm run build`)

---

## 🗄️ PASO 1: Configurar Base de Datos Neon

### 1.1. Crear Proyecto en Neon

```bash
# Ir a https://neon.tech
# 1. Sign in / Create account
# 2. Click "New Project"
# 3. Nombre: sago-factu-production
# 4. Region: US East (Ohio) - o la más cercana
# 5. Postgres Version: 16
# 6. Click "Create Project"
```

### 1.2. Obtener Connection String

```bash
# En el dashboard de Neon:
# 1. Click en "Connection Details"
# 2. Copiar "Connection string"
# 3. Debe verse así:
postgres://username:password@hostname.neon.tech/neondb?sslmode=require
```

### 1.3. Aplicar Schema

```bash
# Configurar DATABASE_URL localmente (temporal)
export DATABASE_URL="postgres://username:password@hostname.neon.tech/neondb?sslmode=require"

# Aplicar migraciones
npx prisma migrate deploy

# O usar db push
npx prisma db push

# Verificar
npx prisma studio
```

---

## 🚀 PASO 2: Desplegar en Vercel

### 2.1. Conectar Repositorio

```bash
# Opción A: Desde Vercel Dashboard
# 1. Ir a https://vercel.com/new
# 2. Click "Import Git Repository"
# 3. Seleccionar repositorio sago-factu
# 4. Click "Import"

# Opción B: Desde CLI
npm i -g vercel
vercel login
vercel link
```

### 2.2. Configurar Variables de Entorno

**En Vercel Dashboard → Settings → Environment Variables:**

#### **Base de Datos** (REQUERIDO)
```bash
DATABASE_URL = postgres://username:password@hostname.neon.tech/neondb?sslmode=require
NEON_DATABASE_URL = postgres://username:password@hostname.neon.tech/neondb?sslmode=require
```

#### **NextAuth** (REQUERIDO)
```bash
NEXTAUTH_SECRET = [Generar con: openssl rand -base64 32]
NEXTAUTH_URL = https://tu-dominio.vercel.app
```

#### **HKA Demo** (Para testing)
```bash
HKA_ENV = demo
HKA_DEMO_SOAP_URL = https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
HKA_DEMO_TOKEN_USER = walgofugiitj_ws_tfhka
HKA_DEMO_TOKEN_PASSWORD = Octopusp1oQs5
HKA_DEMO_REST_URL = https://demoemision.thefactoryhka.com.pa
```

#### **HKA Producción** (Cuando tengas credenciales)
```bash
HKA_ENV = prod
HKA_PROD_SOAP_URL = [URL de producción]
HKA_PROD_TOKEN_USER = [Tu token]
HKA_PROD_TOKEN_PASSWORD = [Tu password]
HKA_PROD_REST_URL = [URL REST producción]
```

#### **Email** (OPCIONAL)
```bash
RESEND_API_KEY = re_xxxxxxxxxxxxx
```

#### **S3** (OPCIONAL - para almacenar XMLs/PDFs)
```bash
AWS_ACCESS_KEY_ID = [Tu Access Key]
AWS_SECRET_ACCESS_KEY = [Tu Secret Key]
AWS_REGION = us-east-1
AWS_S3_BUCKET = sago-factu-docs
```

### 2.3. Configurar Build Settings

En Vercel Dashboard → Settings → Build & Development Settings:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 2.4. Deploy

```bash
# Opción A: Desde Dashboard
# Click "Deploy" en Vercel Dashboard

# Opción B: Desde CLI
vercel --prod
```

---

## ✅ PASO 3: Verificar Despliegue

### 3.1. Check Deployment

```bash
# Ver logs de build
# Vercel Dashboard → Deployments → [Latest] → Logs

# Verificar que no haya errores
```

### 3.2. Probar Aplicación

```bash
# 1. Abrir URL de producción
https://tu-proyecto.vercel.app

# 2. Probar login
https://tu-proyecto.vercel.app/auth/signin

# 3. Verificar dashboard
https://tu-proyecto.vercel.app/dashboard

# 4. Test API
curl https://tu-proyecto.vercel.app/api/health
```

### 3.3. Verificar Base de Datos

```bash
# Desde Neon Dashboard:
# 1. Click en "Tables"
# 2. Verificar que existan:
#    - organizations
#    - users
#    - invoices
#    - customers
#    - etc.
```

---

## 🔧 PASO 4: Configuración Post-Deploy

### 4.1. Crear Super Admin

```bash
# Opción A: Desde Prisma Studio
npx prisma studio --url=$DATABASE_URL

# Crear usuario manualmente:
# - email: admin@example.com
# - password: [Hashear con bcrypt]
# - role: SUPER_ADMIN

# Opción B: Ejecutar seed (si existe)
npx prisma db seed
```

### 4.2. Configurar Dominio Personalizado

```bash
# En Vercel Dashboard → Settings → Domains
# 1. Click "Add Domain"
# 2. Ingresar: facturacion.tuempresa.com
# 3. Seguir instrucciones para DNS
# 4. Esperar propagación DNS (5-15 min)

# Actualizar NEXTAUTH_URL
NEXTAUTH_URL = https://facturacion.tuempresa.com
```

### 4.3. Configurar SSL

```bash
# Automático en Vercel
# Verifica en:
https://facturacion.tuempresa.com

# Debe mostrar candado 🔒
```

---

## 📊 PASO 5: Monitoreo y Logs

### 5.1. Ver Logs en Tiempo Real

```bash
# Opción A: Vercel Dashboard
# Dashboard → Deployments → [Latest] → Runtime Logs

# Opción B: Vercel CLI
vercel logs --follow
```

### 5.2. Configurar Alertas

```bash
# En Vercel Dashboard → Settings → Notifications
# 1. Activar notificaciones por email
# 2. Configurar webhook (opcional)
```

### 5.3. Monitoreo de Performance

```bash
# Vercel Analytics (gratis)
# Dashboard → Analytics

# Ver métricas:
# - Response Time
# - Error Rate
# - Request Volume
# - Cache Hit Ratio
```

---

## 🚨 TROUBLESHOOTING

### Error: "Cannot connect to database"

```bash
# Verificar DATABASE_URL
vercel env ls

# Verificar que Neon DB esté activo
# Neon Dashboard → Status

# Test de conexión
npx prisma db pull
```

### Error: "NextAuth configuration error"

```bash
# Verificar NEXTAUTH_SECRET
vercel env get NEXTAUTH_SECRET

# Regenerar si es necesario
openssl rand -base64 32
vercel env add NEXTAUTH_SECRET
```

### Error: "Build failed"

```bash
# Ver logs completos
vercel logs

# Build local para debug
npm run build

# Limpiar caché
vercel --force
```

### Error: "HKA SOAP connection failed"

```bash
# Verificar credenciales HKA
vercel env ls | grep HKA

# Test de conexión
curl https://tu-proyecto.vercel.app/api/hka/test-connection
```

---

## 🔄 PASO 6: CI/CD Automático

### 6.1. Configurar GitHub Integration

```bash
# Vercel automáticamente hace deploy en:
# - Push a main/master → Deploy a producción
# - Push a otras ramas → Preview deploy
# - Pull Request → Preview deploy
```

### 6.2. Configurar Branch Protection

```bash
# En GitHub:
# Settings → Branches → Add rule
# 1. Branch name pattern: main
# 2. ✓ Require pull request reviews
# 3. ✓ Require status checks (Vercel)
```

---

## 📋 CHECKLIST FINAL

### Pre-Deploy
- [x] Build local exitoso
- [x] Tests pasando
- [x] Variables de entorno documentadas
- [x] Base de datos Neon creada
- [x] Schema aplicado

### Deploy
- [ ] Repositorio conectado a Vercel
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] URL funcionando

### Post-Deploy
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] APIs responden
- [ ] Base de datos conectada
- [ ] Super Admin creado

### Producción
- [ ] Dominio personalizado configurado
- [ ] SSL activo
- [ ] Monitoreo configurado
- [ ] Alertas activas
- [ ] Backup configurado

---

## 🎯 URLs IMPORTANTES

```bash
# Aplicación
Production: https://tu-proyecto.vercel.app
Dashboard: https://tu-proyecto.vercel.app/dashboard

# Vercel
Dashboard: https://vercel.com/tu-usuario/tu-proyecto
Logs: https://vercel.com/tu-usuario/tu-proyecto/deployments
Settings: https://vercel.com/tu-usuario/tu-proyecto/settings

# Neon
Dashboard: https://console.neon.tech/app/projects/tu-proyecto-id
Connection: https://console.neon.tech/app/projects/tu-proyecto-id/branches
```

---

## 📞 SOPORTE

### Vercel
- Docs: https://vercel.com/docs
- Support: support@vercel.com
- Discord: https://discord.gg/vercel

### Neon
- Docs: https://neon.tech/docs
- Support: support@neon.tech
- Discord: https://discord.gg/neon

### SAGO-FACTU
- Docs: Ver archivos `.md` en el repositorio
- Issues: GitHub Issues del proyecto

---

## ✅ RESULTADO ESPERADO

Después de seguir esta guía, deberías tener:

1. ✅ Aplicación desplegada en Vercel
2. ✅ Base de datos PostgreSQL en Neon
3. ✅ SSL automático configurado
4. ✅ CI/CD funcionando
5. ✅ Monitoreo activo
6. ✅ Sistema accesible 24/7

**¡Listo para producción!** 🚀

---

**Última actualización**: 22 de octubre de 2025


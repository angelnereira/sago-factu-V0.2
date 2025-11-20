# 🔗 Integración Vercel + Neon

## 📋 Variables de Entorno Necesarias

### ✅ **Variables que SÍ debes configurar:**

#### **1. DATABASE_URL** (OBLIGATORIA)
```bash
DATABASE_URL=postgresql://neondb_owner:PASSWORD@HOST.neon.tech/neondb?sslmode=require
```
- **Propósito:** Prisma la usa para conectarse a la base de datos
- **Ambientes:** Production, Preview, Development
- **Nota:** Es la ÚNICA variable de BD que necesitas

---

### ❌ **Variables que NO necesitas:**

Las siguientes variables **NO son necesarias** para Prisma:

- `DATABASE_URL_UNPOOLED` - Solo si usas conexión directa sin pooler
- `PGHOST` - Prisma lo extrae de DATABASE_URL
- `PGHOST_UNPOOLED` - No necesario con pooler
- `PGUSER` - Prisma lo extrae de DATABASE_URL
- `PGDATABASE` - Prisma lo extrae de DATABASE_URL
- `PGPASSWORD` - Prisma lo extrae de DATABASE_URL

**¿Por qué no las necesitas?**

Prisma parsea automáticamente la `DATABASE_URL` y extrae:
```
postgresql://[PGUSER]:[PGPASSWORD]@[PGHOST]/[PGDATABASE]
```

---

## 🎯 Configuración en Neon-Vercel Integration

Cuando configures la integración, usa estos valores:

### **Vercel Environment Variables:**
- ✅ Marca solo: **`DATABASE_URL`**
- ❌ No marques las demás

### **Default Database and Role:**
```
Database: neondb
Role: neondb_owner
```

Esto asegura que:
- Cada Preview Deployment obtenga un branch de Neon
- Use la base de datos `neondb`
- Use el rol `neondb_owner`

---

## 📊 Cómo Funciona la Integración

### **Para Production:**
```
Vercel Production → Neon Main Branch
- Usa DATABASE_URL configurada manualmente
- Conexión a branch main de Neon
- Datos persistentes
```

### **Para Preview (Pull Requests):**
```
Vercel Preview → Neon Branch Automático
- Neon crea branch automáticamente
- Nombre: preview/pr-{numero}-{branch}
- DATABASE_URL se actualiza automáticamente
- Datos temporales (se eliminan al cerrar PR)
```

### **Para Development:**
```
Local Development → Neon
- Usa DATABASE_URL de .env local
- Puede ser el mismo branch que producción
- O un branch de desarrollo dedicado
```

---

## 🔧 Setup Paso a Paso

### **1. En Neon Console:**

1. Ve a: https://console.neon.tech
2. Selecciona tu proyecto: `sago-factu`
3. Ve a "Integrations" → "Vercel"
4. Click en "Add Integration"

### **2. Configurar Variables:**

**Marca solo:**
- ✅ `DATABASE_URL`

**NO marques:**
- ❌ `DATABASE_URL_UNPOOLED`
- ❌ `PGHOST`
- ❌ `PGHOST_UNPOOLED`
- ❌ `PGUSER`
- ❌ `PGDATABASE`
- ❌ `PGPASSWORD`

### **3. Configurar Default Database:**

```
Database: neondb
Role: neondb_owner
```

### **4. Seleccionar Proyecto de Vercel:**

- Selecciona: `sago-factu-v0-2`
- Click en "Connect"

### **5. Verificar en Vercel:**

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Verifica que `DATABASE_URL` esté configurada

---

## 🎯 Resultado Esperado

### **En Vercel (Environment Variables):**

```bash
# ✅ Variables de Base de Datos
DATABASE_URL=postgresql://neondb_owner:xxx@xxx.neon.tech/neondb?sslmode=require

# ✅ Variables de NextAuth
NEXTAUTH_URL=https://sago-factu.vercel.app
NEXTAUTH_SECRET=xxx

# ✅ Variables de App
SUPER_ADMIN_EMAIL=admin@sagofactu.com
SUPER_ADMIN_PASSWORD=xxx
NODE_ENV=production

# ✅ Variables HKA (opcional)
HKA_ENV=demo
HKA_DEMO_SOAP_URL=https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
# ... etc
```

---

## 🔄 Flujo de Deployment con Neon

### **Escenario 1: Push a Main**

```
1. Git push a main
2. Vercel detecta el cambio
3. Vercel usa DATABASE_URL (branch main de Neon)
4. Ejecuta: vercel-build.sh
   - prisma generate
   - prisma db push
   - npm run build
5. Deploy a producción ✅
```

### **Escenario 2: Abrir Pull Request**

```
1. Abres PR en GitHub
2. Neon crea branch automáticamente
   - Nombre: preview/pr-42-feature-branch
3. Neon actualiza DATABASE_URL en Vercel (solo para este preview)
4. Vercel hace preview deploy
5. Ejecuta: vercel-build.sh con el nuevo DATABASE_URL
6. Preview disponible con su propia BD ✅
```

### **Escenario 3: Cerrar Pull Request**

```
1. Cierras o mergeas el PR
2. Neon elimina el branch automáticamente
3. Vercel elimina el preview deployment
4. Limpieza completa ✅
```

---

## 🆘 Troubleshooting

### **Problema: "Connection timeout" en Vercel**

**Posibles causas:**
1. DATABASE_URL mal configurada
2. Neon branch no existe
3. Firewall bloqueando conexión

**Solución:**
```bash
# Verificar que DATABASE_URL esté correcta
# En Vercel → Settings → Environment Variables
# Debe verse así:
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require
```

### **Problema: "Prisma Client not generated"**

**Causa:** El build no está generando el cliente

**Solución:**
```bash
# Verificar que vercel-build.sh tenga:
npx prisma generate

# O en package.json:
"build": "prisma generate && next build"
```

### **Problema: Variables PGHOST, PGUSER aparecen como undefined**

**Causa:** No deberías necesitarlas con Prisma

**Solución:**
- Usa solo `DATABASE_URL`
- Prisma maneja todo internamente
- Si las necesitas, agrégalas manualmente en Vercel

---

## 📊 Monitoreo

### **Ver Conexiones Activas en Neon:**

1. Ve a Neon Console
2. Selecciona tu proyecto
3. Ve a "Monitoring"
4. Verás conexiones activas de Vercel

### **Ver Branches Activos:**

1. Ve a Neon Console
2. Selecciona tu proyecto
3. Ve a "Branches"
4. Verás:
   - `main` (producción)
   - `preview/pr-X-Y` (PRs activos)

---

## ✅ Checklist Final

- [ ] Solo `DATABASE_URL` marcada en Neon integration
- [ ] Default database: `neondb`
- [ ] Default role: `neondb_owner`
- [ ] Vercel tiene `DATABASE_URL` configurada
- [ ] Vercel tiene todas las demás env vars necesarias
- [ ] Push a main funciona
- [ ] Preview deployments funcionan
- [ ] Branches de Neon se crean automáticamente en PRs

---

## 📚 Recursos

- **Neon + Vercel:** https://neon.tech/docs/guides/vercel
- **Prisma + Neon:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Vercel Env Vars:** https://vercel.com/docs/concepts/projects/environment-variables

---

**Última actualización:** Configuración inicial  
**Mantenido por:** Equipo SAGO-FACTU


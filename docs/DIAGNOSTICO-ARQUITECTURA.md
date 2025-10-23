# 🔍 DIAGNÓSTICO COMPLETO - SAGO-FACTU

## 📊 ESTADO ACTUAL

### ✅ **LO QUE FUNCIONA:**
1. ✅ Código base de Next.js 15 funcionando
2. ✅ Vercel deployment configurado
3. ✅ Variables de entorno en Vercel configuradas
4. ✅ Middleware optimizado (< 100 KB)
5. ✅ Seguridad: Credenciales protegidas en `.gitignore`

### 🚨 **PROBLEMAS CRÍTICOS ENCONTRADOS:**

#### **PROBLEMA #1: Inconsistencia de Base de Datos** 🔴

**Local:**
- Schema: `provider = "sqlite"`
- DATABASE_URL: `file:./dev.db`
- Estado: ✅ Funciona (dev.db existe)

**Vercel (Producción):**
- DATABASE_URL apunta a: `postgresql://...neon.tech/neondb`
- Script `vercel-build.sh` cambia automáticamente a PostgreSQL
- Estado: ⚠️ **Desconectado de la realidad**

**Consecuencias:**
- ❌ El registro falla en producción porque el schema local es SQLite
- ❌ Las migraciones no están sincronizadas
- ❌ Datos locales (SQLite) ≠ Datos en producción (PostgreSQL)

---

#### **PROBLEMA #2: Dos Clientes de Prisma** 🟡

**Archivos:**
1. `lib/prisma.ts` → Exporta `prisma`
2. `lib/prisma-auth.ts` → Exporta `prismaAuth`

**Uso actual:**
- `app/auth/signup/page.tsx` usa `prismaAuth`
- `app/auth/signin/page.tsx` usa `prismaAuth` (indirectamente vía `lib/auth.ts`)
- Otros archivos usan `prisma`

**Problema:**
- ⚠️ Doble instancia innecesaria
- ⚠️ Confusión sobre cuál usar
- ⚠️ Posibles problemas de conexión

---

#### **PROBLEMA #3: Error de Registro en Producción** 🔴

**Error reportado:** "Error de servidor" al registrarse

**Causa probable:**
1. Base de datos en Vercel no tiene las tablas creadas
2. O las credenciales de Neon no están funcionando
3. O hay un error en el código de `handleSignUp`

**Necesita:**
- Ver logs de Runtime en Vercel
- Verificar que `prisma db push` se ejecutó correctamente en el build

---

## 🏗️ ARQUITECTURA ACTUAL

### **📁 Estructura de Archivos (Relevantes):**

```
sago-factu/
├── prisma/
│   ├── schema.prisma          # ⚠️ SQLite (debería ser PostgreSQL)
│   ├── dev.db                 # Base de datos local SQLite
│   ├── seed.ts                # Script de seed
│   └── migrations/            # ❌ No existen (usando db push)
│
├── lib/
│   ├── prisma.ts              # Cliente Prisma genérico
│   ├── prisma-auth.ts         # Cliente Prisma para auth (⚠️ redundante)
│   └── auth.ts                # Configuración NextAuth
│
├── app/
│   ├── auth/
│   │   ├── signin/page.tsx    # Login (usa prismaAuth)
│   │   └── signup/page.tsx    # Registro (usa prismaAuth) ⚠️ Error aquí
│   ├── dashboard/page.tsx     # Dashboard protegido
│   └── api/auth/[...nextauth]/route.ts  # API de NextAuth
│
├── scripts/
│   ├── setup-db.js            # Setup para local y producción
│   └── switch-db-provider.js  # Cambia SQLite ↔ PostgreSQL
│
├── .env                       # ⚠️ SQLite local
└── vercel-build.sh            # Script de build para Vercel
```

---

### **🔄 Flujo de Autenticación Actual:**

```
1. Usuario → /auth/signup (formulario)
   ↓
2. handleSignUp (Server Action)
   ↓
3. prismaAuth.user.findUnique() → Verifica email
   ↓
4. prismaAuth.organization.findFirst() → Busca org demo
   ↓
5. Si no existe → prismaAuth.organization.create()
   ↓
6. bcrypt.hash(password, 12) → Hash de contraseña
   ↓
7. prismaAuth.user.create() → ⚠️ FALLA AQUÍ en producción
   ↓
8. redirect("/auth/signin?success=AccountCreated")

❌ En producción: Falla en paso 7 con "Error de servidor"
```

---

### **🔄 Flujo de Login Actual:**

```
1. Usuario → /auth/signin (formulario)
   ↓
2. handleSignIn (Server Action)
   ↓
3. signIn("credentials", { email, password })
   ↓
4. NextAuth → CredentialsProvider → authorize()
   ↓
5. prismaAuth.user.findUnique() → Busca usuario
   ↓
6. bcrypt.compare(password, hash) → Verifica contraseña
   ↓
7. Retorna user object
   ↓
8. NextAuth crea JWT token
   ↓
9. redirect("/dashboard")

✅ Debería funcionar si el usuario existe en la BD
```

---

### **🗄️ Base de Datos:**

#### **Local (Desarrollo):**
```
Provider: SQLite
Archivo: prisma/dev.db
Ubicación: Local en tu PC
Estado: ✅ Funcional
Tablas: Creadas con `prisma db push`
Datos: Seeded con `prisma/seed.ts`
```

#### **Producción (Vercel):**
```
Provider: PostgreSQL (Neon)
Host: ep-divine-field-ad26eaav-pooler.c-2.us-east-1.aws.neon.tech
Database: neondb
Estado: ⚠️ Desconocido
Tablas: ⚠️ Deberían crearse en cada deploy
Datos: ⚠️ Deberían crearse en cada deploy
```

---

## 🎯 PLAN DE ACCIÓN (Orden Prioritario)

### **PASO 1: Verificar Estado de Neon** 🔴 CRÍTICO
- [ ] Conectarse a Neon y verificar si existen las tablas
- [ ] Verificar si existe el usuario `admin@sagofactu.com`
- [ ] Ver logs del último deployment en Vercel

### **PASO 2: Unificar Clientes Prisma** 🟡 IMPORTANTE
- [ ] Eliminar `lib/prisma-auth.ts`
- [ ] Usar solo `lib/prisma.ts` en toda la app
- [ ] Actualizar imports en auth/signin y auth/signup

### **PASO 3: Estandarizar Base de Datos** 🟡 IMPORTANTE
- [ ] Decidir: ¿SQLite local + PostgreSQL producción? O ¿PostgreSQL en ambos?
- [ ] Si PostgreSQL en ambos: Crear DB local en Neon o usar Docker
- [ ] Actualizar `.env` y `schema.prisma`

### **PASO 4: Arreglar Registro** 🔴 CRÍTICO
- [ ] Agregar logging detallado en `handleSignUp`
- [ ] Verificar el error exacto en Vercel Runtime Logs
- [ ] Probar registro localmente primero

### **PASO 5: Limpiar Código Obsoleto** 🟢 OPCIONAL
- [ ] Eliminar archivos no usados
- [ ] Eliminar imports no usados
- [ ] Eliminar comentarios obsoletos

### **PASO 6: Documentar Arquitectura Final** 🟢 OPCIONAL
- [ ] Crear diagrama de arquitectura
- [ ] Documentar flujos de autenticación
- [ ] Crear guía de desarrollo

---

## 🔧 SOLUCIONES PROPUESTAS

### **OPCIÓN A: PostgreSQL en Todo** (Recomendado)
**Pros:**
- ✅ Consistencia total entre dev y prod
- ✅ No necesita cambiar provider en build
- ✅ Puedes usar features de PostgreSQL

**Contras:**
- ❌ Requiere configurar PostgreSQL local o usar Neon para dev
- ❌ Más complejo de configurar

**Implementación:**
1. Crear branch "dev" en Neon
2. Usar `DATABASE_URL` de Neon en `.env` local
3. Eliminar `switch-db-provider.js`
4. Actualizar `schema.prisma` a PostgreSQL permanentemente

---

### **OPCIÓN B: SQLite Local + PostgreSQL Prod** (Actual)
**Pros:**
- ✅ Fácil desarrollo local (no requiere servidor DB)
- ✅ Rápido de configurar

**Contras:**
- ❌ Inconsistencias entre dev y prod
- ❌ Script de build debe cambiar provider
- ❌ Posibles bugs que solo aparecen en producción

**Implementación:**
1. Mantener setup actual
2. Mejorar script de build
3. Agregar verificación de sintaxis compatible

---

## 📝 ARCHIVOS A LIMPIAR

### **Obsoletos/No Usados:**
- [ ] `test-neon-connection.js` (solo para testing)
- [ ] `test-signup.js` (solo para testing)
- [ ] `lib/prisma-auth.ts` (redundante)

### **A Mantener:**
- ✅ `lib/prisma.ts`
- ✅ `scripts/setup-db.js`
- ✅ `scripts/switch-db-provider.js` (si usas Opción B)
- ✅ `vercel-build.sh`

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **AHORA MISMO:** Ver logs de Vercel para entender el error exacto
2. **LUEGO:** Verificar estado de la BD en Neon
3. **DESPUÉS:** Decidir estrategia (Opción A o B)
4. **FINALMENTE:** Implementar la solución elegida

---

**Fecha:** $(date)
**Estado:** Diagnóstico completado, esperando decisión de estrategia


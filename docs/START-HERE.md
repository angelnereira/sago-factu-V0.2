# 🚀 SAGO FACTU — Comienza Aquí

**Plataforma SaaS de Facturación Electrónica para Panamá**

---

## ⚡ Acceso Rápido (5 segundos)

### 👉 **[ABRE LA APP AQUÍ](https://sago-factu.vercel.app/)**

```
Usuario Demo:  usuario@empresa.com
Contraseña:    usuario123
```

O usa Super Admin:
```
Super Admin:   admin@sago-factu.com
Contraseña:    admin123
```

---

## ✅ Estado Actual

| Aspecto | Status | Detalles |
|---------|--------|----------|
| **App en Vivo** | ✅ Operativa | https://sago-factu.vercel.app/ |
| **Build** | ✅ Sin Errores | Zero failing tests |
| **Encriptación** | ✅ Funcional | AES-256-GCM + PBKDF2 |
| **Base de Datos** | ✅ Conectada | PostgreSQL Neon |
| **Autenticación** | ✅ Activa | NextAuth v5 |
| **Multi-tenancy** | ✅ Operativa | Por usuario y organización |

---

## 🎯 Qué Puedes Hacer Ahora

### 1️⃣ **Probar la App en Vivo** (5 min)
- Abre https://sago-factu.vercel.app/
- Inicia sesión con credenciales demo
- Explora dashboards, facturas y reportes

### 2️⃣ **Verificar la Encriptación** (2 min)
- Ve a **Settings → HKA Credentials Configuration**
- Ingresa: `demo_user_test` / `demo_pass_test_123`
- Haz clic en **Save**
- Verifica que se guarden sin error ✅

### 3️⃣ **Leer la Documentación Técnica** (10 min)
- [ENCRYPTION-FIX-SUMMARY.md](./ENCRYPTION-FIX-SUMMARY.md) — Fix crítico de encriptación
- [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) — Cómo está deployado
- [TESTING-PRODUCTION.md](./TESTING-PRODUCTION.md) — Testing completo en producción

### 4️⃣ **Entender la Arquitectura** (15 min)
- [README.md](./README.md) — Overview del proyecto
- [ARQUITECTURA-CREDENCIALES-USUARIOS.md](./ARQUITECTURA-CREDENCIALES-USUARIOS.md) — Diseño de credenciales multi-tenant

---

## 🔍 Verificación de Infraestructura

### ✅ En Producción

```bash
# BD PostgreSQL
Status: Neon Serverless — CONECTADA ✅

# Encriptación
Algoritmo: AES-256-GCM
PBKDF2: 120,000 iteraciones
Status: FUNCIONAL ✅

# Autenticación
Sistema: NextAuth.js v5
Status: ACTIVO ✅

# Credenciales HKA
Almacenamiento: Encriptado en PostgreSQL
Lectura: Runtime (dinámica)
Status: OPERATIVA ✅
```

---

## 📋 Guía Rápida de Testing

### Test 1: Encriptación Funciona (2 min)

```
1. Login con usuario@empresa.com / usuario123
2. Settings → HKA Credentials Configuration
3. Ingresa: demo_user_test / demo_pass_test_123
4. Haz clic Save
5. Recarga la página
6. Verifica que los datos persisten ✅
```

**¿Qué prueba esto?**
- ✅ Encriptación AES-256-GCM está operativa
- ✅ Validación en runtime funciona
- ✅ BD está conectada
- ✅ Multi-tenancy por usuario está operativa

### Test 2: Crear una Factura (3 min)

```
1. Ve a Facturas → Nueva Factura
2. Llena datos básicos (cliente, producto, cantidad, precio)
3. Haz clic Enviar
4. Verifica que aparezca en el listado
```

### Test 3: Ver Dashboard (1 min)

```
1. Después de login, verás el dashboard
2. Observa: folios, facturas, estadísticas
3. Verifica que todo carga sin errores
```

---

## 🛠️ Para Desarrolladores

### Clonar y Desarrollar Localmente

```bash
git clone https://github.com/angelnereira/sago-factu-V0.2.git
cd sago-factu
npm install
cp .env.example .env
npm run setup && npm run db:migrate && npm run db:seed
npm run dev
# Abre http://localhost:3000
```

### Stack Tecnológico

- **Frontend**: React 19 + Next.js 15 + Tailwind CSS 4
- **Backend**: Next.js API Routes
- **BD**: PostgreSQL (Neon Serverless)
- **Autenticación**: NextAuth.js v5
- **Encriptación**: crypto (Node.js native)
- **ORM**: Prisma
- **Hosting**: Vercel

---

## 📚 Documentación Clave

| Documento | Propósito | Lectura |
|-----------|-----------|---------|
| [README.md](./README.md) | Overview general | 5 min |
| [START-HERE.md](./START-HERE.md) | Este archivo | 3 min |
| [TESTING-PRODUCTION.md](./TESTING-PRODUCTION.md) | Testing completo | 10 min |
| [ENCRYPTION-FIX-SUMMARY.md](./ENCRYPTION-FIX-SUMMARY.md) | Fix de encriptación | 8 min |
| [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) | Deployment | 7 min |
| [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) | Pre-prod checklist | 5 min |

---

## 🚨 Si Algo No Funciona

### Error: "Fallo al encriptar token HKA"

```
1. Verifica que ENCRYPTION_KEY esté en Vercel
2. Vercel → Project → Settings → Environment Variables
3. Agrega: ENCRYPTION_KEY=923f1d9ae34a1bf8d793499ec3fc200334ebedf165c85a3ad4da5f54e8aa4e8a
4. Redeploy
```

### Otros Problemas

Consulta [TESTING-PRODUCTION.md#-errores-conocidos-y-soluciones](./TESTING-PRODUCTION.md#-errores-conocidos-y-soluciones)

---

## 📞 Soporte

- **Email**: soporte@sago-factu.com
- **Issues**: https://github.com/angelnereira/sago-factu-V0.2/issues
- **Documentación**: Este repositorio

---

## 🎉 Resumen

Tu app está:
- ✅ **En vivo en producción**
- ✅ **Con encriptación operativa**
- ✅ **Completamente documentada**
- ✅ **Lista para demo a clientes**

### Próximos Pasos

1. Prueba la app en https://sago-factu.vercel.app/
2. Lee [ENCRYPTION-FIX-SUMMARY.md](./ENCRYPTION-FIX-SUMMARY.md) para entender qué se fixeó
3. Sigue [TESTING-PRODUCTION.md](./TESTING-PRODUCTION.md) para testing completo
4. Contacta a UbicSystem para cambios adicionales o deployment en tu infraestructura

---

**SAGO FACTU v0.7.0** | Enterprise Billing Platform for Panamá
🚀 En vivo en: https://sago-factu.vercel.app/

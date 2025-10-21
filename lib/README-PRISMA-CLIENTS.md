# 📚 Guía de Clientes Prisma

## 🎯 Dos Clientes, Dos Propósitos

SAGO-FACTU usa **dos clientes de Prisma** para diferentes casos de uso:

### **1. `lib/prisma-server.ts` - Para Server Actions**

**Cuándo usar:**
- ✅ Server Actions (formularios)
- ✅ API Routes que modifican datos
- ✅ Autenticación (NextAuth)
- ✅ Cualquier operación de escritura

**Por qué:**
- Sin extensiones = tipos simples y serializables
- Compatible con Server Actions de Next.js 15
- Evita errores de serialización
- Más rápido para operaciones simples

**Ejemplo:**
```typescript
import { prismaServer } from "@/lib/prisma-server"

async function handleSignUp(formData: FormData) {
  "use server"
  
  const user = await prismaServer.user.create({
    data: { ... }
  })
}
```

---

### **2. `lib/prisma.ts` - Para Queries Optimizadas**

**Cuándo usar:**
- ✅ Componentes de Servidor (lectura)
- ✅ API Routes de solo lectura
- ✅ Dashboards con datos complejos
- ✅ Paginación y búsquedas

**Por qué:**
- Con extensiones (Accelerate, Pagination)
- Caché automático
- Connection pooling
- Queries hasta 6x más rápidas

**Ejemplo:**
```typescript
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  // Query optimizada con caché
  const users = await prisma.user.findMany({
    take: 20,
  })
  
  return <div>...</div>
}
```

---

## 📋 Casos de Uso Detallados

### **Server Actions (prisma-server)**

```typescript
// app/auth/signup/page.tsx
import { prismaServer } from "@/lib/prisma-server"

async function handleSignUp(formData: FormData) {
  "use server"
  
  const user = await prismaServer.user.create({
    data: {
      email: formData.get("email"),
      name: formData.get("name"),
      // ...
    }
  })
  
  redirect("/dashboard")
}
```

---

### **API Routes de Escritura (prisma-server)**

```typescript
// app/api/users/route.ts
import { prismaServer } from "@/lib/prisma-server"

export async function POST(request: Request) {
  const data = await request.json()
  
  const user = await prismaServer.user.create({
    data
  })
  
  return Response.json(user)
}
```

---

### **Autenticación (prisma-server)**

```typescript
// lib/auth.ts
import { prismaServer } from "@/lib/prisma-server"

async function authorize(credentials) {
  const user = await prismaServer.user.findUnique({
    where: { email: credentials.email }
  })
  
  return user
}
```

---

### **Dashboards (prisma)**

```typescript
// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma"

export default async function Dashboard() {
  // Query optimizada con caché
  const [users, invoices, stats] = await Promise.all([
    prisma.user.findMany({ take: 10 }),
    prisma.invoice.findMany({ take: 10 }),
    prisma.invoice.aggregate({
      _count: true,
      _sum: { total: true }
    })
  ])
  
  return <div>...</div>
}
```

---

### **Listados con Paginación (prisma)**

```typescript
// app/users/page.tsx
import { prisma } from "@/lib/prisma"

export default async function UsersPage({ searchParams }) {
  const page = Number(searchParams.page) || 1
  
  const users = await prisma.user.findMany({
    skip: (page - 1) * 20,
    take: 20,
    orderBy: { createdAt: 'desc' }
  })
  
  return <div>...</div>
}
```

---

### **Búsquedas (prisma)**

```typescript
// app/api/search/route.ts
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  // Query optimizada con caché
  const results = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 20
  })
  
  return Response.json(results)
}
```

---

## 🚨 Regla de Oro

**¿Es una Server Action o modifica datos?**
- ✅ Sí → Usa `prisma-server`
- ❌ No → Usa `prisma` (optimizado)

---

## 📊 Comparativa

| Característica | prisma-server | prisma |
|----------------|---------------|---------|
| Server Actions | ✅ Sí | ❌ No |
| Modificar datos | ✅ Sí | ✅ Sí |
| Queries de lectura | ✅ Sí | ✅ Sí (mejor) |
| Caché | ❌ No | ✅ Sí |
| Connection pooling | ❌ Básico | ✅ Avanzado |
| Paginación helpers | ❌ No | ✅ Sí |
| Encriptación | ❌ No | ⚠️  Opcional |
| Tipos | ✅ Simples | ⚠️  Complejos |
| Performance lectura | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Performance escritura | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🔧 Configuración

### **prisma-server.ts**
```typescript
import { PrismaClient } from '@prisma/client'

export const prismaServer = new PrismaClient({
  log: ['error', 'warn'],
})
```

### **prisma.ts**
```typescript
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { pagination } from 'prisma-extension-pagination'

const client = new PrismaClient()
  .$extends(withAccelerate())
  .$extends(pagination())
  
export const prisma = client
```

---

## ❓ FAQ

### **¿Por qué dos clientes?**
Next.js 15 Server Actions requieren que todos los datos sean serializables. Las extensiones de Prisma añaden métodos que no son serializables, causando errores.

### **¿Puedo usar `prisma` en Server Actions?**
No. Causará errores de serialización. Siempre usa `prisma-server`.

### **¿Puedo usar `prisma-server` en dashboards?**
Sí, pero perderás optimizaciones (caché, pooling). Usa `prisma` para mejor performance.

### **¿Qué pasa si me equivoco?**
- Si usas `prisma` en Server Action → Error de serialización
- Si usas `prisma-server` en dashboard → Funciona, pero más lento

### **¿Cuál uso en API Routes?**
- POST/PUT/DELETE → `prisma-server`
- GET (lectura) → `prisma` (mejor performance)

---

## 🎯 Ejemplos Rápidos

### **✅ CORRECTO:**

```typescript
// Server Action
import { prismaServer } from "@/lib/prisma-server"
async function createUser(data: FormData) {
  "use server"
  await prismaServer.user.create({ ... })
}

// Dashboard
import { prisma } from "@/lib/prisma"
export default async function Dashboard() {
  const users = await prisma.user.findMany()
  return <div>...</div>
}
```

### **❌ INCORRECTO:**

```typescript
// Server Action (MAL)
import { prisma } from "@/lib/prisma"  // ❌
async function createUser(data: FormData) {
  "use server"
  await prisma.user.create({ ... })  // ❌ Error de serialización
}

// Dashboard (no óptimo)
import { prismaServer } from "@/lib/prisma-server"  // ⚠️
export default async function Dashboard() {
  const users = await prismaServer.user.findMany()  // ⚠️ Más lento
  return <div>...</div>
}
```

---

## 📚 Referencias

- [Prisma Extensions](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [PRISMA-OPTIMIZATIONS.md](../PRISMA-OPTIMIZATIONS.md)

---

**Última actualización:** Implementación de dos clientes Prisma  
**Mantenido por:** Equipo SAGO-FACTU


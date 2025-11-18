# 🏗️ Arquitectura Refactorización: Folios y Configuración de Usuarios

## Resumen Ejecutivo

Este documento describe las tres áreas principales de refactorización solicitadas por el usuario para mejorar la arquitectura de SAGO-FACTU:

1. **Sistema de Folios**: Cambio de modelo "compra por usuario" a "sincronización con HKA"
2. **Configuración de Usuarios**: Estandarización para que solo admin tenga features diferentes
3. **Certificados**: Sincronización completa de deletions en UI y BD (✅ COMPLETADO)

---

## 1. REFACTORIZACIÓN: Sistema de Folios

### Problema Actual

```
ARQUITECTURA ACTUAL (Problemas):
┌─────────────────────────────────────┐
│      Usuario Regular                 │
├─────────────────────────────────────┤
│  ❌ Puede "comprar" folios           │  ← Confusa (no es real compra)
│  ❌ Visión limitada (solo org)       │
│  ❌ Asignación por usuario           │
│  ❌ Purchase modal visible           │
└─────────────────────────────────────┘
        ↓ POST /api/folios/purchase
   ❌ Crea FolioPool innecesario
```

### Solución Requerida

```
ARQUITECTURA OBJETIVO (Propuesta):
┌─────────────────────────────────────┐
│    Todos los Usuarios (Admin + Regular)
├─────────────────────────────────────┤
│  ✅ Solo consulta HKA (GET)          │
│  ✅ Mismo listado para todos        │
│  ✅ Asignación a nivel organización │
│  ✅ Sin compra manual               │
│  ✅ Sincronización automática       │
└─────────────────────────────────────┘
        ↓ POST /api/folios/sincronizar
   ✅ Consulta HKA vía SOAP
   ✅ Actualiza BD local
   ✅ Todos ven los mismos folios
```

### Cambios Necesarios

#### **1. Modelo de Datos (schema.prisma)**

**ANTES:**
```prisma
model FolioAssignment {
  id String @id
  folioPoolId String      // ← Permite múltiples pools por org
  organizationId String
  assignedAmount Int
  consumedAmount Int
}

// Problema: Permite acumulación de pools
```

**DESPUÉS:**
```prisma
model FolioAssignment {
  id String @id
  folioPoolId String  // ← Relación 1:1 con última sincronización
  organizationId String @unique
  syncedAt DateTime
  totalAvailable Int
  totalConsumed Int

  @@unique([organizationId])  // Una sincronización por org
}
```

#### **2. Endpoints API**

| Endpoint | Antes | Después | Quién |
|----------|-------|---------|-------|
| POST /api/folios/purchase | ✅ Activo | ❌ Eliminar | Usuario |
| POST /api/folios/sincronizar | ✅ Existe | ✅ Mejorar | Admin |
| GET /api/folios/available | ✅ Existe | ✅ Mantener | Todos |

#### **3. Cambios de API**

**POST /api/folios/purchase**
```typescript
// ❌ ELIMINAR COMPLETAMENTE
// Esta endpoint creaba FolioPool de forma manual
// Los folios deben venir SOLO de HKA
```

**POST /api/folios/sincronizar (MEJORADO)**
```typescript
// ✅ ACTUALIZAR para:
// 1. Consultar folios de HKA
// 2. Actualizar FolioAssignment (UPSERT en lugar de CREATE)
// 3. Retornar estado actual de folios

// Request:
{
  "organizationId": "org_123"
}

// Response:
{
  "success": true,
  "data": {
    "folios": [
      {
        "folio": "00001",
        "estado": "DISPONIBLE",
        "rango": "00001-10000"
      }
    ],
    "summary": {
      "totalDisponibles": 9998,
      "totalAsignados": 1,
      "totalUtilizados": 1,
      "ultimaSincronizacion": "2025-11-17T10:30:00Z"
    }
  }
}
```

#### **4. Frontend Components**

| Componente | Acción | Razón |
|-----------|--------|-------|
| FolioPurchaseModal | ❌ Eliminar | No aplica |
| FolioPurchaseButton | ❌ Eliminar | No aplica |
| FolioSyncButton | ✅ Mantener | Usuario admin lo usa |
| FolioList | ✅ Mantener | Muestra folios actuales |
| FolioStats | ✅ Mantener | Dashboard |

#### **5. Workflow de Sincronización**

```
USUARIO ADMIN:
1. Va a Settings → Sincronizar Folios
2. Hace clic en "Sincronizar desde HKA"
3. Sistema:
   - Consulta folios de HKA vía SOAP (consultarFolios)
   - Actualiza FolioAssignment para organizacion
   - Retorna folios disponibles
4. Todos los usuarios ven los mismos folios

USUARIOS REGULARES:
- Solo ven listado de folios (GET /api/folios/available)
- No pueden hacer nada (read-only)
- Ven lo que sincronizó el admin
```

---

## 2. REFACTORIZACIÓN: Configuración de Usuarios

### Problema Actual

```
DISTRIBUCIÓN ACTUAL DE FEATURES:
┌─────────────────────────────────┐
│        Admin User               │
├─────────────────────────────────┤
│ ✅ Ver todas las organizaciones │
│ ✅ Crear usuarios              │
│ ✅ Administrar folios          │
│ ✅ Ver reportes globales       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│      Usuario Regular A           │
├─────────────────────────────────┤
│ ✅ Crear facturas              │
│ ✅ Ver reportes               │
│ ❓ Comprar folios (confuso)    │
│ ❓ Configurar certificados    │
│ ❓ Cambiar nombre org          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│      Usuario Regular B           │
├─────────────────────────────────┤
│ ✅ Crear facturas              │
│ ✅ Ver reportes               │
│ ❓ Diferentes permisos que A?  │
│ ❓ Features inconsistentes    │
└─────────────────────────────────┘

PROBLEMA: ✅ Inconsistencia en features de usuarios regulares
```

### Solución Requerida

```
DISTRIBUCIÓN OBJETIVO:
┌─────────────────────────────────┐
│      Admin User                 │
├─────────────────────────────────┤
│ ✅ Gestionar usuarios          │
│ ✅ Gestionar organizaciones    │
│ ✅ Sincronizar folios (HKA)   │
│ ✅ Ver reportes globales       │
│ ✅ Configurar credenciales HKA │
│ ✅ Administración general      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Usuario Regular (CUALQUIERA)   │
├─────────────────────────────────┤
│ ✅ Crear facturas              │
│ ✅ Ver reportes de su org      │
│ ✅ Ver folios disponibles      │
│ ✅ Descargar XML/PDF           │
│ ✅ Perfil personal             │
│ ❌ Comprar folios              │
│ ❌ Crear usuarios              │
│ ❌ Cambiar configuración org   │
└─────────────────────────────────┘

SOLUCIÓN: ✅ Todos los usuarios regulares IDÉNTICOS
```

### Auditoría de Features Actuales

**Ubicaciones a Revisar:**

1. **Rutas (pages)** - ¿Quién puede acceder?
   - `/dashboard` - ¿Solo admin?
   - `/settings` - ¿Solo admin?
   - `/admin` - ✅ Solo admin

2. **Componentes** - ¿Se renderean en navbar/sidebar?
   - FolioPurchaseButton - ¿Quién lo ve?
   - AdminLink - ✅ Solo admin
   - SettingsLink - ¿Todos?

3. **API Endpoints** - ¿Quién puede llamar?
   - POST /api/folios/purchase - ¿Todos? (ELIMINAR)
   - POST /api/admin/* - ✅ Solo admin
   - POST /api/settings/* - ¿Solo admin?

### Cambios Necesarios

#### **Eliminar de Usuarios Regulares:**

```typescript
// ❌ REMOVER: FolioPurchaseButton de navbar
// ❌ REMOVER: acceso a POST /api/folios/purchase
// ❌ REMOVER: cualquier "settings" no admin
```

#### **Estandarizar Acceso:**

```typescript
// Middleware/Layout: src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get("next-auth.session-token")
  const path = request.nextUrl.pathname

  // SOLO admin → /admin/*
  if (path.startsWith("/admin")) {
    if (!user.role === "SUPER_ADMIN") {
      return NextResponse.redirect("/dashboard")
    }
  }

  // TODOS → /dashboard/*
  if (path.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  // SOLO admin → /settings
  if (path === "/settings") {
    if (!user.role === "SUPER_ADMIN") {
      return NextResponse.redirect("/dashboard")
    }
  }
}
```

---

## 3. Certificados: Sincronización Completada ✅

### Cambio Implementado

```
ANTES (Inconsistencia):
- /api/certificates → deactivate old certs
- /api/certificates/upload → delete old certs
                    ❌ INCONSISTENTE

DESPUÉS (Sincronizado):
- /api/certificates → delete old certs  ✅
- /api/certificates/upload → delete old certs  ✅
                    ✅ SINCRONIZADO
```

**Commit:** a18ca17
**Archivo:** lib/certificates/storage.ts
**Cambio:** Actualizar `storeCertificate()` para DELETE en lugar de UPDATE

---

## 4. Plan de Implementación

### Fase 1: Refactorización de Folios (ACTUAL)

- [ ] **1a.** Actualizar schema.prisma
  - Cambiar FolioAssignment a relación 1:1 con org
  - Agregar `syncedAt` timestamp
  - Agregar uniqueness constraint

- [ ] **1b.** Modificar endpoints
  - ❌ Eliminar POST /api/folios/purchase
  - ✅ Actualizar POST /api/folios/sincronizar
  - ✅ Mantener GET /api/folios/available

- [ ] **1c.** Eliminar componentes de compra
  - ❌ Eliminar FolioPurchaseModal.tsx
  - ❌ Eliminar FolioPurchaseButton.tsx
  - ❌ Eliminar importaciones en navbar/sidebar

- [ ] **1d.** Migración de datos
  - Consolidar múltiples FolioAssignments por org
  - Mantener contador de consumido
  - Registrar `syncedAt` actual

- [ ] **1e.** Testing
  - Endpoint sincronización
  - Folio query desde HKA
  - Permissions (solo admin puede sincronizar)

### Fase 2: Estandarización de Usuarios (PRÓXIMA)

- [ ] **2a.** Auditoría de código
  - Buscar componentes con `user.role` checks
  - Buscar rutas con diferentes permisos
  - Buscar endpoints inconsistentes

- [ ] **2b.** Refactorización de rutas
  - Remover settings para non-admin
  - Unificar navbar/sidebar basado en role

- [ ] **2c.** Refactorización de endpoints
  - Agregar role checks consistentes
  - Documentar quién puede acceder qué

- [ ] **2d.** Testing

### Fase 3: Documentación (FINAL)

- [ ] Actualizar ARCHITECTURE-REFACTORING.md con cambios finales
- [ ] Crear FOLIO-SYNC-GUIDE.md
- [ ] Crear ROLE-BASED-ACCESS.md

---

## 5. Preguntas para Clarificación

> ✅ **Confirmado por usuario:**
> - Folios vienen SOLO de HKA, no de compras manuales
> - Todos los usuarios ven los mismos folios
> - Solo admin puede sincronizar

> ❓ **Por Confirmar:**
> 1. ¿Cada organización tiene su propia sincronización o es global?
> 2. ¿Se deben mantener datos históricos de sincronizaciones anteriores?
> 3. ¿Qué tan frecuente debe ser la sincronización automática?

---

## 6. Referencias

**Archivos Relevantes:**

- `/prisma/schema.prisma` - Modelos de datos
- `/app/api/folios/*` - Endpoints de folios
- `/components/folios/*` - Componentes UI
- `/lib/hka/methods/consultar-folios.ts` - Consulta HKA
- `/lib/certificates/storage.ts` - Sincronización certificados (✅ REFERENCIA)

**Commits Relacionados:**

- a18ca17 - fix: synchronize certificate deletion (✅ REFERENCIA)
- f40c510 - fix: implement certificate overwrite strategy
- fb68034 - docs: add HKA credentials troubleshooting guide

---

**Última actualización:** 2025-11-17
**Versión:** 1.0
**Estado:** Planificación Completada

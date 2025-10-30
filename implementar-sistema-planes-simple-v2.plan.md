# Plan: Sistema de Planes - Modo Simple (Interfaz HKA)

## Objetivo

Implementar **Plan Simple** como una interfaz minimalista para que usuarios con credenciales HKA propias puedan:
- Autogestionar sus credenciales HKA
- Usar TODOS los métodos HKA disponibles (enviar, consultar, anular, etc.)
- No usar credenciales de Sago/Ubicsys (solo las suyas propias)
- Acceder a features de HKA a través de interfaz simplificada

**Plan Empresarial**: Mantiene funcionalidad actual (folio pool, dashboard completo, credenciales centralizadas)

## Concepto Clave

**Plan Simple = Cliente directo de HKA con UI de SAGO-FACTU**
- Usuario compra folios directamente a HKA
- Usuario configura sus propias credenciales HKA
- SAGO-FACTU actúa como wrapper/UI para métodos HKA
- Sin gestión de folios ni pool compartido
- Sin métricas/analytics avanzados

## Fase 1: Base de Datos

### 1.1 Modificar Model Organization

**Archivo:** `prisma/schema.prisma`

```prisma
enum OrganizationPlan {
  SUPER_ADMIN
  ENTERPRISE        // Folios Sago Factor, dashboard completo
  SIMPLE            // Credenciales propias, interfaz HKA
}

model Organization {
  // ... campos existentes ...
  
  plan                OrganizationPlan    @default(ENTERPRISE)
  hkaTokenUser        String?             // Para Plan Simple: credenciales propias
  hkaTokenPassword    String?             // Encriptado
  hkaEnvironment      String?             // demo | prod
  
  // ... resto de campos ...
}

enum UserRole {
  SUPER_ADMIN
  ORG_ADMIN
  USER
  SIMPLE_USER       // Usuario Plan Simple (solo UI HKA)
  API_USER
}
```

### 1.2 Migración

```bash
npx prisma migrate dev --name add_simple_plan
```

## Fase 2: Factory Pattern SIMPLIFICADO

### 2.1 Cliente HKA con Credenciales Dinámicas

**Modificación:** El cliente HKA actual (`HKASOAPClient`) NO necesita cambios complejos.

**Solución simple:** Pasar credenciales como parámetro en cada método HKA.

### 2.2 Modificar Todos los Métodos HKA Existentes

**Patrón:** Todos los métodos HKA actuales usan `getHKAClient()` que lee de `.env`.

**Nueva estrategia:** Los métodos HKA aceptan credenciales opcionales.

**Ejemplo para `enviar-documento.ts`:**

```typescript
// ANTES
export async function enviarDocumento(params: EnviarDocumentoParams) {
  const hkaClient = getHKAClient(); // Usa .env siempre
  // ...
}

// DESPUÉS
export async function enviarDocumento(
  params: Omit<EnviarDocumentoParams, 'tokenEmpresa' | 'tokenPassword'>,
  credentials?: { tokenUser: string; tokenPassword: string; environment: 'demo' | 'prod' }
) {
  // Si vienen credenciales (Plan Simple), usarlas
  // Si no (Plan Empresarial), usar getHKAClient()
  
  if (credentials) {
    // Usar credenciales del usuario
    const fullParams = {
      ...params,
      tokenEmpresa: credentials.tokenUser,
      tokenPassword: credentials.tokenPassword,
    };
    // Crear cliente temporal con esas credenciales
  } else {
    // Usar cliente singleton existente (Plan Empresarial)
    const hkaClient = getHKAClient();
  }
}
```

**Problema:** Esto implica modificar TODOS los métodos HKA.

### 2.3 Solución Más Simple: Override Temporal de .env

En lugar de modificar cada método, usar variables de entorno temporales:

**Archivo:** `lib/hka/credentials-manager.ts` (NUEVO)

```typescript
/**
 * Maneja credenciales HKA según el plan de la organización
 */

export interface HKAOrganizationCredentials {
  tokenUser: string;
  tokenPassword: string;
  environment: 'demo' | 'prod';
}

export async function getHKACredentials(
  organizationId: string
): Promise<HKAOrganizationCredentials | null> {
  const { prismaServer: prisma } = await import('@/lib/prisma-server');
  const { OrganizationPlan } = await import('@prisma/client');
  const { decryptToken } = await import('@/lib/utils/encryption');

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, hkaTokenUser: true, hkaTokenPassword: true, hkaEnvironment: true }
  });

  if (!org) return null;

  // Plan Simple: usar credenciales propias
  if (org.plan === OrganizationPlan.SIMPLE) {
    if (!org.hkaTokenUser || !org.hkaTokenPassword) {
      throw new Error('Plan Simple: Configure sus credenciales HKA en Configuración');
    }
    return {
      tokenUser: org.hkaTokenUser,
      tokenPassword: decryptToken(org.hkaTokenPassword),
      environment: (org.hkaEnvironment || 'demo') as 'demo' | 'prod'
    };
  }

  // Plan Empresarial: retornar null (usa .env por defecto)
  return null;
}

/**
 * Ejecuta función HKA con credenciales específicas
 */
export async function withHKACredentials<T>(
  organizationId: string,
  fn: () => Promise<T>
): Promise<T> {
  const credentials = await getHKACredentials(organizationId);

  if (!credentials) {
    // Plan Empresarial: ejecutar normal
    return fn();
  }

  // Plan Simple: override temporal de .env
  const originalToken = process.env.HKA_DEMO_TOKEN_USER;
  const originalPassword = process.env.HKA_DEMO_TOKEN_PASSWORD;
  const originalEnv = process.env.HKA_ENV;

  try {
    process.env.HKA_DEMO_TOKEN_USER = credentials.tokenUser;
    process.env.HKA_DEMO_TOKEN_PASSWORD = credentials.tokenPassword;
    process.env.HKA_ENV = credentials.environment;

    return await fn();
  } finally {
    // Restaurar valores originales
    process.env.HKA_DEMO_TOKEN_USER = originalToken;
    process.env.HKA_DEMO_TOKEN_PASSWORD = originalPassword;
    process.env.HKA_ENV = originalEnv;
  }
}
```

## Fase 3: APIs para Plan Simple

### 3.1 Todas las APIs HKA existentes funcionan automáticamente

**NO HAY QUE CREAR APIs NUEVAS.**

Las APIs existentes:
- `/api/documentos/enviar`
- `/api/documentos/consultar`
- `/api/documentos/anular`
- `/api/folios/sincronizar`
- etc.

**Solo modificar:** Usar `withHKACredentials` antes de llamar métodos HKA.

### 3.2 Ejemplo: Modificar Endpoint de Envío

**Archivo:** `app/api/documentos/enviar/route.ts`

```typescript
import { withHKACredentials } from '@/lib/hka/credentials-manager';

export async function POST(request: Request) {
  // ... validaciones ...

  // Identificar organizationId desde sesión o parámetros
  const invoice = await prisma.invoice.findUnique({ ... });

  // ✅ MODIFICAR AQUÍ: Usar withHKACredentials
  const result = await withHKACredentials(
    invoice.organizationId,
    async () => {
      return await enviarDocumento({ documento: xml });
    }
  );

  // ... resto del código ...
}
```

## Fase 4: UI Plan Simple

### 4.1 Layout Simple

**Archivo:** `app/simple/layout.tsx`

UI minimalista con:
- Header: Logo + "Plan Simple" + user menu
- Sidebar simplificado (opcional) o solo navegación superior
- Contenido centrado y simple

### 4.2 Dashboard Simple

**Archivo:** `app/simple/page.tsx`

```tsx
// Botones principales:
- "Nueva Factura" → /simple/facturas/nueva
- "Mis Facturas" → /simple/facturas
- "Consultar Folios" → /simple/folios (sincroniza con HKA)
- "Configuración HKA" → /simple/configuracion
```

### 4.3 Formulario de Nueva Factura (Simple)

**Archivo:** `app/simple/facturas/nueva/page.tsx`

Reutilizar `components/invoices/invoice-form.tsx` pero:
- Sin selección de folio (HKA los gestiona)
- Validación simplificada
- Botón "Enviar a HKA" que llama a `/api/documentos/enviar`

### 4.4 Página de Configuración HKA

**Archivo:** `app/simple/configuracion/page.tsx`

Formulario para:
- Token Usuario HKA
- Token Password HKA
- Ambiente (Demo/Producción)
- Test de conexión

### 4.5 Página de Folios (solo consulta)

**Archivo:** `app/simple/folios/page.tsx`

Mostrar folios disponibles desde HKA:
- Botón "Sincronizar con HKA" → llama a `/api/folios/sincronizar`
- Lista de folios disponibles (sin gestión de pool, solo vista)

## Fase 5: Middleware de Redirección

**Archivo:** `middleware.ts`

```typescript
// Si usuario Plan Simple intenta acceder a /dashboard → redirigir a /simple
// Si usuario Plan Empresarial intenta acceder a /simple → redirigir a /dashboard
```

## Fase 6: Modificar Workers

### 6.1 Invoice Processor

**Archivo:** `lib/workers/invoice-processor.ts`

Modificar para usar `withHKACredentials`:

```typescript
import { withHKACredentials } from '@/lib/hka/credentials-manager';

export async function processInvoice(job: Job) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: job.data.invoiceId },
    include: { organization: true }
  });

  // ✅ AQUÍ
  const result = await withHKACredentials(
    invoice.organizationId,
    async () => {
      return await enviarDocumento({ documento: xml });
    }
  );

  // ... resto del código ...
}
```

## Fase 7: Actualizar Métodos HKA

### 7.1 Modificar TODOS los métodos para usar withHKACredentials

Archivos a modificar:
- `lib/hka/methods/enviar-documento.ts`
- `lib/hka/methods/consultar-documento.ts`
- `lib/hka/methods/consultar-folios.ts`
- `lib/hka/methods/anular-documento.ts`
- `lib/hka/methods/nota-credito.ts`
- `lib/hka/methods/nota-debito.ts`
- `lib/hka/methods/enviar-correo.ts`
- `lib/hka/methods/rastrear-correo.ts`

**Patrón:**

```typescript
// Agregar parámetro opcional al inicio de la función
export async function enviarDocumento(params, credentials?) {
  // Si credentials viene, crear cliente con esas credenciales
  // Si no, usar getHKAClient() normal
}
```

**O mejor:** NO modificar métodos, dejar que `withHKACredentials` lo maneje a través de .env override.

## Archivos a Crear

1. `lib/utils/encryption.ts` - Encriptación de tokens
2. `lib/hka/credentials-manager.ts` - Gestor de credenciales por plan
3. `app/simple/layout.tsx` - Layout simple
4. `app/simple/page.tsx` - Dashboard simple
5. `app/simple/facturas/nueva/page.tsx` - Nueva factura
6. `app/simple/facturas/page.tsx` - Lista de facturas
7. `app/simple/folios/page.tsx` - Consulta de folios
8. `app/simple/configuracion/page.tsx` - Configuración HKA
9. `components/simple/hka-credentials-form.tsx` - Formulario de credenciales
10. `prisma/seed-simple-user.ts` - Usuario de prueba

## Archivos a Modificar

1. `prisma/schema.prisma` - Agregar plan, campos HKA
2. `lib/workers/invoice-processor.ts` - Usar withHKACredentials
3. `app/api/documentos/enviar/route.ts` - Usar withHKACredentials
4. `app/api/documentos/consultar/route.ts` - Usar withHKACredentials
5. `app/api/documentos/anular/route.ts` - Usar withHKACredentials
6. `app/api/folios/sincronizar/route.ts` - Usar withHKACredentials
7. `middleware.ts` - Redirección por plan
8. Todos los métodos HKA (opcional, si no usamos override)

## Resumen Ejecutivo

**Plan Simple:**
- Usuario configura sus credenciales HKA propias
- Todas las APIs HKA funcionan con sus credenciales (override temporal de .env)
- UI simplificada para facturación
- Sin gestión de folios ni pool
- Sin analytics complejos
- Básicamente: SAGO-FACTU = UI para HKA con sus credenciales

**Plan Empresarial:**
- Todo igual que ahora
- Usa credenciales centralizadas de .env
- Folio pool gestionado
- Dashboard completo

## To-dos

- [ ] Modificar schema Prisma con plan y campos HKA
- [ ] Crear migración
- [ ] Crear lib/utils/encryption.ts
- [ ] Crear lib/hka/credentials-manager.ts
- [ ] Crear app/simple/* con UI minimalista
- [ ] Modificar APIs existentes para usar withHKACredentials
- [ ] Modificar invoice-processor worker
- [ ] Modificar middleware para redirección
- [ ] Crear usuario de prueba
- [ ] Testing

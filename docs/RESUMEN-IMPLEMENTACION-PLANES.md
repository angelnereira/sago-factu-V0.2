# Resumen de Implementación: Sistema de Planes (Simple + Empresarial)

**Fecha:** 27 de Enero, 2025  
**Estado:** ✅ Implementación Base Completada

---

## Objetivo

Implementar sistema de **dos planes de facturación** para SAGO-FACTU:
- **Plan Empresarial**: Folios gestionados por Sago Factor, dashboard completo
- **Plan Simple**: Interfaz HKA directa, usuarios usan sus propias credenciales HKA

---

## Completado

### ✅ Fase 1: Base de Datos

**Archivo:** `prisma/schema.prisma`

**Cambios:**
- Agregado enum `OrganizationPlan` con valores: `SUPER_ADMIN`, `ENTERPRISE`, `SIMPLE`
- Agregados campos al modelo `Organization`:
  - `plan` (OrganizationPlan, default: ENTERPRISE)
  - `hkaTokenPassword` (String encriptado)
  - `hkaEnvironment` (String, default: "demo")
- Agregado `SIMPLE_USER` al enum `UserRole`

**Migración:** `npx prisma db push` ejecutado exitosamente

### ✅ Fase 2: Utilidad de Encriptación

**Archivo:** `lib/utils/encryption.ts` (NUEVO)

**Funciones:**
- `encryptToken(text: string): string` - Encripta tokens HKA con AES-256
- `decryptToken(text: string): string` - Desencripta tokens

**Uso:** Almacenamiento seguro de credenciales HKA de usuarios Plan Simple

### ✅ Fase 3: Credentials Manager

**Archivo:** `lib/hka/credentials-manager.ts` (NUEVO)

**Funciones:**
- `getHKACredentials(organizationId: string)` - Obtiene credenciales según plan
- `withHKACredentials(organizationId, fn)` - Ejecuta función con credenciales correctas

**Implementación:**
- Plan Simple: usa credenciales del usuario (almacenadas en BD)
- Plan Empresarial: usa credenciales centralizadas de `.env`
- Override temporal de variables de entorno para Plan Simple

### ✅ Fase 4: APIs de Configuración

**Archivos:**
- `app/api/settings/hka-credentials/route.ts` (NUEVO)
  - POST: Guardar credenciales HKA (solo Plan Simple)
  - GET: Obtener credenciales (sin password)
- `app/api/settings/test-hka-connection/route.ts` (NUEVO)
  - POST: Probar conexión con HKA

**Validaciones:**
- Solo usuarios Plan Simple pueden configurar credenciales
- Autenticación requerida
- Datos encriptados antes de guardar

### ✅ Fase 5: UI Plan Simple

**Archivos:**
- `app/simple/layout.tsx` (NUEVO) - Layout minimalista con header/footer
- `app/simple/page.tsx` (NUEVO) - Dashboard con acciones rápidas y facturas recientes
- `app/simple/configuracion/page.tsx` (NUEVO) - Página de configuración HKA
- `components/simple/hka-credentials-form.tsx` (NUEVO) - Formulario de credenciales

**Características:**
- UI minimalista y enfocada
- Dashboard con botones para nueva factura y configuración
- Lista de facturas recientes con estados coloridos
- Formulario de configuración HKA con test de conexión

### ✅ Fase 7: Usuario de Prueba

**Archivo:** `prisma/seed-simple-user.ts` (NUEVO)

**Credenciales:**
- Email: `simple@test.com`
- Password: `Password123!`
- Plan: SIMPLE
- Organización: "Demo Plan Simple"
- Credenciales HKA: Configuradas con tokens demo

**Ejecutado:** Usuario creado exitosamente

---

## Pendiente

### ⏳ Fase 6: Modificar Workers

**Archivo:** `lib/workers/invoice-processor.ts`

**Acción requerida:**
```typescript
// ANTES (línea ~36):
const hkaClient = getHKAClient();

// DESPUÉS:
import { withHKACredentials } from '@/lib/hka/credentials-manager';

const result = await withHKACredentials(
  invoice.organizationId,
  async () => {
    const hkaClient = getHKAClient();
    // ... resto del código
  }
);
```

### ⏳ Modificar Todas las APIs HKA

**Archivos a modificar:**
- `app/api/documentos/enviar/route.ts`
- `app/api/documentos/consultar/route.ts`
- `app/api/documentos/anular/route.ts`
- `app/api/folios/sincronizar/route.ts`

**Patrón:**
```typescript
import { withHKACredentials } from '@/lib/hka/credentials-manager';

// Envolver llamadas HKA con withHKACredentials
const result = await withHKACredentials(organizationId, async () => {
  // ... código que usa getHKAClient()
});
```

### ⏳ Middleware de Redirección

**Archivo:** `middleware.ts`

**Acción requerida:**
- Redirigir usuarios Plan Simple desde `/dashboard` a `/simple`
- Redirigir usuarios Plan Empresarial desde `/simple` a `/dashboard`

Nota: El middleware actual es Edge-compatible y puede requerir simplificación.

### ⏳ Páginas Faltantes

**Crear:**
- `app/simple/facturas/nueva/page.tsx` - Nueva factura (reutilizar formulario existente)
- `app/simple/facturas/page.tsx` - Lista de facturas simple

---

## Arquitectura

### Cómo Funciona

```
┌─────────────────────────────────────────────────────────┐
│                    PLAN SIMPLE                          │
│  Usuario configura sus credenciales HKA propias        │
│  SAGO-FACTU = Interfaz UI para HKA                     │
└─────────────────────────────────────────────────────────┘

1. Usuario se registra/logea → Plan SIMPLE
2. Usuario accede a /simple → Dashboard minimalista
3. Usuario configura credenciales HKA en /simple/configuracion
4. Credenciales se encriptan y guardan en BD
5. Al enviar factura:
   - withHKACredentials() detecta Plan SIMPLE
   - Override temporal de process.env.HKA_DEMO_TOKEN_*
   - Llama a métodos HKA con credenciales del usuario
   - Restaura variables originales
6. Factura se envía con credenciales del usuario

┌─────────────────────────────────────────────────────────┐
│                 PLAN EMPRESARIAL                        │
│  Usa credenciales centralizadas de .env                │
│  SAGO-FACTU gestiona folios y pool                     │
└─────────────────────────────────────────────────────────┘

1. Usuario se registra/logea → Plan ENTERPRISE
2. Usuario accede a /dashboard → Dashboard completo
3. Usa credenciales centralizadas de .env
4. Al enviar factura:
   - withHKACredentials() retorna null (Plan Empresarial)
   - Usa credenciales de .env directamente
5. Folios gestionados por Sago Factor
```

### Ventajas del Diseño

1. **No invasivo**: No modifica métodos HKA existentes
2. **Seguro**: Credenciales encriptadas en BD
3. **Mantenible**: Un solo lugar para gestionar credenciales (`withHKACredentials`)
4. **Escalable**: Fácil agregar más planes en el futuro
5. **Retrocompatible**: Funcionalidad existente no se rompe

---

## Testing

### Pasos para Probar Plan Simple

1. **Acceder:**
   ```bash
   # Servidor debe estar corriendo
   npm run dev
   
   # Acceder a http://localhost:3000
   ```

2. **Login:**
   - Email: `simple@test.com`
   - Password: `Password123!`

3. **Verificar redirección:**
   - Debería redirigir automáticamente a `/simple`
   - Si accede a `/dashboard`, debería redirigir a `/simple`

4. **Configurar credenciales HKA:**
   - Ir a `/simple/configuracion`
   - Token Usuario: `walgofugiitj_ws_tfhka`
   - Token Password: `Octopusp1oQs5`
   - Ambiente: `Demo`
   - Hacer clic en "Probar Conexión"

5. **Verificar funcionamiento:**
   - Las credenciales se guardan encriptadas
   - El test de conexión funciona
   - Las facturas usan credenciales del usuario

### Pasos para Probar Plan Empresarial

1. **Login con usuario existente:**
   - Email: `admin@sagofactu.com`
   - Password: `SagoAdmin2025!`

2. **Verificar:**
   - Acceso normal a `/dashboard`
   - Funcionalidad completa intacta
   - Usa credenciales de `.env`

---

## Próximos Pasos

### Corto Plazo

1. ⏳ Modificar `invoice-processor.ts` para usar `withHKACredentials`
2. ⏳ Modificar APIs HKA para usar `withHKACredentials`
3. ⏳ Agregar redirección en middleware
4. ⏳ Crear página de nueva factura para Plan Simple

### Medio Plazo

1. Crear página de facturas para Plan Simple
2. Agregar búsqueda por CAFE
3. Implementar notificaciones por email
4. Agregar onboarding para Plan Simple

### Largo Plazo

1. Permitir cambio de plan (Simple ↔ Empresarial)
2. Migración de datos al cambiar plan
3. Analytics básicos para Plan Simple
4. API keys para Plan Simple

---

## Archivos Creados (10)

- `lib/utils/encryption.ts`
- `lib/hka/credentials-manager.ts`
- `app/api/settings/hka-credentials/route.ts`
- `app/api/settings/test-hka-connection/route.ts`
- `app/simple/layout.tsx`
- `app/simple/page.tsx`
- `app/simple/configuracion/page.tsx`
- `components/simple/hka-credentials-form.tsx`
- `prisma/seed-simple-user.ts`
- `docs/RESUMEN-IMPLEMENTACION-PLANES.md`

## Archivos Modificados (1)

- `prisma/schema.prisma` (agregado enum OrganizationPlan, campos plan, hkaTokenPassword, hkaEnvironment)

---

## Estado Final

- ✅ **Infraestructura base**: 100% completada
- ✅ **Base de datos**: 100% completada
- ✅ **Utilidades**: 100% completadas
- ✅ **APIs de configuración**: 100% completadas
- ✅ **UI Plan Simple**: Layout y dashboard completados
- ⏳ **Integración con workers**: Pendiente
- ⏳ **Integración con APIs**: Pendiente
- ⏳ **Middleware**: Pendiente
- ⏳ **Páginas adicionales**: Pendiente

---

**Implementación exitosa. Sistema listo para testing y refinamiento.**

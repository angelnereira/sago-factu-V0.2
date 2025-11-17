# 🚀 PLAN DE IMPLEMENTACIÓN - CREDENCIALES POR USUARIO Y ENVÍO REAL A HKA

**Fecha:** 16 de Noviembre de 2025
**Versión:** 1.0
**Responsable:** Angel Nereira / Equipo Dev
**Timeline:** 2-4 semanas

---

## 📋 RESUMEN EJECUTIVO

Este plan transforma SAGO-FACTU de un sistema con credenciales compartidas a un sistema profesional donde:

✅ **Cada usuario tiene sus propias credenciales** HKA (demo y producción)
✅ **El envío es REAL** con datos del usuario autenticado
✅ **Las respuestas** (CUFE, QR, PDF) se persisten y muestran profesionalmente
✅ **Los datos están aislados** por usuario/organización

---

## FASE 1: BASE DE DATOS (3-4 días)

### 1.1 Crear Migraciones Prisma

**Tarea:** Crear las 4 nuevas tablas en Prisma

```bash
npx prisma migrate dev --name add_user_hka_credentials_and_invoices
```

**Archivos a crear:**
- `prisma/migrations/[timestamp]_add_user_hka_credentials_and_invoices/migration.sql`

**Contenido de migration.sql:**
```sql
-- CreateTable HKACredentialsUser
CREATE TABLE "HKACredentialsUser" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "environment" TEXT NOT NULL DEFAULT 'demo',
  "tokenUser" TEXT NOT NULL,
  "tokenPassword" TEXT NOT NULL,
  "soapUrl" TEXT NOT NULL,
  "restUrl" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastTestedAt" DATETIME,
  "lastTestedSuccess" BOOLEAN,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "HKACredentialsUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HKACredentialsUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE("userId", "organizationId", "environment")
);

CREATE INDEX "HKACredentialsUser_userId_idx" ON "HKACredentialsUser"("userId");
CREATE INDEX "HKACredentialsUser_organizationId_idx" ON "HKACredentialsUser"("organizationId");

-- CreateTable DigitalSignatureConfig
CREATE TABLE "DigitalSignatureConfig" (
  -- ... (similar, ver ARQUITECTURA-CREDENCIALES-USUARIOS.md)
);

-- Modify Invoice
ALTER TABLE "Invoice" ADD COLUMN "cufe" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "qrCodeUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "qrCodeData" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "pdfKey" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "pdfGeneratedAt" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "hkaResponseJson" JSON;
ALTER TABLE "Invoice" ADD COLUMN "hkaErrorMessage" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "hkaErrorCode" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "sentToHkaAt" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "hkaResponseReceivedAt" DATETIME;
```

**Tiempo:** 2 horas
**Responsable:** Backend Lead
**Validación:**
```bash
npx prisma generate
npm run db:push
```

---

## FASE 2: API ROUTES (5-7 días)

### 2.1 Crear Routes de Credenciales

**Archivos a crear:**
- `app/api/hka/credenciales/guardar/route.ts`
- `app/api/hka/credenciales/probar/route.ts`
- `app/api/hka/credenciales/obtener/route.ts`
- `app/api/hka/credenciales/eliminar/route.ts`

**Cada archivo:**
- Validar sesión
- Validar input con Zod
- Implementar lógica en DB
- Logging estructurado
- Manejo de errores

**Tiempo por archivo:** 1-1.5 horas
**Total:** 5-6 horas

---

### 2.2 Refactorizar POST /api/invoices/enviar

**Cambios principales:**

```typescript
// ANTES (❌ Incorrecto - credenciales centrales)
const credentials = getHKAConfig(); // Del .env

// DESPUÉS (✅ Correcto - credenciales del usuario)
const credentials = await resolveHKACredentials(
  session.user.organizationId,
  { userId: session.user.id }
);
```

**Pasos:**
1. Obtener credenciales del usuario (no de .env)
2. Validar que el usuario tiene credenciales configuradas
3. Crear Invoice en BD con status DRAFT
4. Generar XML
5. Firmar digitalmente (si tiene certificado)
6. Enviar a HKA
7. Procesar respuesta y guardar CUFE, QR, PDF

**Tiempo:** 4-5 horas
**Validación:** Tests de end-to-end con HKA real

---

### 2.3 Crear Routes de Descargas

**Archivos:**
- `app/api/invoices/[id]/pdf/route.ts` (mejorado)
- `app/api/invoices/[id]/xml/route.ts`
- `app/api/invoices/[id]/qr/route.ts`

**Cada ruta:**
- Verificar propiedad (usuario logueado creó la factura)
- Descargar archivo de HKA o BD
- Retornar con headers correctos

**Tiempo:** 2-3 horas

---

## FASE 3: FRONTEND (4-5 días)

### 3.1 Página de Configuración de Credenciales

**Archivo:** `app/dashboard/configuracion/credenciales-hka/page.tsx`

**Componentes:**
- Tabs: DEMO | PRODUCCIÓN
- Inputs: tokenUser, tokenPassword
- Botón: Guardar
- Botón: Probar conexión
- UI para mostrar estado (✓ Configurado, ✗ No configurado)

**Funcionalidad:**
- Guardar credenciales (POST /api/hka/credenciales/guardar)
- Probar conexión (POST /api/hka/credenciales/probar)
- Mostrar confirmación

**Tiempo:** 3 horas

---

### 3.2 Componente InvoiceSuccessModal

**Archivo:** `components/invoices/InvoiceSuccessModal.tsx`

**Mostrar:**
- ✓ Éxito de certificación
- CUFE (con botón copiar)
- QR (código visual)
- Información de factura
- Botón descargar PDF

**Tiempo:** 2 horas

---

### 3.3 Refactorizar Página Crear Factura

**Archivo:** `app/dashboard/invoices/crear/page.tsx`

**Cambios:**
- Validar que usuario tiene credenciales HKA
- Si no: mostrar modal/banner con enlace a configuración
- Mejorar validación de formulario
- Mostrar loading mientras se envía a HKA
- Mostrar InvoiceSuccessModal al obtener respuesta
- Manejar errores de HKA de forma clara

**Tiempo:** 3 horas

---

### 3.4 Página de Historial de Facturas

**Archivo:** `app/dashboard/invoices/page.tsx` (mejorada)

**Mostrar:**
- Tabla con todas las facturas del usuario
- Columnas: Número, Cliente, Fecha, Estado, CUFE
- Botones: Ver, Descargar PDF, Descargar XML
- Filtros: Estado (DRAFT, CERTIFIED, FAILED)

**Tiempo:** 3 horas

---

## FASE 4: TESTING (3-4 días)

### 4.1 Tests Unitarios

```typescript
// __tests__/api/hka-credentials.test.ts
- test: guardar credenciales
- test: obtener credenciales
- test: encriptar/desencriptar password
- test: aislamiento de datos

// __tests__/api/invoice-send.test.ts
- test: enviar factura exitosamente
- test: capturar CUFE de respuesta
- test: guardar en BD
- test: error de HKA
```

**Tiempo:** 2 horas

---

### 4.2 Tests de Integración

```typescript
// __tests__/integration/complete-invoice-flow.test.ts
1. Usuario configura credenciales
2. Usuario crea factura
3. Usuario envía a HKA
4. Sistema captura CUFE, QR, PDF
5. Usuario descarga PDF
6. Verificar aislamiento de datos
```

**Tiempo:** 3 horas

---

### 4.3 Testing Manual en HKA Real

**Pasos:**
1. Crear cuenta en The Factory HKA (si no existe)
2. Obtener credenciales demo
3. Configurar en SAGO-FACTU
4. Enviar factura de prueba
5. Verificar CUFE en respuesta
6. Descargar PDF
7. Verificar QR

**Tiempo:** 2 horas

---

## FASE 5: SEGURIDAD (2-3 días)

### 5.1 Auditoría de Credenciales

- [ ] No hay credenciales en logs
- [ ] Credenciales encriptadas en BD
- [ ] No hay fallback a hardcoded values
- [ ] Aislamiento de datos verificado

**Tiempo:** 1 hora

---

### 5.2 Validación de Input/Output

- [ ] Validación Zod en todos los inputs
- [ ] No se exponen credenciales en respuestas
- [ ] CUFE, QR, PDF no contienen datos sensibles

**Tiempo:** 1 hora

---

## TIMELINE ESTIMADO

| Fase | Tarea | Horas | Semana |
|------|-------|-------|--------|
| 1 | BD: Migraciones | 2 | Semana 1 |
| 2 | API: Credenciales | 6 | Semana 1 |
| 2 | API: Envío Facturas | 5 | Semana 1-2 |
| 2 | API: Descargas | 3 | Semana 2 |
| 3 | FE: Config Credenciales | 3 | Semana 2 |
| 3 | FE: Modal Respuesta | 2 | Semana 2 |
| 3 | FE: Crear Factura | 3 | Semana 2-3 |
| 3 | FE: Historial | 3 | Semana 3 |
| 4 | Testing: Unit + Integration | 5 | Semana 3 |
| 4 | Testing: Manual HKA | 2 | Semana 3 |
| 5 | Seguridad: Auditoría | 2 | Semana 4 |
| **TOTAL** | | **41 horas** | **3-4 semanas** |

---

## CHECKLIST POR FASE

### Fase 1: Base de Datos

- [ ] Crear migration con 4 nuevas tablas
- [ ] Ejecutar `npx prisma migrate dev`
- [ ] Ejecutar `npx prisma generate`
- [ ] Verificar tablas en BD
- [ ] Actualizar prisma/schema.prisma
- [ ] Commit: "feat(db): add user hka credentials and invoice response data"

### Fase 2: APIs

**Credenciales:**
- [ ] POST /api/hka/credenciales/guardar (guardar credenciales encriptadas)
- [ ] POST /api/hka/credenciales/probar (test conexión a HKA)
- [ ] GET /api/hka/credenciales/obtener (obtener credenciales guardadas)
- [ ] DELETE /api/hka/credenciales/eliminar
- [ ] Tests unitarios para cada ruta

**Envío:**
- [ ] Refactorizar POST /api/invoices/enviar (usar credenciales del usuario)
- [ ] Validar que usuario tiene credenciales
- [ ] Crear Invoice en BD
- [ ] Generar XML real
- [ ] Firmar digitalmente (si tiene certificado)
- [ ] Enviar a HKA
- [ ] Procesar respuesta
- [ ] Guardar CUFE, QR, PDF en BD
- [ ] Tests de end-to-end

**Descargas:**
- [ ] GET /api/invoices/[id]/pdf (descargar PDF de HKA)
- [ ] GET /api/invoices/[id]/xml (descargar XML)
- [ ] GET /api/invoices/[id]/qr (obtener código QR)
- [ ] Verificar propiedad antes de retornar

**Commit:** "feat(api): implement user credentials management and real HKA invoice submission"

### Fase 3: Frontend

**Configuración:**
- [ ] Crear página /dashboard/configuracion/credenciales-hka
- [ ] Tabs: DEMO | PRODUCCIÓN
- [ ] Inputs y validación
- [ ] Botones guardar y probar
- [ ] UI profesional

**Componentes:**
- [ ] InvoiceSuccessModal con CUFE, QR, botón PDF
- [ ] Loading skeleton mientras se envía a HKA
- [ ] Error modal para fallos de HKA

**Páginas:**
- [ ] Mejorar crear-factura
  - [ ] Validar credenciales antes de permitir crear
  - [ ] Mostrar error si no tiene credenciales
  - [ ] Integrar InvoiceSuccessModal
- [ ] Historial de facturas mejorado
  - [ ] Tabla con estados
  - [ ] Botones de acción
  - [ ] Filtros

**Commit:** "feat(frontend): add user credentials UI and invoice response display"

### Fase 4: Testing

- [ ] Tests unitarios de credenciales
- [ ] Tests unitarios de envío de facturas
- [ ] Tests de integración end-to-end
- [ ] Test manual con HKA real
- [ ] Verificar CUFE en respuesta real
- [ ] Verificar descarga de PDF
- [ ] Verificar QR funciona

**Commit:** "test: add comprehensive testing for user credentials and invoice submission"

### Fase 5: Seguridad

- [ ] Audit: No hay credenciales en logs
- [ ] Audit: Credenciales encriptadas
- [ ] Audit: Aislamiento de datos por usuario
- [ ] Audit: Input/Output validation
- [ ] Seguridad code review
- [ ] Verificar no hay datos simulados

**Commit:** "security: audit credentials handling and data isolation"

---

## DEPENDENCIAS INTERNAS

```
Fase 1 (BD)
    ↓
Fase 2 (APIs) → puede empezar en paralelo con Fase 3
    ↓           ↓
Fase 3 (Frontend) → depende de APIs
    ↓
Fase 4 (Testing) → depende de 2 y 3
    ↓
Fase 5 (Seguridad) → depende de 2, 3, 4
```

---

## RIESGOS Y MITIGACIÓN

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|-----------|
| HKA API cambia formato respuesta | Alto | Baja | Usar wrapper class para HKASOAPClient |
| Credenciales del usuario inválidas | Medio | Alta | Botón "Probar conexión" en UI |
| Performance lento en envío | Medio | Media | Usar async/await, no bloquear |
| Datos no se persisten correctamente | Alto | Baja | Tests de BD exhaustivos |
| Encriptación falla | Alto | Muy baja | Validar durante setup |

---

## DEFINICIÓN DE ÉXITO

✅ **Criterios de Aceptación:**

1. Usuario puede guardar credenciales HKA (demo y prod)
2. Usuario puede cambiar entre demo/prod
3. Usuario puede enviar factura con datos reales
4. Sistema retorna CUFE de The Factory HKA
5. Sistema retorna QR (imagen o URL)
6. Sistema retorna PDF de HKA
7. Frontend muestra respuesta profesionalmente
8. Usuario puede descargar PDF
9. Datos están aislados por usuario
10. No hay datos simulados
11. Logs sin credenciales expuestas
12. Tests pasan 100%

---

## PRÓXIMOS PASOS INMEDIATOS

**Hoy:**
- [ ] Revisar este plan
- [ ] Crear branch: `git checkout -b feat/user-hka-credentials`
- [ ] Asignar tareas por equipo

**Mañana:**
- [ ] Empezar Fase 1 (BD)
- [ ] Empezar Fase 2.1 (APIs de credenciales)

**Semana 1:**
- [ ] Completar Fases 1 y 2.1
- [ ] Hacer PR y code review

**Semana 2:**
- [ ] Completar Fases 2.2, 2.3, 3
- [ ] Integración de testing

**Semana 3-4:**
- [ ] Fases 4 y 5
- [ ] Testing final con HKA real
- [ ] Deploy a staging

---

## RECURSOS

**Documentos:**
- ARQUITECTURA-CREDENCIALES-USUARIOS.md (diseño detallado)
- SECURITY-ARCHITECTURE-ANALYSIS.md (seguridad)
- The Factory HKA Wiki: https://felwiki.thefactoryhka.com.pa/

**Contactos:**
- The Factory HKA: soporte@thefactoryhka.com.pa
- Tech Lead: Angel Nereira

---

**Documento preparado por:** Angel Nereira
**Fecha:** 16 de Noviembre de 2025
**Versión:** 1.0 (Plan Técnico)


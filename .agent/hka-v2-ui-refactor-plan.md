# Plan de Refactorización UI - HKA v2.0

## Objetivo
Actualizar completamente la UI para reflejar la nueva arquitectura HKA v2.0, eliminando código obsoleto de firma digital y simplificando la configuración.

## Cambios Principales

### 1. Configuración Simplificada
**Antes:** Múltiples pestañas con certificados, firma digital, configuración HKA compleja
**Después:** Solo 2 campos (Token User + Token Password) + selector de ambiente

#### Archivos a modificar:
- ✅ `app/settings/components/HkaCredentialsForm.tsx` (ya existe, usar este)
- ❌ `components/configuration/configuration-tabs.tsx` (eliminar pestaña "Firma Digital")
- ❌ `components/configuration/integration-settings.tsx` (simplificar)
- ❌ `app/dashboard/configuracion/firma-digital/page.tsx` (eliminar completamente)

### 2. Eliminar Código Obsoleto

#### Componentes de Firma Digital (ELIMINAR):
- `components/certificates/digital-signature-panel.tsx`
- `components/certificates/certificate-upload.tsx`
- `components/certificates/certificate-list.tsx`
- `app/dashboard/certificados/page.tsx`

#### Servicios Obsoletos (ELIMINAR):
- `services/invoice/signer.ts`
- `lib/crypto/certificate-validator.ts`
- Cualquier referencia a `DigitalCertificate` en Prisma queries

### 3. Nuevos Widgets del Dashboard

#### Widgets a agregar:
- ✅ `app/dashboard/components/FoliosWidget.tsx` (ya existe)
- ✅ `app/dashboard/components/EmissionHistory.tsx` (ya existe)
- ❌ `app/dashboard/components/HkaStatusWidget.tsx` (crear)

#### Actualizar:
- `app/dashboard/page.tsx` - agregar los nuevos widgets

### 4. Actualizar Formulario de Factura

#### Características nuevas:
- Autocompletado de RUC (usando HKA)
- Mostrar folios disponibles en tiempo real
- Validación automática de credenciales HKA antes de emitir

#### Archivos:
- `app/dashboard/facturas/nueva/page.tsx`
- `components/invoices/invoice-form.tsx`

### 5. Limpiar Schema de Prisma

#### Modelos obsoletos a deprecar:
- `DigitalCertificate` (marcar como deprecated)
- `UserSignatureConfig` (marcar como deprecated)
- `FolioAssignment` (reemplazar con consulta directa a HKA)

#### Nuevos campos necesarios:
- `Organization.hkaTokenUser`
- `Organization.hkaTokenPassword` (encriptado)
- `Organization.hkaEnvironment` (DEMO | PROD)

### 6. Eliminar Datos Simulados

#### Archivos con mocks a limpiar:
- `lib/mock-data.ts` (si existe)
- Cualquier `const MOCK_*` en componentes
- Datos hardcodeados en formularios

## Orden de Implementación

### Fase 1: Limpieza (CRÍTICO)
1. Eliminar pestaña "Firma Digital" de configuración
2. Eliminar página `/dashboard/certificados`
3. Eliminar página `/dashboard/configuracion/firma-digital`
4. Comentar servicios obsoletos de firma

### Fase 2: Simplificar Configuración
1. Actualizar `integration-settings.tsx` para usar `HkaCredentialsForm`
2. Eliminar referencias a certificados en `configuration-tabs.tsx`
3. Actualizar página de configuración para no cargar certificados

### Fase 3: Integrar Nuevos Widgets
1. Agregar `FoliosWidget` al dashboard
2. Agregar `EmissionHistory` al dashboard
3. Crear y agregar `HkaStatusWidget`

### Fase 4: Actualizar Formulario de Factura
1. Integrar autocompletado de RUC
2. Mostrar folios disponibles
3. Validar credenciales HKA antes de submit

### Fase 5: Migración de Base de Datos
1. Crear migración para nuevos campos HKA en Organization
2. Marcar modelos obsoletos como deprecated
3. Migrar datos existentes (si aplica)

## Archivos Críticos a Revisar

### Mantener (ya refactorizados):
- ✅ `lib/hka/*` (toda la nueva infraestructura)
- ✅ `app/actions/hka/*`
- ✅ `app/actions/invoice/emit-invoice.action.ts`
- ✅ `app/actions/invoice/cancel-invoice.action.ts`

### Eliminar:
- ❌ `services/invoice/signer.ts`
- ❌ `components/certificates/*`
- ❌ `app/dashboard/certificados/*`
- ❌ `app/dashboard/configuracion/firma-digital/*`

### Actualizar:
- 🔄 `components/configuration/configuration-tabs.tsx`
- 🔄 `components/configuration/integration-settings.tsx`
- 🔄 `app/dashboard/page.tsx`
- 🔄 `app/dashboard/facturas/nueva/page.tsx`

## Validación Final

- [ ] No hay referencias a "firma digital" en la UI
- [ ] No hay referencias a "certificado" excepto en contexto de SSL/TLS
- [ ] Configuración HKA solo muestra 2 campos + ambiente
- [ ] Dashboard muestra widgets de HKA v2.0
- [ ] Formulario de factura usa autocompletado
- [ ] No hay datos mock/simulados en producción
- [ ] Todas las acciones usan la nueva infraestructura HKA

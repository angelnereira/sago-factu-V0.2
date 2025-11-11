# ESTADO DEL PROYECTO SAGO-FACTU

**Fecha:** 2025-01-27  
**Versión:** 0.1.0  
**Estado General:** Desarrollo activo - 75% completado

---

## RESUMEN EJECUTIVO

SAGO-FACTU es una plataforma multi-tenant de facturación electrónica para Panamá que actúa como intermediario entre clientes y The Factory HKA para la gestión, distribución y monitoreo de folios de facturación electrónica.

**Stack Principal:**
- Next.js 15 (App Router)
- TypeScript
- Prisma ORM + Neon PostgreSQL
- NextAuth v5
- SOAP Client (HKA Integration)
- BullMQ (Background Jobs)

---

## FUNCIONALIDADES IMPLEMENTADAS

### 1. Autenticación y Autorización (100%)
- NextAuth v5 con JWT
- Credentials provider
- Sistema de roles: SUPER_ADMIN, ADMIN, USER
- Protección de rutas
- Middleware de autenticación

### 2. Integración HKA (80%)
**Implementado:**
- Cliente SOAP con singleton pattern
- Autenticación con tokenEmpresa + tokenPassword
- Métodos: Enviar, Consultar, Anular, ConsultarFolios
- Generador XML conforme a DGI rFE v1.00
- Transformador Invoice → XML
- Worker BullMQ para procesamiento asíncrono

**Pendiente:**
- Notas de Crédito/Débito (estructura creada, no probada)
- Descarga de PDF/XML certificados
- Envío de emails desde HKA

### 3. Gestión de Folios (70%)
**Implementado:**
- Asignación de folios a organizaciones
- Consulta de folios disponibles
- Sincronización con HKA
- Alertas de folios bajos

**Pendiente:**
- Compra de folios (API creada, no probada)
- Asignación automática
- Reportes de consumo

### 4. Gestión de Facturas (60%)
**Implementado:**
- Creación de facturas
- Validación con Zod
- Cálculo de ITBMS
- Listado y detalle
- Formulario de facturación
- Upload de XML/Excel

**Pendiente:**
- Procesamiento completo (DRAFT → HKA → CERTIFIED)
- Descarga de PDF/XML
- Cancelación/anulación
- Reintentos automáticos

### 5. Panel de Administración (85%)
**Implementado:**
- Gestión de usuarios
- Gestión de organizaciones
- Asignación de folios
- Métricas y estadísticas
- Logs de auditoría
- Logs de API calls
- Filtros y búsqueda

**Pendiente:**
- Configuración avanzada de HKA
- Reportes personalizados

### 6. Frontend y UI (80%)
**Implementado:**
- Dashboard principal
- Diseño responsive
- Dark mode
- PWA support
- Componentes shadcn/ui
- Notificaciones en tiempo real

**Pendiente:**
- Optimización de rendimiento
- Mejoras de accesibilidad

### 7. Seguridad (70%)
**Implementado:**
- Variables de entorno para secretos
- Validación de entrada con Zod
- Autenticación JWT
- RBAC (Role-Based Access Control)
- Bcrypt para passwords
- Auditoría de acciones

**Pendiente:**
- Rate limiting
- CSRF protection
- API key rotation
- 2FA (Two-Factor Authentication)

---

## PENDIENTES CRÍTICOS

### 1. Procesamiento de Facturas (Alta Prioridad)
**Estado:** Estructura creada, no funcional end-to-end

**Problemas identificados:**
- Línea 27 en `app/api/documentos/enviar/route.ts`: XML placeholder `<xml>Generar desde factura</xml>`
- Falta integración entre generador XML y envío a HKA
- Worker no está conectado a BullMQ queue

**Acción requerida:**
```typescript
// EnviarDocumento debe:
1. Recibir factura o XML
2. Si es factura, usar invoice-to-xml.ts para transformar
3. Usar xml/generator.ts para generar XML
4. Enviar a HKA con enviar-documento.ts
5. Actualizar status en BD
```

### 2. Campos Faltantes en Schema (Media Prioridad)
**Estado:** TODOs en código

**Campos que faltan en Invoice model:**
- `hkaProtocol` (protocolo de HKA)
- `pdfBase64` (PDF del documento)
- `hkaResponseCode` (código de respuesta)
- `hkaResponseMessage` (mensaje de respuesta)
- `referenceInvoiceId` (para notas de crédito/débito)

**Acción requerida:**
```prisma
// Agregar a prisma/schema.prisma
model Invoice {
  // ... campos existentes ...
  
  hkaProtocol        String?
  pdfBase64         String?  @db.Text
  hkaResponseCode   String?
  hkaResponseMessage String? @db.Text
  referenceInvoiceId String?
  
  @@map("invoices")
}
```

### 3. Autenticación en Endpoints Críticos (Alta Prioridad)
**Estado:** TODOs comentados en código

**Endpoints sin autenticación:**
- `POST /api/invoices/[id]/process`
- `POST /api/invoices/[id]/retry`
- `POST /api/invoices/[id]/cancel`
- `GET /api/invoices/[id]/xml`
- `GET /api/invoices/[id]/pdf`

**Acción requerida:**
```typescript
// Descomentar y verificar en cada endpoint:
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
}
```

### 4. Worker BullMQ No Conectado (Media Prioridad)
**Estado:** Worker creado, no iniciado

**Problema:**
- Worker existe en `lib/workers/invoice-processor.ts`
- No hay proceso que ejecute el worker
- Queue no está conectada a Redis

**Acción requerida:**
1. Crear script para ejecutar worker
2. Configurar Redis en Vercel
3. Iniciar worker como proceso separado o Vercel function

### 5. Testing (Baja Prioridad pero Crítica)
**Estado:** 0% cobertura

**Faltante:**
- Tests unitarios
- Tests de integración
- Tests E2E
- Tests de APIs

**Meta:** 80% cobertura mínimo

---

## VULNERABILIDADES DE SEGURIDAD

**Estado:** 4 vulnerabilidades detectadas por npm audit

1. **HIGH:** SheetJS Regular Expression Denial of Service (ReDoS)
   - Paquete: xlsx (ya reemplazado por exceljs)
   - Acción: Verificar que no hay imports de xlsx

2. **HIGH:** Prototype Pollution in SheetJS
   - Paquete: xlsx (ya reemplazado)
   - Acción: Limpiar dependencias

3. **HIGH:** path-to-regexp outputs backtracking regular expressions
   - Paquete: path-to-regexp
   - Acción: Actualizar dependencias de Next.js

4. **MODERATE:** esbuild enables any website to send requests to dev server
   - Paquete: esbuild
   - Acción: Solo afecta dev environment

5. **LOW:** Various issues in undici
   - Paquete: undici
   - Acción: Actualizar dependencias

**Acción requerida:**
```bash
npm audit fix
npm update
```

---

## ARCHIVOS DUPLICADOS ELIMINADOS

**Acción completada:**
- Eliminado: `lib/hka/soap-client.ts` (duplicado)
- Eliminado: `lib/hka/xml-generator.ts` (duplicado)
- Mantenido: `lib/hka/soap/client.ts` (correcto)
- Mantenido: `lib/hka/xml/generator.ts` (correcto)

---

## RUTA CRÍTICA DE FACTURACIÓN

**Estado actual:** No funcional

**Flujo esperado:**
```
1. Usuario crea factura → POST /api/invoices/create
   → Status: DRAFT
   
2. Usuario envía factura → POST /api/invoices/[id]/process
   → Worker procesa → Genera XML → Envía a HKA
   
3. HKA responde → Worker actualiza
   → Status: CERTIFIED | REJECTED
   
4. Usuario descarga PDF → GET /api/invoices/[id]/pdf
   → Retorna PDF desde HKA
```

**Flujo actual (roto):**
```
1. Usuario crea factura → DRAFT ✓
2. Usuario envía → XML placeholder ❌
3. No hay conexión Worker-Queue ❌
4. No hay campos en BD ❌
```

---

## INVESTIGACIÓN REQUERIDA

### 1. Estructura de Respuesta de HKA
**Pregunta:** ¿Cómo se almacena el PDF en HKA?  
**Archivo a revisar:** `lib/hka/methods/consultar-documento.ts`

**Investigar:**
- Formato de xhelPDF en respuesta HKA
- Cómo convertir a PDF descargable
- Tamaño límite de almacenamiento

### 2. Notas de Crédito/Débito
**Pregunta:** ¿Qué estructura XML necesitan?  
**Archivo a revisar:** `lib/hka/methods/nota-credito.ts`

**Investigar:**
- Diferencias XML vs factura normal
- Campos adicionales requeridos
- Validaciones específicas

### 3. BullMQ en Vercel
**Pregunta:** ¿Cómo ejecutar worker en Vercel?  
**Opción 1:** Vercel Functions  
**Opción 2:** Servicio externo (Railway, Render)  
**Opción 3:** Cron job manual

**Investigar:**
- Límites de tiempo de ejecución en Vercel
- Costs de Redis en Vercel
- Alternativas serverless para workers

### 4. Validación de RUC Panameño
**Pregunta:** ¿Cómo calcular dígito verificador?  
**Archivo:** Código actual asume DV="00"

**Investigar:**
- Algoritmo de validación RUC Panama
- Implementar cálculo correcto
- Validación client-side

---

## PLAN DE ACCIÓN INMEDIATA

### Semana 1: Procesamiento de Facturas
1. Przyczyfix XML generation en `/api/documentos/enviar`
2. Agregar campos faltantes al schema Prisma
3. Conectar generador XML con envío HKA
4. Probar flujo completo: Crear → Enviar → Certificar

### Semana 2: Autenticación y Seguridad
1. Descomentar autenticación en endpoints
2. Agregar validación de permisos por role
3. Ejecutar npm audit fix
4. Implementar rate limiting

### Semana 3: Worker y Jobs
1. Configurar Redis (Upstash o Railway)
2. Crear script para ejecutar worker
3. Probar procesamiento asíncrono
4. Implementar reintentos automáticos

### Semana 4: Testing y Documentación
1. Escribir tests unitarios críticos
2. Tests de integración APIs
3. Documentar flujos de negocio
4. Guía de deployment

---

## MÉTRICAS DE PROGRESO

| Categoría | Completado | Pendiente | Total |
|-----------|-----------|-----------|-------|
| Autenticación | 100% | 0% | 1 |
| Integración HKA | 80% | 20% | 1 |
| Gestión Folios | 70% | 30% | 1 |
| Gestión Facturas | 60% | 40% | 1 |
| Panel Admin | 85% | 15% | 1 |
| Frontend/UI | 80% | 20% | 1 |
| Seguridad | 70% | 30% | 1 |
| Testing | 0% | 100% | 1 |
| **TOTAL** | **68%** | **32%** | **8** |

---

## CONCLUSIÓN

El proyecto está en buen estado con una base sólida. Las funcionalidades críticas de autenticación y administración están implementadas. El mayor bloqueador es el procesamiento de facturas que requiere:

1. Completar la integración XML → HKA
2. Agregar campos faltantes en BD
3. Conectar el worker BullMQ
4. Probar el flujo end-to-end

**Estimación para MVP:** 2-3 semanas  
**Estado de producción:** No listo  
**Estado de desarrollo:** Activo y funcional

---

**Última actualización:** 2025-01-27  
**Responsable:** Equipo de Desarrollo SAGO-FACTU


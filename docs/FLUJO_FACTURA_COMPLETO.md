# Flujo Completo de Creación de Factura y Envío a HKA

## 📋 Resumen Ejecutivo

Este documento describe el flujo completo de creación, validación, envío a HKA, y gestión de respuestas para facturas electrónicas en SAGO-FACTU.

## 🔄 Arquitectura del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAGO-FACTU Invoice Flow                      │
└─────────────────────────────────────────────────────────────────┘

1. CREACIÓN DE FACTURA
   ├── Entrada Manual
   │   └── /simple/facturas/crear → InvoiceForm
   │       └── Validación en tiempo real
   │       └── Cálculo automático de totales
   │       └── Integración RucValidationField
   │
   └── Importación desde Archivo
       ├── Excel (.xlsx)
       │   └── ExcelParser → ParsedInvoiceData
       │   └── Auto-complete formulario
       │   └── Validación de estructura
       │
       └── XML (.xml)
           └── XMLParser → ParsedInvoiceData
           └── Extrae cliente, items, totales
           └── Mapea a estructura SAGO-FACTU

2. VALIDACIÓN DE DATOS
   ├── Cliente
   │   ├── RUC/Cédula válido (via HKA)
   │   ├── Dígito verificador correcto
   │   └── Nombre y dirección
   │
   ├── Items
   │   ├── Descripción no vacía
   │   ├── Cantidad > 0
   │   ├── Precio unitario ≥ 0
   │   ├── Tasa de impuesto válida
   │   └── Cálculo de totales
   │
   └── Factura
       ├── Subtotal correcto
       ├── Impuestos correctos (7% ITBMS)
       ├── Total correcto
       └── Folios disponibles (si no es DEMO)

3. CREACIÓN EN BD
   ├── POST /api/invoices/create
   │   ├── Autenticación (NextAuth)
   │   ├── Validación de datos
   │   ├── Obtener organización
   │   ├── Verificar folios
   │   ├── Crear factura (status: DRAFT)
   │   ├── Crear items
   │   └── Generar clientReferenceId
   │
   └── Estado: DRAFT (guardado como borrador)

4. PROCESAMIENTO Y ENVÍO A HKA
   ├── POST /api/invoices/[id]/process
   │   │
   │   ├── Generación de XML
   │   │   ├── invoice-processor.ts
   │   │   ├── Mapeo de datos a estructura SOAP
   │   │   ├── Validación de XML
   │   │   └── Firma digital (xmldsig)
   │   │
   │   ├── Envío a HKA (SOAP)
   │   │   ├── createHkaService()
   │   │   ├── Método: enviarDocumento()
   │   │   ├── Timeout: 30 segundos
   │   │   └── Reintentos automáticos
   │   │
   │   └── Actualización de BD
   │       ├── Extrae respuesta HKA
   │       ├── Clasifica por código de respuesta
   │       ├── Guarda CUFE, CAFE, QR, PDF
   │       ├── Actualiza status (EMITTED/CERTIFIED)
   │       └── Registra metadata

5. RESPUESTA HKA Y CLASIFICACIÓN
   ├── Clasificación según Código
   │   │
   │   ├── Éxito (0260, 0422, 0600, 200, 00)
   │   │   ├── Status: EMITTED o CERTIFIED
   │   │   ├── Extrae CUFE
   │   │   ├── Extrae CAFE
   │   │   ├── Genera QR
   │   │   ├── Descarga PDF
   │   │   └── Guarda en pdfBase64
   │   │
   │   ├── Procesamiento (100)
   │   │   ├── Status: PROCESSING
   │   │   ├── Espera polling
   │   │   └── Reintentar después
   │   │
   │   └── Error (01-10)
   │       ├── Status: ERROR
   │       ├── Guarda mensaje de error
   │       ├── Permite reintentar
   │       └── Notifica al usuario
   │
   └── Guardado en BD (hkaResponseCode, hkaResponseMessage, etc)

6. PRESENTACIÓN AL USUARIO
   ├── InvoiceSuccessResponse (componente)
   │   ├── Muestra CAFE estilo documento oficial
   │   ├── Código QR descargable
   │   ├── CUFE copiar/pegar
   │   ├── Botones: Ver PDF, Descargar XML
   │   └── Link de consulta en DGI
   │
   └── HkaResponseDisplay (componente alternativo)
       ├── Información clasificada por tipo
       ├── Status badge visual
       ├── Descarga de documentos
       └── Acciones contextuales

7. GESTIÓN POSTERIOR
   ├── Ver Factura (/simple/facturas/[id])
   │   ├── FiscalActionPanel
   │   │   ├── A. Estado del Documento (refrescar en HKA)
   │   │   ├── B. Documentos Digitales (PDF/XML)
   │   │   ├── C. Comunicación (Email, rastreo)
   │   │   └── D. Zona de Peligro (Anular)
   │   │
   │   └── EmailHistory (historial de envíos)
   │
   └── Monitoreo
       └── FoliosStatusWidget (header)
           ├── Semáforo visual
           ├── Contador automático
           └── Alertas de folios

```

## 📁 Archivos Clave del Flujo

### Frontend (Cliente)

| Archivo | Propósito |
|---------|-----------|
| `app/simple/facturas/crear/page.tsx` | Página de crear factura |
| `components/invoices/invoice-form.tsx` | Formulario principal |
| `components/invoices/ruc-validation-field.tsx` | Validación RUC en tiempo real |
| `components/invoices/xml-uploader.tsx` | Upload de archivos |
| `components/invoices/invoice-success-response.tsx` | Visualización CAFE |
| `components/invoices/hka-response-display.tsx` | Visualización alternativa |
| `components/invoices/fiscal-action-panel.tsx` | Panel de operaciones |
| `components/dashboard/folios-status-widget.tsx` | Monitor de folios |

### Backend (API)

| Ruta | Método | Propósito |
|------|--------|-----------|
| `/api/invoices/create` | POST | Crear factura (DRAFT) |
| `/api/invoices/[id]/process` | POST | Enviar a HKA |
| `/api/invoices/[id]/pdf` | GET | Descargar PDF |
| `/api/invoices/[id]/xml` | GET | Descargar XML |
| `/api/invoices/[id]/cancel` | POST | Anular factura |
| `/api/hka/estado-documento` | POST | Consultar estado en HKA |

### Librerías de Integración HKA

| Archivo | Propósito |
|---------|-----------|
| `lib/hka/index.ts` | Factory y servicios |
| `lib/hka/methods/*` | Implementación de 9 métodos SOAP |
| `lib/hka/parsers/xml-parser.ts` | Parser de respuestas |
| `lib/hka/mappers/hka-to-domain.mapper.ts` | Mapeo a modelos |
| `lib/hka/utils/response-classifier.ts` | Clasificación de respuestas |
| `lib/workers/invoice-processor.ts` | Worker de procesamiento |

## 🔐 Códigos de Respuesta HKA y Clasificación

### Códigos de Éxito

```
'0260' - Factura electrónica autorizada
'0422' - Consulta de factura exitosa
'0600' - Evento de anulación registrado
'200'  - Consulta exitosa (FoliosRestantes)
'00'   - Operación exitosa (legacy)
```

**Acción**: Status = EMITTED/CERTIFIED, guarda CUFE, CAFE, QR, PDF

### Código de Procesamiento

```
'100' - Procesamiento en curso
```

**Acción**: Status = PROCESSING, espera polling

### Códigos de Error

```
'01' - Error de autenticación
'02' - Error de validación
'03' - Error del sistema
'04' - Documento duplicado
'05' - Folios insuficientes
'06' - RUC no válido
'07' - Cédula no válida
'08' - DV incorrecto
'09' - Error en XML
'10' - Error en firma digital
```

**Acción**: Status = ERROR, guarda mensaje

## 💾 Modelo de Datos (Prisma)

```prisma
model Invoice {
  // Identificadores
  id String @id @default(cuid())
  organizationId String
  createdBy String

  // Cliente
  receiverRuc String?
  receiverDv String?
  receiverName String
  receiverEmail String?

  // Datos de la factura
  status InvoiceStatus @default(DRAFT) // DRAFT → PROCESSING → EMITTED/CERTIFIED or ERROR
  subtotal Decimal
  itbms Decimal
  total Decimal

  // Items
  items InvoiceItem[]

  // Respuesta HKA
  hkaResponseCode String? // Código: '0260', '0422', '0600', '01', etc
  hkaResponseMessage String? @db.Text // Mensaje de HKA
  hkaResponseData Json? // Datos adicionales en JSON

  // Documentos generados
  cufe String? @unique // Código único de la factura
  cafe String? // Código de autorización FE
  numeroDocumentoFiscal String? // Número asignado
  qrUrl String? // URL del QR
  qrCode String? @db.Text // QR en Base64
  pdfBase64 String? @db.Text // PDF firmado
  pdfUrl String?

  // Metadatos
  hkaProtocol String? // Protocolo de HKA
  hkaProtocolDate DateTime? // Fecha de certificación
  certifiedAt DateTime? // Cuando se certificó localmente

  // Relaciones
  organization Organization
  user User
  items InvoiceItem[]
}

model InvoiceItem {
  id String @id @default(cuid())
  invoiceId String
  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  description String
  quantity Decimal
  unitPrice Decimal
  taxRate Decimal @default(7) // ITBMS 7%
  taxAmount Decimal
  total Decimal

  lineNumber Int
}
```

## 📊 Diagrama de Estados

```
DRAFT
  │
  ├─→ (Usuario hace click en "Emitir")
  │
  ├─→ PROCESSING (preparando envío a HKA)
  │   │
  │   ├─→ Generación de XML
  │   ├─→ Firma digital
  │   ├─→ Envío SOAP a HKA
  │   │
  │   ├─→ Respuesta 0260/0422/0600
  │   │   └─→ EMITTED/CERTIFIED ✅
  │   │
  │   ├─→ Respuesta 100
  │   │   └─→ Espera (polling) ⏳
  │   │
  │   └─→ Respuesta 01-10
  │       └─→ ERROR ❌
  │
  └─→ Cualquier estado puede ir a:
      CANCELLED (si anula el usuario)
```

## 🚀 Cómo Funciona el Flujo en Detalle

### Paso 1: Crear Factura Manualmente

```
1. Usuario va a /simple/facturas/crear
2. Completa InvoiceForm manualmente
3. Valida RUC con RucValidationField (opcional)
4. Verifica totales (auto-calculados)
5. Click en "Emitir Factura"
6. Formulario se envía a POST /api/invoices/create
```

**Resultado**: Factura creada en BD con status = DRAFT

### Paso 2: Importar desde Excel/XML

```
1. Usuario hace click en "Subir Archivo"
2. Sube Excel o XML
3. XMLUploader/ExcelParser extrae datos
4. Formulario se auto-complete
5. Usuario revisa y hace click en "Emitir"
6. Mismo flujo que manual
```

**Ventaja**: No repite datos manualmente

### Paso 3: Procesar y Enviar a HKA

```
1. API /api/invoices/[id]/process
2. Ejecuta invoice-processor.ts
3. Genera XML con todos los datos
4. Firma digitalmente el XML
5. Envía via SOAP a HKA
6. Espera respuesta (max 30 seg)
7. Clasifica respuesta según código
8. Guarda en BD (CUFE, CAFE, QR, PDF)
9. Retorna al frontend InvoiceSuccessResponse
```

**Importante**: Si hay error, usuario puede reintentar

### Paso 4: Gestión Posterior

```
1. Usuario va a /simple/facturas/[id]
2. Ve FiscalActionPanel con opciones:
   - Refrescar estado en HKA
   - Descargar PDF/XML
   - Enviar por email
   - Anular (con confirmación)
3. Puede hacer seguimiento de emails
4. Monitor de folios en header
```

## 🔧 Configuración Requerida

### Variables de Entorno

```env
# HKA SOAP Credentials
HKA_DEMO_TOKEN_USER=usuario_demo
HKA_DEMO_TOKEN_PASSWORD=password_demo
HKA_PROD_TOKEN_USER=usuario_prod
HKA_PROD_TOKEN_PASSWORD=password_prod

# Certificados Digitales
HKA_DEMO_CERTIFICATE_PATH=/path/to/demo/cert.pfx
HKA_DEMO_CERTIFICATE_PASSWORD=cert_password

# URLs SOAP
HKA_DEMO_SOAP_URL=https://demo-soap.hka.com
HKA_PROD_SOAP_URL=https://soap.hka.com
```

### Configuración en Aplicación

1. **Organización**: Configurar RUC, DV, nombre, dirección
2. **Certificado Digital**: Subir certificado .pfx en Settings
3. **Credenciales HKA**: Configurar en Settings (BD o .env)
4. **Folios**: Comprar folios o usar ambiente DEMO

## 📈 Monitoreo y Debugging

### Logs Disponibles

- **HKA Logger** (`lib/hka/utils/logger.ts`): Todos los eventos HKA
- **API Logs** (BD): Historial de requests/responses
- **Console**: Información de desarrollo

### Endpoints de Debug

```
GET /api/configuration/test-hka-connection - Prueba conexión
POST /api/hka/test-connection - Test SOAP directo
GET /api/monitors/hka-stats - Estadísticas de envíos
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "No folios disponibles" | Folios gastados | Comprar folios o usar DEMO |
| "RUC no válido" | RUC mal formado | Verificar formato (8 dígitos-1-año) |
| "Certificado expirado" | Certificado vencido | Renovar certificado .pfx |
| "Error de firma" | Certificado incorrecto | Resubir certificado válido |
| "Timeout" | HKA no responde | Reintentar en algunos segundos |

## 🎯 Casos de Uso

### Caso 1: Usuario Quiere Crear Factura Simple

```
1. Va a /simple/facturas/crear
2. Llena datos manualmente (5 min)
3. Valida RUC opcionalmente
4. Click "Emitir" (2 seg)
5. Ve respuesta CUFE y QR en pantalla
6. Descarga PDF para cliente
```

### Caso 2: Usuario Importa Excel con Muchas Facturas

```
1. Prepara Excel con estructura estándar
2. Va a /simple/facturas/crear
3. Click "Subir Archivo" → Selecciona Excel
4. Sistema auto-llena todo
5. Revisa datos
6. Click "Emitir" (mismo flujo)
7. Respuesta inmediata con CUFE/QR
```

### Caso 3: Usuario Necesita Anular Factura

```
1. Va a /simple/facturas/[id]
2. Panel fiscal (derecha) → "Zona de Peligro"
3. Click "Anular Factura Fiscal"
4. Modal pide motivo de anulación
5. Envía a HKA via método "Anulación"
6. Status cambia a CANCELLED
7. Sistema genera acta de anulación
```

### Caso 4: Usuario Quiere Reenviar por Email

```
1. Va a /simple/facturas/[id]
2. Panel fiscal → "Comunicación"
3. Email pre-llena con cliente
4. Click "Reenviar Factura"
5. Sistema envía PDF y QR al email
6. Historial de envíos visible (EmailHistory)
7. Puede rastrear lectura si HKA proporciona
```

## 🔗 Referencias

- **Blueprint HKA Panamá**: Documento oficial de métodos SOAP
- **DGI Panamá**: Portal oficial de facturas (https://fe.dgi.mef.gob.pa)
- **Prisma Docs**: Modelos y consultas
- **Next.js 15**: Framework base

## ✅ Checklist de Implementación

- [x] Página de crear factura (`/simple/facturas/crear`)
- [x] Upload de archivos Excel/XML
- [x] Auto-complete de formulario
- [x] Validación RUC en tiempo real
- [x] Envío a HKA con formato SOAP correcto
- [x] Clasificación de respuestas por código
- [x] Guardado en BD (CUFE, CAFE, QR, PDF)
- [x] Visualización de respuesta (CAFE + HkaResponseDisplay)
- [x] Panel de operaciones fiscales (FiscalActionPanel)
- [x] Monitor de folios (FoliosStatusWidget)
- [x] Gestión de anulaciones
- [x] Historial de emails

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0
**Estado**: Implementación Completa

# Arquitectura Completa de SAGO FACTU

## 🏗️ Visión General

SAGO FACTU es una plataforma SaaS que simplifica la facturación electrónica en Panamá. Traduce la complejidad técnica de la API SOAP de The Factory HKA en una experiencia de usuario intuitiva y eficiente.

```
┌─────────────────────────────────────────────────────────────┐
│                     SAGO FACTU                              │
│                   (Frontend React)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                   NextAuth.js v5                            │
│                 (Autenticación Segura)                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   Next.js API Routes                        │
│              (Backend Serverless Functions)                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Servicios de Negocio                               │   │
│  │  ├─ Emisión de Facturas                             │   │
│  │  ├─ Gestión de Folios                               │   │
│  │  ├─ Distribución (Email/WhatsApp)                   │   │
│  │  ├─ Validación de Datos                             │   │
│  │  └─ Auditoría y Compliance                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Capa de Integración HKA                             │   │
│  │  ├─ Cliente SOAP multi-tenant                        │   │
│  │  ├─ Inyección segura de credenciales                 │   │
│  │  ├─ 8 Métodos HKA implementados                      │   │
│  │  ├─ Monitoreo y retry logic                          │   │
│  │  └─ Validación de respuestas                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Capa de Datos                                      │   │
│  │  ├─ Prisma ORM                                      │   │
│  │  ├─ PostgreSQL (Neon) - Base de datos               │   │
│  │  ├─ Redis - Cache y sesiones                        │   │
│  │  └─ AWS S3 - Almacenamiento de PDFs/XMLs           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              Integraciones Externas                         │
│  The Factory HKA ← SOAP → DGI Panamá                       │
│  AWS S3 (documentos)   SendGrid (emails)   WhatsApp API     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Capas de la Arquitectura

### 1. Capa de Presentación (Frontend - React 19)

**Responsabilidad:** Interfaz de usuario intuitiva y responsiva

**Componentes Principales:**
```
src/components/
├─ auth/                    (Autenticación)
├─ dashboard/              (Dashboard principal)
├─ invoices/              (Gestión de facturas)
│  ├─ invoice-form.tsx    (Formulario de nueva factura)
│  ├─ invoice-list.tsx    (Listado de facturas)
│  └─ invoice-detail.tsx  (Detalle de factura)
├─ folios/                (Gestión de folios)
│  ├─ folio-sync-button.tsx     (Sincronizar folios)
│  └─ folio-purchase-button.tsx (Comprar folios)
├─ configuration/         (Configuración de usuario)
│  └─ hka-credentials-form.tsx  (Credenciales HKA)
└─ common/                (Componentes reutilizables)
   ├─ layout.tsx
   ├─ header.tsx
   └─ sidebar.tsx
```

**Stack Tecnológico:**
- React 19 (UI components)
- Next.js 15 (App Router, SSR/SSG)
- TypeScript 5 (Type safety)
- Tailwind CSS 4 (Styling)
- Zod (Client-side validation)
- TanStack Query (Data fetching)
- zustand (State management - optional)

**Flujo de Datos:**
```
User Input → Component State → API Call → Response → Component Update
```

---

### 2. Capa de Autenticación (NextAuth.js v5)

**Responsabilidad:** Gestión segura de sesiones y autorización

**Configuración:**
```typescript
// lib/auth.ts
export const auth = getSession() // NextAuth.js v5

// Proveedores:
- Email/Password (Credentials provider)
- OAuth (Google, GitHub) - opcional

// Sesión:
- JWT (JSON Web Token)
- Duración: 30 días
- Refresh automático

// Autorización (Roles):
- SUPER_ADMIN: Acceso total del sistema
- ORG_ADMIN: Administrador de organización
- USER: Usuario estándar
```

**Middlewares:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Proteger rutas autenticadas
  // Redirigir a login si no está autenticado
  // Validar permisos por rol
}
```

---

### 3. Capa de API Routes (Backend)

**Responsabilidad:** Lógica de negocio y procesamiento de datos

**Estructura:**
```
app/api/
├─ auth/
│  └─ [...nextauth]/route.ts     (NextAuth handlers)
├─ invoices/
│  ├─ create/route.ts             (Nueva factura)
│  ├─ [id]/
│  │  ├─ process/route.ts         (Procesar/emitir)
│  │  ├─ retry/route.ts           (Reintentar)
│  │  ├─ xml/route.ts             (Descargar XML)
│  │  └─ pdf/route.ts             (Descargar PDF)
│  └─ list/route.ts               (Listado
├─ folios/
│  ├─ sincronizar/route.ts        (Sincronizar de HKA)
│  ├─ consultar/route.ts          (Consultar disponibles)
│  └─ comprar/route.ts            (Iniciar compra)
├─ settings/
│  └─ hka-credentials/route.ts    (Guardar credenciales)
└─ notifications/
   ├─ email/route.ts              (Enviar email)
   └─ webhook/hka/route.ts        (Webhooks de HKA)
```

**Características:**
- Serverless Functions (Vercel)
- Error handling centralizado
- Logging y auditoría
- Rate limiting
- CORS configurado
- Validación de entrada (Zod)

---

### 4. Capa de Lógica de Negocio

**Responsabilidad:** Reglas de negocio, validaciones, cálculos

**Ubicación:** `lib/services/` y `lib/hka/`

**Servicios Principales:**

#### A. Servicio de Facturas
```typescript
// lib/services/invoice/
├─ invoice-generator.ts    // Generar XML para DGI
├─ signer.ts               // Firmar con certificado digital
├─ validator.ts            // Validar estructura
└─ processor.ts            // Procesar factura completa
```

**Funciones:**
- Generar XML válido según esquema FE_v1.00.xsd
- Validar montos, impuestos, clientes
- Firmar digitalmente (si en producción)
- Procesar respuesta de HKA
- Guardar en base de datos

#### B. Servicio de Folios
```typescript
// lib/services/folios/
├─ folio-manager.ts        // Gestión de folios
├─ inventory-tracker.ts    // Tracking de consumo
└─ alert-system.ts         // Alertas de folios bajos
```

**Funciones:**
- Sincronizar folios de HKA
- Rastrear consumo por usuario
- Generar alertas cuando baja
- Reservar folio para factura

#### C. Servicio de Distribución
```typescript
// lib/services/distribution/
├─ email-handler.ts        // Envío por email
├─ whatsapp-handler.ts     // Envío por WhatsApp
├─ tracking-handler.ts     // Rastrear entregas
└─ portal-generator.ts     // Links de portal cliente
```

**Funciones:**
- Enviar factura certificada
- Rastrear estado de entrega
- Generar links seguros
- Reenvío automático

---

### 5. Capa de Integración HKA (SOAP)

**Responsabilidad:** Comunicación segura con The Factory HKA

**Arquitectura Multi-Tenant Segura:**

```typescript
// lib/hka/
├─ soap/
│  ├─ client.ts              // 🔑 Cliente SOAP mejorado
│  │  └─ invokeWithCredentials() // Inyección segura
│  └─ types.ts               // Tipos SOAP
├─ credentials-manager.ts    // Resolución de credenciales
├─ methods/                  // 8 métodos HKA
│  ├─ consultar-folios.ts
│  ├─ enviar-documento.ts
│  ├─ consultar-documento.ts
│  ├─ anular-documento.ts
│  ├─ nota-credito.ts
│  ├─ nota-debito.ts
│  ├─ enviar-correo.ts
│  └─ rastrear-correo.ts
├─ utils/
│  ├─ ruc-validator.ts       // Validar RUCs
│  ├─ response-parser.ts     // Parsear respuestas
│  ├─ retry.ts               // Lógica de reintentos
│  └─ logger.ts              // Logging de operaciones
└─ validators/
   └─ xml-validator.ts       // Validar XML antes enviar
```

**Seguridad Multi-Tenant:**

```typescript
// Flujo seguro de credenciales:

1. Usuario guarda credenciales en Configuración
   → Encriptadas con AES-256-GCM
   → Almacenadas en BD (HKACredential o Organization)

2. Cuando usuario emite factura:
   → Sistema resuelve credenciales (usuario → org → sistema)
   → Inyecta localmente en instancia de cliente SOAP
   → Invoca método con credenciales específicas
   → Limpia credenciales automáticamente (finally block)

3. Resultado:
   ✅ Cada usuario aislado
   ✅ 0 race conditions
   ✅ 0 mezcla de credenciales
   ✅ Seguro para multi-tenant
```

**8 Métodos HKA Implementados:**

| Método | Función | Status |
|--------|---------|--------|
| ConsultarFolios | Consultar folios disponibles | ✅ |
| Enviar | Enviar factura/notas | ✅ |
| ConsultaFE | Consultar estado documento | ✅ |
| AnulacionFE | Anular documento | ✅ |
| NotaCreditoFE | Emitir nota crédito | ✅ |
| NotaDebitoFE | Emitir nota débito | ✅ |
| EnvioCorreo | Enviar por email | ✅ |
| RastreoCorreo | Rastrear entrega email | ✅ |

---

### 6. Capa de Datos

**Responsabilidad:** Persistencia, caché y almacenamiento de archivos

#### Base de Datos (PostgreSQL/Neon)

**Tablas Principales:**

```sql
users
├─ id (PK)
├─ email (UNIQUE)
├─ password_hash
├─ organizationId (FK)
└─ role (SUPER_ADMIN | ORG_ADMIN | USER)

organizations
├─ id (PK)
├─ name
├─ ruc
├─ dv
├─ plan (SIMPLE | ENTERPRISE)
├─ hkaTokenUser (encrypted)
├─ hkaTokenPassword (encrypted)
├─ hkaEnvironment (demo | prod)
└─ createdAt

hka_credentials
├─ id (PK)
├─ userId (FK)
├─ tokenUser (encrypted)
├─ tokenPassword (encrypted)
├─ environment (demo | prod)
├─ ruc
├─ dv
└─ isActive

invoices
├─ id (PK)
├─ organizationId (FK)
├─ number
├─ cufe (UNIQUE)
├─ xmlDocument
├─ status (DRAFT | PROCESSING | CERTIFIED | REJECTED)
├─ hkaResponseCode
├─ hkaResponseMessage
├─ qrCode
├─ pdfUrl (S3)
├─ xmlUrl (S3)
├─ createdAt
└─ updatedAt

invoice_items
├─ id (PK)
├─ invoiceId (FK)
├─ description
├─ quantity
├─ unitPrice
├─ amount
└─ order

folio_assignments
├─ id (PK)
├─ organizationId (FK)
├─ folioPoolId (FK)
├─ assignedAmount
├─ consumedAmount
└─ assignedAt

audit_logs
├─ id (PK)
├─ userId (FK)
├─ action (CREATE | UPDATE | DELETE | DOWNLOAD)
├─ resource (invoice | folio | credential)
├─ resourceId
├─ changes (JSON)
├─ ipAddress
└─ timestamp
```

#### Cache (Redis)

```
Clave de cache               TTL      Descripción
─────────────────────────────────────────────────────
user:{userId}:session       30d      Sesión del usuario
org:{orgId}:folios          5m       Cantidad de folios disponibles
org:{orgId}:settings        1h       Configuración de organización
invoice:{invoiceId}         24h      Datos de factura procesada
hka:methods                 7d       Métodos disponibles en WSDL
```

#### Almacenamiento (AWS S3)

```
Buckets:
sago-factu-production/
├─ pdfs/
│  └─ {year}/{month}/invoice-{id}.pdf
├─ xmls/
│  └─ {year}/{month}/invoice-{id}.xml
├─ certificates/
│  └─ {organizationId}/certificate.pfx (encrypted)
└─ backups/
   └─ {date}/backup-{timestamp}.tar.gz
```

**Políticas:**
- Encriptación en tránsito (HTTPS)
- Encriptación en reposo (AWS KMS)
- Control de acceso (presigned URLs)
- Versionado de documentos
- Retención automática (5 años mínimo)

---

## 🔄 Flujos Principales

### Flujo 1: Emisión de Factura (End-to-End)

```
1. USER → Abre "Nueva Factura"
   Frontend carga formulario vacío

2. USER → Ingresa datos (cliente, items, etc.)
   Frontend valida en tiempo real

3. USER → Click "Emitir y Certificar"
   POST /api/invoices/create

4. BACKEND:
   a. Resuelve credenciales HKA del usuario
   b. Obtiene datos de cliente (validar RUC)
   c. Genera XML válido según esquema DGI
   d. Valida estructura XML
   e. Si prod: Firma con certificado digital
   f. Invoca método SOAP "Enviar" en HKA
   g. Monitorea respuesta (puede tardar 2-3 seg)
   h. Guarda en BD (status = PROCESSING)
   i. Responde al frontend con CUFE preliminar

5. FRONTEND: Muestra "Procesando..."
   Backend continúa en background

6. BACKEND (Async):
   a. Espera confirmación final de HKA
   b. Si éxito: Genera PDF, guarda en S3
   c. Actualiza invoice.status = CERTIFIED
   d. Guarda PDF/XML URLs
   e. Dispara notificación al usuario

7. FRONTEND: Recibe actualización en tiempo real
   Muestra ✅ "Factura #0125 certificada"
   Opciones: Descargar, Enviar, Imprimir

Total: < 5 segundos para usuario
```

### Flujo 2: Sincronización de Folios

```
1. USER → Click "Consultar Folios"
   POST /api/folios/sincronizar

2. BACKEND:
   a. Resuelve credenciales del usuario
   b. Invoca método HKA "ConsultarFolios"
   c. Obtiene lista de folios (disponibles, asignados, usados)
   d. Actualiza folio_assignments en BD
   e. Calcula alerta si < 20%

3. FRONTEND:
   a. Recibe conteo actualizado
   b. Actualiza header: "Folios: 150/500"
   c. Si crítico: Muestra alerta naranja/roja

Total: < 10 segundos
```

### Flujo 3: Distribución a Cliente

```
1. USER → Click "Enviar Email"
   Modal se abre con email prerellenado

2. USER → Click "Enviar"
   POST /api/notifications/email

3. BACKEND:
   a. Resuelve credenciales (EnvioCorreo de HKA)
   b. Obtiene PDF de S3
   c. Invoca HKA.EnvioCorreo() con PDF
   d. HKA retorna trackingId
   e. Guarda trackingId en BD
   f. Retorna confirmación

4. FRONTEND:
   a. Muestra ✅ "Enviado a cliente@email.com"
   b. Link para copiar al portapapeles
   c. Opción "Ver estado de entrega"

5. BACKGROUND (Async):
   a. Cada hora: Invoca HKA.RastreoCorreo()
   b. Actualiza estado (enviado → entregado → abierto)
   c. Notifica si hay cambios importantes

Total: < 5 segundos para usuario
```

---

## 🛡️ Seguridad

### Encriptación de Credenciales

```typescript
// lib/utils/encryption.ts
Algorithm: AES-256-GCM
Key Derivation: PBKDF2 (120,000 iterations)
Salt: Random 32 bytes (único por credencial)
IV: Random 16 bytes (único por encriptación)

Proceso de guardado:
1. Generar salt aleatorio
2. Derivar clave usando PBKDF2
3. Generar IV aleatorio
4. Encriptar con AES-256-GCM
5. Guardar: {salt, iv, encrypted, authTag}

Proceso de lectura:
1. Leer {salt, iv, encrypted, authTag}
2. Derivar clave usando PBKDF2 + salt
3. Desencriptar con IV y authTag
4. Verificar integridad (authTag)
```

### Control de Acceso

```
Nivel 1: Authentication
- NextAuth.js v5
- Email/Password con hash bcrypt
- JWT tokens con expiración

Nivel 2: Authorization
- Row-Level Security (RLS) en Prisma
- Usuarios solo ven sus facturas
- Admins ven de su organización

Nivel 3: API Security
- HTTPS/TLS obligatorio
- CORS configurado
- Rate limiting (100 req/min)
- CSRF protection
- Input validation (Zod)
- Output encoding

Nivel 4: Data Security
- PII encriptada (credenciales, certificados)
- Logs sin información sensible
- No logear passwords ni tokens
- Audit trail completa
```

### Cumplimiento Regulatorio

```
Panameño:
✅ Ley de Facturación Electrónica (2012)
✅ Resolución de la DGI
✅ Retención de documentos 5 años
✅ Firma digital obligatoria (producción)

Internacional:
✅ GDPR (si usuarios en EU)
✅ CCPA (si usuarios en CA)
✅ ISO 27001 (roadmap)
```

---

## 📊 Deployments

### Desarrollo (Local)

```bash
npm install
npm run dev
# http://localhost:3000

Database: PostgreSQL (local)
Redis: local:6379
S3: minio (local)
```

### Staging

```
Plataforma: Vercel
Database: Neon (PostgreSQL managed)
Redis: Upstash
S3: AWS S3
HKA: Demo environment
Dominio: staging.sago-factu.com
```

### Production

```
Plataforma: Vercel
Database: Neon (PostgreSQL managed con backup automático)
Redis: Upstash (alta disponibilidad)
S3: AWS S3 con CloudFront (CDN)
HKA: Producción
Dominio: sago-factu.com

Features:
- Auto-scaling
- Zero-downtime deployments
- CDN caching
- 99.9% uptime SLA
- Backup diario
- Disaster recovery
```

---

## 📈 Monitoreo y Observabilidad

### Logs

```
Nivel: DEBUG | INFO | WARN | ERROR | FATAL

Ejemplos:
[HKA] Invocando método Enviar | usuario: juan@emp.com | ambiente: demo
[SOAP] Respuesta recibida | código: 0200 | mensaje: Operación exitosa
[DB] Factura insertada | invoiceId: uuid | status: CERTIFIED
[ERROR] Falló envío a HKA | error: connection timeout | retentando...

Almacenamiento: Vercel Analytics + Datadog/LogRocket
```

### Métricas

```
KPIs:
- Facturas emitidas/día
- Tasa de error en HKA
- Tiempo promedio de respuesta
- Uptime de sistema
- Folios consumidos/día
- Usuarios activos
```

---

## 🚀 Roadmap

### Fase 1 (Meses 1-2) - MVP
- ✅ Autenticación con NextAuth
- ✅ Formulario de nueva factura
- ✅ Emisión y certificación (HKA)
- ✅ Descarga PDF/XML
- ✅ Sincronización de folios
- ✅ Gestión de credenciales

### Fase 2 (Meses 3-4)
- Emisión masiva (batch upload)
- Dashboard con gráficos
- Notificaciones
- Auditoría completa

### Fase 3 (Meses 5-6)
- Portal de clientes
- Distribución automática (Email/WhatsApp)
- Plantillas de facturas
- Reportes avanzados

### Fase 4 (Meses 7+)
- Integración con ERPs
- API pública para desarrolladores
- Mobile app (React Native)
- Multi-moneda (USD)

---

## 💡 Conclusión

SAGO FACTU es una arquitectura moderna, escalable y segura que:

1. **Simplifica:** Complejidad técnica SOAP → UX intuitiva
2. **Escala:** De 1 a 10,000+ facturas/día sin cambios arquitectónicos
3. **Asegura:** Multi-tenant, encriptación, auditoría completa
4. **Cumple:** 100% regulaciones panameñas
5. **Innova:** Features de valor agregado (Portal, WhatsApp, etc.)

Stack moderno, código limpio, y lista para crecer.

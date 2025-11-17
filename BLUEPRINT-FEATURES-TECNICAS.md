# 🏗️ SAGO FACTU - Blueprint Técnico

**Plataforma SaaS para Facturación Electrónica - Panamá**
**Versión**: 0.7.0 | **Status**: Production Ready ✅

---

## 📋 Índice

1. [Arquitectura Técnica](#arquitectura-técnica)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Features Técnicas](#features-técnicas)
4. [Modelos de Datos](#modelos-de-datos)
5. [APIs y Endpoints](#apis-y-endpoints)
6. [Seguridad](#seguridad)
7. [Performance](#performance)
8. [Escalabilidad](#escalabilidad)

---

## Arquitectura Técnica

### 1. Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                         SAGO FACTU SaaS                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      CAPA PRESENTACIÓN                            │
├──────────────────────────────────────────────────────────────────┤
│  • React 19 + Next.js 15 App Router                              │
│  • Tailwind CSS 4 + shadcn/ui Components                         │
│  • Dark Mode Support                                             │
│  • Responsive Design (Mobile/Tablet/Desktop)                     │
│  • TypeScript 5 para type safety                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   CAPA API (NEXT.JS ROUTES)                      │
├──────────────────────────────────────────────────────────────────┤
│  • 75+ Endpoints REST                                            │
│  • NextAuth.js v5 Authentication                                 │
│  • Server Actions para mutaciones                                │
│  • Middleware para autorización                                  │
│  • Rate limiting y validación                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   CAPA LÓGICA DE NEGOCIO                         │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ HKA Integration Service                                     │ │
│  │  • SOAP Client para The Factory HKA                         │ │
│  │  • Transformación de datos (JSON → XML rFE)                │ │
│  │  • Validación de esquemas XML                               │ │
│  │  • Manejo de respuestas HKA                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Encryption Service                                          │ │
│  │  • AES-256-GCM para datos sensibles                         │ │
│  │  • PBKDF2 con 120k iteraciones                              │ │
│  │  • Gestión de claves de usuario                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Folio Management Service                                    │ │
│  │  • Consulta de folios disponibles                           │ │
│  │  • Sincronización con HKA                                   │ │
│  │  • Asignación a usuarios                                    │ │
│  │  • Tracking de consumo                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Digital Signature Service                                   │ │
│  │  • Carga y validación de certificados P12/PFX               │ │
│  │  • XMLDSig según DGI Panamá                                 │ │
│  │  • Manejo seguro de PIN                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│              CAPA DE DATOS Y PERSISTENCIA                         │
├──────────────────────────────────────────────────────────────────┤
│  • PostgreSQL 15 (Neon Serverless)                               │
│  • Prisma ORM 6.17 (type-safe queries)                           │
│  • Redis para caché y queues                                     │
│  • AWS S3 para archivos (PDF, XML)                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS E INTEGRACIONES                   │
├──────────────────────────────────────────────────────────────────┤
│  • The Factory HKA (SOAP API)                                    │
│  • AWS S3 (Object Storage)                                       │
│  • Resend (Email Service)                                        │
│  • Vercel (Hosting/Serverless Functions)                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 19 | UI Framework |
| **Next.js** | 15.5.6 | Full-stack framework + App Router |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 4 | Styling |
| **shadcn/ui** | Latest | Pre-built components |
| **Lucide Icons** | Latest | Icons |
| **SWR/TanStack Query** | Latest | Data fetching |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 20+ | Runtime |
| **Next.js API Routes** | 15.5.6 | REST API endpoints |
| **NextAuth.js** | v5 | Authentication/Authorization |
| **Prisma ORM** | 6.17.1 | Database abstraction |
| **node-soap** | Latest | SOAP client for HKA |

### Base de Datos
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **PostgreSQL** | 15 | Primary database (Neon) |
| **Redis** | 7+ | Cache + Job queues |
| **Prisma Client** | 6.17.1 | Query builder |

### Infraestructura
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Vercel** | - | Hosting + Serverless Functions |
| **AWS S3** | - | Document storage |
| **GitHub** | - | Version control + CD |
| **Neon** | - | PostgreSQL hosting |

---

## Features Técnicas

### 1. Autenticación y Autorización

#### NextAuth.js v5
```typescript
// Flujo de autenticación
User Login → Credentials Provider → JWT Token → Secure Cookie
                                  ↓
                         Session Management
                                  ↓
                    Middleware Check en cada request
```

**Características**:
- ✅ Autenticación basada en credenciales
- ✅ JWT tokens con expiración configurable
- ✅ Refresh tokens para sesiones largas
- ✅ Rol-based access control (RBAC)
- ✅ Middleware para protección de rutas

**Roles Implementados**:
```typescript
enum UserRole {
  SUPER_ADMIN,    // Acceso total al sistema
  ADMIN,          // Gestor de organización
  USER,           // Usuario regular
  OPERATOR        // Operador limitado
}
```

---

### 2. Encriptación de Datos Sensibles

#### AES-256-GCM + PBKDF2
```
Token HKA (plain text)
       ↓
[PBKDF2 Key Derivation - 120k iteraciones]
       ↓
[AES-256-GCM Encryption]
       ↓
{salt, iv, encrypted, authTag} → JSON → Base64
       ↓
Almacenado en PostgreSQL
```

**Implementación**:
- ✅ Archivo: `lib/utils/encryption.ts`
- ✅ Claves derivadas dinámicamente en runtime
- ✅ Salt aleatorio (16 bytes) por encriptación
- ✅ IV aleatorio (12 bytes) para GCM
- ✅ Authentication tag (128 bits) para integridad

**Lo que se encripta**:
- ✅ Tokens HKA (user + password)
- ✅ Certificados digitales (P12/PFX)
- ✅ PIN de certificados

---

### 3. Integración HKA (The Factory)

#### SOAP Client
```typescript
// lib/hka/client.ts
class HKAClient extends soap.Client {
  async consultarFolios(ruc: string, dv: string)
  async enviarFactura(xmlRFE: string)
  async consultarEstatus(referencia: string)
  async anularDocumento(referencia: string)
}
```

**Métodos SOAP Soportados**:
1. **ConsultarFolios** → Obtener folios disponibles
2. **EnviarDocumento** → Enviar factura rFE
3. **ConsultarTramite** → Verificar estado
4. **AnularDocumento** → Anular factura

**Transformación de Datos**:
```
JavaScript/JSON (usuario)
       ↓
[Transformador rFE]
       ↓
XML según DGI Panamá
       ↓
[Firma Digital XMLDSig]
       ↓
SOAP Request → HKA
       ↓
SOAP Response ← HKA
       ↓
Parseo y almacenamiento
```

---

### 4. Gestión de Folios

#### Consulta y Sincronización
```typescript
// Flujo de sincronización
POST /api/folios/sincronizar
  ├─ Verificar credenciales HKA
  ├─ Llamar ConsultarFolios() en HKA
  ├─ Parsear respuesta SOAP
  ├─ Actualizar tabla FolioPool
  ├─ Registrar en audit log
  └─ Retornar status
```

**Modelos de Datos**:
```prisma
model FolioPool {
  id              String
  organizationId  String
  startFolio      Int
  endFolio        Int
  availableFolios Int
  assignedFolios  Int
  consumedFolios  Int
  purchaseDate    DateTime
  expiryDate      DateTime?

  assignments     FolioAssignment[]
}

model FolioAssignment {
  id              String
  organizationId  String
  userId          String
  folioPoolId     String
  assignedAmount  Int
  consumedAmount  Int
  assignedAt      DateTime
  assignedBy      String? // Admin ID

  user            User
  folioPool       FolioPool
}
```

---

### 5. Gestión de Credenciales por Usuario

#### Multi-tenant Credential Model
```typescript
// Cada usuario tiene credenciales encriptadas
model HKACredential {
  id            String
  userId        String              // Isolación por usuario
  environment   HKAEnvironment      // DEMO | PROD
  tokenUser     String              // Username
  tokenPassword String              // Encriptado
  isActive      Boolean
  lastUsedAt    DateTime?

  user          User
  @@unique([userId, environment])
}

// Contexto de credenciales para requests
withHKACredentials(userId, environment, async () => {
  // Injectar credenciales en process.env
  // Ejecutar operaciones HKA
  // Restaurar env original
})
```

**Ventajas**:
- ✅ Cada usuario gestiona sus propias credenciales
- ✅ Soporta múltiples ambientes (demo/prod)
- ✅ Encriptación individual
- ✅ Auditoría por usuario
- ✅ Revocación granular

---

### 6. Procesamiento de Facturas

#### Pipeline de Facturación
```
1. Creación de Factura
   └─ Validación de datos
   └─ Verificación de folios
   └─ Persistencia en BD

2. Generación XML rFE
   └─ Transformación JSON → XML
   └─ Validación contra esquema
   └─ Enriquecimiento de datos

3. Firma Digital
   └─ Cargar certificado P12/PFX
   └─ Incluir PIN
   └─ Aplicar XMLDSig

4. Envío a HKA
   └─ Construir SOAP request
   └─ Manejar timeouts
   └─ Reintentos automáticos

5. Almacenamiento
   └─ XML → AWS S3
   └─ PDF → AWS S3
   └─ Metadata → PostgreSQL
   └─ Status → audit trail
```

---

### 7. Procesamiento Asíncrono

#### BullMQ + Redis
```typescript
// Queues configuradas
- CertificationQueue     // Envíos a HKA
- SyncQueue            // Sincronización de folios
- EmailQueue           // Notificaciones
- ReportingQueue       // Generación de reportes

// Ejemplo
const job = await certificationQueue.add('process-invoice', {
  invoiceId: '123',
  userId: 'user-456'
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true
})
```

---

### 8. API REST Endpoints

#### Facturas
```
POST   /api/invoices/create           → Crear factura
GET    /api/invoices/[id]             → Obtener detalles
GET    /api/invoices/[id]/xml         → Descargar XML
GET    /api/invoices/[id]/pdf         → Generar PDF
POST   /api/invoices/[id]/process     → Enviar a HKA
POST   /api/invoices/[id]/cancel      → Anular
POST   /api/invoices/[id]/email/send  → Enviar por email
```

#### Folios
```
GET    /api/folios/available          → Folios disponibles
POST   /api/folios/sincronizar        → Sincronizar desde HKA
POST   /api/folios/purchase           → Comprar folios (admin)
```

#### Credenciales HKA
```
GET    /api/settings/hka-credentials           → Obtener credenciales
POST   /api/settings/hka-credentials           → Guardar credenciales
POST   /api/settings/test-hka-connection       → Probar conexión
```

#### Certificados Digitales
```
POST   /api/certificates/upload       → Cargar certificado P12/PFX
GET    /api/certificates/[id]         → Obtener certificado
DELETE /api/certificates/[id]         → Eliminar certificado
```

---

### 9. Seguridad

#### Medidas Implementadas

1. **Encriptación en Tránsito**
   - ✅ HTTPS (TLS 1.3)
   - ✅ Secure cookies con HttpOnly flag
   - ✅ CORS configurado

2. **Encriptación en Reposo**
   - ✅ AES-256-GCM para tokens
   - ✅ AES-256-GCM para certificados
   - ✅ Hashing bcrypt para passwords

3. **Validación de Entrada**
   - ✅ Zod schemas en todos los endpoints
   - ✅ Type checking con TypeScript
   - ✅ Sanitización de datos

4. **Autorización**
   - ✅ NextAuth middleware
   - ✅ RBAC basado en roles
   - ✅ Aislamiento de datos por organización/usuario

5. **Auditoría**
   - ✅ Logging de operaciones sensibles
   - ✅ Metadata de usuario/timestamp
   - ✅ Trail de cambios en credenciales

---

### 10. Performance

#### Optimizaciones

1. **Caché**
   - ✅ Redis para datos frecuentes
   - ✅ Client-side caching con SWR
   - ✅ ISR (Incremental Static Regeneration) en rutas

2. **Base de Datos**
   - ✅ Índices en campos frecuentes
   - ✅ Conexión pool con Prisma
   - ✅ Lazy loading de relaciones

3. **API**
   - ✅ Compresión gzip
   - ✅ Pagination en listados
   - ✅ Rate limiting

4. **Frontend**
   - ✅ Code splitting automático
   - ✅ Lazy loading de componentes
   - ✅ Image optimization

---

### 11. Escalabilidad

#### Arquitectura Serverless
```
Vercel Functions → Auto-scaling
                ├─ Scale up bajo carga
                ├─ Scale down en idle
                └─ Billing por uso

PostgreSQL (Neon) → Serverless
                 ├─ Auto-pause inactivo
                 ├─ Escalable en demanda
                 └─ Backups automáticos

Redis (Vercel KV) → Managed
                 ├─ Escalado automático
                 ├─ Replicación
                 └─ Persistencia
```

---

## Modelos de Datos

### Core Models

```prisma
model Organization {
  id              String
  slug            String @unique
  name            String
  ruc             String?
  dv              String?

  // HKA Configuration
  hkaEnabled      Boolean @default(true)
  hkaEnvironment  String? @default("demo")
  plan            OrganizationPlan

  // Multi-tenant scope
  users           User[]
  invoices        Invoice[]
  folioPools      FolioPool[]
  folioAssignments FolioAssignment[]
}

model User {
  id              String
  email           String @unique
  password        String (bcrypt)
  organizationId  String
  role            UserRole

  // Credentials HKA
  hkaCredentials  HKACredential[]

  // Certificados
  certificates    Certificate[]

  // Auditoría
  invoices        Invoice[] @relation("CreatedBy")
  createdAt       DateTime
  updatedAt       DateTime
}

model Invoice {
  id              String
  organizationId  String
  userId          String

  // Datos factura
  number          String
  date            DateTime
  amount          Decimal

  // Status
  status          InvoiceStatus
  hkaResponse     Json?
  referenceHKA    String?

  // Archivos
  xmlPath         String?  // S3
  pdfPath         String?  // S3

  createdAt       DateTime
  updatedAt       DateTime
}

model HKACredential {
  id              String
  userId          String
  environment     HKAEnvironment
  tokenUser       String
  tokenPassword   String (encrypted)
  isActive        Boolean
  lastUsedAt      DateTime?

  user            User
  @@unique([userId, environment])
}

model Certificate {
  id              String
  userId          String
  organizationId  String

  // Certificado
  p12File         Bytes (encrypted)
  pin             String (encrypted)
  ruc             String

  // Metadata
  expiryDate      DateTime
  isActive        Boolean

  user            User
}
```

---

## APIs y Endpoints

### Estructura de Respuesta Estándar

```typescript
// Success Response
{
  success: true,
  data: {...},
  message: "Operation completed"
}

// Error Response
{
  success: false,
  error: "Error message",
  details: {...},
  timestamp: ISO8601
}
```

### Rate Limiting
```
- General: 100 requests/minute
- API Auth: 5 attempts/5 minutes
- File Upload: 10 requests/minute
```

---

## Resumen Técnico

| Aspecto | Implementación |
|---------|---|
| **Frontend** | React 19 + Next.js 15 |
| **Backend** | Node.js + Next.js API Routes |
| **Auth** | NextAuth.js v5 + JWT |
| **BD** | PostgreSQL (Neon) |
| **Encryption** | AES-256-GCM + PBKDF2 |
| **Async Jobs** | BullMQ + Redis |
| **Storage** | AWS S3 |
| **Deployment** | Vercel (Serverless) |
| **Monitoring** | Vercel Analytics |
| **Type Safety** | TypeScript 5 |

---

**Última actualización**: Noviembre 2025
**Status**: Production Ready ✅
**Build**: Passing (0 errors)

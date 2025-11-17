# 🏗️ Arquitectura de SAGO FACTU

Una visión completa de cómo funciona SAGO FACTU internamente.

## 📐 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                             │
│   (Next.js Client - React, TailwindCSS, TypeScript)         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/HTTPS
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Routes (Node.js + Express)                       │   │
│  │ - /api/invoices/create (crear factura)              │   │
│  │ - /api/invoices/send-signed (firmar + enviar)       │   │
│  │ - /api/hka/* (integración HKA)                      │   │
│  │ - /api/certificates/* (gestión de certificados)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ NextAuth.js (Autenticación)                          │   │
│  │ - Manejo de sesiones                                │   │
│  │ - Multi-tenant security                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────────────┬──────────────────┘
         │                                  │
         ↓                                  ↓
    ┌─────────────┐               ┌──────────────────┐
    │  PostgreSQL │               │  OVH S3 Storage  │
    │   (Neon)    │               │  (PDFs, XMLs)    │
    └─────────────┘               └──────────────────┘
```

## 🔄 Flujo Principal: Crear y Enviar una Factura

```
1. Usuario crea factura en UI
   ↓
2. POST /api/invoices/create
   ├─ Valida datos (Zod schema)
   ├─ Guarda en BD (Prisma)
   └─ Retorna invoiceId
   ↓
3. Usuario hace clic en "Enviar a HKA"
   ↓
4. POST /api/invoices/send-signed
   ├─ Obtiene certificado del usuario
   ├─ Obtiene credenciales HKA de la organización
   ├─ Firma XML con XMLDSig (W3C standard)
   ├─ Envía a HKA vía SOAP API
   ├─ Recibe CUFE (autorización fiscal)
   └─ Guarda resultado en BD
   ↓
5. Factura ya está certificada por DGI
```

## 🔐 Capas de Seguridad

### 1. Autenticación (NextAuth.js)
- Login con email/contraseña (bcrypt hashing)
- Manejo de sesiones seguras
- CSRF protection

### 2. Autorización (Multi-tenant)
- Cada usuario solo ve datos de su organización
- Restricción de acceso por roles (Admin, User)
- Aislamiento de credenciales HKA por organización

### 3. Encriptación en Tránsito
- HTTPS en todas las conexiones
- TLS 1.2+ obligatorio

### 4. Encriptación en Reposo
- Contraseñas hasheadas con bcrypt
- Tokens HKA encriptados con AES-256-GCM
- PINs de certificados encriptados

### 5. Firma Digital
- XMLDSig W3C standard
- RSA-SHA256 algorithm
- Certificado digital (X.509)
- CUFE (Código Único de Fiscalización Electrónica) del DGI

## 📊 Modelo de Datos Clave

### Tablas Principales

#### **Organization**
```typescript
{
  id: string              // PK
  slug: string           // URL-friendly name
  name: string           // Nombre del negocio
  ruc: string            // Registro Único de Contribuyente
  hkaTokenUser: string   // Usuario para HKA
  hkaTokenPassword: string // Contraseña HKA (encriptada)
  hkaEnvironment: string  // "demo" | "prod"
  plan: OrganizationPlan // ENTERPRISE | SIMPLE
}
```

#### **User**
```typescript
{
  id: string
  email: string          // @unique
  password: string       // bcrypt hashed
  organizationId: string // FK → Organization
  role: UserRole         // ADMIN | USER
}
```

#### **Invoice**
```typescript
{
  id: string
  organizationId: string
  createdBy: string      // FK → User
  documentType: string   // FACTURA | NOTA_CREDITO | etc
  receiverName: string   // Empresa que recibe la factura
  receiverRuc: string    // RUC del receptor (puede ser null)
  total: Decimal
  status: InvoiceStatus  // DRAFT | QUEUED | PROCESSING | CERTIFIED
  xmlContent: string     // XML sin firmar
  cufe: string          // CUFE (después de certificar)
  hkaProtocol: string   // Número de protocolo HKA
}
```

#### **DigitalCertificate**
```typescript
{
  id: string
  userId: string         // FK → User (único por usuario)
  certificateP12: Bytes  // Archivo .p12 encriptado
  ruc: string
  subject: string        // CN del certificado
  validFrom: DateTime
  validTo: DateTime      // Fecha de vencimiento
  uploadedAt: DateTime
}
```

#### **UserSignatureConfig**
```typescript
{
  userId: string @unique  // FK → User
  organizationId: string
  digitalCertificateId: string // FK → DigitalCertificate
  signatureMode: string   // PERSONAL | ORGANIZATION
  autoSign: boolean       // ¿Firmar automáticamente?
}
```

## 🔌 Integración HKA (Facturación Electrónica)

### SOAP API de HKA

HKA (The Factory) es la autoridad tributaria panameña que autoriza facturas electrónicas.

#### Endpoints principales:

1. **ConsultarFolios()**
   - Verifica folios disponibles para emitir
   - Retorna cantidad de facturas que puedo emitir

2. **EnviarDocumento()**
   - Envía XML firmado de la factura
   - HKA valida firma digital, datos, etc.
   - Retorna CUFE si es válido

3. **AnularDocumento()**
   - Invalida una factura ya certificada
   - Requiere CUFE de la factura original

#### Flujo Completo:

```
1. Usuario crea factura (DRAFT)
   ↓
2. Sistema genera XML desde datos de factura
   ↓
3. Sistema obtiene certificado digital del usuario
   ↓
4. Sistema firma XML con certificado (XMLDSig)
   ↓
5. Sistema envía XML firmado a HKA vía SOAP
   ↓
6. HKA valida firma y datos
   ↓
7. Si OK: HKA retorna CUFE (autorización)
   ↓
8. Sistema guarda CUFE en BD
   ↓
9. Factura está CERTIFIED (lista para usar)
```

## 🛡️ Firma Digital (XMLDSig)

### ¿Qué es?

XMLDSig es un estándar W3C para firmar documentos XML digitalmente.

### Algoritmos Usados:

- **Firma**: RSA-SHA256
- **Canonicalización**: Exclusive C14N (para evitar problemas de espacios)
- **Digest**: SHA-256

### Flujo:

```
1. Tener XML de la factura
2. Cargar certificado digital (.p12)
3. Calcular SHA-256 hash del XML
4. Firmar hash con clave privada (RSA)
5. Incrustar firma en el XML (nodo <Signature>)
6. Enviar XML firmado
```

### Validación:

HKA valida que:
- La firma es válida (corresponde al certificado)
- El certificado no está vencido
- El certificado es de una autoridad confiable (CA)
- El XML no ha sido modificado

## 📱 Componentes Principales

### Frontend (Next.js + React)

**Estructura de carpetas:**
```
app/
├── /dashboard              # Interfaz principal
├── /api                    # API endpoints
├── /components             # Componentes reutilizables
└── /auth                   # Páginas de login/signup
```

**Componentes clave:**
- **InvoiceForm**: Crear/editar facturas
- **InvoiceList**: Listar facturas
- **SimpleCertificateUpload**: Cargar certificado digital
- **Dashboard**: Panel principal

### Backend (Node.js + Prisma)

**Rutas API principales:**
```
POST /api/invoices/create
POST /api/invoices/send-signed
GET  /api/invoices/[id]
POST /api/invoices/[id]/cancel
POST /api/invoices/[id]/email/send

POST /api/certificates/simple-upload
GET  /api/certificates/simple-upload

GET  /api/folios/available
POST /api/folios/sincronizar

POST /api/hka/test-connection
```

### Base de Datos (PostgreSQL)

**Hospedado en**: Neon (serverless PostgreSQL)

**Tablas principales**: 15+ tablas para:
- Usuarios y organizaciones
- Facturas e items
- Certificados digitales
- Configuración HKA
- Logs de API
- Auditoría

## 🔄 Ciclo de Vida de una Factura

```
DRAFT
  ↓ [Usuario hace clic en "Enviar"]
QUEUED
  ↓ [Sistema intenta firmar y enviar a HKA]
PROCESSING
  ↓ [HKA valida y procesa]
CERTIFIED ← ¡Autorizada!
  ↓ [O si falla...]
REJECTED ← Error de HKA
  ↓ [O...]
ERROR ← Error técnico
```

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Líneas de código | ~80,000+ |
| API endpoints | 50+ |
| Tablas BD | 20+ |
| Componentes React | 40+ |
| Test cases | 100+ |
| Documentación | 2,000+ líneas |

## 🚀 Rendimiento

- **Tiempo de carga**: < 2s (homepage)
- **API latency**: < 500ms
- **HKA latency**: 1-3s (depende de HKA)
- **Uptime**: 99.9% (SLA de Vercel)

---

**Última actualización**: 2025-11-17

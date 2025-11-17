# Implementación de Firma Digital - SAGO FACTU

Documentación completa del sistema de firma digital implementado para SAGO FACTU.

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de firma digital electrónica compatible con los requisitos de DGI Panamá para la facturación electrónica. El sistema incluye:

- ✅ Gestión de certificados PKCS#12 (.p12/.pfx)
- ✅ Firma XMLDSig con algoritmos W3C estándar
- ✅ Validación y monitoreo de certificados
- ✅ Panel de administración de certificados
- ✅ Alertas automáticas por vencimiento
- ✅ Integración con HKA para envío de facturas firmadas
- ✅ Tests unitarios e integración completos

## 🏗️ Arquitectura

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    API REST Endpoints                       │
├─────────────────────────────────────────────────────────────┤
│ POST   /api/certificates/upload          (Cargar cert)      │
│ GET    /api/certificates/upload          (Listar certs)     │
│ DELETE /api/certificates/[id]            (Eliminar cert)    │
│ POST   /api/certificates/[id]/default    (Establecer default)
│ GET    /api/certificates/monitoring      (Estadísticas)     │
│ POST   /api/invoices/sign                (Firmar factura)   │
│ GET    /api/invoices/sign                (Info certificado) │
└─────────────────────────────────────────────────────────────┘
         ↓                                       ↓
    ┌─────────────────┐              ┌──────────────────────┐
    │ UI Components   │              │  Service Layer       │
    ├─────────────────┤              ├──────────────────────┤
    │ UploadForm      │              │ InvoiceSigner        │
    │ CertList        │              │ SendWithSignature    │
    │ Monitoring      │              │ CertManager          │
    └─────────────────┘              │ XMLDSigSigner        │
                                     │ ExpirationAlerts     │
                                     └──────────────────────┘
```

### Stack Tecnológico

- **Lenguaje**: TypeScript/Node.js
- **Framework Web**: Next.js 14 + App Router
- **Autenticación**: NextAuth.js
- **Base de Datos**: Prisma ORM
- **Criptografía**: OpenSSL nativo + xml-crypto
- **Validación**: Zod schemas
- **Encriptación BD**: AES-256-GCM + PBKDF2
- **Scheduling**: node-cron
- **Logging**: Custom logger integrado

## 📁 Estructura de Archivos

### Core Modules

```
lib/
├── certificates/
│   ├── certificate-manager.ts       # Parsing y validación de PKCS#12
│   ├── expiration-alerts.ts         # Alertas automáticas
│   └── types.ts                     # Interfaces de certificados
│
├── xmldsig/
│   ├── signer.ts                    # XMLDSig W3C standard
│   └── types.ts                     # Interfaces XMLDSig
│
├── invoices/
│   ├── invoice-signer.ts            # Orquestación de firma
│   └── types.ts                     # Interfaces de factura
│
└── hka/
    ├── methods/
    │   └── send-with-signature.ts   # Envío con firma automática
    └── ...
```

### UI Components

```
app/
├── components/
│   └── certificates/
│       ├── CertificateUploadForm.tsx    # Formulario de carga
│       ├── CertificateList.tsx          # Lista de certificados
│       └── CertificateMonitoring.tsx    # Dashboard de monitoreo
│
├── api/
│   └── certificates/
│       ├── upload/route.ts              # POST/GET upload
│       ├── [id]/route.ts                # DELETE certificado
│       ├── [id]/default/route.ts        # POST set default
│       └── monitoring/route.ts          # GET estadísticas
│
└── dashboard/
    └── certificados/
        └── page.tsx                     # Página principal
```

### Tests

```
__tests__/
├── certificates/
│   └── certificate-manager.test.ts      # Tests de parsing
├── xmldsig/
│   └── signer.test.ts                   # Tests de firma
├── invoices/
│   └── invoice-signer.test.ts           # Tests integración
└── hka/
    └── send-with-signature.test.ts      # Tests HKA
```

## 🔐 Seguridad

### Encriptación de Certificados

Los certificados se almacenan encriptados en la base de datos:

- **Algoritmo**: AES-256-GCM
- **Key Derivation**: PBKDF2 (120,000 iteraciones)
- **Implementación**: Prisma field encryption (automática)

```typescript
// En schema.prisma:
certificateData String  @db.Text
// Encriptado automáticamente por Prisma
```

### Validaciones de Seguridad

```typescript
// 1. Validación de formato PKCS#12
parsePKCS12(buffer, password)
  ├─ Parsear contenedor PKCS#12
  ├─ Extraer clave privada
  ├─ Extraer certificados X.509
  └─ Validar estructura

// 2. Validación de certificado
validateCertificate(cert, ruc)
  ├─ Verificar vigencia
  ├─ Verificar RUC coincida
  ├─ Validar estructura X.509
  ├─ Extraer información
  └─ Calcular huella digital

// 3. Validación de firma
verifySignature(signedXml, publicCert)
  ├─ Parsear XML firmado
  ├─ Extraer firma XMLDSig
  ├─ Validar con certificado público
  └─ Retornar resultado
```

### Control de Acceso

- Solo usuarios autenticados pueden cargar certificados
- Solo administradores pueden gestionar certificados
- Certificados aislados por organización (multi-tenant)
- Los datos no se comparten entre organizaciones

## 🔧 Configuración

### Variables de Entorno Requeridas

```bash
# Criptografía
ENCRYPTION_KEY=                    # AES-256 key (64 hex chars)
ENCRYPTION_ALGORITHM=AES-256-GCM   # No cambiar

# Email (para alertas)
SMTP_HOST=                         # SMTP server
SMTP_PORT=587                      # SMTP port
SMTP_USER=                         # SMTP user
SMTP_PASS=                         # SMTP password
SMTP_FROM=noreply@domain.com       # From address

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                   # Random secret

# HKA
HKA_CERTIFICATE_BASE64=            # Certificado por defecto (opcional)
```

### Instalación de Dependencias

```bash
npm install xml-crypto
npm install node-cron
npm install nodemailer
npm install zod
```

## 🚀 Uso de la API

### 1. Cargar Certificado

```bash
curl -X POST http://localhost:3000/api/certificates/upload \
  -F "file=@certificado.p12" \
  -F "password=miclave" \
  -F "name=Certificado Empresa 2024" \
  -F "setAsDefault=true"

# Response:
{
  "success": true,
  "certificateId": "cert_123",
  "certificate": {
    "subject": "EMPRESA S.A. RUC=123456789-2-2020 DV=45",
    "issuer": "DGI Panama",
    "validFrom": "2023-01-15T00:00:00Z",
    "validTo": "2025-01-15T00:00:00Z",
    "daysUntilExpiration": 450,
    "ruc": "123456789-2-2020",
    "fingerprint": "a1b2c3d4e5f6..."
  }
}
```

### 2. Listar Certificados

```bash
curl http://localhost:3000/api/certificates/upload

# Response:
{
  "success": true,
  "certificates": [
    {
      "id": "cert_123",
      "name": "Certificado Empresa 2024",
      "certificateSubject": "EMPRESA S.A. RUC=123456789-2-2020 DV=45",
      "daysUntilExpiration": 450,
      "isExpired": false,
      "expiringWarning": false,
      "isDefault": true
    }
  ]
}
```

### 3. Firmar Factura

```bash
curl -X POST http://localhost:3000/api/invoices/sign \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "inv_123",
    "certificateId": "cert_123",
    "password": "miclave",
    "validateRuc": true
  }'

# Response:
{
  "success": true,
  "signedXml": "<rFE>...<ds:Signature>...</ds:Signature></rFE>",
  "signature": {
    "algorithm": "RSA-SHA256",
    "timestamp": "2025-11-17T12:30:00Z",
    "certificateSubject": "EMPRESA S.A. RUC=123456789-2-2020 DV=45",
    "daysUntilExpiration": 450
  },
  "validations": {
    "certificateValid": true,
    "signatureValid": true,
    "rucMatch": true
  }
}
```

### 4. Enviar Factura con Firma Automática

```bash
# Desde código TypeScript:
import { sendInvoiceWithSignature } from '@/lib/hka/methods/send-with-signature'

const result = await sendInvoiceWithSignature({
  invoiceId: 'inv_123',
  organizationId: 'org_456',
  credentials: {
    username: 'hka_user',
    password: 'hka_pass'
  },
  certificateBase64: 'base64cert',
  certificatePassword: 'cert_pass',
  autoSign: true,
  validateRuc: true,
  maxRetries: 3
})

// Result:
{
  success: true,
  invoiceId: 'inv_123',
  cufe: 'CUFE123456789',
  protocoloAutorizacion: 'PROTOCOLO123456',
  signed: true,
  signedAt: Date,
  sentAt: Date
}
```

## 📊 Monitoreo de Certificados

### Dashboard de Estadísticas

La API `/api/certificates/monitoring` proporciona:

```json
{
  "success": true,
  "status": {
    "total": 5,
    "active": 4,
    "expiring": 1,
    "expired": 0,
    "averageDaysToExpiration": 180
  },
  "certificates": [
    {
      "id": "cert_123",
      "name": "Cert 1",
      "daysUntilExpiration": 450,
      "isExpired": false,
      "expiringWarning": false
    }
  ]
}
```

### Alertas por Email

Sistema automático que:

1. ✅ Verifica certificados diariamente a las 8:00 AM
2. ✅ Detecta certificados próximos a vencer:
   - **Urgente**: < 7 días
   - **Advertencia**: 7-30 días
   - **Información**: 30-60 días
3. ✅ Envía emails a administradores de organizaciones
4. ✅ Incluye links directos al panel de certificados

## 🧪 Tests

### Ejecutar Tests Unitarios

```bash
npm test -- __tests__/certificates/certificate-manager.test.ts
npm test -- __tests__/xmldsig/signer.test.ts
npm test -- __tests__/invoices/invoice-signer.test.ts
npm test -- __tests__/hka/send-with-signature.test.ts
```

### Cobertura de Tests

- Certificate Manager: 15+ test cases
- XMLDSig Signer: 16+ test cases
- Invoice Signer: 18+ test cases
- HKA Integration: 20+ test cases

## 📈 Algoritmos Utilizados

### Firma Digital (XMLDSig)

```
Algoritmo de Firma:  http://www.w3.org/2001/04/xmldsig-more#rsa-sha256
├─ Tipo: RSA-SHA256 (2048+ bits)
├─ Hash: SHA-256
└─ Standard: W3C XMLDSig

Canonicalización:    http://www.w3.org/2001/10/xml-exc-c14n#
├─ Tipo: Exclusive C14N
└─ Uso: Normalizar XML antes de firmar

Digest:              http://www.w3.org/2001/04/xmlenc#sha256
├─ Tipo: SHA-256
└─ Uso: Hash del documento

Transformación:      http://www.w3.org/2000/09/xmldsig#enveloped-signature
├─ Tipo: Enveloped Signature
└─ Ubicación: Dentro del documento
```

### Encriptación (BD)

```
Algoritmo:  AES-256-GCM
Key Derivation: PBKDF2
├─ Iteraciones: 120,000
├─ Salt: Random (16 bytes)
└─ Hash: SHA-256

IV: Aleatorio (12 bytes)
Authentication Tag: GCM
```

## 🔄 Flujo de Firma Completo

```
1. Usuario carga certificado .p12
   ├─ Validación de formato
   ├─ Extracción de componentes
   └─ Almacenamiento encriptado en BD

2. Usuario inicia firma de factura
   ├─ Cargar certificado de BD
   ├─ Desencriptar datos
   └─ Validar vigencia y RUC

3. Aplicar XMLDSig
   ├─ Normalizar XML (Exclusive C14N)
   ├─ Calcular hash (SHA-256)
   ├─ Firmar con clave privada (RSA-SHA256)
   └─ Incrustar firma en XML (Enveloped)

4. Validar firma
   ├─ Parsear XML con firma
   ├─ Extraer firma XMLDSig
   └─ Verificar con certificado público

5. Enviar a HKA
   ├─ XML firmado como entrada
   ├─ HKA valida firma
   ├─ HKA autoriza factura
   └─ Retorna CUFE y protocolo

6. Guardar en BD
   ├─ XML firmado
   ├─ CUFE
   ├─ Protocolo de autorización
   └─ Timestamp
```

## ⚠️ Manejo de Errores

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "Contraseña incorrecta" | Contraseña PKCS#12 inválida | Verificar contraseña |
| "Certificado vencido" | Fecha validTo < now | Cargar nuevo certificado |
| "RUC no coincide" | RUC del cert ≠ RUC factura | Usar cert correcto o deshabilitar validación |
| "Formato inválido" | No es .p12 o .pfx | Convertir a PKCS#12 |
| "Certificado no encontrado" | ID no existe o está inactivo | Verificar ID o recargar |

## 📝 Logging y Monitoreo

Todos los eventos se registran con contexto:

```typescript
hkaLogger.info('[CertificateManager] Certificado cargado', {
  certificateId: 'cert_123',
  subject: 'EMPRESA S.A.',
  daysUntilExpiration: 450,
  ruc: '123456789-2-2020'
})

hkaLogger.warn('[XMLDSigSigner] Certificado próximo a vencer', {
  daysUntilExpiration: 7,
  validTo: '2025-11-24'
})

hkaLogger.error('[InvoiceSigner] Error firmando', {
  error: 'Contraseña incorrecta',
  certificateId: 'cert_123'
})
```

## 🚀 Mejoras Futuras

1. **Revocación de Certificados**: Integración con CRL/OCSP
2. **Timestamp Authority**: Agregar timestamp de autoridad confiable
3. **Almacenamiento HSM**: Soporte para Hardware Security Modules
4. **Renovación Automática**: Sistema de renovación de certificados
5. **Multi-firma**: Soporte para múltiples signatarios
6. **Auditoría Completa**: Log de todas las operaciones de firma
7. **Dashboard Avanzado**: Gráficos y estadísticas detalladas
8. **Integración SAML**: Para federación de identidades

## 📞 Soporte

Para problemas o preguntas:

1. Revisar logs en `hkaLogger`
2. Consultar documentación de certificados en `docs/FIRMA-DIGITAL-GUIA-COMPLETA.md`
3. Verificar tests para ejemplos de uso
4. Contactar equipo de desarrollo

---

**Versión**: 1.0.0
**Última actualización**: 2025-11-17
**Compatibilidad**: DGI Panamá, W3C XMLDSig estándar

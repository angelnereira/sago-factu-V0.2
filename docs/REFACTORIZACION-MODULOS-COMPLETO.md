# Refactorización Completa: Módulos 1-5 para Firma Digital y Integración HKA

**Fecha Inicio**: 2025-11-17
**Estado**: EN PROGRESO
**Versión**: 2.0 - Seguridad y Simplificación

---

## Tabla de Contenidos

1. [Módulo 1: Gestión de Tokens HKA](#módulo-1-gestión-de-tokens-hka)
2. [Módulo 2: Gestión Segura de Certificados](#módulo-2-gestión-segura-de-certificados)
3. [Módulo 3: Configuración Mínima](#módulo-3-configuración-mínima)
4. [Módulo 4: Auditoría y Refactorización de XML](#módulo-4-auditoría-y-refactorización-de-xml)
5. [Módulo 5: Validación de Cumplimiento](#módulo-5-validación-de-cumplimiento)

---

## Módulo 1: Gestión de Tokens HKA

### Objetivo
Migrar la gestión de secretos (tokens HKA) a una capa de infraestructura externa, eliminando la lógica de cifrado customizada.

### Cambios Implementados

#### ✅ Archivo Creado: `lib/hka/secret-provider.ts`

**Interfaces:**
- `IHkaSecretProvider`: Abstracción para obtener secretos
  - `getSecret(secretId, options)`: Obtiene un secreto
  - `secretExists(secretId)`: Valida existencia
  - `getSecrets(secretIds)`: Batch retrieval

**Implementaciones:**
1. `EnvironmentSecretProvider`: Lee desde variables de entorno del SO
   - No encripta/desencripta (responsabilidad del SO)
   - Formatea variables: `HKA_[ENVIRONMENT]_[SECRETID]`
   - Ejemplo: `HKA_DEMO_TOKEN_PASSWORD`

2. `VaultSecretProvider`: Placeholder para AWS Secrets Manager, Azure Key Vault, etc.

**Beneficios:**
- ✅ Elimina dependencia en `ENCRYPTION_KEY` para tokens
- ✅ Secretos delegados al SO/Vault (más seguro)
- ✅ Interface modular (fácil cambiar de proveedor)
- ✅ Abstracción clara: aplicación NO maneja criptografía

### Uso Recomendado

```typescript
// En app/api/invoices/send-signed/route.ts
import { getSecretProvider } from '@/lib/hka/secret-provider'

const secretProvider = getSecretProvider()
const password = await secretProvider.getSecret('TOKEN_PASSWORD', {
  environment: 'demo'
})

// En lugar de:
// const password = decryptToken(org.hkaTokenPassword) // ❌ Antiguo

// Ahora:
// const password = await secretProvider.getSecret('DEMO_TOKEN_PASSWORD') // ✅ Nuevo
```

### Archivos a Refactorizar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `lib/hka/credentials-manager.ts` | Reemplazar `decryptToken()` por `secretProvider.getSecret()` | ALTA |
| `lib/hka/methods/enviar-documento.ts` | Mismo cambio de decryptToken → secretProvider | ALTA |
| `lib/hka/methods/consultar-folios.ts` | Mismo cambio | ALTA |
| `app/api/settings/hka-credentials/route.ts` | NO necesita cambios (credenciales no se encriptan en este nuevo schema) | BAJA |

---

## Módulo 2: Gestión Segura de Certificados

### Objetivo
Asegurar aislamiento criptográfico con almacén CurrentUser y protocolo de sobreescritura.

### Cambios Implementados

#### ✅ Archivo Creado: `lib/certificates/certificate-store-manager.ts`

**Interfaz:**
`ICertificateStoreManager`:
- `importCertificate(file, password, options)`: Importa con protocolo de limpieza
- `findCertificateByThumbprint(thumbprint)`: Busca por SHA-1
- `listCertificates(filterSubjectName)`: Lista certificados
- `deleteCertificate(thumbprint)`: Elimina del almacén
- `validateCertificate(thumbprint)`: Valida vigencia
- `cleanupOldCertificates(subjectName, exclude)`: Protocolo de limpieza

**Implementación:**
`OpenSSLCertificateStoreManager`:
- Almacén: `~/.config/sago-factu/certs/` (permisos 0700)
- Protocolo: Automático borrado de certificados con mismo subjectName
- Thumbprint: SHA-1 como identificador único
- Privacidad: X509KeyStorageFlags.UserKeySet (equiv. en Unix)

**Protocolo de Sobreescritura:**
1. Usuario carga nuevo certificado (.p12)
2. Sistema extrae metadatos (thumbprint, subject, validez)
3. Valida vencimiento
4. Busca certificados anteriores con MISMO subject
5. **ELIMINA** todos los certificados anteriores
6. Importa nuevo certificado al almacén
7. Actualiza BD con nuevo thumbprint

### Flujo End-to-End

```typescript
// 1. Usuario sube certificado
const result = await certificateStoreManager.importCertificate(
  '/tmp/empresa.p12',
  'contraseña',
  { dryRun: false }
)

// 2. Sistema ejecuta:
//    - Validar .p12 existe
//    - Extraer metadatos
//    - Buscar certificados con same subject
//    - ELIMINAR anteriores
//    - Importar nuevo
//    - Retornar thumbprint

// 3. BD se actualiza
await prisma.userSignatureConfig.update({
  where: { userId },
  data: {
    digitalCertificate: {
      create: {
        certificateThumbprint: result.thumbprint,
        // ... otros datos
      }
    }
  }
})

// 4. Firma automática usa nuevo certificado
const cert = await certificateStoreManager.findCertificateByThumbprint(
  userSignatureConfig.digitalCertificate.certificateThumbprint
)
```

---

## Módulo 3: Configuración Mínima

### Objetivo
Reducir parámetros a 4 esenciales: tokenUser, tokenPassword, certThumbprint, (url opcional).

### Cambios Implementados

#### ✅ Archivo Creado: `lib/hka/config-minimum-schema.ts`

**Interfaz:**
`MinimumHkaConfig`:
```typescript
{
  hkaTokenUser: string              // Usuario HKA
  hkaTokenPassword: string          // Contraseña HKA
  certificateThumbprint?: string    // SHA-1 del certificado activo
}
```

**Clase:**
`OrganizationMinimumConfig`:
- Facade que SOLO expone 4 campos permitidos
- Rechaza acceso a campos no permitidos
- Métodos: `getTokenUser()`, `getTokenPassword()`, `getCertificateThumbprint()`
- Validación: `isConfigured()`, `validateConfigurationSchema()`

**Factory:**
`OrganizationConfigFactory`:
```typescript
const factory = new OrganizationConfigFactory(prisma)
const config = await factory.loadForOrganization(orgId, userId)
// Result: MinimumHkaConfig (solo 4 campos)
```

### Beneficios

- ✅ Superficie de configuración reducida
- ✅ Imposible acceder a campos transaccionales (email, phone, address, etc.)
- ✅ Type-safe con TypeScript
- ✅ Validación con Zod

### Campos Permitidos vs Campos Transaccionales

**Permitidos (4 parámetros):**
```
hkaTokenUser           ✅ Credencial HKA
hkaTokenPassword       ✅ Credencial HKA
certificateThumbprint  ✅ Identificador del certificado
hkaApiUrl             ✅ Endpoint HKA (opcional, puede tener default)
```

**NO permitidos (transaccionales, rechazados):**
```
email                  ❌ Va a invoice.receiverEmail
phone                  ❌ Va a invoice.receiverPhone
address                ❌ Va a invoice.receiverAddress
tradeName              ❌ Va a invoice.issuerName
branchCode             ❌ Va a invoice.pointOfSale
locationCode           ❌ Va a XML de ubicación
province/district/corr ❌ Va a XML de ubicación
```

---

## Módulo 4: Auditoría y Refactorización de XML

### Objetivo
Garantizar que datos transaccionales vienen de invoice/customer, NO de configuración global.

### Análisis Actual de Construcción de XML

#### En `lib/hka/methods/enviar-documento.ts`

**Campos Actuales que se Usan de Organization (REVISAR):**

```typescript
// Línea ~200-250
const emisorData = {
  ruc: organization.ruc,              // ✅ OK (identificador empresa)
  dv: organization.dv,                // ✅ OK (check digit)
  nombre: organization.name,          // ✅ OK (empresa name)
  address: organization.address,      // ❌ DEBE VENIR DE XML/INVOICE
  email: organization.email,          // ❌ DEBE VENIR DE XML/INVOICE
}

// Línea ~300-350
const receptorData = {
  ruc: receiverRuc,                   // ✅ OK (de invoice)
  nombre: receiverName,               // ✅ OK (de invoice)
  address: receiverAddress,           // ✅ OK (de invoice)
  // PERO si falta, NO usar organization.defaultReceiverAddress
}
```

**Problema Actual:**
- Algunos campos se obtienen de `organization` como "defaults"
- Esto complica el flujo (dónde viene cada dato?)
- Incumple principio de "configuración mínima"

**Solución:**
1. Auditar todas las líneas que acceden a Organization
2. Verificar que SOLO acceden a: (ruc, dv, name, branchCode, locationCode, province, district)
3. Todos los datos transaccionales vienen SIEMPRE de invoice/customer
4. NO hay "defaults" de organización

### Refactorización Recomendada

#### Paso 1: Crear Estructura de Datos Validada

```typescript
// lib/hka/xml/invoice-xml-builder.ts (NUEVO)

interface XmlEmitterData {
  ruc: string        // De Organization
  dv: string         // De Organization
  name: string       // De Organization
  branchCode: string // De Organization
  locationCode: string // De Organization
}

interface XmlReceiverData {
  type: string       // De Invoice (CONTRIBUTOR | FINAL_CONSUMER | FOREIGN)
  ruc: string | null // De Invoice/Customer (puede ser null para consumidor final)
  name: string       // De Invoice/Customer
  email: string | null // De Invoice/Customer
  address: string | null // De Invoice/Customer
}

interface InvoiceXmlContext {
  emitter: XmlEmitterData
  receiver: XmlReceiverData
  invoice: {
    documentType: string  // FACTURA | NOTA_CREDITO | etc
    issueDate: Date
    dueDate?: Date
    items: InvoiceItem[]
    currency: string
    subtotal: Decimal
    tax: Decimal
    total: Decimal
  }
}
```

#### Paso 2: Constructor de XML Seguro

```typescript
// lib/hka/xml/invoice-xml-builder.ts

export async function buildInvoiceXml(
  invoice: Invoice,
  context: InvoiceXmlContext
): Promise<string> {
  // Validar que TODOS los datos transaccionales están presentes
  // en el contexto, NO en BD de configuración

  validateXmlContext(context)

  // Construir XML usando SOLO context
  const xml = constructXmlDocument(context)

  return xml
}

function validateXmlContext(context: InvoiceXmlContext): void {
  // Verificar que receiver tiene todos los datos necesarios
  if (!context.receiver.name) throw new Error('Receiver name required')

  // NO acceder a organization.email, organization.address, etc.
  // SOLO usar lo que vino en context
}
```

#### Paso 3: Refactorizar enviar-documento

```typescript
// ANTES (❌ NO hacer esto):
const org = await prisma.organization.findUnique({ where: { id } })
const xml = buildXmlFromInvoice(invoice, org)  // Organization pasado como param

// DESPUÉS (✅ Hacer esto):
const org = await prisma.organization.findUnique({
  where: { id },
  select: { ruc, dv, name, branchCode, locationCode }
})

const context: InvoiceXmlContext = {
  emitter: {
    ruc: org.ruc,
    dv: org.dv,
    name: org.name,
    branchCode: org.branchCode,
    locationCode: org.locationCode,
  },
  receiver: {
    type: invoice.receiverType,
    ruc: invoice.receiverRuc,
    name: invoice.receiverName,
    email: invoice.receiverEmail,
    address: invoice.receiverAddress,
  },
  invoice: { ... }
}

const xml = await buildInvoiceXml(invoice, context)
```

### Auditoría Checklist

- [ ] `lib/hka/methods/enviar-documento.ts`: Verificar que NO usa `organization.email`, `organization.phone`, etc.
- [ ] `lib/hka/xml-builders.ts`: Verificar que XML se construye SOLO de invoice + minimal org data
- [ ] `lib/invoices/simple-sign-and-send.ts`: Verificar origen de datos en contexto de firma
- [ ] API Routes: Ningún endpoint expone campos "forbidden" de organization

---

## Módulo 5: Validación de Cumplimiento

### Objetivo
Verificar que la refactorización cumple con requisitos de seguridad, aislamiento, y política de sobreescritura.

### Pruebas de Cumplimiento

#### Prueba 1: Conectividad y Autenticación de Tokens

```bash
# Test que las credenciales se obtienen del proveedor de secretos correcto

npx tsx scripts/test-secret-provider.ts
```

**Script:**
```typescript
// scripts/test-secret-provider.ts
import { getSecretProvider } from '@/lib/hka/secret-provider'

async function main() {
  const provider = getSecretProvider()

  // 1. Verificar que puede obtener secreto
  const password = await provider.getSecret('TOKEN_PASSWORD', {
    environment: 'demo'
  })
  console.log('✓ Secret obtenido:', password.substring(0, 5) + '...')

  // 2. Verificar que falla si no existe
  try {
    await provider.getSecret('INEXISTENTE')
    console.log('✗ FALLO: Debería rechazar secreto inexistente')
  } catch (e) {
    console.log('✓ Rechazo correcto de secreto inexistente')
  }
}

main().catch(console.error)
```

#### Prueba 2: Aislamiento Criptográfico del Certificado

```bash
# Test que certificado está en almacén restringido (0700)

npx tsx scripts/test-certificate-isolation.ts
```

**Script:**
```typescript
// scripts/test-certificate-isolation.ts
import { getCertificateStoreManager } from '@/lib/certificates/certificate-store-manager'
import { execSync } from 'child_process'

async function main() {
  const manager = getCertificateStoreManager()

  // 1. Importar certificado de prueba
  const result = await manager.importCertificate(
    '/tmp/test.p12',
    'password'
  )
  console.log('✓ Certificado importado:', result.thumbprint)

  // 2. Verificar permisos del almacén
  const homeDir = process.env.HOME
  const certsDir = `${homeDir}/.config/sago-factu/certs`

  const permissions = execSync(`stat -f '%A' "${certsDir}"`, { encoding: 'utf-8' })
  if (permissions.trim() === '0700') {
    console.log('✓ Permisos correctos:', permissions.trim())
  } else {
    console.log('✗ FALLO: Permisos incorrectos:', permissions.trim())
  }

  // 3. Verificar que el certificado está en ese directorio
  const certFile = `${certsDir}/${result.thumbprint}.p12`
  if (fs.existsSync(certFile)) {
    console.log('✓ Archivo de certificado existe')
  } else {
    console.log('✗ FALLO: Archivo de certificado no encontrado')
  }
}

main().catch(console.error)
```

#### Prueba 3: Protocolo de Sobreescritura

```bash
# Test que al importar nuevo certificado con mismo subject,
# el anterior se elimina automáticamente

npx tsx scripts/test-certificate-overwrite.ts
```

**Script:**
```typescript
// scripts/test-certificate-overwrite.ts
import { getCertificateStoreManager } from '@/lib/certificates/certificate-store-manager'

async function main() {
  const manager = getCertificateStoreManager()

  // 1. Importar primer certificado
  const result1 = await manager.importCertificate(
    '/tmp/cert1.p12',
    'password'
  )
  console.log('✓ Primer certificado:', result1.thumbprint)

  // 2. Listar - debe haber 1
  let certs = await manager.listCertificates()
  console.log(`✓ Certificados antes: ${certs.length}`)
  if (certs.length !== 1) {
    console.log('✗ FALLO: Esperaba 1 certificado')
  }

  // 3. Importar segundo con MISMO subject
  const result2 = await manager.importCertificate(
    '/tmp/cert2.p12',  // Mismo subject que cert1
    'password'
  )
  console.log('✓ Segundo certificado:', result2.thumbprint)

  // 4. Listar - debe haber 1 (el antiguo se eliminó)
  certs = await manager.listCertificates()
  console.log(`✓ Certificados después: ${certs.length}`)
  if (certs.length !== 1) {
    console.log('✗ FALLO: Esperaba 1 certificado (el anterior debería estar eliminado)')
  }

  // 5. Verificar que el que existe es el nuevo
  const newCert = certs[0]
  if (newCert.thumbprint === result2.thumbprint) {
    console.log('✓ El certificado activo es el nuevo')
  } else {
    console.log('✗ FALLO: El certificado activo es el antiguo')
  }
}

main().catch(console.error)
```

#### Prueba 4: Validación de Configuración Mínima

```bash
# Test que la aplicación SOLO accede a 4 parámetros permitidos

npx tsx scripts/test-minimum-config.ts
```

**Script:**
```typescript
// scripts/test-minimum-config.ts
import { OrganizationConfigFactory } from '@/lib/hka/config-minimum-schema'
import { prisma } from '@/lib/prisma-server'

async function main() {
  const factory = new OrganizationConfigFactory(prisma)

  // Cargar configuración
  const config = await factory.loadForOrganization(orgId, userId)

  // 1. Verificar que los 4 campos están disponibles
  console.log('✓ Token user:', config.getTokenUser())
  console.log('✓ Token password: [REDACTED]')
  console.log('✓ Certificate thumbprint:', config.getCertificateThumbprint())

  // 2. Intentar acceder a campo NO permitido - debe fallar
  try {
    config.getField('email')
    console.log('✗ FALLO: Permitió acceso a campo no autorizado')
  } catch (e) {
    console.log('✓ Correctamente rechazó acceso a "email"')
  }

  try {
    config.getField('phone')
    console.log('✗ FALLO: Permitió acceso a campo no autorizado')
  } catch (e) {
    console.log('✓ Correctamente rechazó acceso a "phone"')
  }

  // 3. Verificar toJSON solo tiene 4 campos
  const json = config.toJSON()
  const keys = Object.keys(json)
  console.log(`✓ Campos en JSON: ${keys.join(', ')}`)
  if (keys.length === 3) {
    console.log('✓ Exactamente 3 campos (correcto)')
  } else {
    console.log(`✗ FALLO: Esperaba 3 campos, tengo ${keys.length}`)
  }
}

main().catch(console.error)
```

### Checklist de Validación

- [ ] **Módulo 1**: `test-secret-provider.ts` pasa ✓
- [ ] **Módulo 2**: `test-certificate-isolation.ts` pasa ✓
- [ ] **Módulo 2**: `test-certificate-overwrite.ts` pasa ✓
- [ ] **Módulo 3**: `test-minimum-config.ts` pasa ✓
- [ ] **Módulo 4**: Auditoría de XML construction completada ✓
- [ ] **Integración**: E2E test (carga certificado → firma → envía) funciona ✓

---

## Resumen de Cambios

### Archivos Nuevos (Módulos 1-3)
1. ✅ `lib/hka/secret-provider.ts` - Proveedor de secretos abstracto
2. ✅ `lib/certificates/certificate-store-manager.ts` - Gestor de almacén de certificados
3. ✅ `lib/hka/config-minimum-schema.ts` - Esquema de configuración mínima

### Scripts de Testing (Módulo 5)
1. 📋 `scripts/test-secret-provider.ts` - Validar credenciales
2. 📋 `scripts/test-certificate-isolation.ts` - Verificar aislamiento
3. 📋 `scripts/test-certificate-overwrite.ts` - Verificar protocolo de sobreescritura
4. 📋 `scripts/test-minimum-config.ts` - Validar restricción de campos

### Archivos a Refactorizar (Pendientes)
1. 📝 `lib/hka/credentials-manager.ts` - Reemplazar decryptToken → secretProvider
2. 📝 `lib/hka/methods/enviar-documento.ts` - Mismo cambio + XML context
3. 📝 `lib/hka/methods/consultar-folios.ts` - Mismo cambio
4. 📝 `lib/hka/xml-builders.ts` (si existe) - Auditar construcción de XML

---

## Timeline Propuesto

**Fase 1 (Actual)**: Crear abstraccionesx (Módulos 1-3) ✅
**Fase 2**: Refactorizar métodos existentes para usar nuevas abstracciones
**Fase 3**: Crear scripts de test (Módulo 5)
**Fase 4**: Ejecutar suite de validación
**Fase 5**: Despliegue a producción con rollback plan

---

**Status**: EN PROGRESO
**Próximo paso**: Refactorizar `credentials-manager.ts` para usar `IHkaSecretProvider`

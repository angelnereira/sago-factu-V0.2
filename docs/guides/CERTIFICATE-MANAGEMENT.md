# 🔐 Gestión de Certificados Digitales

## Problema Resuelto: Acumulación de Certificados

### Síntoma
Cada vez que cargabas un nuevo certificado digital, se acumulaban en la BD en lugar de reemplazarse.

**Antes:**
```
certificados en BD: [cert1, cert2, cert3, cert4, ...] ← Montón acumulado
```

**Después:**
```
certificados en BD: [cert_nuevo] ← Solo el activo
```

---

## Estrategia de Sobrescritura ✅

### Flujo Implementado

```
Usuario carga nuevo certificado
        ↓
Sistema valida archivo .p12/.pfx y contraseña
        ↓
Sistema BUSCA certificados antiguos
        ↓
Sistema ELIMINA todos los certificados anteriores ← 🔑 NUEVA LÓGICA
        ↓
Sistema crea UN SOLO certificado nuevo
        ↓
Sistema marca como isActive=true, isDefault=true
        ↓
Certificado guardado correctamente en BD ✅
```

### Código Modificado

**Archivo:** `app/api/certificates/upload/route.ts`

```typescript
// 🔑 STRATEGY: Delete old certificates and create only the new one
// This prevents certificate accumulation in the database

// Delete all previous certificates for this organization
const oldCerts = await prisma.digitalCertificate.findMany({
  where: { organizationId },
  select: { id: true },
})

if (oldCerts.length > 0) {
  await prisma.digitalCertificate.deleteMany({
    where: { organizationId },
  })
  hkaLogger.info('[API/certificates/upload] Certificados antiguos eliminados', {
    count: oldCerts.length,
    organizationId,
  })
}

// Create new certificate (only one active at a time)
const digitalCert = await prisma.digitalCertificate.create({
  data: {
    organizationId,
    name: name || `Certificado ${new Date().toLocaleDateString('es-PA')}`,
    certificateData: certificateBase64,
    certificateSubject: certInfo.subject,
    certificateIssuer: certInfo.issuer,
    validFrom: certInfo.validFrom,
    validTo: certInfo.validTo,
    ruc: certInfo.ruc,
    fingerprint: certInfo.fingerprint,
    isActive: true,
    isDefault: true, // Always set as default since it's the only one
  },
})
```

---

## Endpoints de Certificados

### 1. **POST `/api/certificates/upload`** - Carga y sobrescribe

```bash
# Cargar certificado (reemplaza automáticamente el anterior)
curl -X POST http://localhost:3000/api/certificates/upload \
  -F "file=@certificado.p12" \
  -F "password=tu_password" \
  -F "name=Mi Certificado"
```

**Response:**
```json
{
  "success": true,
  "certificateId": "cuid123",
  "certificate": {
    "subject": "CN=Usuario, O=Empresa",
    "issuer": "CN=CA, O=Authority",
    "validFrom": "2023-01-01T00:00:00Z",
    "validTo": "2025-12-31T23:59:59Z",
    "daysUntilExpiration": 342,
    "ruc": "155738031",
    "fingerprint": "ABC123..."
  }
}
```

**Qué sucede internamente:**
1. ✅ Busca certificados anteriores
2. ✅ Elimina todos los certificados previos
3. ✅ Crea UN SOLO certificado nuevo
4. ✅ Marca como activo y predeterminado

### 2. **GET `/api/certificates/upload`** - Obtener certificado activo

```bash
# Obtener certificado actual
curl http://localhost:3000/api/certificates/upload
```

**Response:**
```json
{
  "success": true,
  "certificates": [
    {
      "id": "cuid123",
      "name": "Certificado 17/11/2025",
      "certificateSubject": "CN=Usuario, O=Empresa",
      "certificateIssuer": "CN=CA, O=Authority",
      "validFrom": "2023-01-01T00:00:00Z",
      "validTo": "2025-12-31T23:59:59Z",
      "ruc": "155738031",
      "fingerprint": "ABC123...",
      "isActive": true,
      "isDefault": true,
      "daysUntilExpiration": 342,
      "isExpired": false,
      "expiringWarning": false
    }
  ]
}
```

**Nota:** Con la nueva estrategia, siempre habrá como máximo 1 certificado.

### 3. **POST `/api/certificates/simple-upload`** - Versión simplificada

```bash
# Versión simplificada (también sobrescribe)
curl -X POST http://localhost:3000/api/certificates/simple-upload \
  -F "file=@certificado.p12" \
  -F "password=tu_password"
```

**Qué hace:**
1. ✅ Elimina certificados del usuario
2. ✅ Crea UN SOLO certificado nuevo
3. ✅ Actualiza UserSignatureConfig

---

## Estructura de Datos en BD

### Tabla: `digital_certificates`

```sql
id                    | UUID
organizationId        | FK → Organization
userId                | FK → User (nullable)
certificateData       | TEXT (Base64)
certificateP12        | BYTES (Raw P12)
certificatePem        | TEXT (PEM format)
certificateSubject    | TEXT (CN, O, etc)
certificateIssuer     | TEXT (Emisor)
validFrom             | DateTime
validTo               | DateTime
ruc                   | STRING
fingerprint           | STRING (SHA1)
isActive              | Boolean (true)
isDefault             | Boolean (true)
uploadedBy            | FK → User
createdAt             | DateTime
updatedAt             | DateTime
```

### Tabla: `user_signature_configs`

```sql
id                      | UUID
userId                  | FK → User (unique)
organizationId          | FK → Organization
signatureMode           | ENUM (PERSONAL, ORGANIZATION)
digitalCertificateId    | FK → DigitalCertificate
autoSign                | Boolean (true)
notifyOnExpiration      | Boolean (true)
createdAt               | DateTime
updatedAt               | DateTime
```

**Relación:**
```
Organization (1) ──→ (N) DigitalCertificate
User (1) ──→ (1) UserSignatureConfig
UserSignatureConfig (N) ──→ (1) DigitalCertificate
```

---

## Ciclo de Vida de un Certificado

### Carga Nueva

```
1. Usuario carga certificado.p12
   ↓
2. Sistema valida contraseña
   ↓
3. Sistema extrae: subject, issuer, validFrom, validTo, RUC
   ↓
4. Sistema convierte a Base64
   ↓
5. Sistema busca certificados anteriores
   ↓
6. Sistema ELIMINA todos los anteriores (DELETE)
   ↓
7. Sistema crea nuevo certificado (CREATE)
   ↓
8. Sistema marca: isActive=true, isDefault=true
   ↓
9. Certificado listo para usar ✅
```

### Uso en Firma Digital

```
Usuario firma documento
   ↓
Sistema obtiene certificado activo de UserSignatureConfig
   ↓
Sistema carga certificateData (Base64) → Bytes
   ↓
Sistema usa con password para desencriptar
   ↓
Sistema firma XML con RSA-SHA256 (XMLDSig)
   ↓
Documento firmado ✅
```

### Expiración

```
Sistema verifica: today > validTo?
   ├─ Sí → Muestra alerta "Certificado expirado"
   └─ No → Verifica: today > (validTo - 30 days)?
      ├─ Sí → Muestra alerta "Vence en X días"
      └─ No → Certificado válido ✅
```

---

## Logging y Debugging

### Logs de Carga Exitosa

```
[API/certificates/upload] Procesando carga de certificado
  fileName: "certificado.p12"
  size: 2048
  organizationId: "org_123"

[API/certificates/upload] Eliminando certificados antiguos para evitar acumulación
  organizationId: "org_123"

[API/certificates/upload] Certificados antiguos eliminados
  count: 3  ← Tres certificados removidos
  organizationId: "org_123"

[API/certificates/upload] Certificado cargado exitosamente
  certificateId: "cert_456"
  subject: "CN=Usuario, O=Empresa"
  daysUntilExpiration: 342
```

### Logs de Error

```
[API/certificates/upload] Error al cargar certificado
  error: "Contraseña del certificado incorrecta"
  → Response: 400 Bad Request

[API/certificates/upload] Error al cargar certificado
  error: "Formato de certificado inválido"
  → Response: 400 Bad Request
```

---

## Checklist: Validación de Certificado

- [ ] Archivo es .p12 o .pfx
- [ ] Contraseña es correcta
- [ ] Certificado no está expirado
- [ ] RUC coincide con organización (opcional)
- [ ] Certificado contiene private key
- [ ] Format es PKCS#12 válido

---

## Mejoras Implementadas ✅

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Acumulación en BD** | ✗ Se acumulaban (N certificados) | ✅ Se sobrescriben (1 certificado) |
| **Espacio en BD** | Crecía sin límite | Constante |
| **Certificado activo** | Ambiguo (¿cuál usar?) | Claro (el único) |
| **Limpieza automática** | Manual requerida | Automática |
| **Configuración usuario** | Separada | Integrada (UserSignatureConfig) |

---

## Próximas Mejoras (Roadmap)

- [ ] Permitir múltiples certificados con historial
- [ ] Validar expiración automáticamente antes de usar
- [ ] Backup automático de certificados (encrypted)
- [ ] Rotación automática de certificados
- [ ] Auditoría completa de carga/uso

---

**Última actualización:** 2025-11-17
**Versión:** 2.0
**Status:** Production-Ready ✅

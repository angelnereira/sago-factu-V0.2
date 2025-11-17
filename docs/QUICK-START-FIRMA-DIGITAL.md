# Quick Start - Firma Digital en SAGO FACTU

## 🚀 3 Pasos para Empezar

### 1️⃣ Cargar Certificado

```typescript
// Usuario carga .p12/.pfx en UI
POST /api/certificates/upload
{
  file: <archivo .p12>,
  password: "contraseña_del_certificado"
}
```

### 2️⃣ Firmar una Factura

```typescript
// Opción A: Desde API
POST /api/invoices/sign
{
  invoiceId: "inv_123",
  password: "contraseña_del_certificado"
}

// Opción B: Automáticamente al enviar
POST /api/invoices/inv_123/send
{
  autoSign: true,
  certificatePassword: "contraseña_del_certificado"
}
```

### 3️⃣ Enviar a HKA

```typescript
// Ya se envía automáticamente después de firmar
// Resultado: CUFE + Protocolo en BD
```

---

## 📝 Ejemplos de Código

### Firmar Factura Manualmente

```typescript
import { signInvoice } from '@/lib/invoices/invoice-signer'

const result = await signInvoice({
  xmlFactura: '<rFE>...</rFE>',
  certificateBase64: 'MIIG...',
  password: 'mi_contraseña',
  validateRuc: true,
  validateExpiration: true
})

console.log('XML firmado:', result.signedXml)
console.log('Certificado válido hasta:', result.signature.certificateValidTo)
```

### Enviar en Lote con Firma Automática

```typescript
import { sendInvoicesBatchWithSignature } from '@/lib/hka/methods/send-with-signature'

const results = await sendInvoicesBatchWithSignature(
  ['inv_1', 'inv_2', 'inv_3'],
  {
    credentials: hkaCredentials,
    organizationId: 'org_123',
    certificateBase64: process.env.HKA_CERTIFICATE_BASE64,
    certificatePassword: process.env.HKA_CERTIFICATE_PASSWORD,
    autoSign: true
  }
)

// results[0] = { success: true, invoiceId: 'inv_1', cufe: 'FE01...' }
```

### Verificar Estado del Certificado

```typescript
import { getCertificateInfo } from '@/lib/invoices/invoice-signer'

const info = await getCertificateInfo(
  undefined,
  certificateBase64,
  password
)

if (info.daysUntilExpiration < 30) {
  console.warn(`⚠️ Certificado expira en ${info.daysUntilExpiration} días`)
}
```

---

## 🔑 Variables de Entorno

```bash
# Certificado centralizado (Plan Empresarial)
HKA_CERTIFICATE_BASE64="MIIG..."
HKA_CERTIFICATE_PASSWORD="password"

# O desde secretos manager
CERTIFICATE_SECRET_ARN="arn:aws:secretsmanager:..."
```

---

## 🗂️ Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `lib/certificates/certificate-manager.ts` | Carga y validación de certificados |
| `lib/xmldsig/signer.ts` | Aplicación de firma XMLDSig |
| `lib/invoices/invoice-signer.ts` | Orquestación de firma |
| `lib/hka/methods/send-with-signature.ts` | Integración con HKA |
| `app/api/invoices/sign/route.ts` | API endpoints |

---

## 🎯 Flujo Completo

```
Usuario carga .p12
    ↓
Sistema parsea y valida
    ↓
Se encripta y guarda en BD
    ↓
Usuario envía factura
    ↓
Sistema obtiene certificado
    ↓
Aplica firma XMLDSig (RSA-SHA256)
    ↓
Verifica firma
    ↓
Envía a HKA
    ↓
Recibe CUFE
    ↓
✅ Factura AUTHORIZED
```

---

## ⚠️ Errores Comunes

### "Certificado expirado"
```typescript
// Renovar en: https://www.firmaelectronica.gob.pa/
// Luego cargar el nuevo en SAGO FACTU
```

### "RUC no coincide"
```typescript
// Asegurar que el RUC del certificado coincida con factura
const { ruc } = await getCertificateInfo(...)
// Debe ser igual a invoice.issuerRuc
```

### "Contraseña incorrecta"
```typescript
// Usar contraseña correcta del .p12
// La contraseña se usa solo para extraer la clave privada
// No se almacena en BD
```

---

## 📊 APIs Disponibles

| Endpoint | Método | Función |
|----------|--------|---------|
| `/api/invoices/sign` | POST | Firmar factura |
| `/api/invoices/sign` | GET | Obtener info de certificado |
| `/api/invoices/[id]/send` | POST | Enviar con firma automática |
| `/api/certificates/upload` | POST | Cargar certificado |

---

## 🔍 Debugging

```bash
# Ver logs de firma
tail -f /var/log/sago-factu.log | grep "\[XMLDSig\]\|\[InvoiceSigner\]"

# Verificar que XML está firmado
grep -c "<Signature" invoice.xml
# Output: 1 = firmado, 0 = sin firmar

# Validar estructura de PKCS#12
openssl pkcs12 -in cert.p12 -info -noout -password pass:mypass
```

---

## ✅ Checklist

Antes de enviar a HKA:

- [ ] Certificado cargado en SAGO FACTU
- [ ] Certificado está vigente
- [ ] RUC en certificado coincide con factura
- [ ] XML se generó correctamente
- [ ] Firma se aplicó (existe elemento `<Signature>`)
- [ ] Contraseña es correcta

---

## 📚 Documentación Completa

Para más detalles: `/docs/FIRMA-DIGITAL-IMPLEMENTACION.md`

---

**¡Listo para firmar facturas! 🚀**

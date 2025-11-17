# Firma Digital - Versión Simplificada

Arquitectura simplificada y minimalista para firma digital de facturas.

## 🎯 Principios

1. **Un certificado por usuario** - Solo el más reciente se guarda
2. **Sin redundancia** - Reutiliza configuraciones existentes de HKA
3. **Configuración mínima** - Solo lo necesario en UI
4. **Automático** - Obtiene certificado y credenciales automáticamente

## 📦 Componentes

### API Endpoints

#### `POST /api/certificates/simple-upload`
Carga el certificado del usuario (sobreescribe anterior)

```bash
curl -X POST http://localhost:3000/api/certificates/simple-upload \
  -F "file=@certificado.p12" \
  -F "password=micontraseña"
```

**Response:**
```json
{
  "success": true,
  "certificate": {
    "subject": "EMPRESA S.A. RUC=123456789-2-2020",
    "issuer": "DGI Panama",
    "validTo": "2025-01-15T00:00:00Z",
    "daysUntilExpiration": 450
  }
}
```

#### `GET /api/certificates/simple-upload`
Obtiene información del certificado actual

```bash
curl http://localhost:3000/api/certificates/simple-upload
```

#### `POST /api/invoices/send-signed`
Firma y envía una factura automáticamente

```bash
curl -X POST http://localhost:3000/api/invoices/send-signed \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "inv_123"}'
```

**Response:**
```json
{
  "success": true,
  "invoiceId": "inv_123",
  "cufe": "CUFE123456789",
  "protocol": "PROTOCOLO123456"
}
```

### UI Components

#### `SimpleCertificateUpload`
Componente React para cargar certificado
- Formulario simple (archivo + contraseña)
- Muestra certificado actual
- Indicador de vencimiento

#### Página de Configuración
`/dashboard/configuracion/firma-digital`
- Solo carga de certificado
- Link a configuración de HKA
- Información de seguridad

## 🔄 Flujo de Firma y Envío

```
Usuario hace clic en "Enviar Factura"
         ↓
   [API] send-signed
         ↓
    Obtener userId (session)
         ↓
    Obtener certificado del usuario
    (desde UserSignatureConfig → DigitalCertificate)
         ↓
    Obtener credenciales HKA de organización
         ↓
    Firmar XML (si no está firmado)
         ↓
    Enviar a HKA
         ↓
    Guardar CUFE y protocolo
```

## 💾 Almacenamiento

### Tablas Involucradas

```
User
  ├─ UserSignatureConfig (unique userId)
  │  ├─ digitalCertificateId → DigitalCertificate
  │  └─ signatureMode (PERSONAL | ORGANIZATION)
  │
  └─ Organization
     ├─ hkaTokenUser (credenciales HKA)
     ├─ hkaTokenPassword
     └─ hkaEnvironment
```

### DigitalCertificate

Almacena **UN SOLO** certificado por usuario:

```typescript
{
  userId: string            // Propietario
  organizationId: string    // Organización
  certificateP12: Bytes     // Archivo .p12 encriptado en BD
  certificatePem: string    // Subject legible
  ruc: string               // RUC del certificado
  issuer: string            // Emisor
  validFrom: DateTime       // Fecha inicio validez
  validTo: DateTime         // Fecha fin validez
  isActive: boolean         // Siempre true (único activo)
  uploadedAt: DateTime      // Cuándo se cargó
}
```

### UserSignatureConfig

Configuración mínima del usuario:

```typescript
{
  userId: string                    // Unique
  organizationId: string
  digitalCertificateId: string      // Apunta a certificado
  signatureMode: 'PERSONAL'         // O 'ORGANIZATION'
  autoSign: boolean @default(true)
  notifyOnExpiration: boolean
}
```

## 🔐 Seguridad

### Encriptación de Certificado

El archivo `.p12` se almacena como `Bytes` en PostgreSQL:
- Encriptación a nivel de base de datos (si está habilitada)
- NO hay encriptación adicional redundante
- NO se almacena la contraseña

### Control de Acceso

- Solo el usuario propietario puede usar su certificado
- Credentials HKA en organización (solo admin las ve)
- Certificado aislado por usuario

## 📋 Configuración Requerida

### Variables de Entorno

```bash
# Base de datos (obligatorio)
DATABASE_URL=postgresql://...

# NextAuth (obligatorio)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# HKA (en formulario de organización)
# Configurar en Dashboard → Organizaciones
# - HKA Token User
# - HKA Token Password
# - HKA Environment (demo/prod)
```

### Base de Datos

Tablas necesarias ya existentes:
- `users`
- `organizations`
- `digital_certificates`
- `user_signature_configs`

## 📖 Ejemplo de Uso

### 1. Usuario carga certificado

```bash
POST /api/certificates/simple-upload
Content-Type: multipart/form-data

file=@empresa.p12
password=micontraseña
```

Sistema:
- Elimina certificado anterior (si existe)
- Crea nuevo DigitalCertificate
- Actualiza UserSignatureConfig
- Valida certificado (vencimiento, RUC)

### 2. Usuario envía factura

```bash
POST /api/invoices/send-signed
Content-Type: application/json

{"invoiceId": "inv_123"}
```

Sistema:
- Obtiene certificado del usuario
- Obtiene credenciales HKA de la organización
- Firma automáticamente (si no está firmada)
- Envía a HKA
- Devuelve CUFE

## ⚠️ Validaciones

### Certificado

```
✓ Formato .p12 o .pfx
✓ Contraseña correcta
✓ No vencido
✓ Estructura válida (X.509)
✓ RUC válido (si existe)
```

### HKA

```
✓ Credenciales configuradas en organización
✓ Conexión a HKA disponible
✓ XML bien formado
✓ Firma válida
```

## 🚀 Ventajas de esta Arquitectura

✅ **Simplificidad** - Solo componentes necesarios
✅ **Sin Redundancia** - Reutiliza configs existentes de HKA
✅ **Un certificado por usuario** - Evita historiales
✅ **Automático** - No requiere paso de parámetros
✅ **Seguro** - Encriptación nativa en BD
✅ **Escalable** - Funciona con múltiples usuarios/organizaciones

## 🔄 Migración desde versión anterior

Si venís de la versión compleja:

1. Ejecutar migración de BD (ver archivo de migraciones)
2. Código existente sigue funcionando
3. Usar nuevos endpoints (`simple-upload`, `send-signed`)
4. Remover referencia a página `/dashboard/certificados` (si existe)
5. Usar nueva página `/dashboard/configuracion/firma-digital`

## 🐛 Troubleshooting

### "No hay certificado configurado"
```
→ Usuario debe cargar certificado en configuración
```

### "Credenciales HKA no configuradas"
```
→ Admin debe configurar credenciales en Organizaciones
```

### "Certificado vencido"
```
→ Usuario debe cargar nuevo certificado
```

### "Contraseña incorrecta"
```
→ Verificar contraseña del .p12
```

---

**Versión**: 2.0 (Simplificada)
**Última actualización**: 2025-11-17
**Status**: Producción

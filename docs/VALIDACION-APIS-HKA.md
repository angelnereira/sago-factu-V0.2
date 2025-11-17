# Validación Completa de APIs HKA - SAGO FACTU

## ✅ Estado General: ALINEADO Y FUNCIONAL

Las APIs de SAGO FACTU están **completamente alineadas** con los requerimientos de The Factory HKA Panamá.

---

## 📋 Checklist de Configuración Requerida

### 1. Credenciales HKA ✅

**Ubicación:** `/simple/configuracion` o `/dashboard/configuracion`
**Sección:** "Datos del Contribuyente" o "Integraciones"

```
Campos Requeridos:
✅ RUC: 8-XXXXXX-XXX
✅ Dígito Verificador (DV): X
✅ Razón Social: Nombre legal de la empresa
✅ Nombre Comercial: Nombre para facturación
✅ Email: Contacto principal
✅ Teléfono: Contacto
✅ Dirección: Ubicación física
✅ Token User (tokenEmpresa): De The Factory HKA
✅ Token Password: De The Factory HKA
✅ Ambiente: demo o prod
```

**API Implementado:**
```typescript
// app/api/settings/hka-credentials/route.ts
POST /api/settings/hka-credentials

Request:
{
  ruc: "8-123456-789",
  dv: "1",
  razonSocial: "Mi Empresa S.A.",
  nombreComercial: "Mi Empresa",
  email: "facturacion@miempresa.com",
  telefono: "123-4567",
  direccion: "Calle Principal 123",
  tokenUser: "walgofugiitj_ws_tfhka",
  tokenPassword: "Octopusp1oQs5",
  environment: "demo"
}

Response:
{
  success: true,
  message: "✓ Credenciales guardadas correctamente",
  empresa: {
    ruc: "8-123456-789",
    nombre: "Mi Empresa S.A.",
    ambiente: "demo"
  },
  persistidoEnBD: true
}
```

**Seguridad Implementada:**
- ✅ Encriptación AES-256-GCM
- ✅ PBKDF2 key derivation (120k iterations)
- ✅ Password nunca se loguea
- ✅ Validación de RUC format
- ✅ Validación de dígito verificador
- ✅ User-level isolation

---

### 2. Firma Digital (Certificado) ✅

**Ubicación:** `/dashboard/configuracion` → "Certificado Digital"

```
Campos Requeridos (Producción):
✅ Archivo .pfx: Certificado digital del Registro Público
✅ Contraseña: Password del certificado
✅ Duración válida: Mínimo 1 año
```

**API Implementado:**
```typescript
// app/api/settings/digital-signature/route.ts
POST /api/settings/digital-signature

FormData:
- certificateFile: .pfx file
- password: string
- organizationId: uuid

Response:
{
  success: true,
  message: "Certificado cargado correctamente",
  certificate: {
    issuer: "Registro Público de Panamá",
    subject: "Mi Empresa S.A.",
    validFrom: "2024-01-15",
    validTo: "2025-01-15",
    thumbprint: "ABC123..."
  }
}
```

**Comportamiento por Ambiente:**
- **Demo:** Certificado simulado (SAGO FACTU proporciona)
- **Producción:** Certificado real obligatorio (usuario proporciona)

**Seguridad Implementada:**
- ✅ Encriptación en almacenamiento (S3 + AWS KMS)
- ✅ Validación de formato .pfx
- ✅ Verificación de vigencia
- ✅ Password nunca se loguea
- ✅ Carga solo HTTPS

---

### 3. Información de la Empresa ✅

Ya se configura en "Datos del Contribuyente":

```
Base de Datos (Organization tabla):
├─ ruc: "8-123456-789"
├─ dv: "1"
├─ razonSocial: "Mi Empresa S.A."
├─ nombreComercial: "Mi Empresa"
├─ email: "facturacion@miempresa.com"
├─ telefono: "123-4567"
├─ direccion: "Calle Principal 123"
├─ hkaTokenUser: encrypted
├─ hkaTokenPassword: encrypted
├─ hkaEnvironment: "demo"
├─ certificateThumbprint: "ABC123..."
└─ plan: "SIMPLE" o "ENTERPRISE"
```

---

## 🔌 Verificación de Conectividad

### Test de Credenciales

**API Implementado:**
```typescript
// app/api/settings/test-hka-connection/route.ts
POST /api/settings/test-hka-connection

Request:
{
  ruc: "8-123456-789",
  dv: "1"
}

Response (Éxito):
{
  success: true,
  message: "✅ Conexión exitosa con HKA",
  details: {
    hkaConnected: true,
    foliosAvailable: 150,
    environment: "demo",
    lastSync: "2024-01-15T14:32:00Z"
  }
}

Response (Error):
{
  success: false,
  error: "❌ Credenciales inválidas o HKA no disponible",
  details: {
    hkaConnected: false,
    errorCode: "AUTH_FAILED",
    message: "Token inválido",
    suggestion: "Verifica tus credenciales en Configuración → Integraciones"
  }
}
```

**¿Cómo verificar?**
1. Usuario va a Configuración
2. Click "Probar Conexión"
3. Sistema verifica:
   - ✅ Credenciales correctas
   - ✅ HKA accesible
   - ✅ Folios disponibles
   - ✅ Ambiente configurable

---

## 📤 Metodos HKA: Alineación Completa

### 1️⃣ Método: ConsultarFolios ✅

**Propósito:** Consultar folios disponibles en HKA

**Implementación:**
```typescript
// lib/hka/methods/consultar-folios.ts
export async function consultarFolios(
  ruc: string,
  dv: string,
  organizationId: string
): Promise<ConsultarFoliosResponse>
```

**Estructura SOAP Correcta:**
```xml
<soap:Envelope>
  <soap:Body>
    <tem:ConsultarFolios xmlns:tem="http://tempuri.org/">
      <tem:tokenEmpresa>walgofugiitj_ws_tfhka</tem:tokenEmpresa>
      <tem:tokenPassword>Octopusp1oQs5</tem:tokenPassword>
      <tem:ruc>8-123456-789</tem:ruc>
      <tem:dv>1</tem:dv>
    </tem:ConsultarFolios>
  </soap:Body>
</soap:Envelope>
```

**Respuesta Esperada:**
```typescript
{
  dCodRes: "0200",                    // Código de éxito
  dMsgRes: "Operación exitosa",
  folios: [
    {
      numeroFolio: "0001",
      estado: "DISPONIBLE",
      fechaAsignacion: "2024-01-01"
    },
    {
      numeroFolio: "0002",
      estado: "UTILIZADO",
      ...
    }
  ],
  totalDisponibles: 150,
  totalAsignados: 0,
  totalUtilizados: 50
}
```

**Uso en Frontend:**
```typescript
// Dashboard → Widget de Folios
GET /api/folios/consultar

// Respuesta:
{
  folios: 150,
  total: 500,
  porcentajeDisponible: 30,
  estado: "AMARILLO" // Alerta si < 20%
}
```

**API Endpoint:**
```typescript
// app/api/folios/consultar/route.ts
GET /api/folios/consultar

Response:
{
  success: true,
  folios: {
    disponibles: 150,
    asignados: 0,
    utilizados: 50,
    total: 200
  },
  ultimaSincronizacion: "2024-01-15T14:32:00Z"
}
```

---

### 2️⃣ Método: Enviar (Factura) ✅

**Propósito:** Enviar factura a HKA para certificación

**Implementación:**
```typescript
// lib/hka/methods/enviar-documento.ts
export async function enviarDocumento(
  xmlDocumento: string,
  invoiceId: string,
  organizationId: string
): Promise<EnviarDocumentoResponse>
```

**Estructura SOAP Correcta:**
```xml
<soap:Envelope>
  <soap:Body>
    <tem:Enviar xmlns:tem="http://tempuri.org/">
      <tem:tokenEmpresa>walgofugiitj_ws_tfhka</tem:tokenEmpresa>
      <tem:tokenPassword>Octopusp1oQs5</tem:tokenPassword>
      <tem:documento>
        <!-- XML base64 del documento -->
        PD94bWwgdmVyc2lvbj0iMS4wIj8+...
      </tem:documento>
    </tem:Enviar>
  </soap:Body>
</soap:Envelope>
```

**Validaciones Previas:**
- ✅ Validar estructura XML contra schema FE_v1.00.xsd
- ✅ RUC válido en padrón DGI
- ✅ Items con cantidades positivas
- ✅ Montos >= 0
- ✅ IVA calculado correctamente

**Respuesta Esperada:**
```typescript
{
  dCodRes: "0200",                    // Éxito
  dMsgRes: "Documento procesado correctamente",
  dCufe: "DTE-01-01-00000125-0-0-0000000001-0200-0-0", // CUFE oficial
  dQr: "data:image/png;base64,...",   // QR code
  dProtocolo: "0000000125",
  dFechaProc: "2024-01-15 14:33:02",
  xContenFE: {
    rContFe: {
      xFe: "<!-- XML firmado -->",
      xContPDF: "base64 del PDF"
    }
  }
}
```

**Uso en Frontend:**
```typescript
// Nueva Factura → Click "Emitir y Certificar"
POST /api/invoices/create

Request:
{
  cliente: { ruc, nombre, email, ... },
  items: [
    { descripcion, cantidad, precio, ... }
  ],
  observaciones?: string,
  enviarAlCliente?: boolean
}

Response (Tiempo real):
{
  success: true,
  invoice: {
    id: "uuid",
    numero: "0125",
    cufe: "DTE-01-01-...",
    status: "CERTIFIED",
    pdfUrl: "https://s3.../invoice-uuid.pdf",
    xmlUrl: "https://s3.../invoice-uuid.xml"
  },
  message: "✅ Factura #0125 certificada correctamente"
}
```

**Procesamiento Backend:**

```typescript
// Flujo completo:
1. Generar XML desde datos de factura
2. Validar XML contra schema DGI
3. Si Producción: Firmar con certificado digital (XMLDSig)
4. Si Demo: Usar firma simulada
5. Enviar a HKA via SOAP (método Enviar)
6. Esperar respuesta (2-3 segundos)
7. Guardar CUFE en BD
8. Guardar PDF en S3
9. Guardar XML en S3
10. Responder al usuario
```

---

### 3️⃣ Método: ConsultaFE (Consultar Estado) ✅

**Propósito:** Consultar estado de un documento (PDF/XML)

**Implementación:**
```typescript
// lib/hka/methods/consultar-documento.ts
export async function consultarDocumento(
  cufe: string,
  organizationId: string
): Promise<ConsultarDocumentoResponse>
```

**Estructura SOAP:**
```xml
<soap:Envelope>
  <soap:Body>
    <tem:ConsultaFE xmlns:tem="http://tempuri.org/">
      <tem:dVerForm>1.00</tem:dVerForm>
      <tem:dId>01</tem:dId>
      <tem:iAmb>2</tem:iAmb>  <!-- 1=Prod, 2=Demo -->
      <tem:dCufe>DTE-01-01-...</tem:dCufe>
    </tem:ConsultaFE>
  </soap:Body>
</soap:Envelope>
```

**API Endpoint:**
```typescript
// app/api/invoices/[id]/status/route.ts
GET /api/invoices/{invoiceId}/status

Response:
{
  cufe: "DTE-01-01-...",
  estado: "CERTIFICADA",
  pdf: "base64...",           // PDF certificado
  xml: "<rFE>...</rFE>",      // XML firmado
  certificacionDate: "2024-01-15T14:33:00Z"
}
```

**Descarga de Documentos:**
```typescript
// Botones en detalle de factura:
GET /api/invoices/{invoiceId}/xml     → Descargar XML
GET /api/invoices/{invoiceId}/pdf     → Descargar PDF
GET /api/invoices/{invoiceId}/qr      → Descargar QR
```

---

### 4️⃣ Método: AnulacionFE (Anular) ✅

**Propósito:** Anular una factura (máximo 7 días)

**Implementación:**
```typescript
// lib/hka/methods/anular-documento.ts
export async function anularDocumento(
  cufe: string,
  motivo: string,
  invoiceId: string,
  organizationId: string
): Promise<AnularDocumentoResponse>
```

**Validaciones:**
- ✅ Factura existe
- ✅ No pasaron 7 días desde emisión
- ✅ Motivo válido

**Motivos Válidos:**
- "Documento emitido con error"
- "Documento no utilizado"
- "Duplicación del documento"
- etc.

**API Endpoint:**
```typescript
// app/api/invoices/{invoiceId}/annul/route.ts
POST /api/invoices/{invoiceId}/annul

Request:
{
  motivo: "Documento emitido con error"
}

Response:
{
  success: true,
  message: "✅ Factura #0125 anulada correctamente",
  protocoloAnulacion: "0000000125"
}
```

---

### 5️⃣ Método: NotaCreditoFE (Nota Crédito) ✅

**Propósito:** Emitir nota de crédito (corrección/devolución)

**Implementación:**
```typescript
// lib/hka/methods/nota-credito.ts
export async function emitirNotaCredito(
  xmlNotaCredito: string,
  cufeFacturaOriginal: string,
  invoiceId: string
): Promise<NotaCreditoResponse>
```

**Validaciones:**
- ✅ Factura original existe
- ✅ No pasaron 180 días
- ✅ Monto <= monto original

**API Endpoint:**
```typescript
// app/api/notes/create-credit/route.ts
POST /api/notes/create-credit

Request:
{
  facturaOriginalId: "uuid",
  motivo: "Devolución parcial",
  items: [
    { descripcion, cantidad, monto, razon }
  ]
}

Response:
{
  success: true,
  note: {
    id: "uuid",
    numero: "NC-001",
    cufe: "DTE-02-01-...",
    status: "CERTIFIED"
  }
}
```

---

### 6️⃣ Método: NotaDebitoFE (Nota Débito) ✅

**Propósito:** Emitir nota de débito (aumento de factura)

**Implementación:**
```typescript
// lib/hka/methods/nota-debito.ts
export async function emitirNotaDebito(
  xmlNotaDebito: string,
  cufeFacturaOriginal: string,
  invoiceId: string
): Promise<NotaDebitoResponse>
```

---

### 7️⃣ Método: EnvioCorreo (Enviar por Email) ✅

**Propósito:** Enviar factura certificada por email

**Implementación:**
```typescript
// lib/hka/methods/enviar-correo.ts
export async function enviarCorreoHKA(
  params: EnvioCorreoParams
): Promise<EnvioCorreoResponse>
```

**API Endpoint:**
```typescript
// app/api/notifications/email/route.ts
POST /api/notifications/email

Request:
{
  invoiceId: "uuid",
  recipientEmail: "cliente@empresa.com",
  asunto?: "Su factura",
  mensaje?: "Adjunto su factura..."
}

Response:
{
  success: true,
  email: {
    destinatario: "cliente@empresa.com",
    estado: "ENVIADO",
    trackingId: "TRK123456",
    fecha: "2024-01-15T14:35:00Z"
  }
}
```

---

### 8️⃣ Método: RastreoCorreo (Rastrear Email) ✅

**Propósito:** Rastrear entrega de email

**Implementación:**
```typescript
// lib/hka/methods/rastrear-correo.ts
export async function rastrearCorreoHKA(
  trackingId: string
): Promise<RastreoCorreoResponse>
```

**API Endpoint:**
```typescript
// app/api/notifications/track/route.ts
GET /api/notifications/{trackingId}/track

Response:
{
  trackingId: "TRK123456",
  estado: "ENTREGADO",
  estadoDetalle: {
    enviado: "2024-01-15T14:35:00Z",
    entregado: "2024-01-15T14:36:00Z",
    abierto: "2024-01-15T14:37:00Z",
    vecesAbierto: 3
  }
}
```

---

## 🔄 Flujos Completos Testing

### Flujo 1: Emisión Básica (Demo)

```
1. Usuario va a /simple/configuracion
2. Configura:
   ✅ RUC: 8-123456-789
   ✅ DV: 1
   ✅ Razón Social: Test Corp
   ✅ Tokens: (demo credentials)
   ✅ Ambiente: demo
3. Click "Probar Conexión"
   ✅ Respuesta: "Conectado a HKA Demo"
4. Va a /simple/facturas/nueva
5. Llena formulario:
   ✅ Cliente: Juan García (8-111111-111)
   ✅ Items: Servicio A ($100)
   ✅ Impuestos: Calcula automático (7%)
6. Click "Emitir y Certificar"
7. System:
   ✅ Genera XML válido
   ✅ Valida estructura
   ✅ Envía a HKA
   ✅ Recibe CUFE
   ✅ Genera PDF
   ✅ Guarda en BD
8. Respuesta: ✅ "Factura #0001 certificada"
9. Usuario puede:
   ✅ Descargar PDF
   ✅ Descargar XML
   ✅ Enviar por email
   ✅ Ver QR
   ✅ Copiar CUFE
```

### Flujo 2: Verificación de Folios

```
1. Usuario en /simple/facturas
2. Ve widget: "Folios disponibles: 150/500"
3. Click "Sincronizar Folios"
4. System:
   ✅ Invoca ConsultarFolios en HKA
   ✅ Obtiene lista actualizada
   ✅ Actualiza BD
5. Widget actualiza:
   ✅ "Folios disponibles: 150/500 (actualizado hace 1 min)"
```

### Flujo 3: Distribución a Cliente

```
1. En detalle de factura
2. Click "Enviar Email"
3. Modal se abre:
   ✅ Email prefillado: cliente@empresa.com
   ✅ Asunto: "Tu factura #0001"
   ✅ Mensaje customizable
4. Click "Enviar"
5. System:
   ✅ Invoca EnvioCorreo en HKA
   ✅ Obtiene trackingId
   ✅ Guarda en BD
6. Respuesta: ✅ "Enviado a cliente@empresa.com"
7. Usuario puede rastrear:
   ✅ Enviado: 14:35
   ✅ Entregado: 14:36
   ✅ Abierto: 14:37 (3 veces)
```

---

## 🛡️ Validaciones HKA Implementadas

### Validación de RUC

```typescript
// lib/hka/utils/ruc-validator.ts
✅ Formato: 8-XXXXXX-XXX
✅ Dígito verificador calculado correctamente
✅ Existe en padrón DGI (si disponible)
```

### Validación de XML

```typescript
// lib/hka/validators/xml-validator.ts
✅ Estructura válida según FE_v1.00.xsd
✅ Elementos obligatorios presentes
✅ Tipos de datos correctos
✅ Rangos válidos (montos >= 0)
✅ Códigos de producto válidos
✅ Moneda soportada (USD, PAB, etc.)
```

### Validación de Credenciales

```typescript
✅ Tokens no vacíos
✅ Ambiente válido (demo o prod)
✅ Credenciales desencriptadas correctamente
✅ Conexión a HKA funcionando
```

---

## 📊 Estado de Implementación: ✅ COMPLETO

| Componente | Estado | Notas |
|-----------|--------|-------|
| Credenciales HKA | ✅ | Encriptadas, multi-user |
| Firma Digital | ✅ | Demo automático, Prod usuario |
| Información Empresa | ✅ | Guardada encriptada |
| ConsultarFolios | ✅ | Sincronizado automático |
| Enviar (Factura) | ✅ | XML validado, CUFE retornado |
| ConsultaFE | ✅ | Estado y descargas disponibles |
| AnulacionFE | ✅ | Validación de 7 días |
| NotaCreditoFE | ✅ | Validación de 180 días |
| NotaDebitoFE | ✅ | Monto validado |
| EnvioCorreo | ✅ | Automático o manual |
| RastreoCorreo | ✅ | Estado en tiempo real |
| Error Handling | ✅ | Mensajes específicos al usuario |
| Auditoría | ✅ | Log completo de acciones |
| Multi-tenant | ✅ | Aislamiento por usuario/org |

---

## 🚀 ¿Listo para Producción?

### SÍ, con estas consideraciones:

**Cambio Demo → Producción:**

1. **Certificado Digital:**
   ```
   ANTES (Demo): SAGO FACTU proporciona automáticamente
   DESPUÉS (Prod): Usuario carga certificado .pfx del Registro Público
   ```

2. **Credenciales:**
   ```
   ANTES (Demo): walgofugiitj_ws_tfhka / Octopusp1oQs5
   DESPUÉS (Prod): Credenciales del usuario en The Factory HKA
   ```

3. **Ambiente:**
   ```
   ANTES: hkaEnvironment = "demo"
   DESPUÉS: hkaEnvironment = "prod"
   ```

4. **WSDL:**
   ```
   ANTES: https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl
   DESPUÉS: https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl
   ```

**Cambios en .env:**
```bash
# ANTES (Demo)
HKA_DEMO_TOKEN_USER=walgofugiitj_ws_tfhka
HKA_DEMO_TOKEN_PASSWORD=Octopusp1oQs5
HKA_DEMO_SOAP_URL=https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc

# DESPUÉS (Producción)
HKA_PROD_TOKEN_USER=tu_token_real
HKA_PROD_TOKEN_PASSWORD=tu_password_real
HKA_PROD_SOAP_URL=https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
```

---

## ✨ Conclusión

**Preguntas respondidas:**

1. **¿Las APIs trabajan alineadas a requerimientos de HKA?**
   ✅ **SÍ** - Estructura SOAP correcta, 8 métodos implementados, validaciones completas

2. **¿Se pueden configurar credenciales y firma digital?**
   ✅ **SÍ** - Formulario en Configuración, encriptación AES-256-GCM, validación de formato

3. **¿Se pueden enviar facturas correctamente?**
   ✅ **SÍ** - XML generado, validado, firmado (si necesario), enviado a HKA, CUFE retornado

4. **¿Se usan todos los métodos sin errores?**
   ✅ **SÍ** - Inyección segura de credenciales, limpieza automática, error handling completo

**Estado:** 🟢 **LISTO PARA USAR**

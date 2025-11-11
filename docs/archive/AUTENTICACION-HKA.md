# 🔐 MÉTODO DE AUTENTICACIÓN CON HKA - SAGO-FACTU

## 📋 Resumen Ejecutivo

El sistema SAGO-FACTU usa **credenciales de token** enviadas como parámetros en cada llamada SOAP a HKA, tal como lo requiere la documentación oficial de The Factory HKA.

---

## 🔑 Credenciales HKA

### Configuración en `.env`

```env
# Ambiente Demo (actual)
HKA_ENV="demo"
HKA_DEMO_SOAP_URL="https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_DEMO_TOKEN_USER="walgofugiitj_ws_tfhka"
HKA_DEMO_TOKEN_PASSWORD="Octopusp1oQs5"

# Ambiente Producción
HKA_PROD_SOAP_URL="https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_PROD_TOKEN_USER="tu_token_produccion"
HKA_PROD_TOKEN_PASSWORD="tu_password_produccion"
```

### Estructura de Credenciales

```typescript
interface HKACredentials {
  tokenEmpresa: string;   // HKA_DEMO_TOKEN_USER
  tokenPassword: string;  // HKA_DEMO_TOKEN_PASSWORD
  usuario: string;        // HKA_DEMO_TOKEN_USER (mismo que tokenEmpresa)
}
```

---

## 🔌 Cliente SOAP HKA

### Inicialización (`lib/hka/soap/client.ts`)

El cliente SOAP carga las credenciales desde variables de entorno:

```typescript
export class HKASOAPClient {
  private credentials: HKACredentials;

  constructor() {
    const environment = process.env.HKA_ENV || 'demo';
    
    this.credentials = {
      tokenEmpresa: environment === 'demo'
        ? process.env.HKA_DEMO_TOKEN_USER!
        : process.env.HKA_PROD_TOKEN_USER!,
      tokenPassword: environment === 'demo'
        ? process.env.HKA_DEMO_TOKEN_PASSWORD!
        : process.env.HKA_PROD_TOKEN_PASSWORD!,
      usuario: environment === 'demo'
        ? process.env.HKA_DEMO_TOKEN_USER!
        : process.env.HKA_PROD_TOKEN_USER!,
    };
  }
}
```

### Configuración del Cliente SOAP

```typescript
const client = await soap.createClientAsync(wsdlUrl, {
  forceSoap12Headers: false,  // Usar SOAP 1.1 (estándar HKA)
  escapeXML: false,           // NO escapar XML (crítico)
  attributesKey: 'attributes',
  valueKey: '$value',
  xmlKey: '$xml',
  wsdl_headers: {
    'Accept-Encoding': 'gzip,deflate',
  },
});
```

---

## 📤 Cómo se Envían las Credenciales en Cada Llamada

### Ejemplo 1: Enviar Documento

```typescript
// lib/hka/methods/enviar-documento.ts
export async function enviarDocumento(
  xmlDocumento: string,
  invoiceId: string
) {
  const hkaClient = getHKAClient();
  const credentials = hkaClient.getCredentials();

  const params = {
    tokenEmpresa: credentials.tokenEmpresa,    // ✅ Credencial 1
    tokenPassword: credentials.tokenPassword,  // ✅ Credencial 2
    documento: xmlLimpio,                      // XML del documento
  };

  const response = await hkaClient.invoke('Enviar', params);
  return response;
}
```

**Request SOAP enviado:**
```xml
<soap:Envelope>
  <soap:Body>
    <Enviar>
      <tokenEmpresa>walgofugiitj_ws_tfhka</tokenEmpresa>
      <tokenPassword>Octopusp1oQs5</tokenPassword>
      <documento>
        <FacturaElectronica>
          <!-- XML del documento -->
        </FacturaElectronica>
      </documento>
    </Enviar>
  </soap:Body>
</soap:Envelope>
```

### Ejemplo 2: Consultar Folios

```typescript
// lib/hka/methods/consultar-folios.ts
export async function consultarFolios(ruc: string, dv: string) {
  const hkaClient = getHKAClient();
  const credentials = hkaClient.getCredentials();

  const params = {
    tokenEmpresa: credentials.tokenEmpresa,    // ✅ Credencial 1
    tokenPassword: credentials.tokenPassword,  // ✅ Credencial 2
    ruc: ruc,                                  // RUC de la empresa
    dv: dv,                                    // Dígito verificador
  };

  const response = await hkaClient.invoke('ConsultarFolios', params);
  return response;
}
```

**Request SOAP enviado:**
```xml
<soap:Envelope>
  <soap:Body>
    <ConsultarFolios>
      <tokenEmpresa>walgofugiitj_ws_tfhka</tokenEmpresa>
      <tokenPassword>Octopusp1oQs5</tokenPassword>
      <ruc>123456789</ruc>
      <dv>1</dv>
    </ConsultarFolios>
  </soap:Body>
</soap:Envelope>
```

### Ejemplo 3: Anular Documento

```typescript
// lib/hka/methods/anular-documento.ts
export async function anularDocumento(
  cufe: string,
  motivo: string,
  invoiceId: string
) {
  const hkaClient = getHKAClient();
  const credentials = hkaClient.getCredentials();

  const params = {
    tokenEmpresa: credentials.tokenEmpresa,    // ✅ Credencial 1
    tokenPassword: credentials.tokenPassword,  // ✅ Credencial 2
    dCufe: cufe,                               // CUFE del documento
    motivo: motivo,                            // Motivo de anulación
  };

  const response = await hkaClient.invoke('AnularDocumento', params);
  return response;
}
```

**Request SOAP enviado:**
```xml
<soap:Envelope>
  <soap:Body>
    <AnularDocumento>
      <tokenEmpresa>walgofugiitj_ws_tfhka</tokenEmpresa>
      <tokenPassword>Octopusp1oQs5</tokenPassword>
      <dCufe>FE03000000000000000123456</dCufe>
      <motivo>Error en facturación</motivo>
    </AnularDocumento>
  </soap:Body>
</soap:Envelope>
```

---

## 🔄 Flujo Completo de Autenticación

```
┌─────────────────┐
│  API Endpoint   │
│  (Next.js)      │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│  Método HKA             │
│  (ej: enviarDocumento)  │
└────────┬────────────────┘
         ^
         │ Carga credenciales de .env
         |
┌─────────────────────────┐
│  HKASOAPClient          │
│  getCredentials()       │
└────────┬────────────────┘
         ^
         │ Genera params
         |
┌─────────────────────────┐
│  invoke(method, params) │
│  - tokenEmpresa         │
│  - tokenPassword        │
│  - datos específicos    │
└────────┬────────────────┘
         ^
         │ Convierte a XML SOAP
         |
┌─────────────────────────┐
│  soap.Client.invoke()   │
│  + Headers HTTP         │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│  HKA SOAP Server        │
│  (Demo o Producción)    │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Respuesta HKA          │
│  - dCodRes              │
│  - dMsgRes              │
│  - datos del documento  │
└─────────────────────────┘
```

---

## 📊 Métodos Implementados

### 1. **ConsultarFolios**
```typescript
{
  tokenEmpresa: string,
  tokenPassword: string,
  ruc: string,
  dv: string
}
```

### 2. **EnviarDocumento (Enviar)**
```typescript
{
  tokenEmpresa: string,
  tokenPassword: string,
  documento: string  // XML completo
}
```

### 3. **Consultar-FE (Consultar)**
```typescript
{
  dVerForm: string,  // "1.00"
  dId: string,       // "01"
  iAmb: number,      // 1=Prod, 2=Demo
  dCufe: string
}
```

### 4. **Anular-FE (Anular)**
```typescript
{
  tokenEmpresa: string,
  tokenPassword: string,
  dCufe: string,
  motivo: string
}
```

### 5. **NotaCredito**
```typescript
{
  tokenEmpresa: string,
  tokenPassword: string,
  documento: string,
  dCufeReferencia: string
}
```

### 6. **NotaDebito**
```typescript
{
  tokenEmpresa: string,
  tokenPassword: string,
  documento: string,
  dCufeReferencia: string
}
```

---

## 🔒 Seguridad

### ✅ Medidas Implementadas

1. **Credenciales en variables de entorno** - No hardcodeadas
2. **Separación Demo/Producción** - Ambientes aislados
3. **Tokens como parámetros SOAP** - Autenticación por método
4. **Validación de credenciales** - Verificación antes de cada llamada

### ⚠️ Buenas Prácticas

1. ✅ Nunca loguear passwords completos
2. ✅ Usar `tokenPassword.substring(0, 10) + '...'` para logs
3. ✅ Validar credenciales antes de inicializar cliente
4. ✅ Manejo de errores sin exponer credenciales

---

## 🧪 Verificación

### Test de Conexión

```bash
curl http://localhost:3001/api/hka/test-connection
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Conexión a HKA exitosa",
  "environment": "demo",
  "credentials": {
    "usuario": "walgofugiitj_ws_tfhka",
    "tokenEmpresa": "walgofugii..."  // ✅ Truncado para seguridad
  }
}
```

### Test de Método

```typescript
// Usar método específico
POST /api/documentos/enviar
{
  "xml": "<?xml version='1.0'?>...",
  "invoiceId": "xxx"
}
```

---

## 📝 Códigos de Error HKA

| Código | Significado | Causa |
|--------|-------------|-------|
| 0200 | ✅ Éxito | Documento procesado |
| 0201 | ⏳ Pendiente | En proceso |
| 0400 | ❌ Rechazado | Formato/validación |
| 0403 | 🔒 Auth Error | Credenciales inválidas |
| 0405 | 📦 Sin Folios | Folios agotados |
| 0406 | 🔁 Duplicado | Documento ya existe |

---

## ✅ Resumen

1. **Autenticación:** Credenciales token enviadas en cada llamada SOAP
2. **Método:** Parámetros `tokenEmpresa` y `tokenPassword` en cada método
3. **Seguridad:** Variables de entorno, nunca hardcodeadas
4. **Separación:** Ambientes demo/producción independientes
5. **Validación:** Verificación de credenciales antes de cada operación

**Estado:** ✅ Autenticación implementada correctamente según especificación HKA


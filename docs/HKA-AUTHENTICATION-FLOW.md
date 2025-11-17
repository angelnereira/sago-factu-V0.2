# Flujo de Autenticación HKA - SAGO FACTU

## 📋 Descripción General

SAGO FACTU implementa un sistema de autenticación multi-tenant seguro con The Factory HKA de Panamá. Cada usuario mantiene sus credenciales de forma completamente aislada.

## 🔐 Estructura de Autenticación

### 1. Doble Token de HKA

Cada solicitud SOAP a HKA requiere dos tokens:

```xml
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <tem:NombreMetodo xmlns:tem="http://tempuri.org/">
      <!-- REQUERIDO: Token Empresa (usuario) -->
      <tem:tokenEmpresa>walgofugiitj_ws_tfhka</tem:tokenEmpresa>

      <!-- REQUERIDO: Token Password -->
      <tem:tokenPassword>Octopusp1oQs5</tem:tokenPassword>

      <!-- Parámetros específicos del método -->
      <tem:ruc>8-123456-789</tem:ruc>
      <tem:dv>1</tem:dv>
    </tem:NombreMetodo>
  </soap:Body>
</soap:Envelope>
```

### 2. Ciclo de Vida de las Credenciales

#### Fase 1: Almacenamiento Cifrado

```typescript
// Usuario guarda credenciales en Configuración → Integraciones
POST /api/settings/hka-credentials
{
  tokenUser: "walgofugiitj_ws_tfhka",
  tokenPassword: "Octopusp1oQs5",
  environment: "demo" // o "prod"
}

// Backend:
1. ✅ Valida RUC y ambiente
2. 🔐 Encripta password con AES-256-GCM
3. 💾 Almacena en base de datos (tabla HKACredential o Organization)
4. ✔️ Devuelve confirmación de persistencia
```

#### Fase 2: Resolución de Credenciales

Cuando usuario ejecuta una acción (enviar factura, consultar folios, etc.):

```typescript
// Prioridad de resolución (credentials-manager.ts):
1. Credenciales del usuario (si userId presente) → HKACredential tabla
2. Credenciales de organización (Plan Simple) → Organization tabla
3. Credenciales del sistema (Plan Empresarial) → .env variables

async function resolveHKACredentials(organizationId, options) {
  const orgCredentials = await getHKACredentials(organizationId, options);
  return orgCredentials || getSystemHKACredentials();
}
```

#### Fase 3: Inyección Segura

Las credenciales se inyectan **localmente en la instancia del cliente** (NO en process.env global):

```typescript
// NUEVO: invokeWithCredentials() (client.ts)
async invokeWithCredentials<T>(
  method: string,
  params: any,
  credentials: HKACredentials
): Promise<T> {
  try {
    // Inyectar credenciales localmente
    this.injectCredentials(credentials);

    // Invocar método SOAP
    const [result] = await client[methodAsync](params);

    return result;
  } finally {
    // ✅ CRÍTICO: Limpiar credenciales después
    this.clearInjectedCredentials();
  }
}
```

#### Fase 4: Invocación SOAP

```typescript
// Ejemplo: Consultar Folios
async function consultarFolios(ruc, dv, organizationId) {
  // 1. Resolver credenciales
  const credentials = await resolveHKACredentials(organizationId);

  // 2. Preparar parámetros con credenciales
  const params = {
    tokenEmpresa: credentials.tokenEmpresa,
    tokenPassword: credentials.tokenPassword,
    ruc,
    dv,
  };

  // 3. Invocar con inyección segura
  return hkaClient.invokeWithCredentials('ConsultarFolios', params, credentials);
}
```

## 🔄 Métodos de la API HKA Implementados

Todos estos métodos usan el flujo de inyección segura:

### 1. **ConsultarFolios** ✅
Consulta folios disponibles para una empresa

```typescript
consultarFolios(
  ruc: string,
  dv: string,
  organizationId: string
): Promise<ConsultarFoliosResponse>
```

### 2. **Enviar** ✅
Envía factura, nota crédito o nota débito certificada

```typescript
enviarDocumento(
  xmlDocumento: string,
  invoiceId: string,
  organizationId: string
): Promise<EnviarDocumentoResponse>
```

### 3. **ConsultaFE** ✅
Consulta estado y obtiene PDF/XML de documento

```typescript
consultarDocumento(
  cufe: string,
  organizationId: string
): Promise<ConsultarDocumentoResponse>
```

### 4. **AnulacionFE** ✅
Anula documento (máximo 7 días)

```typescript
anularDocumento(
  cufe: string,
  motivo: string,
  invoiceId: string,
  organizationId: string
): Promise<AnularDocumentoResponse>
```

### 5. **NotaCreditoFE** ✅
Emite nota de crédito

```typescript
emitirNotaCredito(
  xmlNotaCredito: string,
  cufeFacturaOriginal: string,
  invoiceId: string
): Promise<NotaCreditoResponse>
```

### 6. **NotaDebitoFE** ✅
Emite nota de débito

```typescript
emitirNotaDebito(
  xmlNotaDebito: string,
  cufeFacturaOriginal: string,
  invoiceId: string
): Promise<NotaDebitoResponse>
```

### 7. **EnvioCorreo** ✅
Envía documento certificado por email

```typescript
enviarCorreoHKA(
  params: EnvioCorreoParams
): Promise<EnvioCorreoResponse>
```

### 8. **RastreoCorreo** ✅
Rastrea estado de envío de email

```typescript
rastrearCorreoHKA(trackingId: string): Promise<RastreoCorreoResponse>
```

## 🛡️ Seguridad Multi-Tenant

### Garantías de Aislamiento

```typescript
// ✅ ANTES (Inseguro - Race Condition)
process.env.HKA_TOKEN = user1_credentials;
await sendInvoice(user1_invoice);
// ⚠️ Si user2 request intercalado → usa user1 credentials

// ✅ AHORA (Seguro - Inyección Local)
client.injectCredentials(user1_credentials);
await client.invokeWithCredentials('Enviar', params, user1_credentials);
// ✔️ user2 request obtiene sus propias credenciales sin interferencia
```

### Validaciones de Seguridad

1. **Encriptación de Credenciales**
   - Algorithm: AES-256-GCM
   - Key Derivation: PBKDF2 (120k iterations)
   - Storage: Base de datos PostgreSQL (Neon)

2. **Aislamiento por Usuario/Organización**
   - Cada usuario tiene credenciales únicas en DB
   - Organizaciones Plan Simple comparten credenciales (controlado)
   - Plan Empresarial usa credenciales centralizadas

3. **Limpieza Automática**
   - `finally { clearInjectedCredentials() }` siempre ejecuta
   - Credenciales no se persisten en memoria entre requests

## 📊 Flujo Completo de Ejemplo: Enviar Factura

```
Usuario Panel: Click "Enviar Factura"
                    ↓
API POST /api/invoices/create
                    ↓
Backend resuelve credenciales:
  - ¿Usuario tiene HKACredential?
  - ¿Organización tiene credenciales?
  - ¿Usar credenciales del sistema?
                    ↓
Obtiene XML de factura
                    ↓
Inyecta credenciales localmente:
  client.injectCredentials({
    tokenEmpresa: "...",
    tokenPassword: "...",
    environment: "demo"
  })
                    ↓
Invoca SOAP ConsultarFolios para validar
  (Usa credenciales inyectadas)
                    ↓
Invoca SOAP Enviar
  (Usa credenciales inyectadas)
                    ↓
finally { clearInjectedCredentials() }
                    ↓
Guarda respuesta:
  - CUFE en invoice.cufe
  - PDF en S3
  - XML en base de datos
                    ↓
Devuelve confirmación al usuario
```

## 🔍 Debugging y Logs

### Logs del Flujo de Autenticación

```typescript
// Cuando se inyectan credenciales:
console.log('[HKA] Inyectando credenciales específicas del usuario');

// Cuando se invocan métodos:
console.log(`📤 Invocando método HKA: Enviar`, {
  usuario: 'walgofugiitj_ws_tfhka',
  ambiente: 'demo',
});

// Respuesta de HKA:
console.log(`📥 Respuesta de HKA Enviar:`, {
  codigo: '0200',
  mensaje: 'Operación exitosa',
});

// Limpieza:
console.log('[HKA] Limpiando credenciales inyectadas');
```

### Monitoreo de Errores

```typescript
// Error de credenciales no configuradas:
'❌ Plan Simple: configura tus credenciales HKA en Configuración → Integraciones'

// Error de desencriptación:
'⚠️  Error desencriptando password de BD'

// Error de invocación SOAP:
'❌ Error al invocar método Enviar: [detalles]'
```

## 📝 Configuración de Credenciales por Usuario

### Plan Simple (Credenciales Personales)

```typescript
// Usuario va a: /simple/configuracion o /dashboard/configuracion
// Sección: "Integraciones" o "Datos del Contribuyente"

POST /api/settings/hka-credentials
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

// Backend encripta password y almacena:
INSERT INTO "HKACredential" (
  id, userId, tokenUser, tokenPassword, environment, ruc, dv, ...
) VALUES (...)
```

### Plan Empresarial (Credenciales Centralizadas)

```
# .env (una sola vez, ambiente centralizado)
HKA_DEMO_TOKEN_USER=walgofugiitj_ws_tfhka
HKA_DEMO_TOKEN_PASSWORD=Octopusp1oQs5
HKA_PROD_TOKEN_USER=prod_token_user
HKA_PROD_TOKEN_PASSWORD=prod_password

# Todos los usuarios usan estas credenciales
# Sistema automáticamente selecciona demo o prod
```

## 🚀 Casos de Uso

### Caso 1: Usuario con Credenciales Personales (Plan Simple)

```typescript
organizationId = 'org_123'
userId = 'user_456'

// Sistema busca:
1. HKACredential.findFirst({
     where: { userId: 'user_456', isActive: true }
   })
   → Encuentra credencial personal
   → Usa tokenEmpresa y tokenPassword del usuario

2. Invoca: client.invokeWithCredentials('Enviar', params, userCredentials)
   → SOLO usa credenciales de user_456
```

### Caso 2: Organización Sin Credenciales Personales (Plan Simple)

```typescript
organizationId = 'org_123'
userId = 'user_789'

// Sistema busca:
1. HKACredential para user_789 → No encuentra
2. Organization.findUnique({ id: 'org_123' })
   → hkaTokenUser y hkaTokenPassword configurados
   → Usa credenciales de la organización

3. Invoca: client.invokeWithCredentials('Enviar', params, orgCredentials)
   → Usa credenciales de org_123
```

### Caso 3: Plan Empresarial (Credenciales Centralizadas)

```typescript
organizationId = 'org_456'

// Sistema busca:
1. HKACredential para usuario → No encuentra
2. Organization credenciales → No configuradas (Plan Empresarial)
3. getSystemHKACredentials() → Lee de .env

4. Invoca: client.invokeWithCredentials('Enviar', params, systemCredentials)
   → Usa credenciales globales de .env
   → Todos los usuarios usan mismo token
   → Apropiado para Plan Empresarial con facturación centralizada
```

## ⚠️ Mitigación de Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Race condition en process.env | ✅ Credenciales inyectadas localmente |
| Credenciales expuestas en logs | ✅ Se loguea usuario, no password |
| Password sin encriptación en DB | ✅ AES-256-GCM + PBKDF2 |
| Mezcla de credenciales entre usuarios | ✅ Aislamiento por userId/organizationId |
| Inyección SOAP | ✅ Parámetros escapados, no valores raw |
| Expiración de credenciales | ✅ Validación en cada invocación |

## 📚 Referencias

- **Documentación HKA**: https://demoemision.thefactoryhka.com.pa/
- **WSDL Demo**: https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl
- **WSDL Producción**: https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl
- **Ficheros Relacionados**:
  - `lib/hka/credentials-manager.ts` - Resolución de credenciales
  - `lib/hka/soap/client.ts` - Cliente SOAP con inyección segura
  - `lib/hka/methods/*.ts` - Métodos específicos (8 métodos HKA)
  - `app/api/settings/hka-credentials/route.ts` - Guardado de credenciales
  - `lib/utils/encryption.ts` - Encriptación AES-256-GCM

## 🔄 Changelog

### Versión 2.0 (Actual)
- ✅ Inyección segura de credenciales a nivel de instancia
- ✅ Aislamiento completo por usuario/organización
- ✅ Limpieza automática post-invocación
- ✅ 8 métodos HKA implementados
- ✅ Soporte para Plan Simple y Plan Empresarial

### Versión 1.0 (Deprecated)
- ⚠️ Modificación de process.env global
- ⚠️ Riesgo de race conditions
- ⚠️ No aislamiento seguro en multi-tenant

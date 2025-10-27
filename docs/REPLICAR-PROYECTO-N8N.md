# 🔄 REPLICACIÓN DE SAGO-FACTU EN N8N

**Proyecto Original:** SAGO-FACTU (Next.js 15 + React)  
**Versión N8N:** 1.x  
**Fecha:** 2025-01-27  
**Objetivo:** Crear réplica funcional del sistema en N8N

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Arquitectura en N8N](#arquitectura-en-n8n)
3. [Mapeo Funcional](#mapeo-funcional)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Workflows Principales](#workflows-principales)
6. [Integración HKA](#integración-hka)
7. [Base de Datos](#base-de-datos)
8. [Autenticación](#autenticación)
9. [Frontend](#frontend)
10. [Comparativa](#comparativa)
11. [Ventajas y Desventajas](#ventajas-y-desventajas)
12. [Guía de Implementación](#guía-de-implementación)

---

## 1. INTRODUCCIÓN

### 1.1 Propósito

Este documento describe cómo replicar completamente el sistema SAGO-FACTU en N8N, migrando toda la funcionalidad desde Next.js a un enfoque basado en workflows.

### 1.2 Enfoque

**Original (Next.js):**
- Código TypeScript
- API REST endpoints
- React Frontend
- Base de datos con Prisma

**N8N:**
- Workflows visuales
- Nodos pre-configurados
- Automatizaciones
- Integraciones nativas

---

## 2. ARQUITECTURA EN N8N

### 2.1 Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────┐
│              N8N Platform                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Webhook   │  │Trigger   │  │Cron Jobs │     │
│  │Listeners │  │Nodes     │  │Schedules │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │              │             │
│       └─────────────┼──────────────┘             │
│                     │                             │
│  ┌──────────────────┼───────────────────┐       │
│  │     Workflows (Flujos de Trabajo)    │       │
│  ├──────────────────┼───────────────────┤       │
│  │  • Crear Factura │  • Enviar a HKA   │       │
│  │  • Consultar Folios │ • Anular Docs   │       │
│  │  • Procesar Pagos │  • Reportes      │       │
│  └──────────────────┼───────────────────┘       │
│                     │                             │
└─────────────────────┼─────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐ ┌──────────┐ ┌─────────┐
    │PostgreSQL│ │  HKA API │ │AWS S3  │
    │ (Neon)  │ │  (SOAP)  │ │ (PDFs) │
    └─────────┘ └──────────┘ └─────────┘
```

### 2.2 Componentes Principales

#### Triggers (Iniciadores)
- **Webhook** - Recibir requests HTTP
- **Cron** - Ejecutar periodicamente
- **Schedule** - Programar tareas

#### Nodos de Procesamiento
- **HTTP Request** - API calls
- **Code** - JavaScript personalizado
- **Function** - Lógica custom
- **Set** - Modificar datos

#### Nodos de Datos
- **PostgreSQL** - Base de datos
- **XML** - Generar/parsear XML
- **JSON** - Manipular JSON

#### Nodos de Integración
- **Email (SMTP)** - Enviar emails
- **AWS S3** - Almacenar archivos
- **HTTP Request** - SOAP calls

---

## 3. MAPEO FUNCIONAL

### 3.1 Tabla de Correspondencia

| Funcionalidad Next.js | Implementación N8N | Nodos Principales |
|----------------------|-------------------|-------------------|
| **Frontend React** | ✅ N8N UI Builder | UI Builder, HTML |
| **API Routes** | ✅ Webhook Trigger | Webhook, HTTP Response |
| **Server Actions** | ✅ Function Node | Code, Function |
| **Prisma ORM** | ✅ PostgreSQL Node | PostgreSQL (Direct) |
| **NextAuth.js** | ⚠️ Custom Auth | HTTP Request, Code |
| **BullMQ Workers** | ✅ Cron Trigger | Schedule, Queue |
| **HKA SOAP Client** | ✅ HTTP Request | SOAP XML Request |
| **XML Generator** | ✅ XML Node | XML Builder |
| **Validación Zod** | ✅ Code Node | JavaScript validation |
| **Testing** | ❌ No disponible | - |
| **PWA** | ⚠️ Limitado | Workarounds |

### 3.2 Funcionalidades Core

#### ✅ Facturación Electrónica
- Crear facturas
- Generar XML
- Enviar a HKA
- Descargar PDF
- Estado: **Totalmente Replicable**

#### ✅ Gestión de Folios
- Consultar folios
- Comprar folios
- Sincronizar con HKA
- Estado: **Totalmente Replicable**

#### ✅ Integración HKA
- SOAP API calls
- XML parsing
- Manejo de respuestas
- Estado: **Totalmente Replicable**

#### ⚠️ Autenticación
- No NextAuth en N8N
- API Key authentication
- Custom JWT (si necesario)
- Estado: **Implementación Custom Requerida**

#### ❌ Frontend Complejo
- N8N UI Builder limitado
- Sin React components
- Solo HTML básico
- Estado: **No Recomendado**

---

## 4. INSTALACIÓN Y CONFIGURACIÓN

### 4.1 Instalación de N8N

#### Opción 1: Docker (Recomendado)

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=password \
  n8nio/n8n
```

#### Opción 2: NPM

```bash
npm install -g n8n
n8n start
```

#### Opción 3: N8N Cloud

- Ir a: https://app.n8n.io
- Crear cuenta
- Usar gratis hasta 2500 ejecuciones/mes

### 4.2 Variables de Entorno

Configurar en N8N:
**Settings > Environment Variables**

```env
# Database
POSTGRES_HOST=ep-xxx.us-east-2.aws.neon.tech
POSTGRES_PORT=5432
POSTGRES_DB=neondb
POSTGRES_USER=neondb_owner
POSTGRES_PASSWORD=xxx
POSTGRES_SSL=true

# HKA
HKA_ENV=demo
HKA_DEMO_SOAP_URL=https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
HKA_DEMO_TOKEN_USER=walgofugiitj_ws_tfhka
HKA_DEMO_TOKEN_PASSWORD=Octopusp1oQs5
HKA_DEMO_WSDL_URL=https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl

# Redis (Opcional para cache)
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 (Opcional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=sago-factu-documents

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@sagofactu.com
```

### 4.3 Conexiones a Configurar

En N8N, ir a: **Credentials > Add**

1. **PostgreSQL**
   - Name: `Neon Database`
   - Host: `${POSTGRES_HOST}`
   - Database: `${POSTGRES_DB}`
   - User: `${POSTGRES_USER}`
   - Password: `${POSTGRES_PASSWORD}`
   - SSL: Enabled

2. **HTTP Request (HKA)**
   - Name: `HKA SOAP`
   - Base URL: `${HKA_DEMO_SOAP_URL}`
   - Authentication: None (SOAP headers manuales)

3. **Email (Resend)**
   - Name: `Resend SMTP`
   - SMTP Host: `smtp.resend.com`
   - SMTP Port: `465`
   - SMTP User: `resend`
   - SMTP Password: `${RESEND_API_KEY}`

---

## 5. WORKFLOWS PRINCIPALES

### 5.1 Workflow: Crear Factura

**Archivo:** `workflows/01-create-invoice.json`

**Descripción:**
Recibe datos de factura por webhook, valida, calcula totales y guarda en BD.

**Nodos:**

```
1. Webhook Trigger
   ↓
2. Code: Validar Datos
   ↓
3. Function: Calcular Totales
   ↓
4. PostgreSQL: Insert Invoice
   ↓
5. PostgreSQL: Insert Items
   ↓
6. Code: Generar Invoice Number
   ↓
7. Webhook Response: Retornar Success
```

**Código Node 2 (Validar Datos):**
```javascript
const items = $input.first().json.body.items;
const errors = [];

// Validar items
if (!items || items.length === 0) {
  errors.push('Debe tener al menos un item');
}

// Validar cliente
if (!$input.first().json.body.clientId) {
  errors.push('Debe seleccionar un cliente');
}

if (errors.length > 0) {
  return {
    json: {
      success: false,
      errors: errors
    }
  };
}

return $input.first();
```

**Código Node 3 (Calcular Totales):**
```javascript
const items = $input.first().json.body.items;

let subtotal = 0;
let totalITBMS = 0;

items.forEach(item => {
  const cantidad = parseFloat(item.quantity);
  const precio = parseFloat(item.unitPrice);
  const descuento = parseFloat(item.discount || 0);
  
  const subtotalItem = cantidad * precio * (1 - descuento / 100);
  const itbms = subtotalItem * 0.07; // 7% ITBMS
  
  subtotal += subtotalItem;
  totalITBMS += itbms;
  
  item.subtotal = subtotalItem;
  item.itbms = itbms;
  item.total = subtotalItem + itbms;
});

const total = subtotal + totalITBMS;

return {
  json: {
    ...$input.first().json,
    totals: {
      subtotal: subtotal.toFixed(2),
      itbms: totalITBMS.toFixed(2),
      total: total.toFixed(2)
    },
    items: items
  }
};
```

### 5.2 Workflow: Enviar a HKA

**Archivo:** `workflows/02-send-to-hka.json`

**Descripción:**
Genera XML, envía a HKA y actualiza estado de factura.

**Nodos:**

```
1. Webhook Trigger
   ↓
2. PostgreSQL: Get Invoice con Items
   ↓
3. PostgreSQL: Get Organization
   ↓
4. PostgreSQL: Get Customer
   ↓
5. Code: Generar XML (DGI v1.00)
   ↓
6. Function: Calcular CUFE
   ↓
7. HTTP Request: Enviar a HKA SOAP
   ↓
8. Code: Parsear Respuesta HKA
   ↓
9. PostgreSQL: Update Invoice Status
   ↓
10. Webhook Response: Retornar Resultado
```

**Código Node 5 (Generar XML):**
```javascript
const invoice = $input.first().json.invoice;
const organization = $input.first().json.organization;
const customer = $input.first().json.customer;
const items = invoice.items;

// Template XML DGI rFE v1.00
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dVerForm>1.00</dVerForm>
  <dId>FE${organization.rucType}${invoice.invoiceNumber}-${invoice.id}</dId>
  
  <!-- Emisor -->
  <gEmis>
    <gRucEmi>
      <dTipoRuc>${organization.rucType}</dTipoRuc>
      <dRuc>${organization.ruc}-${organization.dv}</dRuc>
      <dDV>${organization.dv}</dDV>
    </gRucEmi>
    <dNombEm>${organization.name}</dNombEm>
    <!-- Más campos... -->
  </gEmis>
  
  <!-- Receptor -->
  <gRec>
    <gRucRec>
      <dTipoRuc>${customer.rucType}</dTipoRuc>
      <dRuc>${customer.ruc}-${customer.dv}</dRuc>
      <dDV>${customer.dv}</dDV>
    </gRucRec>
    <dNombRec>${customer.name}</dNombRec>
    <!-- Más campos... -->
  </gRec>
  
  <!-- Items -->
  <gItems>
    ${items.map(item => `
    <gItem>
      <dCodItem>${item.code}</dCodItem>
      <dDescItem>${item.description}</dDescItem>
      <dCantItem>${item.quantity}</dCantItem>
      <dPrecioItem>${item.unitPrice}</dPrecioItem>
      <dTasaITBMS>04</dTasaITBMS>
      <dValITBMS>${item.itbms}</dValITBMS>
      <dTotItem>${item.total}</dTotItem>
    </gItem>
    `).join('')}
  </gItems>
  
  <!-- Totales -->
  <gTot>
    <dTotNeto>${invoice.subtotal}</dTotNeto>
    <dTotITBMS>${invoice.itbms}</dTotITBMS>
    <dVTot>${invoice.total}</dVTot>
  </gTot>
</rFE>`;

return {
  json: {
    invoice: invoice,
    organization: organization,
    customer: customer,
    xml: xml
  }
};
```

**Código Node 7 (Enviar a HKA):**
```javascript
const xml = $input.first().json.xml;

// SOAP Envelope
const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <EnviarDocumento xmlns="http://www.hka.com.pa/">
      <pUsuario>${$env.HKA_DEMO_TOKEN_USER}</pUsuario>
      <pClave>${$env.HKA_DEMO_TOKEN_PASSWORD}</pClave>
      <pแปวD>${xml}</pxmlDocumento>
    </EnviarDocumento>
  </soap:Body>
</soap:Envelope>`;

// HTTP Request
return {
  json: {
    method: 'POST',
    url: $env.HKA_DEMO_SOAP_URL,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://www.hka.com.pa/EnviarDocumento'
    },
    body: soapRequest
  }
};
```

**Configurar Node HTTP Request:**
- Method: `POST`
- URL: `{{ $env.HKA_DEMO_SOAP_URL }}`
- Send Body: `Yes`
- Body Parameters: Expression
```javascript
{{ $json['json']['body'] }}
```

### 5.3 Workflow: Procesar Facturas Automáticamente

**Archivo:** `workflows/03-auto-process-invoices.json`

**Descripción:**
Cron que procesa facturas pendientes cada 5 minutos.

**Nodos:**

```
1. Cron Trigger: */5 * * * *
   ↓
2. PostgreSQL: Query Invoices PROCESSING
   ↓
3. Split In Batches: 3 facturas
   ↓
4. HTTP Request: Webhook Enviar a HKA
   ↓
5. Set: Marcar Status
   ↓
6. PostgreSQL: Update Invoice
```

### 5.4 Workflow: Consultar Folios

**Archivo:** `workflows/04-consult-folios.json`

**Nodos:**

```
1. Webhook Trigger
   ↓
2. HTTP Request: HKA ConsultarFolios
   ↓
3. Code: Parsear Respuesta
   ↓
4. PostgreSQL: Update FolioAssignment
   ↓
5. Webhook Response
```

**Código SOAP Request:**
```javascript
const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ConsultarFolios xmlns="http://www.hka.com.pa/">
      <pUsuario>${$env.HKA_DEMO_TOKEN_USER}</pUsuario>
      <pClave>${$env.HKA_DEMO_TOKEN_PASSWORD}</pClave>
    </ConsultarFolios>
  </soap:Body>
</soap:Envelope>`;
```

### 5.5 Workflow: Enviar Email de Factura

**Archivo:** `workflows/05-send-invoice-email.json`

**Nodos:**

```
1. Webhook Trigger
   ↓
2. PostgreSQL: Get Invoice
   ↓
3. HTTP Request: Get PDF from HKA
   ↓
4. Email Node: Enviar con Adjunto
   ↓
5. Webhook Response
```

**Configuración Email Node:**
- From: `{{ $env.EMAIL_FROM }}`
- To: `{{ $('Get Invoice').item.json.customer.email }}`
- Subject: `Factura Electrónica {{ $('Get Invoice').item.json.invoiceNumber }}`
- Text: Template HTML
- Attachments: PDF desde HKA

---

## 6. INTEGRACIÓN HKA

### 6.1 Envío de Documentos

**Método SOAP:** `EnviarDocumento`

**Request:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <EnviarDocumento xmlns="http://www.hka.com.pa/">
      <pUsuario>{{ $env.HKA_DEMO_TOKEN_USER }}</pUsuario>
      <pClave>{{ $env.HKA_DEMO_TOKEN_PASSWORD }}</pClave>
      <pxmlDocumento>{{ $json.xml }}</pxmlDocumento>
    </EnviarDocumento>
  </soap:Body>
</soap:Envelope>
```

**Response:**
```xml
<dCodRes>0200</dCodRes>
<dMsgRes>Documento certificado</dMsgRes>
<dProtocolo>XXX-XXXXXXX</dProtocolo>
<dCufe>xxxx-xxxxx-xxxx</dCufe>
```

### 6.2 Generación de XML

Usar nodo **XML** de N8N o **Code** node para generar manualmente.

**Template XML DGI rFE v1.00:**

Ver código en Workflow 2 (Node 5)

---

## 7. BASE DE DATOS

### 7.1 Configuración PostgreSQL

**Connection Credential:**
- Name: `Neon Database`
- Host: Variable de entorno
- Port: `5432`
- Database: Variable de entorno
- User: Variable de entorno
- Password: Variable de entorno
- SSL: `Enabled`

### 7.2 Operaciones SQL

#### Crear Factura
```sql
INSERT INTO invoices (
  id, "invoiceNumber", "organizationId", "customerId",
  subtotal, itbms, total, status, "createdAt"
) VALUES (
  gen_random_uuid(),
  :invoiceNumber,
  :organizationId,
  :customerId,
  :subtotal,
  :itbms,
  :total,
  'DRAFT',
  NOW()
) RETURNING *;
```

#### Actualizar Estado
```sql
UPDATE invoices
SET 
  status = :status,
  "hkaProtocol" = :protocol,
  "hkaResponseCode" = :code,
  "certifiedAt" = NOW()
WHERE id = :invoiceId
RETURNING *;
```

#### Consultar Facturas
```sql
SELECT 
  i.*,
  o.name as "organizationName",
  c.name as "customerName"
FROM invoices i
JOIN organizations o ON i."organizationId" = o.id
JOIN customers c ON i."customerId" = c.id
WHERE i.status = :status
ORDER BY i."createdAt" DESC
LIMIT :limit
OFFSET :offset;
```

---

## 8. AUTENTICACIÓN

### 8.1 OPCIÓN 1: API Keys (Recomendado)

**Workflow:** `Auth: Validate API Key`

```
1. Webhook Trigger (Header: X-API-KEY)
   ↓
2. PostgreSQL: Validate API Key
   ↓
3. If: Valid → Continue
   Else: Return 401
```

### 8.2 OPCIÓN 2: JWT Custom

**Generar Token:**
```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: $input.first().json.userId },
  $env.JWT_SECRET,
  { expiresIn: '24h' }
);

return { json: { token } };
```

**Validar Token:**
```javascript
const jwt = require('jsonwebtoken');

try {
  const decoded = jwt.verify(
    $input.first().json.headers['authorization'].replace('Bearer ', ''),
    $env.JWT_SECRET
  );
  return { json: { user: decoded } };
} catch (error) {
  return { json: { error: 'Invalid token' } };
}
```

### 8.3 Limitar Acceso por IP

En Webhook node:
- Settings > Additional Options > Allowed Origins
- Agregar IPs permitidas

---

## 9. FRONTEND

### 9.1 Opciones

#### OPCIÓN 1: N8N UI Builder
- Básico, limitado
- Solo formularios simples
- No recomendado para UI compleja

#### OPCIÓN 2: SAGO-FACTU Frontend Mantener
- Usar Next.js frontend
- Consumir N8N workflows via webhooks
- **Recomendado**

#### OPCIÓN 3: Frontend Separado
- React, Vue, Angular
- Conectar a N8N APIs
- **Recomendado para apps complejas**

### 9.2 Integración Frontend → N8N

```typescript
// En el frontend (React)
const sendInvoice = async (invoiceData) => {
  const response = await fetch('http://n8n-instance.com/webhook/create-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey
    },
    body: JSON.stringify(invoiceData)
  });
  
  return response.json();
};
```

---

## 10. COMPARATIVA

### 10.1 Next.js vs N8N

| Aspecto | Next.js (Original) | N8N (Replica) |
|---------|-------------------|---------------|
| **Desarrollo** | Código TypeScript | Workflows visuales |
| **Frontend** | React completo | HTML básico |
| **Backend** | API REST | Webhooks |
| **Base de Datos** | Prisma ORM | PostgreSQL directo |
| **Testing** | Jest, 80% coverage | No disponible |
| **Deployment** | Vercel | Docker/N8N Cloud |
| **Escalabilidad** | Serverless | Manual scaling |
| **Costos** | $20-200/mes | $0-400/mes |
| **Curva Aprendizaje** | Alta (React, Next.js) | Media (Workflows) |
| **Mantenimiento** | Código | Workflows |
| **Debugging** | DevTools | Execution log |
| **Version Control** | Git | N8N Export |

### 10.2 Ventajas N8N

✅ **Rápido de implementar**
- No escribir código
- Workflows visuales
- Integraciones nativas

✅ **Bajo costo inicial**
- Gratis hasta 2500 ejecuciones
- N8N cloud barato
- Sin infraestructura

✅ **Fácil de modificar**
- Sin deployments
- Cambios instantáneos
- Visual debugging

✅ **Muchas integraciones**
- 400+ nodos
- APIs populares
- Webhooks

### 10.3 Desventajas N8N

❌ **Frontend limitado**
- Sin React components
- UI Builder básico
- No PWA

❌ **Sin testing**
- No unit tests
- No integration tests
- Solo ejecución manual

❌ **Escalabilidad manual**
- No auto-scaling
- Depende de hardware
- Límite de ejecuciones concurrentes

❌ **Debugging difícil**
- Logs dispersos
- Sin DevTools
- Harder to troubleshoot

❌ **Version control limitado**
- Export manual
- No merge workflows
- Difícil collaborative workflow

---

## 11. VENTAJAS Y DESVENTAJAS

### 11.1 Usar N8N Como Reemplazo Completo

**PROS:**
- No coding required
- Fast development
- Built-in integrations
- Lower cost

**CONS:**
- Limited frontend
- No testing framework
- Hard to scale
- Difficult debugging
- Limited customization

### 11.2 Usar N8N Como Complemento

**Arquitectura Híbrida:**
```
SAGO-FACTU (Next.js) ──┐
                       │
                       ├─→ N8N (Automatizaciones)
                       │
Otras APIs ────────────┘
```

**PROS:**
- Best of both worlds
- Keep React frontend
- Add automation easily
- Separate concerns

**CONS:**
- Dos sistemas mantener
- Más complejidad
- Dos deployments

**RECOMENDACIÓN:** ⭐⭐⭐⭐⭐

---

## 12. GUÍA DE IMPLEMENTACIÓN

### 12.1 Pasos para Replicar

#### PASO 1: Instalar N8N

```bash
# Opción Docker
docker run -d \
  --name sago-factu-n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### PASO 2: Configurar Conexiones

1. PostgreSQL → Neon Database
2. HTTP Request → HKA SOAP
3. Email → Resend SMTP

#### PASO 3: Importar Workflows

Los workflows están en:
```
workflows/
├── 01-create-invoice.json
├── 02-send-to-hka.json
├── 03-auto-process-invoices.json
├── 04-consult-folios.json
├── 05-send-invoice-email.json
```

Importar desde: **Workflows > Import from File**

#### PASO 4: Configurar Webhooks

En cada workflow:
1. Agregar nodo Webhook
2. Copiar URL
3. Usar URL en frontend

Ejemplo:
```
http://localhost:5678/webhook/create-invoice
```

#### PASO 5: Probar

1. Activar workflows
2. Enviar test request
3. Ver execution log
4. Verificar BD

### 12.2 Migración Gradual

#### Fase 1: Workflows necesarios
- ✅ Consultar folios
- ✅ Sincronización

#### Fase 2: Facturación básica
- ✅ Crear factura
- ✅ Enviar a HKA

#### Fase 3: Automatizaciones
- ✅ Procesamiento automático
- ✅ Notificaciones email

#### Fase 4: Reportes
- ✅ Dashboard en N8N
- ✅ Exports

### 12.3 Checklist de Implementación

- [ ] Instalar N8N
- [ ] Configurar variables de entorno
- [ ] Crear conexión PostgreSQL
- [ ] Importar workflows
- [ ] Configurar webhooks
- [ ] Probar workflow crear factura
- [ ] Probar workflow enviar a HKA
- [ ] Configurar email
- [ ] Configurar cron jobs
- [ ] Documentar endpoints
- [ ] Integrar frontend (si aplica)

---

## 13. CONCLUSIÓN

### 13.1 Resumen

**¿Se puede replicar SAGO-FACTU en N8N?**

✅ **Sí, funcionalmente sí**
- Toda la lógica de negocio
- Integración HKA
- Gestión de folios
- Procesamiento de facturas

⚠️ **Pero con limitaciones**
- Frontend limitado
- No hay testing
- Escalabilidad manual
- Debugging más difícil

### 13.2 Recomendación Final

**NO replicar completamente, sino usarlo como complemento:**

```
┌─────────────────────────────────────┐
│   SAGO-FACTU (Next.js)             │
│   - Frontend completo              │
│   - APIs REST                      │
│   - Base de datos                  │
│   - Autenticación                  │
└─────────────┬───────────────────────┘
              │
              │ Webhooks / REST API
              │
┌─────────────▼───────────────────────┐
│   N8N (Automatización)             │
│   - Workflows complejos            │
│   - Integraciones externas         │
│   - Notificaciones                 │
│   - Reportes                       │
└─────────────────────────────────────┘
```

**Beneficios:**
- Mantener React frontend (mejor UX)
- Agregar automatizaciones fácilmente
- Aprovechar integraciones de N8N
- Separar concerns lógicamente

### 13.3 Casos de Uso

**Usar N8N para:**
- ✅ Automatizaciones de HKA
- ✅ Notificaciones de eventos
- ✅ Integraciones con terceros
- ✅ Reportes y analytics
- ✅ Sincronización de datos

**NO usar N8N para:**
- ❌ Frontend complejo
- ❌ Lógica de negocio crítica
- ❌ Sistemas con alta concurrencia
- ❌ Proyectos que necesitan testing

---

**Documento generado:** 2025-01-27  
**Version:** 1.0  
**Autor:** Technical Documentation


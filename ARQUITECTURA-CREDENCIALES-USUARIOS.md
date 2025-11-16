# 🏗️ ARQUITECTURA - GESTIÓN DE CREDENCIALES Y FACTURAS POR USUARIO

**Fecha:** 16 de Noviembre de 2025
**Versión:** 1.0 (Diseño)
**Estado:** ESPECIFICACIÓN TÉCNICA

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Requisitos](#requisitos)
3. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
4. [Flujo de Credenciales](#flujo-de-credenciales)
5. [Flujo de Envío de Facturas](#flujo-de-envío-de-facturas)
6. [Estructura de Respuestas](#estructura-de-respuestas)
7. [Componentes Frontend](#componentes-frontend)
8. [Aislamiento de Datos](#aislamiento-de-datos)
9. [Persistencia](#persistencia)
10. [Testing](#testing)

---

## RESUMEN EJECUTIVO

**SAGO-FACTU** debe funcionar como una plataforma **multi-usuario** donde:

✅ Cada usuario gestiona sus propias credenciales HKA (demo y producción)
✅ Cada usuario puede cambiar entre ambiente demo y producción
✅ Las facturas se envían con credenciales del usuario conectado
✅ Las respuestas (CUFE, QR, PDF) se persisten en BD
✅ El frontend muestra profesionalmente la respuesta
✅ No hay datos simulados, todo es real

---

## REQUISITOS

### Funcionales (RF)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-001 | Usuario puede guardar credenciales HKA (demo y prod) | CRÍTICA |
| RF-002 | Usuario puede cambiar entre demo/producción | CRÍTICA |
| RF-003 | Usuario ve UI para configurar firma digital | ALTA |
| RF-004 | Usuario puede enviar factura con credenciales propias | CRÍTICA |
| RF-005 | Sistema retorna CUFE de The Factory HKA | CRÍTICA |
| RF-006 | Sistema retorna QR generado por HKA | CRÍTICA |
| RF-007 | Sistema descarga PDF de HKA | CRÍTICA |
| RF-008 | Frontend muestra respuesta profesional | ALTA |
| RF-009 | Usuario puede descargar/guardar PDF | ALTA |
| RF-010 | Historial de facturas persiste por usuario | CRÍTICA |

### No-Funcionales (RNF)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF-001 | Datos aislados por usuario (sin contaminación) | CRÍTICA |
| RNF-002 | Credenciales encriptadas en BD | CRÍTICA |
| RNF-003 | Sin credenciales en logs o errores | ALTA |
| RNF-004 | Tiempo de respuesta < 5 segundos | ALTA |
| RNF-005 | Validación antes de envío a HKA | ALTA |

---

## ARQUITECTURA DE BASE DE DATOS

### Schema Prisma - Nuevas Tablas

```prisma
// ============================================================================
// HKA CREDENTIALS - Credenciales por usuario y ambiente
// ============================================================================

model HKACredentialsUser {
  id                    String   @id @default(cuid())

  // Relación con usuario
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relación con organización (para aislamiento)
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Credenciales encriptadas
  environment           String   @default("demo") // "demo" | "production"
  tokenUser             String   // Username para The Factory HKA
  tokenPassword         String   // Contraseña encriptada

  // Información del endpoint
  soapUrl               String   // URL SOAP específica del ambiente
  restUrl               String   // URL REST específica del ambiente

  // Estado
  isActive              Boolean  @default(true)
  lastTestedAt          DateTime?
  lastTestedSuccess     Boolean?

  // Auditoría
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Índices
  @@unique([userId, organizationId, environment])
  @@index([userId])
  @@index([organizationId])
}

// ============================================================================
// DIGITAL SIGNATURE - Configuración de firma digital por usuario
// ============================================================================

model DigitalSignatureConfig {
  id                    String   @id @default(cuid())

  // Relación con usuario
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relación con organización
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Certificado P12/PFX
  certificateFileName   String   // Nombre original del archivo
  certificateData       Bytes    // Archivo P12/PFX encriptado
  certificateHash       String   // SHA-256 del certificado para validación

  // PIN de acceso al certificado
  certificatePinEncrypted String // PIN encriptado

  // Información del certificado
  certificateSubject    String   // CN del certificado (para UI)
  certificateIssuer     String   // Emisor del certificado
  certificateValidFrom  DateTime // Fecha válido desde
  certificateValidTo    DateTime // Fecha válido hasta

  // Configuración
  isDefault             Boolean  @default(false)
  isActive              Boolean  @default(true)

  // Auditoría
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Índices
  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
}

// ============================================================================
// INVOICE - Facturas con respuesta de HKA
// ============================================================================

model Invoice {
  id                    String   @id @default(cuid())

  // Relación
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdByUserId       String
  createdBy             User     @relation(fields: [createdByUserId], references: [id])

  // Datos de emisor
  issuerRuc             String   // RUC del emisor
  issuerName            String   // Nombre del emisor
  issuerAddress         String   // Dirección

  // Datos del receptor
  receiverType          String   // "CONTRIBUYENTE" | "CONSUMIDOR_FINAL" | etc
  receiverRuc           String?  // RUC del receptor (puede ser null para consumidor final)
  receiverName          String   // Nombre del receptor
  receiverEmail         String?  // Email para notificación

  // Factura
  invoiceNumber         String   // Número de factura
  invoiceDate           DateTime // Fecha de emisión

  // Montos
  subtotal              Float
  itbms                 Float
  discount              Float    @default(0)
  total                 Float
  currency              String   @default("PAB") // Moneda

  // Estado
  status                String   @default("DRAFT")
  // "DRAFT" | "PENDING_HKA" | "CERTIFIED" | "FAILED" | "CANCELLED"

  // ============================================================================
  // RESPUESTA DE HKA - Datos recibidos después de envío
  // ============================================================================

  // CUFE - Código Único de Factura Electrónica
  cufe                  String?  // Código único de HKA

  // QR Code
  qrCodeUrl             String?  // URL del QR generado por HKA
  qrCodeData            String?  // Data del QR en base64

  // PDF
  pdfUrl                String?  // URL donde descargar PDF de HKA
  pdfKey                String?  // Clave para descargar PDF seguramente
  pdfGeneratedAt        DateTime? // Cuándo fue generado

  // Respuesta completa de HKA
  hkaResponseJson       Json?    // Respuesta completa de The Factory HKA (sin credenciales)
  hkaErrorMessage       String?  // Mensaje de error si falló
  hkaErrorCode          String?  // Código de error de HKA

  // Timestamp de envío
  sentToHkaAt           DateTime?
  hkaResponseReceivedAt DateTime?

  // Items de la factura
  items                 InvoiceItem[]

  // Logs
  logs                  InvoiceLog[]

  // Auditoría
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Índices
  @@unique([organizationId, invoiceNumber])
  @@index([createdByUserId])
  @@index([organizationId])
  @@index([status])
  @@index([cufe])
}

// ============================================================================
// INVOICE ITEM - Detalle de items en la factura
// ============================================================================

model InvoiceItem {
  id                    String   @id @default(cuid())

  invoiceId             String
  invoice               Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  description           String   // Descripción del producto/servicio
  code                  String?  // Código del producto
  quantity              Float
  unitPrice             Float
  discount              Float    @default(0)
  itbmsRate             String   // "0%" | "7%" | "10%" | "15%"

  lineTotal             Float    // Total de la línea (cantidad * unitPrice - discount)
  lineTax               Float    // Impuesto de la línea

  createdAt             DateTime @default(now())

  @@index([invoiceId])
}

// ============================================================================
// INVOICE LOG - Historial de cambios en la factura
// ============================================================================

model InvoiceLog {
  id                    String   @id @default(cuid())

  invoiceId             String
  invoice               Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  action                String   // "CREATED" | "SENT_TO_HKA" | "CERTIFIED" | "ERROR" | "DOWNLOADED_PDF"
  message               String   // Descripción de la acción
  details               Json?    // Detalles adicionales

  createdAt             DateTime @default(now())

  @@index([invoiceId])
}
```

### Relaciones

```
User (1) ──→ (M) HKACredentialsUser
         ──→ (M) DigitalSignatureConfig
         ──→ (M) Invoice

Organization (1) ──→ (M) HKACredentialsUser
              ──→ (M) DigitalSignatureConfig
              ──→ (M) Invoice

Invoice (1) ──→ (M) InvoiceItem
         ──→ (M) InvoiceLog
```

---

## FLUJO DE CREDENCIALES

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USUARIO CONFIGURA CREDENCIALES                    │
└─────────────────────────────────────────────────────────────────────┘

1. Usuario accede a: /dashboard/configuracion/credenciales-hka

2. UI Muestra:
   ├─ Tabs: DEMO | PRODUCCIÓN
   ├─ Inputs:
   │  ├─ Token User (The Factory HKA)
   │  ├─ Token Password
   │  └─ Botón: "Guardar Credenciales"
   └─ Botón: "Probar Conexión a HKA"

3. Usuario ingresa credenciales

4. Frontend valida (no envía vacío):
   if (!tokenUser || !tokenPassword) {
     mostrarError("Todos los campos son requeridos")
     return
   }

5. POST /api/hka/credenciales/guardar
   ├─ Body: { environment: "demo", tokenUser, tokenPassword }
   ├─ Backend:
   │  ├─ Validar input con Zod
   │  ├─ Encriptar tokenPassword
   │  ├─ Guardar en BD (HKACredentialsUser)
   │  ├─ Si ya existe para ese environment, actualizar
   │  └─ Retornar { success: true, message: "Guardado" }
   └─ Frontend muestra confirmación

6. Usuario puede probar conexión:
   POST /api/hka/credenciales/probar
   ├─ Conecta a HKA con esas credenciales
   ├─ Si éxito: { success: true, message: "Conexión OK" }
   └─ Si falla: { success: false, error: "Credenciales inválidas" }
```

### Código TypeScript - API Routes

#### POST /api/hka/credenciales/guardar

```typescript
// app/api/hka/credenciales/guardar/route.ts

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { encryptToken } from '@/lib/utils/encryption';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SaveCredentialsSchema = z.object({
  environment: z.enum(['demo', 'production']),
  tokenUser: z.string().min(1, 'Token user requerido'),
  tokenPassword: z.string().min(1, 'Token password requerido'),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { environment, tokenUser, tokenPassword } = SaveCredentialsSchema.parse(body);

    // Encriptar password
    const encryptedPassword = encryptToken(tokenPassword);

    // Guardar o actualizar credenciales
    const credentials = await prisma.hKACredentialsUser.upsert({
      where: {
        userId_organizationId_environment: {
          userId: session.user.id,
          organizationId: session.user.organizationId,
          environment,
        },
      },
      update: {
        tokenPassword: encryptedPassword,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        environment,
        tokenUser,
        tokenPassword: encryptedPassword,
        soapUrl: environment === 'demo'
          ? 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc'
          : 'https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
        restUrl: environment === 'demo'
          ? 'https://demointegracion.thefactoryhka.com.pa'
          : 'https://integracion.thefactoryhka.com.pa',
      },
    });

    logger.info('Credenciales HKA guardadas', {
      userId: session.user.id,
      environment,
      tokenUser: tokenUser.substring(0, 4) + '***', // Ocultar en logs
    });

    return Response.json({
      success: true,
      message: `Credenciales ${environment} guardadas exitosamente`,
    });
  } catch (error) {
    logger.error('Error guardando credenciales', { error });
    return Response.json(
      { error: 'Error guardando credenciales' },
      { status: 500 }
    );
  }
}
```

#### POST /api/hka/credenciales/probar

```typescript
// app/api/hka/credenciales/probar/route.ts

import { auth } from '@/lib/auth';
import { HKASOAPClient } from '@/lib/hka/soap/client';
import { resolveHKACredentials } from '@/lib/hka/credentials-manager';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { environment } = body;

    // Obtener credenciales guardadas
    const credentials = await resolveHKACredentials(
      session.user.organizationId,
      { userId: session.user.id }
    );

    // Probar conexión a HKA
    const client = new HKASOAPClient(credentials);

    try {
      // Llamar a método simple de HKA para probar conexión
      const folios = await client.consultarFolios();

      logger.info('Conexión HKA exitosa', {
        userId: session.user.id,
        environment,
      });

      return Response.json({
        success: true,
        message: 'Conexión a HKA exitosa',
        foliosRestantes: folios,
      });
    } catch (hkaError) {
      logger.error('Error conectando a HKA', { hkaError });
      return Response.json({
        success: false,
        error: 'No se pudo conectar a HKA. Verifica tus credenciales.',
        details: hkaError instanceof Error ? hkaError.message : String(hkaError),
      });
    }
  } catch (error) {
    logger.error('Error probando credenciales', { error });
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
```

---

## FLUJO DE ENVÍO DE FACTURAS

### Diagrama Completo

```
┌──────────────────────────────────────────────────────────────────────┐
│                     USUARIO ENVÍA FACTURA A HKA                       │
└──────────────────────────────────────────────────────────────────────┘

1. Usuario llena formulario:
   ├─ Receptor (RUC, Nombre, Email)
   ├─ Items (cantidad, precio, descripción)
   ├─ Totales (subtotal, ITBMS, total)
   └─ Botón: "Enviar Factura"

2. Frontend valida con Zod:
   if (!datos.validos) {
     mostrar errores específicos
     return
   }

3. POST /api/invoices/enviar
   │
   ├─ BACKEND: Validar sesión
   ├─ BACKEND: Obtener credenciales del usuario
   ├─ BACKEND: Crear Invoice en BD (status: DRAFT)
   ├─ BACKEND: Generar XML
   ├─ BACKEND: Validar XML
   ├─ BACKEND: Firmar digitalmente (si user tiene certificado)
   ├─ BACKEND: Enviar a HKA
   │
   ├─ SI ÉXITO (HKA retorna CUFE):
   │  ├─ Extraer: CUFE, QR, URL PDF
   │  ├─ Guardar en BD:
   │  │  ├─ invoice.status = "CERTIFIED"
   │  │  ├─ invoice.cufe = <cufe de HKA>
   │  │  ├─ invoice.qrCodeUrl = <url QR>
   │  │  ├─ invoice.pdfUrl = <url PDF>
   │  │  ├─ invoice.hkaResponseJson = <respuesta completa>
   │  │  └─ invoice.sentToHkaAt = now()
   │  │
   │  ├─ Agregar log: "Enviado a HKA correctamente"
   │  └─ Retornar:
   │     {
   │       success: true,
   │       cufe: "...",
   │       qrCodeUrl: "...",
   │       pdfUrl: "...",
   │       invoiceId: "...",
   │       message: "Factura certificada"
   │     }
   │
   └─ SI FALLA (HKA retorna error):
      ├─ invoice.status = "FAILED"
      ├─ invoice.hkaErrorMessage = <error de HKA>
      ├─ invoice.hkaErrorCode = <código error>
      ├─ Agregar log: "Error enviando a HKA"
      └─ Retornar:
         {
           success: false,
           error: "No se pudo certificar la factura",
           details: "<error de HKA>",
           invoiceId: "..."
         }

4. Frontend recibe respuesta
   ├─ Si success = true:
   │  └─ Mostrar modal/drawer con CUFE, QR, botón PDF
   ├─ Si success = false:
   │  └─ Mostrar error con opción de reintento
   └─ En ambos casos:
      └─ Guardar invoiceId en estado local para referencia
```

### Código TypeScript - POST /api/invoices/enviar

```typescript
// app/api/invoices/enviar/route.ts

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { resolveHKACredentials } from '@/lib/hka/credentials-manager';
import { HKASOAPClient } from '@/lib/hka/soap/client';
import { generateInvoiceXML } from '@/lib/hka/xml/generator';
import { signXML } from '@/lib/certificates/signer';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SendInvoiceSchema = z.object({
  invoiceNumber: z.string(),
  receiverRuc: z.string().optional(),
  receiverName: z.string(),
  receiverEmail: z.string().email().optional(),
  receiverType: z.enum(['CONTRIBUYENTE', 'CONSUMIDOR_FINAL', 'GOBIERNO', 'EXTRANJERO']),
  items: z.array(z.object({
    description: z.string(),
    code: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    itbmsRate: z.enum(['0%', '7%', '10%', '15%']),
  })),
  subtotal: z.number(),
  itbms: z.number(),
  total: z.number(),
});

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. VALIDAR SESIÓN Y PERMISOS
    // ========================================================================
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const requestId = crypto.randomUUID();
    const log = logger.child({
      requestId,
      userId: session.user.id,
      organizationId: session.user.organizationId,
    });

    log.info('Iniciando envío de factura');

    // ========================================================================
    // 2. VALIDAR INPUT
    // ========================================================================
    const body = await request.json();
    const invoiceData = SendInvoiceSchema.parse(body);

    log.debug('Input validado', { invoiceNumber: invoiceData.invoiceNumber });

    // ========================================================================
    // 3. OBTENER CREDENCIALES DEL USUARIO
    // ========================================================================
    const credentials = await resolveHKACredentials(
      session.user.organizationId,
      { userId: session.user.id }
    );

    if (!credentials) {
      log.error('No hay credenciales configuradas');
      return Response.json({
        success: false,
        error: 'No has configurado credenciales HKA',
        helpUrl: '/dashboard/configuracion/credenciales-hka',
      }, { status: 400 });
    }

    // ========================================================================
    // 4. CREAR INVOICE EN BD (STATUS: DRAFT)
    // ========================================================================
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: session.user.organizationId,
        createdByUserId: session.user.id,
        invoiceNumber: invoiceData.invoiceNumber,

        issuerRuc: session.user.organization.ruc,
        issuerName: session.user.organization.name,
        issuerAddress: 'Panama', // TODO: Obtener de configuración

        receiverRuc: invoiceData.receiverRuc,
        receiverName: invoiceData.receiverName,
        receiverEmail: invoiceData.receiverEmail,
        receiverType: invoiceData.receiverType,

        invoiceDate: new Date(),
        subtotal: invoiceData.subtotal,
        itbms: invoiceData.itbms,
        total: invoiceData.total,

        status: 'DRAFT',

        items: {
          create: invoiceData.items.map(item => ({
            description: item.description,
            code: item.code,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itbmsRate: item.itbmsRate,
            lineTotal: item.quantity * item.unitPrice,
            lineTax: (item.quantity * item.unitPrice * parseFloat(item.itbmsRate)) / 100,
          })),
        },
      },
      include: {
        items: true,
        logs: true,
      },
    });

    log.debug('Invoice creada en BD', { invoiceId: invoice.id, status: 'DRAFT' });

    // ========================================================================
    // 5. GENERAR XML
    // ========================================================================
    let xmlDocument: string;

    try {
      xmlDocument = generateInvoiceXML(invoice);
      log.debug('XML generado');
    } catch (error) {
      log.error('Error generando XML', { error });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'FAILED',
          logs: {
            create: {
              action: 'ERROR',
              message: 'Error generando XML',
              details: { error: String(error) },
            },
          },
        },
      });

      return Response.json({
        success: false,
        error: 'Error generando XML de factura',
        invoiceId: invoice.id,
      }, { status: 400 });
    }

    // ========================================================================
    // 6. FIRMAR DIGITALMENTE (OPCIONAL - SI USER TIENE CERTIFICADO)
    // ========================================================================
    let signedXmlDocument = xmlDocument;

    const certificateConfig = await prisma.digitalSignatureConfig.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: session.user.organizationId,
        },
      },
    });

    if (certificateConfig) {
      try {
        signedXmlDocument = await signXML(xmlDocument, certificateConfig);
        log.debug('XML firmado digitalmente');
      } catch (error) {
        log.error('Error firmando XML', { error });

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'FAILED',
            logs: {
              create: {
                action: 'ERROR',
                message: 'Error firmando XML',
              },
            },
          },
        });

        return Response.json({
          success: false,
          error: 'Error firmando documento con certificado digital',
          invoiceId: invoice.id,
        }, { status: 400 });
      }
    } else {
      log.warn('Usuario sin certificado digital configurado');
    }

    // ========================================================================
    // 7. ENVIAR A HKA
    // ========================================================================
    log.info('Enviando documento a HKA', {
      environment: credentials.environment,
      tokenUser: credentials.tokenUser.substring(0, 4) + '***',
    });

    let hkaResponse: any;

    try {
      const client = new HKASOAPClient(credentials);
      hkaResponse = await client.enviarDocumento(signedXmlDocument);

      log.info('Respuesta recibida de HKA', {
        codigo: hkaResponse.codigo,
        mensaje: hkaResponse.mensaje,
      });
    } catch (error) {
      log.error('Error enviando a HKA', { error });

      const errorMessage = error instanceof Error ? error.message : String(error);

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'FAILED',
          hkaErrorMessage: errorMessage,
          sentToHkaAt: new Date(),
          logs: {
            create: {
              action: 'ERROR',
              message: 'Error enviando a HKA',
              details: { error: errorMessage },
            },
          },
        },
      });

      return Response.json({
        success: false,
        error: 'No se pudo conectar con The Factory HKA',
        details: errorMessage,
        invoiceId: invoice.id,
      }, { status: 502 });
    }

    // ========================================================================
    // 8. PROCESAR RESPUESTA DE HKA
    // ========================================================================
    if (hkaResponse.codigo === '0' || hkaResponse.codigo === 0) {
      // ✅ ÉXITO: Factura certificada
      const cufe = hkaResponse.cufe;
      const qrCodeUrl = hkaResponse.qr;

      log.info('Factura certificada por HKA', { cufe });

      // Guardar respuesta en BD
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'CERTIFIED',
          cufe,
          qrCodeUrl,
          hkaResponseJson: hkaResponse, // Guardar respuesta completa (sin encriptar)
          sentToHkaAt: new Date(),
          hkaResponseReceivedAt: new Date(),
          logs: {
            create: {
              action: 'CERTIFIED',
              message: 'Factura certificada por The Factory HKA',
              details: { cufe, qr: qrCodeUrl },
            },
          },
        },
      });

      // ====================================================================
      // 9. DESCARGAR PDF DE HKA
      // ====================================================================
      let pdfUrl: string | null = null;

      try {
        // HKA proporciona URL para descargar PDF
        // Guardamos la URL en la BD
        if (hkaResponse.pdfUrl) {
          pdfUrl = hkaResponse.pdfUrl;

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              pdfUrl,
              pdfGeneratedAt: new Date(),
            },
          });

          log.debug('URL de PDF guardada');
        }
      } catch (error) {
        log.warn('Error descargando/guardando PDF', { error });
        // No es crítico si falla PDF, continuamos
      }

      const duration = Date.now() - startTime;

      return Response.json({
        success: true,
        message: 'Factura certificada exitosamente',
        invoiceId: invoice.id,
        cufe,
        qrCodeUrl,
        pdfUrl,
        invoiceNumber: invoice.invoiceNumber,
        duration,
      });
    } else {
      // ❌ FALLA: HKA rechazó
      const errorCode = hkaResponse.codigo;
      const errorMessage = hkaResponse.mensaje;

      log.error('HKA rechazó la factura', {
        codigo: errorCode,
        mensaje: errorMessage,
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'FAILED',
          hkaErrorCode: String(errorCode),
          hkaErrorMessage: errorMessage,
          hkaResponseJson: hkaResponse,
          sentToHkaAt: new Date(),
          hkaResponseReceivedAt: new Date(),
          logs: {
            create: {
              action: 'ERROR',
              message: `The Factory HKA rechazó: ${errorMessage}`,
              details: { codigo: errorCode, mensaje: errorMessage },
            },
          },
        },
      });

      return Response.json({
        success: false,
        error: 'The Factory HKA rechazó la factura',
        details: errorMessage,
        invoiceId: invoice.id,
        hkaErrorCode: errorCode,
      }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error no manejado en POST /api/invoices/enviar', { error });

    return Response.json({
      success: false,
      error: 'Error interno del servidor',
      requestId,
    }, { status: 500 });
  }
}
```

---

## ESTRUCTURA DE RESPUESTAS

### Respuesta Exitosa (HKA Certificó)

```json
{
  "success": true,
  "message": "Factura certificada exitosamente",
  "invoiceId": "inv_abc123",
  "cufe": "2024010100001001000000065000000123456789AABBCC",
  "qrCodeUrl": "https://factura.thefactoryhka.com.pa/qr/...",
  "pdfUrl": "https://emision.thefactoryhka.com.pa/pdf/...",
  "invoiceNumber": "001",
  "duration": 3456 // milliseconds
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": "No se pudo conectar con The Factory HKA",
  "details": "Credenciales inválidas",
  "invoiceId": "inv_abc123",
  "hkaErrorCode": "401",
  "requestId": "req_xyz789"
}
```

---

## COMPONENTES FRONTEND

### Modal de Respuesta - InvoiceSuccessModal.tsx

```typescript
// components/invoices/InvoiceSuccessModal.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CopyIcon, DownloadIcon, QrCodeIcon } from 'lucide-react';

interface InvoiceSuccessModalProps {
  open: boolean;
  cufe: string;
  qrCodeUrl: string;
  pdfUrl: string;
  invoiceNumber: string;
  invoiceId: string;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export function InvoiceSuccessModal({
  open,
  cufe,
  qrCodeUrl,
  pdfUrl,
  invoiceNumber,
  invoiceId,
  onClose,
  onDownloadPdf,
}: InvoiceSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCUFE = async () => {
    await navigator.clipboard.writeText(cufe);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Factura Certificada Exitosamente
          </DialogTitle>
          <DialogDescription>
            Tu factura ha sido certificada por The Factory HKA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ================================================================
              CUFE - Código Único de Factura Electrónica
              ================================================================ */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-sm font-medium text-gray-700">
              CUFE (Código Único de Factura Electrónica)
            </label>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 bg-white p-3 rounded border font-mono text-sm break-all">
                {cufe}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCUFE}
                title="Copiar CUFE"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-2">✓ Copiado al portapapeles</p>
            )}
          </div>

          {/* ================================================================
              QR CODE
              ================================================================ */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <QrCodeIcon className="h-4 w-4" />
              Código QR
            </label>
            <div className="mt-3 flex justify-center">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 border-2 border-gray-200 rounded"
                />
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              Escanea este código con tu dispositivo móvil
            </p>
          </div>

          {/* ================================================================
              INFORMACIÓN DE FACTURA
              ================================================================ */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Número de Factura</p>
              <p className="font-semibold text-gray-900">{invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">ID Interno</p>
              <p className="font-mono text-sm text-gray-700">{invoiceId}</p>
            </div>
          </div>

          {/* ================================================================
              BOTONES DE ACCIÓN
              ================================================================ */}
          <div className="flex gap-2">
            {pdfUrl && (
              <Button
                onClick={onDownloadPdf}
                className="flex-1 gap-2"
                size="lg"
              >
                <DownloadIcon className="h-4 w-4" />
                Descargar PDF de The Factory HKA
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              size="lg"
            >
              Cerrar
            </Button>
          </div>

          {/* ================================================================
              INFORMACIÓN ADICIONAL
              ================================================================ */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>✓ Tu factura está certificada.</strong> Puedes acceder a ella en
              cualquier momento desde el historial de facturas.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Uso en Página de Crear Factura

```typescript
// app/dashboard/invoices/crear/page.tsx

'use client';

import { useState } from 'react';
import { InvoiceSuccessModal } from '@/components/invoices/InvoiceSuccessModal';

export default function CrearFacturaPage() {
  const [successData, setSuccessData] = useState<{
    cufe: string;
    qrCodeUrl: string;
    pdfUrl: string;
    invoiceNumber: string;
    invoiceId: string;
  } | null>(null);

  const handleEnviarFactura = async (formData: any) => {
    try {
      const response = await fetch('/api/invoices/enviar', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        // Mostrar error
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Mostrar modal de éxito
        setSuccessData({
          cufe: data.cufe,
          qrCodeUrl: data.qrCodeUrl,
          pdfUrl: data.pdfUrl,
          invoiceNumber: data.invoiceNumber,
          invoiceId: data.invoiceId,
        });
      }
    } catch (error) {
      // Manejar error
    }
  };

  const handleDescargarPdf = async () => {
    if (successData?.pdfUrl) {
      window.open(successData.pdfUrl, '_blank');
    }
  };

  return (
    <>
      {/* Formulario de factura */}
      <InvoiceForm onSubmit={handleEnviarFactura} />

      {/* Modal de éxito */}
      {successData && (
        <InvoiceSuccessModal
          open={!!successData}
          cufe={successData.cufe}
          qrCodeUrl={successData.qrCodeUrl}
          pdfUrl={successData.pdfUrl}
          invoiceNumber={successData.invoiceNumber}
          invoiceId={successData.invoiceId}
          onClose={() => setSuccessData(null)}
          onDownloadPdf={handleDescargarPdf}
        />
      )}
    </>
  );
}
```

---

## AISLAMIENTO DE DATOS

### Principios de Aislamiento

```typescript
// ========================================================================
// AISLAMIENTO POR USUARIO Y ORGANIZACIÓN
// ========================================================================

// ✅ CORRECTO: Solo datos del usuario logueado
async function getInvoices(userId: string, organizationId: string) {
  return prisma.invoice.findMany({
    where: {
      createdByUserId: userId,
      organizationId: organizationId,
    },
  });
}

// ❌ INCORRECTO: Sin filtro de usuario
async function getInvoicesWrong() {
  return prisma.invoice.findMany({}); // ¡TODOS LOS DATOS!
}

// ========================================================================
// MIDDLEWARE DE VERIFICACIÓN DE PERMISOS
// ========================================================================

export async function verifyInvoiceOwnership(
  invoiceId: string,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      createdByUserId: userId,
      organizationId: organizationId,
    },
  });

  return !!invoice;
}

// En rutas:
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  const isOwner = await verifyInvoiceOwnership(
    params.id,
    session.user.id,
    session.user.organizationId
  );

  if (!isOwner) {
    return Response.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  // ... obtener data segura
}
```

---

## PERSISTENCIA

### Base de Datos

```typescript
// Todas las tablas tienen timestamps y aislamiento:
model Invoice {
  // ... campos
  createdByUserId String    // ← Quién creó
  organizationId  String    // ← Cuál organización
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Índices para queries rápidas
  @@index([createdByUserId])
  @@index([organizationId])
  @@unique([organizationId, invoiceNumber]) // Un número por org
}
```

### Historial de Auditoría

```typescript
// InvoiceLog persiste todos los cambios
model InvoiceLog {
  id          String @id @default(cuid())
  invoiceId   String
  action      String // CREATED | SENT_TO_HKA | CERTIFIED | ERROR
  message     String
  details     Json?
  createdAt   DateTime @default(now())
}

// Ejemplo de uso:
await prisma.invoiceLog.create({
  data: {
    invoiceId: invoice.id,
    action: 'CERTIFIED',
    message: 'Factura certificada por HKA',
    details: {
      cufe: 'abc123',
      timestamp: new Date().toISOString(),
    },
  },
});
```

---

## TESTING

### Test 1: Flujo Completo

```typescript
// __tests__/integration/invoice-complete-flow.test.ts

describe('Invoice Complete Flow', () => {
  it('should create, send, and certify invoice', async () => {
    // 1. Usuario con credenciales configuradas
    const user = await createTestUser();
    const credentials = await saveTestCredentials(user);

    // 2. Crear factura
    const invoice = await createInvoice(user, {
      invoiceNumber: '001',
      receiverName: 'Cliente Test',
      items: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
    });

    expect(invoice.status).toBe('DRAFT');

    // 3. Enviar a HKA
    const response = await sendInvoice(invoice, credentials);

    expect(response.success).toBe(true);
    expect(response.cufe).toBeDefined();
    expect(response.qrCodeUrl).toBeDefined();

    // 4. Verificar BD
    const updatedInvoice = await getInvoice(invoice.id);
    expect(updatedInvoice.status).toBe('CERTIFIED');
    expect(updatedInvoice.cufe).toBe(response.cufe);

    // 5. Verificar aislamiento
    const otherUser = await createTestUser();
    const canAccess = await verifyInvoiceOwnership(
      invoice.id,
      otherUser.id,
      user.organizationId
    );
    expect(canAccess).toBe(false); // ✓ Aislado
  });
});
```

---

**Continúa en próxima sección: Implementación**


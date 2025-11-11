# Arquitectura General

## Visión Global

SAGO FACTU es una plataforma SaaS multi-tenant construida sobre **Next.js 15 (App Router)** que actúa como backend y frontend unificado. Opera como intermediario entre clientes corporativos panameños y el PAC **The Factory HKA** para emitir y certificar facturas electrónicas bajo el estándar rFE.

```
Clientes → UI Next.js → Server Actions / API Routes → Servicios internos → HKA SOAP → DGI Panamá
                           │                     │
                           └── Prisma ORM ───────┘
                               │
                               └── PostgreSQL (Neon)
```

### Capas Principales

| Capa | Ubicación | Responsabilidades |
|------|-----------|-------------------|
| Presentación | `app/`, `components/` | Interfaces React 19, formularios con React Hook Form, tablas shadcn/ui. |
| Dominio/Servicios | `lib/` | Autenticación NextAuth, integración HKA, colas BullMQ, utilidades, monitores. |
| Persistencia | `prisma/`, `lib/prisma*.ts` | Prisma Client, extensiones (accelerate, encryption, pagination). |
| Infraestructura | `scripts/`, `docker-compose.yml`, `Dockerfile` | Setup, seeds, tareas de mantenimiento y deployment. |

## Flujo de Facturación

1. Usuario autentica vía NextAuth (Credentials Provider).
2. Server Action en `app/dashboard/facturas/nueva` valida con esquemas Zod.
3. Se crea registro `Invoice` con estado `QUEUED` y se reserva folio.
4. Un worker BullMQ (`lib/workers/invoice-processor.ts`) transforma los datos a XML rFE.
5. Cliente SOAP (`lib/hka/soap/client.ts`) envía la factura a HKA.
6. Respuesta firmada se almacena en S3 y se actualiza la factura (`CERTIFIED`).
7. Se notifican usuarios vía Resend y se actualiza el dashboard en tiempo casi real.

## Módulos Destacados

- **Integración HKA (`lib/hka/*`)**
  - `methods/`: llamadas SOAP (consultar folios, enviar documento, etc.).
  - `transformers/`: mapea entidades Prisma a XML requerido por HKA.
  - `validators/`: asegura conformidad con rFE y reglas locales.
  - `utils/logger.ts`: logging estructurado y métricas para diagnóstico.

- **Gestión de Folios**
  - `FolioPool`, `FolioAssignment`, `FolioConsumption` gestionan compra, asignación y consumo.
  - UI en `app/dashboard/folios` y `components/folios/*`.

- **Sistema de Monitoreo**
  - `lib/monitoring/*`: wrappers para métricas (colas, salud de HKA).
  - `app/dashboard/monitores`: interfaz de monitoreo con gráficas y estados.

- **Seguridad**
  - `lib/auth/*`: helper de autenticación, políticas de rol, sanitización.
  - `lib/middleware/api-logger.ts`: logging y control de errores centralizados.

## Comunicaciones Externas

| Servicio | Uso | Notas |
|----------|-----|-------|
| The Factory HKA (SOAP) | Certificación de facturas, consulta de folios | Autenticación con token + firma digital. |
| AWS S3 | Almacenamiento de XML y PDFs certificados | Encriptación mediante `prisma-field-encryption`. |
| Resend | Notificaciones por correo | Plantillas definidas en `components/invoices/email-*`. |
| Redis | Colas BullMQ, rate limiting | Requerido para workers y monitorización. |

## Escalabilidad

- Next.js App Router permite SSR/ISR y edge functions si se despliega en Vercel.
- Colas BullMQ escalan horizontalmente con múltiples workers.
- Prisma Accelerate habilita operaciones read-heavy con caché distribuido (opcional).
- Arquitectura multi-tenant permite aislamiento por organización con mínimos cambios.

### Diagrama de Componentes (alto nivel)

```
┌───────────┐     ┌──────────────┐     ┌───────────┐
│  Next.js  │ --> │ API Routes   │ --> │ Prisma ORM│ --> PostgreSQL
│ (App + UI)│     │ Server Actions│     └───────────┘
└───────────┘     │ Background   │
        │         │ Workers      │
        ▼         └──────┬───────┘
 ┌─────────────┐         │
 │ Redis/BullMQ│◄────────┘
 └─────────────┘         │
        │                ▼
        │         ┌─────────────┐
        └────────►│ HKA SOAP API│
                  └─────────────┘
```

## Referencias

- `docs/architecture/database-schema.md`: detalla entidades y relaciones.
- `docs/architecture/tech-decisions.md`: decisiones técnicas, trade-offs y estándares.
- `docs/deployment/*`: despliegues en Docker, Oracle Cloud y Google Cloud.


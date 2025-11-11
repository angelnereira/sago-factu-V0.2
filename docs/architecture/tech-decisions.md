# Decisiones Técnicas

## Framework y Lenguaje

- **Next.js 15 (App Router)** para unificar frontend y backend, aprovechando Server Actions y rutas API.
- **TypeScript estricto** para contratos end-to-end (UI ↔ API ↔ Prisma).
- **React 19** con server components y Suspense para mejoras de performance.

## Autenticación

- **NextAuth v5** con Credentials Provider.
- Tokens JWT firmados en servidor con roles y `organizationId`.
- Middleware minimalista; la protección principal se realiza en server components.
- Session cookies con `Secure`, `HttpOnly` y `SameSite=strict`.

## Multi-Tenancy

- Todas las entidades referencian `organizationId`.
- Policies de E2E se implementan en capa de servicio (`lib/auth/policies.ts`).
- Extensiones Prisma (`prisma-field-encryption`, `accelerate`) para rendimiento y seguridad.

## Integración HKA

- Cliente SOAP construido con `node-soap`.
- Transformadores específicos (`lib/hka/transformers/*`) convierten invoices Prisma a XML rFE.
- Validadores (`lib/hka/validators/xml-validator.ts`) aseguran cumplimiento de reglas fiscales.
- Retries exponenciales (`lib/hka/utils/retry.ts`) y logging granular (`lib/hka/utils/logger.ts`).

## Procesamiento Asíncrono

- **BullMQ** para colas críticas (procesar factura, sincronizar folios).
- **Redis** como backend de colas y cache puntual.
- Workers desacoplados (`lib/workers/*`) con métricas y alertas.

## UI/UX

- **shadcn/ui + Radix UI** para consistencia visual y accesibilidad.
- Tailwind CSS 4 con `tailwind-merge` para variantes dinámicas.
- Componentes reutilizables en `components/*`.
- Dark mode implementado con `next-themes`.

## Observabilidad

- Logging estructurado con `pino` y transportes configurables.
- Monitores internos (`lib/monitoring/*`) que integran con HKA.
- Paneles de auditoría en `app/dashboard/admin/auditoria`.
- Hooks de métricas para colas y HKA (`app/dashboard/admin/monitores`).

## Seguridad

- Cifrado de certificados digitales (clave maestra `CERTIFICATE_MASTER_KEY`).
- Validación de entrada y salida con Zod (`lib/validations/*`).
- Rate limiting con Upstash Redis (`@upstash/ratelimit`) para endpoints sensibles.
- Sanitización de errores centralizada (`lib/utils/api-error-response.ts`).

## Decisiones de Infraestructura

- Base de datos gestionada en Neon (pooling automático, escalado serverless).
- Contenedor Docker multi-stage para builds reproducibles.
- `docker-compose.yml` incluye app, PostgreSQL y Redis listos para desarrollo/QA.
- Guías de despliegue en Oracle Cloud y Google Cloud (docs/deployment/).

## Automatización y QA

- Jest para pruebas unitarias e integrales (`__tests__/`).
- Scripts específicos (`npm run test:excel-import`) para validar importaciones masivas.
- Husky + Commitlint para estandarizar commits (config en `commitlint.config.cjs`).
- Linter Next + ESLint 9 con reglas personalizadas documentadas en `docs/contributing/code-style.md`.

## Futuras Iteraciones (Backlog)

- Integrar un workflow CI/CD en GitHub Actions (build + tests + lint).
- Añadir métricas en tiempo real via WebSockets.
- Expandir soporte para multi-región y fallback de certificados.
- Automatizar verificación de credenciales HKA en pipeline.


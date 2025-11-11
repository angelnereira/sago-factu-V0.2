# SAGO FACTU — Plataforma SaaS de Facturación Electrónica para Panamá

![SAGO FACTU Banner](public/sago-factu-logo.png)

<p align="center">
  <a href="https://github.com/angelnereira/sago-factu-V0.2/actions"><img alt="Build" src="https://img.shields.io/badge/build-passing-00c853?style=flat-square"></a>
  <a href="./CHANGELOG.md"><img alt="Versión" src="https://img.shields.io/badge/version-0.7.0-blue?style=flat-square"></a>
  <a href="./LICENSE"><img alt="Licencia" src="https://img.shields.io/badge/license-MIT-ff9800?style=flat-square"></a>
  <a href="https://nextjs.org"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15.5.6-000000?logo=next.js&style=flat-square"></a>
  <a href="https://www.prisma.io/"><img alt="Prisma" src="https://img.shields.io/badge/Prisma-6.17.1-2D3748?logo=prisma&style=flat-square"></a>
</p>

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Características Clave](#características-clave)
- [Stack Tecnológico](#stack-tecnológico)
- [Demo y Capturas](#demo-y-capturas)
- [Quick Start](#quick-start)
- [Entorno y Configuración](#entorno-y-configuración)
- [Arquitectura](#arquitectura)
- [Guías de Uso](#guías-de-uso)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Resumen Ejecutivo

SAGO FACTU es una plataforma multi-tenant que centraliza la administración de folios y la emisión de facturas electrónicas para empresas panameñas mediante la integración directa con el Proveedor Autorizado de Certificación (PAC) **The Factory HKA**. El proyecto está pensado para entornos enterprise y soporta onboarding rápido, monitoreo en tiempo real y procesamiento asíncrono de documentos.

## Características Clave

- 🚀 **Multi-tenant completo** con aislamiento por organización y roles granularizados.
- 🧾 **Generación y envío de facturas rFE** a HKA, incluyendo validaciones avanzadas y seguimiento.
- 📦 **Gestión de folios**: compra, asignación y consumo con métricas en dashboard.
- 🔐 **Seguridad enterprise**: NextAuth v5, hashing bcrypt, cifrado de certificados digitales.
- ⚙️ **Procesamiento asíncrono** con BullMQ + Redis para jobs de certificación.
- 📊 **Dashboards y reportes** en tiempo real con gráficas y status detallados.
- ✉️ **Notificaciones automáticas** vía Resend y almacenamiento de XML/PDF en AWS S3.

## Stack Tecnológico

| Capa | Tecnología | Detalles |
|------|------------|----------|
| Frontend & Backend | Next.js 15 App Router, React 19, TypeScript 5 | Componentes shadcn/ui, Tailwind CSS 4 |
| Base de datos | PostgreSQL 15 (Neon Serverless) | Prisma ORM 6.17 con extensiones Accelerate, cifrado de campos |
| Autenticación | NextAuth.js v5 (Credentials) | JWT, callbacks personalizadas, roles multi-tenant |
| Integraciones | node-soap, AWS SDK v3, Resend | Cliente SOAP HKA, gestión de certificados p12/pfx |
| Jobs & Caché | BullMQ 5 + Redis | Workers para certificación y sincronizaciones |
| DevOps | Docker, Docker Compose, GitHub Actions (blueprint) | Scripts de setup y diagnostico |

Consulta la documentación ampliada en `docs/architecture/overview.md`.

## Demo y Capturas

> Añade tus capturas oficiales en `public/screenshots/` y enlázalas aquí para personalizar la demo visual del proyecto.

## Quick Start

```bash
git clone https://github.com/angelnereira/sago-factu-V0.2.git
cd sago-factu
npm install
cp .env.example .env
npm run setup && npm run db:migrate && npm run db:seed
npm run dev
```

Credenciales demo tras el seed:

- **Super Admin**: `admin@sago-factu.com` / `admin123`
- **Usuario Demo**: `usuario@empresa.com` / `usuario123`

## Entorno y Configuración

1. Requisitos mínimos: Node.js 20, Docker 24, PostgreSQL 15, Redis 7.
2. Revisa `.env.example` y ajusta las variables obligatorias.
3. Para scripts de automatización consulta `docs/guides/development-workflow.md`.
4. Guías de setup detallado en:
   - `docs/setup/installation.md`
   - `docs/setup/environment-setup.md`
   - `docs/setup/database-setup.md`

## Arquitectura

- **Monolito Next.js** con server actions, rutas API y middleware para control de acceso.
- **Capas principales**: `app/*` (UI y APIs), `lib/*` (servicios y utilidades), `components/*` (UI reusables), `prisma/*` (schema y seeds).
- **Integración HKA** encapsulada en `lib/hka/*` con transformers, clientes SOAP y validadores XML.
- **Jobs** (`lib/queue`, `lib/workers`) manejan la certificación y procesos intensivos.
- **Monitorización** vía módulos en `lib/monitoring` y paneles en `app/dashboard`.

Consulta `docs/architecture/overview.md` y `docs/architecture/tech-decisions.md` para diagramas y decisiones clave.

## Guías de Uso

- **Workflow de desarrollo**: `docs/guides/development-workflow.md`
- **API HTTP + Webhooks**: `docs/guides/api-documentation.md`
- **Testing (unit + integration + E2E)**: `docs/guides/testing.md`
- **Migraciones y seeds**: `docs/database/migrations.md` y `docs/database/seeds.md`
- **Backup & restore**: `docs/database/backup-restore.md`

## Deployment

| Plataforma | Documento | Contenido |
|------------|-----------|-----------|
| Docker | `docs/deployment/docker.md` | Imágenes multi-stage, docker-compose, healthchecks |
| Oracle Cloud | `docs/deployment/oracle-cloud.md` | Configuración de compute, redes, CI/CD |
| Google Cloud | `docs/deployment/google-cloud.md` | Cloud Run / Compute Engine, Cloud SQL, IAM |

Scripts de despliegue adicionales en `vercel-build.sh` y `scripts/`.

## Roadmap

- [x] Multi-tenancy con roles avanzados
- [x] Generación y certificación XML rFE
- [x] Dashboard de monitoreo de folios y facturas
- [ ] Integración directa con pasarelas de pago
- [ ] Portal de clientes auto-servicio
- [ ] Pipeline CI/CD en GitHub Actions
- [ ] Alertas en tiempo real con WebSockets

Consulta el detalle en `CHANGELOG.md` y abre un issue para proponer nuevas funcionalidades.

## Contribuir

Aceptamos contribuciones externas siguiendo la guía oficial:

- Lee `CONTRIBUTING.md` para conocer estándares de código, convenios de commits y flujo de PR.
- Usa `docs/contributing/code-style.md` para formateo y patrones aceptados.
- Aplica la plantilla `docs/contributing/pull-request-template.md` al abrir un PR.

### Scripts útiles

```bash
npm run lint             # Linting con ESLint + reglas personalizadas
npm run test             # Suite completa (unit + integration)
npm run test:unit        # Validaciones y utilidades
npm run test:integration # Importación de Excel y flujos críticos
npm run db:reset         # Reset completo + seed demo
```

## Licencia

Este proyecto se distribuye bajo licencia [MIT](./LICENSE). Consulta el documento para conocer los términos completos.

---

**SAGO FACTU** — Enterprise Billing Platform for Panamá  
Construido con ❤️ por el equipo de UbicSystem. Para soporte escribe a `soporte@sago-factu.com`.
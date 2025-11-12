# Changelog

Todas las novedades relevantes del proyecto se documentan aquí siguiendo [Conventional Commits](https://www.conventionalcommits.org/).

## [0.8.0] - 2025-11-12

### Added
- Sistema completo de certificados digitales multi-tenant con almacenamiento cifrado (P12/PFX).
- Firma XMLDSig (RSA-SHA256 + canonicalización exclusiva) integrada al flujo de envío a HKA.
- Endpoints `/api/certificates/*` y `/api/certificates/test-signature` para gestionar y validar certificados.
- Componentes UI (`CertificateManager`, `CertificateUploader`, `CertificateList`, `CertificateStatus`) visibles para todos los usuarios.
- Tests unitarios para cifrado de PIN y firma XML.
- Variable `CERTIFICATE_ENCRYPTION_KEY` documentada en `.env` y guías de entorno.

### Changed
- `ConfigurationTabs` habilita la pestaña de firma digital para cualquier rol autenticado.
- Documentación de API y setup actualizada con los nuevos endpoints y requisitos de firma.

---

## [0.7.0] - 2025-11-11

### Added
- README profesional con badges, quick start y roadmap actualizado.
- Nueva estructura documental bajo `docs/` (setup, arquitectura, deployment, database, guides, contributing).
- Guías de deployment para Docker, Oracle Cloud y Google Cloud.
- Documentación de migraciones, seeds y estrategias de backup.
- Guía de workflow de desarrollo, API y testing.
- `CONTRIBUTING.md`, `LICENSE`, `CHANGELOG.md` y plantilla de PR.
- Dockerfile multi-stage, `docker-compose.yml` y `.dockerignore`.
- Plantilla `.env.example` actualizada con variables obligatorias.

### Changed
- Reorganización de la documentación previa, identificando archivos obsoletos para archivo.
- README reemplazado por versión orientada a enterprise/portfolio.

### Deprecated
- Documentos históricos movidos a `docs/archive/` (ver listado en `docs/archive/ARCHIVE-INDEX.md`).

### Security
- Recordatorios explícitos sobre manejo de secretos y backups antes de migrar.

---

## Historial Anterior

Los cambios previos a la versión 0.7.0 están registrados en commits anteriores. Utiliza `git log` para consultar el detalle hasta que se complete la migración del historial a este archivo.

[0.7.0]: https://github.com/angelnereira/sago-factu-V0.2/releases/tag/v0.7.0
[0.8.0]: https://github.com/angelnereira/sago-factu-V0.2/releases/tag/v0.8.0


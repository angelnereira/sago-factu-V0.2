# Documentación de API

> Esta guía resume los endpoints principales expuestos por la aplicación Next.js (App Router) bajo `/app/api`. Las rutas utilizan JSON y autenticación basada en sesión/JWT manejada por NextAuth.

## Convenciones

- **Base URL (dev)**: `http://localhost:3000/api`
- **Autenticación**: cookie de sesión (NextAuth) o token JWT (para llamadas server-side).
- **Formato de respuesta**:

```json
{
  "data": {...},
  "meta": {...},
  "error": null
}
```

En caso de error se retorna `error` con código y mensaje.

## Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/[...nextauth]` | Endpoint manejado por NextAuth (credenciales). |
| `POST` | `/signup` | Registra un usuario y organización (plan demo). |

### Ejemplo `POST /signup`

```json
{
  "organization": "Empresa Demo",
  "email": "user@empresa.com",
  "password": "segura123",
  "confirmPassword": "segura123"
}
```

## Administración (Super Admin)

- `GET /admin/organizations`
- `POST /admin/organizations`
- `PATCH /admin/organizations/[orgId]/toggle`
- `GET /admin/users`
- `POST /admin/users/create`
- `PATCH /admin/users/[id]/update`
- `DELETE /admin/users/[id]/delete`

## Folios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/folios/available` | Disponibilidad de folios por organización. |
| `POST` | `/folios/purchase` | Registra compra de pool de folios. |
| `POST` | `/folios/assign` | Asigna folios a una organización. |
| `POST` | `/folios/sincronizar` | Sincroniza folios con HKA. |

## Facturas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/invoices/create` | Crea factura y la encola para certificación. |
| `POST` | `/invoices/[id]/process` | Reprocesa factura fallida. |
| `POST` | `/invoices/[id]/cancel` | Cancela factura (si HKA lo permite). |
| `GET` | `/invoices/[id]/xml` | Descarga XML certificado. |
| `GET` | `/invoices/[id]/pdf` | Descarga representación impresa. |
| `POST` | `/invoices/[id]/email/send` | Envía factura vía correo. |
| `GET` | `/invoices/[id]/email/history` | Historial de envíos. |

## Configuración

- `GET /configuration/organization`
- `PATCH /configuration/organization`
- `GET /configuration/invoice-settings`
- `PATCH /configuration/invoice-settings`
- `POST /configuration/test-hka-connection`
- `GET /configuration/users/[userId]`
- `PATCH /configuration/users/[userId]`
- `GET /configuration/users/[userId]/folio-history`

## Integración HKA

- `POST /settings/hka-credentials`: guarda credenciales cifradas.
- `POST /settings/digital-signature`: carga certificados `.pfx/.p12`.
- `POST /settings/test-hka-connection`: prueba conexión SOAP.
- `POST /documentos/enviar`: envía documento ad-hoc a HKA.
- `POST /documentos/anular`: solicita anulación (si el PAC lo soporta).

## Certificados digitales

- `GET /certificates`: lista certificados del tenant (incluye días hasta expiración).
- `POST /certificates`: sube un certificado `.p12/.pfx` y su PIN (ambos cifrados en servidor).
- `GET /certificates/{id}`: detalles de un certificado específico.
- `PUT /certificates/{id}`: activación/desactivación del certificado.
- `DELETE /certificates/{id}`: elimina un certificado (solo admins o super admins).
- `GET /certificates/{id}/validate`: valida estructura, vigencia y RUC del certificado.
- `POST /certificates/test-signature`: firma un XML de prueba y devuelve el resultado firmado.

## Monitoreo

- `GET /monitors/list`: listado de monitores configurados.
- `POST /monitors/create`: crea monitor personalizado.
- `POST /monitors/create-defaults`: repone monitores por defecto.
- `POST /monitors/trigger`: ejecuta chequeos manuales.
- `GET /monitors/hka-stats`: estadísticas de disponibilidad.

## Notificaciones

- `GET /notifications`: lista notificaciones de usuario.
- `PATCH /notifications/[id]/read`: marca como leída.

## Estructura de Errores

Las respuestas de error incluyen un código y detalles:

```json
{
  "data": null,
  "error": {
    "code": "HKA_INVALID_RESPONSE",
    "message": "El servicio HKA retornó un XML inválido",
    "details": {...}
  }
}
```

## Webhooks / Integraciones

- Implementa rutas adicionales bajo `/api/webhooks/*` (reserva de namespace).
- Autentica con API keys (`ApiKey` model) cuando se habiliten integraciones externas.

## Versionado

- Actualmente no se aplica versionado de rutas (`/api/v1`), pero está planificado. Documenta cualquier cambio rupturista en `CHANGELOG.md`.

## Testeo de API

- Usa la colección Postman/Insomnia en `docs/guides/api-collection.json` (añade tu propia colección).
- Ejecuta `npm run test:integration` para validar flujos críticos (importaciones, errores HKA).

## Recomendaciones

- Centraliza validaciones en Zod (`lib/validations/*`).
- Maneja errores con `lib/utils/api-error-response.ts`.
- Registra toda interacción con HKA vía `lib/hka/utils/logger.ts`.


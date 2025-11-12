# CASE-0001 · Configuración de firma digital falla con PIN almacenado

## Contexto
- **Fecha**: 12 de noviembre de 2025
- **Área**: Configuración de certificados digitales (`/dashboard/configuracion` → pestaña Firma digital)
- **Entorno**: Desarrollo
- **Responsable**: Equipo de plataforma SAGO-FACTU

## Síntomas
- Al subir un certificado `.p12` desde la UI aparecía un mensaje genérico de error con el PIN (`I&2i5cU3`).
- En la consola del navegador se observaba `POST /api/certificates 500`.
- No se generaban registros exitosos en la tabla de certificados.

## Evidencia
```text
POST https://localhost:3000/api/certificates 500 (Internal Server Error)
```

## Causa raíz
1. La migración `20241112_add_digital_certificate_model` no se había aplicado al motor PostgreSQL, por lo que Prisma lanzaba `relation "digital_certificates" does not exist`.
2. Faltaba definir la variable de entorno `CERTIFICATE_ENCRYPTION_KEY`, requerida para cifrar el PIN con AES-256-GCM.

## Resolución
1. **Baselinar migración** (la base ya tenía datos previos):
   ```bash
   npx prisma migrate resolve --applied 20241112_add_digital_certificate_model
   npx prisma db push
   npx prisma migrate deploy
   ```
2. **Configurar variables sensibles** en `.env`:
   ```bash
   CERTIFICATE_MASTER_KEY=<hex-32-bytes>
   CERTIFICATE_ENCRYPTION_KEY=<hex-32-bytes>
   ```
3. Reiniciar el servidor Next.js para recargar las variables.
4. Reintentar la subida del certificado desde la UI.

## Verificación
- `GET /api/certificates` devuelve el nuevo certificado con estado `isActive: true`.
- El XML demo firmado a través de `POST /api/certificates/test-signature` contiene el bloque `<ds:Signature>`.
- No se registran errores en consola ni en logs del servidor.

## Acciones preventivas
- Documentar ambas variables en `env.example`, `env.template` y `docs/setup/environment-setup.md` (completado).
- Mantener un script de verificación (`npx prisma migrate deploy`) en el pipeline al iniciar un entorno.
- Crear pruebas automatizadas que verifiquen la existencia de la tabla `digital_certificates` y la presencia de las variables de entorno críticas.

---

**Estado**: Resuelto  
**Última actualización**: 12/nov/2025



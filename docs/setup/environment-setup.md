# Configuración de Entorno

Esta guía detalla cómo preparar variables de entorno y servicios externos para ejecutar SAGO FACTU en desarrollo y producción.

## Variables de Entorno

### Plantilla

- Copia `.env.example` a `.env`.
- Completa los valores obligatorios marcados como **Required**.

```bash
cp .env.example .env
```

### Variables Críticas

| Variable | Descripción | Entorno |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Neon, RDS, local) | Dev/Prod |
| `NEXTAUTH_SECRET` | Clave de 32 bytes para NextAuth (openssl rand -base64 32) | Dev/Prod |
| `NEXTAUTH_URL` | URL pública de la app (`http://localhost:3000` en dev) | Dev/Prod |
| `REDIS_URL` | Redis para BullMQ (`redis://localhost:6379`) | Dev/Prod |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credenciales IAM con permisos para S3 | Prod |
| `AWS_REGION` | Región S3 (ej: `us-east-1`) | Prod |
| `AWS_S3_BUCKET` | Bucket para XML/PDF certificados | Prod |
| `RESEND_API_KEY` | API key de Resend para notificaciones | Prod |
| `CERTIFICATE_MASTER_KEY` | Clave hex de 32 bytes para cifrar certificados (.pfx) | Dev/Prod |
| `HKA_SOAP_URL` | URL WSDL de HKA (`https://demo.thefactoryhka.com.pa/...`) | Dev/Prod |
| `HKA_CLIENT_ID` / `HKA_CLIENT_SECRET` | Credenciales emitidas por HKA | Prod |

> Para entornos demo puedes habilitar `HKA_DEMO_USE_FAKE_SIGNATURE=true` y omitir los certificados físicos.

### Archivos de referencia

- `vercel-env.example.txt`: variables mínimas para entornos serverless.
- `vercel-env-production.txt`: checklist para producción en Vercel.
- `docs/deployment/docker.md`: describe cómo inyectar variables en Docker Compose.

## Servicios Dependientes

### PostgreSQL

```bash
docker compose up -d postgres
# Usuario: postgres / postgres (ver docker-compose.yml)
```

El proyecto está optimizado para Neon Serverless. Ajusta `DATABASE_URL` acorde al proveedor utilizado.

### Redis

```bash
docker compose up -d redis
```

Redis es requerido para colas BullMQ. Puedes usar Upstash o Elasticache en producción.

### AWS S3

1. Crea un bucket (ej: `sago-factu-storage`).
2. Limita el acceso a HTTPS y habilita versionado opcionalmente.
3. Genera un usuario IAM con política restringida al bucket.
4. Guarda las claves en tu `.env`.

### Resend

- Registra la aplicación y añade un dominio verificado.
- Copia la API key en `RESEND_API_KEY`.
- Define `RESEND_EMAIL_FROM` si deseas usar remitentes personalizados.

## Buenas Prácticas

- Nunca subas `.env` ni claves sensibles; usa `.gitignore`.
- Mantén secretos en gestores como 1Password, Vault o Secret Manager.
- Automatiza la validación de variables con `npm run check-config`.
- Revisa el checklist de seguridad en `docs/architecture/tech-decisions.md`.


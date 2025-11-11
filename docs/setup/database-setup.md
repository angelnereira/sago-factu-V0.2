# Configuración de Base de Datos

## Esquema y Migraciones

- ORM oficial: **Prisma 6.17.1**
- Base recomendada: **PostgreSQL 15** (Neon Serverless por defecto)
- Multi-tenant por `organizationId` con cascada controlada

### Inicialización rápida

```bash
# 1. Generar Prisma Client
npm run db:generate

# 2. Crear estructura con migraciones
npm run db:migrate

# 3. Poblar datos demo
npm run db:seed
```

> Usa `npm run db:reset` para reiniciar todo el esquema (destruye datos actuales).

## Configuración Local con Docker

El archivo `docker-compose.yml` provee un servicio PostgreSQL optimizado.

```bash
docker compose up -d postgres
```

- Puerto expuesto: `5432`
- Base por defecto: `sago_factu`
- Credenciales: ver `docker-compose.yml`

Actualiza la variable `DATABASE_URL` acorde a la configuración:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sago_factu?schema=public"
```

## Conexión a Neon

1. Crea un proyecto en [Neon](https://neon.tech).
2. Genera una branch `main` y copia la cadena de conexión.
3. Habilita `sslmode=require`.
4. Ajusta `DATABASE_URL` y ejecuta `npm run db:migrate`.

Consulta `docs/guides/development-workflow.md` para scripts de diagnóstico (`npm run neon:info`).

## Seeds Disponibles

- `prisma/seed.ts`: Crea organización demo, usuarios y catálogos base.
- `prisma/seeds/*`: Scripts auxiliares para entornos simples.
- `prisma/seed-simple.ts`: Configuración para el plan “Simple”.

Ejecuta seeds específicos con:

```bash
npm run db:seed                  # seed general
tsx prisma/seed-simple-user.ts   # crea usuario simple
```

## Backups

Consulta `docs/database/backup-restore.md` para estrategias automáticas y manuales antes de migrar o actualizar el esquema.


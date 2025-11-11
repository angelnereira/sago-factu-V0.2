# Guía de Migraciones

## Herramienta

- **Prisma Migrate** con esquema en `prisma/schema.prisma`.
- Migraciones versionadas en `prisma/migrations/*`.

## Comandos Clave

| Acción | Comando | Notas |
|--------|---------|-------|
| Crear nueva migración | `npx prisma migrate dev --name add-new-feature` | Ejecuta migraciones pendientes y genera archivos SQL. |
| Aplicar migraciones (dev) | `npm run db:migrate` | Equivalente a `prisma migrate dev`. |
| Aplicar en producción | `npx prisma migrate deploy` | Sin prompts; usa en CI/CD. |
| Deshacer última migración | `npx prisma migrate reset` | Destruye datos, úsalo solo en dev/test. |
| Sincronizar esquema sin historial | `npm run db:push` | Evita en prod; útil en prototipos. |

## Estrategia Recomendada

1. Modifica `prisma/schema.prisma`.
2. Genera migración:

```bash
npx prisma migrate dev --name descripcion-corta
```

3. Verifica los archivos en `prisma/migrations/<timestamp>/migration.sql`.
4. Ejecuta tests (`npm run test:unit`, `npm run test:integration`).
5. Actualiza `CHANGELOG.md`.
6. Sube los cambios y ejecuta `prisma migrate deploy` en producción (CI/CD).

## Migraciones en Producción

- Usa `DATABASE_URL` apuntando a la base productiva.
- Ejecuta:

```bash
npx prisma migrate deploy
```

- Habilita backups automáticos antes de cada release (ver `docs/database/backup-restore.md`).
- Preferir ventanas de mantenimiento o zero-downtime:
  - Agrega columnas como `nullable`.
  - Evita renombrar columnas; crea nuevas y migra datos manualmente.
  - Para operaciones pesadas usa scripts SQL independientes.

## Seeds y Datos Iniciales

- Tras migrar en entornos nuevos ejecuta `npm run db:seed`.
- Seeds especializados (`prisma/seeds/*`) para planes específicos (Simple/Enterprise).

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| Error `The migration failed` | Cambios incompatibles con datos existentes. | Ajusta la migración SQL manualmente o prepara scripts de transición. |
| `prisma migrate deploy` no detecta migraciones | No se generó la migración. | Ejecuta `npx prisma migrate dev` y commitea los archivos. |
| Desincronización schema ↔ DB | Se alteró la DB manualmente. | Ejecuta `npx prisma db pull` y alinea el schema, documenta los cambios. |

## Automatización

- Añade al pipeline (ej. GitHub Actions):

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed # opcional con bandera para evitar sobreescritura
```

Controla seeds en producción con flags o secciones idempotentes.


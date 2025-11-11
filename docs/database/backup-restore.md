# Backup y Restore

## Estrategia General

1. Automatiza backups diarios de PostgreSQL.
2. Mantén al menos 7 snapshots rotatorios y 2 backups mensuales.
3. Genera dumps antes de:
   - Ejecutar migraciones mayores.
   - Actualizar la aplicación.
   - Cambiar configuraciones de infraestructura.
4. Almacena backups cifrados en Object Storage (S3/OCI/GCS).

## PostgreSQL (pg\_dump)

### Backup manual

```bash
pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --file=backups/sago-factu-$(date +%Y%m%d%H%M).dump
```

### Restore

```bash
pg_restore \
  --clean \
  --if-exists \
  --dbname="$DATABASE_URL" \
  backups/sago-factu-20250101.dump
```

> Revisa la variable `DATABASE_URL`; en entornos productivos usa cuentas read-only para realizar los dumps.

## Neon / Bases Serverless

- Habilita **branching** y backups automáticos en el panel de Neon.
- Antes de migrar crea una branch temporal (`neonctl branches create backup-YYYYMMDD`).
- Si ocurre un problema, promueve la branch de respaldo o crea una nueva a partir del snapshot.

## Automatización

Ejemplo usando cron + AWS CLI:

```bash
0 3 * * * pg_dump --dbname="$DATABASE_URL" --format=custom | \
  aws s3 cp - s3://sago-factu-backups/db/$(date +\%Y/\%m)/sago-factu-$(date +\%Y%m%d).dump
```

- Configura `aws s3 cp` con `--sse AES256` o claves KMS.
- Usa usuarios IAM con permisos limitados al bucket de backups.

## Verificación

- Ejecuta restores en un entorno de staging mensualmente.
- Usa `pg_restore --list` para revisar el contenido del dump.
- Valida integridad de certificados y archivos XML almacenados (S3) — sincroniza con `aws s3 sync`.

## Restore en Emergencia

1. Detén workers y tráfico (modo mantenimiento).
2. Restaura la base con `pg_restore`.
3. Ejecuta `npm run db:migrate` para asegurar compatibilidad con el esquema actual.
4. Revisar logs de Prisma/BullMQ y reiniciar servicios.

## Archivos Adjuntos

- Scripts utilitarios en `scripts/backup/` (crea plantillas según tu entorno).
- Documenta cada restore exitoso en `CHANGELOG.md` o en runbooks internos.


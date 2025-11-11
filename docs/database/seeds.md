# Seeds y Datos Iniciales

## Objetivo

Proveer datos de referencia para:

- Probar el flujo completo de facturación.
- Crear usuarios demo.
- Configurar organizaciones, folios y certificados ficticios.

## Scripts Disponibles

| Archivo | Descripción |
|---------|-------------|
| `prisma/seed.ts` | Seed principal (organización Enterprise demo, usuarios, monitoreo). |
| `prisma/seed-simple.ts` | Configuración mínima para el plan Simple. |
| `prisma/seed-simple-user.ts` | Crea usuario adicional para demos. |
| `prisma/seeds/*.ts` | Scripts especializados (foliación masiva, configuración HKA). |

## Ejecución

```bash
npm run db:seed
# o
tsx prisma/seed-simple.ts
```

- Asegúrate de tener las migraciones aplicadas previamente.
- Puedes pasar variables vía CLI (`NODE_ENV`, `SEED_PLAN=simple`).

## Datos Incluidos

- Organización `Empresa Demo S.A.` con `slug=empresa-demo`.
- Usuarios:
  - `admin@sago-factu.com` / `admin123` (SUPER_ADMIN)
  - `usuario@empresa.com` / `usuario123` (USER)
- Pools de folios de ejemplo y asignaciones iniciales.
- Configuración HKA en modo demo (`HKA_DEMO_USE_FAKE_SIGNATURE=true`).

## Buenas Prácticas

- Haz los seeds **idempotentes** (verifica existencia antes de crear registros).
- Encapsula lógica en funciones reutilizables (`prisma/seeds/utils.ts` si aplica).
- Evita credenciales reales; usa valores clearly marcados como demo.
- Documenta cambios en `CHANGELOG.md` y en esta guía.

## Seeds en Producción

- Úsalos solo para bootstrap inicial (super admin, organización principal).
- Protege el script con banderas para evitar re-ejecuciones accidentales.
- Considera mover seeds críticos a migraciones SQL en lugar de scripts TypeScript.

## Limpieza

- `npm run db:reset` ejecuta:
  1. `prisma migrate reset --force`
  2. `npm run db:seed`
- Útil para entornos locales o CI.

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `Unique constraint failed` | Seed no idempotente. | Usa `upsert` o verifica existencia antes de crear. |
| `PrismaClientInitializationError` | Base no accesible. | Verifica `DATABASE_URL` y que el servicio esté activo. |
| `TypeError: Cannot read properties of undefined` | Variables de entorno faltantes. | Ejecuta `npm run check-config` o valida `.env`. |


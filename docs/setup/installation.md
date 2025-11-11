# Instalación de SAGO FACTU

## Requisitos Previos

- **Sistema operativo**: Linux o macOS. Windows soportado vía WSL2.
- **Node.js**: v20 LTS (`nvm install 20` recomendado).
- **npm**: v10+ (incluido con Node 20).
- **Git**: v2.40 o superior.
- **Docker Desktop** *(opcional pero recomendado)* para ejecutar PostgreSQL y Redis en contenedores.

## Clonar el Repositorio

```bash
git clone https://github.com/angelnereira/sago-factu-V0.2.git
cd sago-factu
```

## Instalar Dependencias

```bash
npm install
```

> El proyecto usa un solo workspace. No se requieren configuraciones adicionales de pnpm o yarn.

## Scripts de Inicialización

| Script | Descripción |
|--------|-------------|
| `npm run setup` | Genera secretos mínimos (NEXTAUTH\_SECRET, SUPER\_ADMIN\_PASSWORD) y valida tooling. |
| `npm run db:migrate` | Ejecuta migraciones pendientes en la base configurada. |
| `npm run db:seed` | Crea usuarios demo y datos base. |

Ejecuta la secuencia recomendada:

```bash
npm run setup
npm run db:migrate
npm run db:seed
```

## Servidor de Desarrollo

```bash
npm run dev
```

Por defecto el proyecto arranca en `http://localhost:3000`. Inicia sesión con:

- `admin@sago-factu.com` / `admin123`
- `usuario@empresa.com` / `usuario123`

## Resolución de Problemas

| Problema | Posible solución |
|----------|------------------|
| Error `prisma: query-engine` | Verifica la variable `DATABASE_URL` y que la base esté accesible. |
| Error `Redis connection` | Define `REDIS_URL` o ejecuta Redis local con Docker (`docker compose up redis`). |
| Lint no se ejecuta en pre-push | Instala Husky: `npm run prepare`. |

Consulta `docs/guides/development-workflow.md` para comandos avanzados y checklists durante el desarrollo diario.


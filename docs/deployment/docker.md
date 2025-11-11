# Despliegue con Docker

## Visión General

El proyecto incluye:

- `Dockerfile` multi-stage (Node 20 slim)
- `docker-compose.yml` con servicios `app`, `postgres`, `redis`
- `.dockerignore` optimizado para reducir el tamaño de la imagen

## Preparación

1. Copia las variables de entorno para el entorno dockerizado:

```bash
cp .env.example .env.docker
# Edita .env.docker con credenciales locales seguras
```

2. Asegúrate de contar con Docker 24+ y Docker Compose v2.

## Build y Ejecución

```bash
# Construir imagen
docker compose build

# Levantar servicios
docker compose up -d

# Ver logs en vivo
docker compose logs -f app
```

El servicio quedará disponible en `http://localhost:3000`.

## Servicios Incluidos

| Servicio | Descripción | Puertos | Persistencia |
|----------|-------------|---------|--------------|
| `app` | Next.js + API + workers | 3000 | Usa imagen `sago-factu-app` |
| `postgres` | PostgreSQL 15 | 5432 | Volumen `postgres-data` |
| `redis` | Redis 7 | 6379 | Volumen `redis-data` |

### Healthchecks

- `app`: realiza un ping a `/api/health` (ajusta al endpoint real cuando esté disponible).
- `postgres`: usa `pg_isready`.
- `redis`: usa `redis-cli ping`.

## Variables en Docker

`docker-compose.yml` lee valores desde el propio archivo y variables de entorno externas:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_URL`
- Credenciales AWS/Resend/HKA que definas en `.env.docker`

> Por seguridad, no incluyas secretos reales en el repositorio. `.env.docker` está ignorado por Git.

## Deploy en Producción

1. Construye y etiqueta la imagen:

```bash
docker build -t registry.example.com/sago-factu:0.7.0 .
docker push registry.example.com/sago-factu:0.7.0
```

2. En el servidor destino:

```bash
docker pull registry.example.com/sago-factu:0.7.0
docker run -d --name sago-factu \
  --env-file /etc/sago-factu/.env \
  -p 3000:3000 \
  registry.example.com/sago-factu:0.7.0
```

3. Configura un reverso proxy (Nginx/Traefik) para HTTPS.

## Optimización de Imagen

- Multi-stage reduce tamaño al excluir devDependencies.
- `npm prune --omit=dev` deja solo dependencias de producción.
- `.dockerignore` excluye `.next`, `node_modules`, `docs` y archivos temporales no necesarios.

## Troubleshooting

| Error | Posible causa | Solución |
|-------|---------------|----------|
| `next start` no encuentra `.next` | `npm run build` falló en la etapa `builder`. | Revisa logs durante `docker compose build`. |
| Prisma no conecta | `DATABASE_URL` mal configurada. | Verifica credenciales en `.env.docker` o variables de entorno. |
| Redis desconectado | Servicio no inició o credenciales erróneas. | Revisa `docker compose logs redis`. |
| Falta endpoint `/api/health` | Implementa un endpoint ligero o ajusta el healthcheck. | Edita `docker-compose.yml` para usar otro método. |

## Referencias

- `docs/deployment/oracle-cloud.md` y `docs/deployment/google-cloud.md` para despliegues cloud.
- `docs/database/migrations.md` para ejecutar migraciones dentro del contenedor.


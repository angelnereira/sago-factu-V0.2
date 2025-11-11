# Despliegue en Google Cloud Platform (GCP)

## Opciones de Infraestructura

| Servicio | Caso de uso | Consideraciones |
|----------|-------------|-----------------|
| **Cloud Run** | Deploy serverless (contenedor stateless) | Ideal si usas Neon/Cloud SQL y S3 compatible. Escala automático. |
| **Compute Engine** | Control total sobre VM | Útil para entornos tradicionales o cuando necesitas workers persistentes. |
| **GKE** | Kubernetes gestionado | Para escalar múltiples instancias y workers especializados. |

La guía se enfoca en **Cloud Run** como opción principal y provee notas para Compute Engine y GKE.

## Componentes Clave

- **Cloud SQL for PostgreSQL** (instancia gestionada)
- **MemoryStore (Redis)** o Redis administrado por terceros
- **Artifact Registry** para almacenar imágenes Docker
- **Secret Manager** para variables sensibles
- **Cloud Build / Cloud Deploy** para CI/CD
- **Cloud Storage** como repositorio de XML/PDF (compatible con AWS SDK vía `S3 endpoint` alternativo)

## Paso a Paso con Cloud Run

### 1. Build y Registro de Imagen

```bash
gcloud auth configure-docker
gcloud builds submit --tag gcr.io/PROJECT_ID/sago-factu:0.7.0
```

### 2. Base de Datos (Cloud SQL)

```bash
gcloud sql instances create sago-factu-db \
  --database-version=POSTGRES_15 \
  --cpu=2 --memory=7680MB --region=us-central1

gcloud sql databases create sago_factu --instance=sago-factu-db
gcloud sql users set-password postgres --instance=sago-factu-db --password=<secure-password>
```

- Habilita conectividad privada o usa el **Cloud SQL Proxy**.
- Ajusta `DATABASE_URL` con el formato:  
  `postgresql://postgres:<password>@//cloudsql/<INSTANCE_CONNECTION_NAME>/sago_factu?schema=public`

### 3. Redis (MemoryStore)

```bash
gcloud redis instances create sago-factu-redis \
  --size=1 --region=us-central1 --tier=STANDARD_HA
```

Obtén la IP y define `REDIS_URL=redis://<ip>:6379`.

### 4. Secret Manager

```bash
gcloud secrets create NEXTAUTH_SECRET --data-file=<(openssl rand -base64 32)
gcloud secrets create CERTIFICATE_MASTER_KEY --data-file=<(openssl rand -hex 32)
```

Agrega el resto de variables (AWS, Resend, HKA) como secretos separados y otorga el rol `Secret Manager Secret Accessor` al servicio de Cloud Run.

### 5. Despliegue Cloud Run

```bash
gcloud run deploy sago-factu \
  --image gcr.io/PROJECT_ID/sago-factu:0.7.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXTAUTH_URL=https://app.example.com \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest \
  --set-env-vars REDIS_URL=redis://10.0.0.4:6379 \
  --vpc-connector projects/PROJECT_ID/locations/us-central1/connectors/serverless-vpc \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 2 \
  --memory 2Gi
```

- Usa Serverless VPC Access para conectar con Cloud SQL/Redis.
- Configura dominios personalizados y SSL desde la consola de Cloud Run.

### 6. Storage

- Crea un bucket en Cloud Storage (`gs://sago-factu-certificados`).
- Usa `AWS_ENDPOINT` apuntando a `https://storage.googleapis.com`.
- Configura las credenciales con un Service Account y mapea en `.env`.

## Compute Engine (Alternativa)

1. Crea una VM `e2-standard-2` con Ubuntu 24.
2. Instala Docker + Docker Compose.
3. Despliega usando `docker-compose.yml` (ver `docs/deployment/docker.md`).
4. Configura firewall para puertos 80/443 (Forwarding rules + HTTPS Load Balancer).
5. Usa Cloud SQL Auth Proxy o VPC privado para base de datos.

## GKE (Opcional)

- Crea un clúster Autopilot.
- Despliega la imagen vía manifests Helm/Kustomize.
- Usa `StatefulSet` para workers, `Deployment` para la app.
- Configura Secrets con `Config Connector` o `External Secrets`.

## CI/CD con Cloud Build

Archivo `cloudbuild.yaml` sugerido:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: ["build", "-t", "gcr.io/$PROJECT_ID/sago-factu:$COMMIT_SHA", "."]
  - name: gcr.io/cloud-builders/docker
    args: ["push", "gcr.io/$PROJECT_ID/sago-factu:$COMMIT_SHA"]
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      [
        "run", "deploy", "sago-factu",
        "--image", "gcr.io/$PROJECT_ID/sago-factu:$COMMIT_SHA",
        "--region", "us-central1",
        "--platform", "managed"
      ]
images:
  - "gcr.io/$PROJECT_ID/sago-factu:$COMMIT_SHA"
```

Activa triggers desde GitHub o Cloud Source Repositories.

## Monitoreo y Logging

- **Cloud Logging** para stdout/stderr.
- **Cloud Monitoring**: crea dashboards con latencia, CPU, memoria, errores HTTP.
- **Error Reporting** para capturar excepciones no controladas.
- Configura alertas (PagerDuty, correo) ante fallos en la cola o aumento de errores 5xx.

## Checklist Final

- [ ] Dominio personalizado y SSL activo.
- [ ] Reglas IAM revisadas (principio de mínimo privilegio).
- [ ] Backups automatizados en Cloud SQL.
- [ ] Alertas configuradas para métricas críticas.
- [ ] Pruebas E2E ejecutadas (`npm run test`).
- [ ] Documentación actualizada en `CHANGELOG.md`.

## Recursos

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs)


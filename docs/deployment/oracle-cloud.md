# Despliegue en Oracle Cloud Infrastructure (OCI)

## Arquitectura Recomendada

```
┌──────────────────────────────┐
│ OCI Compartment              │
│  ├─ VCN (10.0.0.0/16)        │
│  │   ├─ Subnet pública       │
│  │   │    ├─ Load Balancer   │
│  │   │    └─ Bastion (opcional)
│  │   └─ Subnet privada       │
│  │        ├─ Compute (App)   │
│  │        ├─ Autonomous PG   │
│  │        └─ Redis (ElastiCache / self-hosted)
└──────────────────────────────┘
```

## Paso a Paso

### 1. Red y Seguridad

1. Crea una **VCN** con subred pública (LB/bastion) y privada (aplicación y servicios).
2. Configura **Security Lists** / **Network Security Groups**:
   - Permite 80/443 hacia el Load Balancer.
   - Permite 3000 internamente (o el puerto que uses para la app).
   - Habilita 5432 para la base de datos solo desde la subred privada.
3. Activa **Bastion** para acceso SSH seguro si requieres administración directa.

### 2. Base de Datos

- Opción recomendada: **Autonomous Database (PostgreSQL-compatible)** o instancia gestionada.
- Alternativa: despliega PostgreSQL en un contenedor/VM distinta con almacenamiento en Block Volumes.
- Configura backups automáticos y replica en otra región si es necesario.

### 3. Compute Instance (Aplicación)

1. Crea una instancia `VM.Standard.E4.Flex` (2 OCPU / 8 GB RAM) como baseline.
2. Instala Docker y Docker Compose:

```bash
sudo dnf update -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker opc
```

3. Clona el repositorio o despliega la imagen desde OCI Artifact Registry.

4. Configura variables de entorno en `/etc/sago-factu/.env` y referencias en `systemd` o `docker compose`.

### 4. Object Storage

- Crea un bucket estándar para almacenar XML/PDF certificados.
- Genera claves de acceso (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` compatibles con S3 API).
- Limita acceso por IAM Policies y compartimentos.

### 5. Load Balancer + SSL

1. Despliega un **Load Balancer** en la subred pública.
2. Configura un backend pointing al puerto 3000 de la instancia.
3. Añade un certificado TLS (ACME/Let’s Encrypt o importado).
4. Habilita health checks HTTP (`/api/health`).

### 6. CI/CD

- Usa **OCI DevOps** o GitHub Actions:
  - Job de build → push a OCI Artifact Registry.
  - Despliegue: script remoto que actualiza contenedores (`docker compose pull && docker compose up -d`).
- Asegura las credenciales con **OCI Vault** y Secrets.

### 7. Monitoreo y Logging

- Habilita **OCI Logging** para capturar stdout/stderr de contenedores.
- Configura métricas de CPU/RAM y crea alarmas.
- Exporta logs a Object Storage o integra con servicios externos (Datadog, New Relic).

## Checklist Post-Deploy

- [ ] HTTPS activo con certificados válidos.
- [ ] Seguridad de puertos: solo 80/443 expuestos públicamente.
- [ ] Variables de entorno cargadas correctamente (`npm run check-config` dentro del contenedor).
- [ ] Backups programados de la base de datos.
- [ ] Rotación periódica de claves (AWS/Resend/HKA).
- [ ] Monitor de colas BullMQ en estado saludable.

## Recuperación ante Desastres

- Activa snapshots automáticos de Block Volumes.
- Replica Object Storage a otra región.
- Mantén plantillas Terraform o CLI scripts para recrear infraestructura rápidamente.

## Referencias

- [OCI Networking](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/overview.htm)
- [OCI DevOps](https://docs.oracle.com/en-us/iaas/Content/devops/using/home.htm)
- [Guía Docker oficial](https://docs.docker.com/engine/install/centos/)


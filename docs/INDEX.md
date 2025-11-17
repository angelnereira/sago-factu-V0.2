# 📚 SAGO FACTU - Centro de Documentación

Bienvenido a la documentación de **SAGO FACTU**, un sistema moderno de facturación electrónica integrado con la autoridad tributaria panameña (DGI).

---

## 🚀 Inicio Rápido

**¿Es tu primera vez?** Comienza aquí:
- [START-HERE.md](../START-HERE.md) - Guía de inicio rápido (5 minutos)
- [BLUEPRINTS-INDEX.md](../BLUEPRINTS-INDEX.md) - Documentación estratégica

---

## 📖 Documentación por Rol

### 👨‍💻 Para Desarrolladores

**1. Comenzar a Desarrollar**
- [setup/installation.md](./setup/installation.md) - Instalación local
- [setup/environment-setup.md](./setup/environment-setup.md) - Configurar variables de entorno
- [guides/development-workflow.md](./guides/development-workflow.md) - Flujo de desarrollo

**2. Entender la Arquitectura**
- [architecture/overview.md](./architecture/overview.md) - Visión general del sistema
- [architecture/credentials.md](./architecture/credentials.md) - Sistema multi-tenant
- [architecture/database-schema.md](./architecture/database-schema.md) - Esquema de BD

**3. Trabajar en Funcionalidades**
- [guides/digital-signatures.md](./guides/digital-signatures.md) - Firma digital XMLDSig
- [guides/encryption.md](./guides/encryption.md) - Criptografía y seguridad
- [guides/api-documentation.md](./guides/api-documentation.md) - APIs disponibles
- [guides/testing.md](./guides/testing.md) - Testing y validación

**4. Base de Datos**
- [database/migrations.md](./database/migrations.md) - Prisma migrations
- [database/seeds.md](./database/seeds.md) - Datos iniciales
- [database/backup-restore.md](./database/backup-restore.md) - Backup y restauración

**5. Despliegue**
- [deployment/docker.md](./deployment/docker.md) - Docker
- [deployment/vercel.md](./deployment/vercel.md) - Vercel (producción)
- [deployment/oracle-cloud.md](./deployment/oracle-cloud.md) - Oracle Cloud
- [deployment/google-cloud.md](./deployment/google-cloud.md) - Google Cloud

---

### 📊 Para Stakeholders / No-Técnicos

- [../BLUEPRINT-RESUMEN-EJECUTIVO.md](../BLUEPRINT-RESUMEN-EJECUTIVO.md) - Resumen para inversores
- [../BLUEPRINT-MODELO-NEGOCIO.md](../BLUEPRINT-MODELO-NEGOCIO.md) - Modelo de negocio
- [../BLUEPRINT-FEATURES-TECNICAS.md](../BLUEPRINT-FEATURES-TECNICAS.md) - Capacidades técnicas
- [../CONNECTIVITY-AND-DEPLOYMENT-STATUS.md](../CONNECTIVITY-AND-DEPLOYMENT-STATUS.md) - Estado del sistema

---

### 🤝 Para Colaboradores

- [../CONTRIBUTING.md](../CONTRIBUTING.md) - Guía de contribución
- [contributing/code-style.md](./contributing/code-style.md) - Estándares de código
- [contributing/pull-request-template.md](./contributing/pull-request-template.md) - Plantilla de PR
- [../CHANGELOG.md](../CHANGELOG.md) - Historial de cambios

---

## 🎯 Búsqueda Rápida por Tema

### Firma Digital (XMLDSig + Certificados)
1. **Qué es**: [guides/digital-signatures.md](./guides/digital-signatures.md)
2. **Certificados**: [guides/digital-signatures.md](./guides/digital-signatures.md)
3. **Testing**: [guides/testing.md](./guides/testing.md)

### Integración HKA (Facturación Electrónica)
1. **Visión general**: [architecture/overview.md](./architecture/overview.md)
2. **API endpoints**: [guides/api-documentation.md](./guides/api-documentation.md)
3. **Flujo completo**: [guides/development-workflow.md](./guides/development-workflow.md)

### Seguridad y Criptografía
1. **Conceptos**: [guides/encryption.md](./guides/encryption.md)
2. **Implementación**: [guides/digital-signatures.md](./guides/digital-signatures.md)
3. **Arquitectura**: [architecture/credentials.md](./architecture/credentials.md)

### Multi-Tenancy (Multi-usuario)
1. **Diseño**: [architecture/credentials.md](./architecture/credentials.md)
2. **Implementación**: [guides/development-workflow.md](./guides/development-workflow.md)
3. **Testing**: [guides/testing.md](./guides/testing.md)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Next.js 15, React, TypeScript, TailwindCSS, Shadcn UI |
| **Backend** | Node.js, Express (Next.js API routes), Prisma ORM |
| **Base de Datos** | PostgreSQL (Neon) |
| **Autenticación** | NextAuth.js |
| **Firma Digital** | XMLDSig W3C, RSA-SHA256 |
| **Encriptación** | AES-256-GCM, PBKDF2 |
| **Integración** | HKA SOAP API (DGI) |
| **Despliegue** | Docker, Vercel, Google Cloud |

---

## ❓ FAQ Rápidas

**¿Por dónde empiezo?** → [START-HERE.md](../START-HERE.md)
**¿Cómo instalo?** → [setup/installation.md](./setup/installation.md)
**¿Cómo funciona HKA?** → [guides/api-documentation.md](./guides/api-documentation.md)
**¿Qué es firma digital?** → [guides/digital-signatures.md](./guides/digital-signatures.md)
**¿Cómo contribuyo?** → [../CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Última actualización**: 2025-11-17 | **Versión**: 2.0

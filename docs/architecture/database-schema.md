# Esquema de Base de Datos

El esquema Prisma (`prisma/schema.prisma`) modela un sistema multi-tenant con control total sobre folios y facturación electrónica.

## Entidades Principales

| Modelo | Descripción | Campos Clave |
|--------|-------------|--------------|
| `Organization` | Representa cada tenant. Controla configuración HKA y límites. | `slug`, `plan`, `hkaEnvironment`, `autoSendToHKA` |
| `User` | Usuarios autenticados con roles y preferencias. | `role`, `organizationId`, `signatureConfig` |
| `Invoice` | Facturas electrónicas emitidas. | `status`, `xmlContent`, `cufe`, `customerId` |
| `InvoiceItem` | Ítems asociados a la factura. | `quantity`, `taxRate`, `itbms` |
| `FolioPool` | Pools globales comprados al PAC. | `totalFolios`, `purchaseAmount` |
| `FolioAssignment` | Asignación de folios por organización. | `assignedAmount`, `alertThreshold` |
| `FolioConsumption` | Registro de consumo de folios por factura. | `invoiceId`, `folioNumber` |
| `DigitalCertificate` | Certificados digitales (.pfx/.p12) cifrados. | `certificateP12`, `validTo`, `certificateThumbprint`, `encryptedPin` |
| `Monitor` | Configuración de monitores HKA/colas. | `type`, `threshold`, `status` |
| `Notification` | Bandeja de notificaciones internas. | `type`, `payload`, `readAt` |

## Relaciones Clave

```
Organization 1 ────┐
                   │
                   ├── Users (ROL-based)
                   ├── Invoices ── InvoiceItems
                   ├── FolioAssignments ── FolioConsumption
                   └── Certificates ── UserSignatureConfig
```

- **Cascadas controladas**: Eliminación de una organización borra usuarios, folios e invoices asociados.
- **Índices**: existen índices para `slug`, `isActive`, `role`, `status`, `createdAt` para acelerar dashboards y reportes.
- **Enums**: `UserRole`, `DocumentType`, `InvoiceStatus`, `ReceiverType`, `SignatureMode`, entre otros.

## Auditoría y Seguridad

- `AuditLog` registra cambios críticos (creación/actualización).
- `ApiLog` guarda metadatos de peticiones externas e internas.
- Campos sensibles (`certificateData`, `passwordEncrypted`) cifrados con `prisma-field-encryption`.

## Migraciones Relevantes

- Migraciones Prisma versionadas en `prisma/migrations`.
- Seeds iniciales en `prisma/seed.ts` con datos demo.
- Ver `docs/database/migrations.md` para la estrategia de ejecución, rollback y despliegue a producción.


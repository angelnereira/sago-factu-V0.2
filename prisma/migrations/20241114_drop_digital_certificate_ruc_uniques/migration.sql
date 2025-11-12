-- Permitir múltiples certificados por RUC tanto para organizaciones como para usuarios
DROP INDEX IF EXISTS "digital_certificates_organizationId_ruc_key";
DROP INDEX IF EXISTS "digital_certificates_userId_ruc_key";

-- Índices no únicos para mantener el rendimiento en las búsquedas
CREATE INDEX IF NOT EXISTS "digital_certificates_organizationId_ruc_idx"
  ON "digital_certificates" ("organizationId", "ruc")
  WHERE "organizationId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "digital_certificates_userId_ruc_idx"
  ON "digital_certificates" ("userId", "ruc")
  WHERE "userId" IS NOT NULL;


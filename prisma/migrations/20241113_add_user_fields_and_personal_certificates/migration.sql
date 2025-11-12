-- Add personal RUC fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ruc" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dv" TEXT;

-- Allow digital certificates to be scoped to users as well as organizations
ALTER TABLE "digital_certificates"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ALTER COLUMN "organizationId" DROP NOT NULL,
  ADD CONSTRAINT "digital_certificates_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraints for personal certificates
DROP INDEX IF EXISTS "digital_certificates_organizationId_ruc_key";
CREATE UNIQUE INDEX IF NOT EXISTS "digital_certificates_organizationId_ruc_key"
  ON "digital_certificates" ("organizationId", "ruc")
  WHERE "organizationId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "digital_certificates_userId_ruc_key"
  ON "digital_certificates" ("userId", "ruc")
  WHERE "userId" IS NOT NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "digital_certificates_userId_idx"
  ON "digital_certificates" ("userId");


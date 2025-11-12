-- Drop old relations to Certificate table if they exist
ALTER TABLE "UserSignatureConfig" DROP CONSTRAINT IF EXISTS "UserSignatureConfig_certificateId_fkey";
DROP INDEX IF EXISTS "UserSignatureConfig_certificateId_idx";

-- Rename column to new foreign key
ALTER TABLE "UserSignatureConfig"
  RENAME COLUMN "certificateId" TO "digitalCertificateId";

-- Create new digital_certificates table
CREATE TABLE IF NOT EXISTS "digital_certificates" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "certificateP12" BYTEA NOT NULL,
  "certificatePem" TEXT,
  "certificateChainPem" TEXT,
  "certificateThumbprint" TEXT,
  "encryptedPin" TEXT NOT NULL,
  "pinSalt" TEXT NOT NULL,
  "pinIv" TEXT NOT NULL,
  "pinAuthTag" TEXT NOT NULL,
  "ruc" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "serialNumber" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "uploadedBy" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "digital_certificates_pkey" PRIMARY KEY ("id")
);

-- Remove legacy certificate table
DROP TABLE IF EXISTS "Certificate";

-- Indexes for new table
CREATE INDEX IF NOT EXISTS "digital_certificates_organizationId_idx" ON "digital_certificates" ("organizationId");
CREATE INDEX IF NOT EXISTS "digital_certificates_validTo_idx" ON "digital_certificates" ("validTo");
CREATE UNIQUE INDEX IF NOT EXISTS "digital_certificates_organizationId_ruc_key" ON "digital_certificates" ("organizationId", "ruc");

-- Foreign key to organizations
ALTER TABLE "digital_certificates"
  ADD CONSTRAINT IF NOT EXISTS "digital_certificates_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate foreign key from signature config to digital certificates
CREATE INDEX IF NOT EXISTS "UserSignatureConfig_digitalCertificateId_idx" ON "UserSignatureConfig" ("digitalCertificateId");
ALTER TABLE "UserSignatureConfig"
  ADD CONSTRAINT IF NOT EXISTS "UserSignatureConfig_digitalCertificateId_fkey"
  FOREIGN KEY ("digitalCertificateId") REFERENCES "digital_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

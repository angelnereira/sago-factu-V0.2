-- CreateEnum
CREATE TYPE "HKAEnvironment" AS ENUM ('DEMO', 'PROD');

-- CreateTable
CREATE TABLE "hka_credentials" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "environment" "HKAEnvironment" NOT NULL DEFAULT 'DEMO',
  "tokenUser" TEXT NOT NULL,
  "tokenPassword" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hka_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hka_credentials_userId_environment_key" ON "hka_credentials" ("userId", "environment");
CREATE INDEX "hka_credentials_userId_environment_idx" ON "hka_credentials" ("userId", "environment");

-- AddForeignKey
ALTER TABLE "hka_credentials"
  ADD CONSTRAINT "hka_credentials_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


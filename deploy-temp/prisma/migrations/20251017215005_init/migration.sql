-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "dv" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "hkaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hkaTokenUser" TEXT,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxFolios" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "suspendedAt" DATETIME,
    "suspendReason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'es',
    "timezone" TEXT NOT NULL DEFAULT 'America/Panama',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "lastLoginIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "folio_pools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'HKA',
    "totalFolios" INTEGER NOT NULL,
    "availableFolios" INTEGER NOT NULL,
    "assignedFolios" INTEGER NOT NULL DEFAULT 0,
    "consumedFolios" INTEGER NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseAmount" REAL NOT NULL,
    "hkaInvoiceNumber" TEXT,
    "folioStart" TEXT,
    "folioEnd" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "folio_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folioPoolId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedAmount" INTEGER NOT NULL,
    "consumedAmount" INTEGER NOT NULL DEFAULT 0,
    "alertThreshold" INTEGER NOT NULL DEFAULT 10,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "lastAlertAt" DATETIME,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "notes" TEXT,
    "assignedBy" TEXT,
    CONSTRAINT "folio_assignments_folioPoolId_fkey" FOREIGN KEY ("folioPoolId") REFERENCES "folio_pools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folio_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "folio_consumptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "consumedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folioNumber" TEXT,
    CONSTRAINT "folio_consumptions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "clientReferenceId" TEXT NOT NULL,
    "issuerRuc" TEXT NOT NULL,
    "issuerDv" TEXT NOT NULL,
    "issuerName" TEXT NOT NULL,
    "issuerAddress" TEXT NOT NULL,
    "issuerEmail" TEXT NOT NULL,
    "issuerPhone" TEXT,
    "receiverType" TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
    "receiverRuc" TEXT,
    "receiverDv" TEXT,
    "receiverName" TEXT NOT NULL,
    "receiverEmail" TEXT,
    "receiverPhone" TEXT,
    "receiverAddress" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'FACTURA',
    "invoiceNumber" TEXT,
    "cufe" TEXT,
    "qrCode" TEXT,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "subtotalAfterDiscount" REAL NOT NULL,
    "itbms" REAL NOT NULL,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PAB',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "notes" TEXT,
    "internalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "hkaStatus" TEXT,
    "hkaMessage" TEXT,
    "rejectionReason" TEXT,
    "hkaCode" TEXT,
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "rawXml" TEXT,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "cancellationCufe" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "queuedAt" DATETIME,
    "sentAt" DATETIME,
    "certifiedAt" DATETIME,
    CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'UND',
    "discount" REAL NOT NULL DEFAULT 0,
    "discountRate" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 7,
    "taxCode" TEXT NOT NULL DEFAULT '01',
    "taxAmount" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "total" REAL NOT NULL,
    "cpbsCode" TEXT,
    "cpbsUnit" TEXT,
    CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "userIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_logs_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "rateLimitWindow" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" TEXT,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_ruc_key" ON "organizations"("ruc");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_ruc_idx" ON "organizations"("ruc");

-- CreateIndex
CREATE INDEX "organizations_isActive_idx" ON "organizations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "folio_pools_batchNumber_key" ON "folio_pools"("batchNumber");

-- CreateIndex
CREATE INDEX "folio_pools_isActive_idx" ON "folio_pools"("isActive");

-- CreateIndex
CREATE INDEX "folio_pools_batchNumber_idx" ON "folio_pools"("batchNumber");

-- CreateIndex
CREATE INDEX "folio_pools_expiresAt_idx" ON "folio_pools"("expiresAt");

-- CreateIndex
CREATE INDEX "folio_assignments_organizationId_idx" ON "folio_assignments"("organizationId");

-- CreateIndex
CREATE INDEX "folio_assignments_folioPoolId_idx" ON "folio_assignments"("folioPoolId");

-- CreateIndex
CREATE UNIQUE INDEX "folio_assignments_folioPoolId_organizationId_key" ON "folio_assignments"("folioPoolId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "folio_consumptions_invoiceId_key" ON "folio_consumptions"("invoiceId");

-- CreateIndex
CREATE INDEX "folio_consumptions_assignmentId_idx" ON "folio_consumptions"("assignmentId");

-- CreateIndex
CREATE INDEX "folio_consumptions_invoiceId_idx" ON "folio_consumptions"("invoiceId");

-- CreateIndex
CREATE INDEX "folio_consumptions_consumedAt_idx" ON "folio_consumptions"("consumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_clientReferenceId_key" ON "invoices"("clientReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_cufe_key" ON "invoices"("cufe");

-- CreateIndex
CREATE INDEX "invoices_organizationId_idx" ON "invoices"("organizationId");

-- CreateIndex
CREATE INDEX "invoices_createdBy_idx" ON "invoices"("createdBy");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_cufe_idx" ON "invoices"("cufe");

-- CreateIndex
CREATE INDEX "invoices_issuerRuc_idx" ON "invoices"("issuerRuc");

-- CreateIndex
CREATE INDEX "invoices_receiverRuc_idx" ON "invoices"("receiverRuc");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE INDEX "invoices_issueDate_idx" ON "invoices"("issueDate");

-- CreateIndex
CREATE INDEX "invoices_documentType_idx" ON "invoices"("documentType");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_logs_invoiceId_idx" ON "invoice_logs"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_logs_createdAt_idx" ON "invoice_logs"("createdAt");

-- CreateIndex
CREATE INDEX "invoice_logs_action_idx" ON "invoice_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_organizationId_idx" ON "api_keys"("organizationId");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_prefix_idx" ON "api_keys"("prefix");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

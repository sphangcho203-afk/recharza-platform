-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthTokenPurpose" AS ENUM ('SIGN_IN');

-- CreateEnum
CREATE TYPE "FulfilmentStatus" AS ENUM ('PLANNED', 'SUBMITTING', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfilmentMode" AS ENUM ('DRY_RUN', 'SUPPLIER_WRITE');

-- AlterTable
ALTER TABLE "Customer"
ADD COLUMN "displayName" TEXT,
ADD COLUMN "username" TEXT,
ADD COLUMN "role" "AccountRole" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "verifiedNickname" TEXT,
ADD COLUMN "supplierProductId" TEXT,
ADD COLUMN "supplierCategoryId" TEXT,
ADD COLUMN "supplierOfferId" TEXT;

-- AlterTable
ALTER TABLE "AdminAuditLog"
ADD COLUMN "actorCustomerId" TEXT;

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthMagicLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "AuthTokenPurpose" NOT NULL DEFAULT 'SIGN_IN',
    "customerId" TEXT NOT NULL,
    "requestedFingerprint" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthMagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfilmentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "mode" "FulfilmentMode" NOT NULL,
    "status" "FulfilmentStatus" NOT NULL DEFAULT 'PLANNED',
    "idempotencyKey" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfilmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_username_key" ON "Customer"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE INDEX "AuthSession_customerId_expiresAt_idx" ON "AuthSession"("customerId", "expiresAt");
CREATE INDEX "AuthSession_expiresAt_revokedAt_idx" ON "AuthSession"("expiresAt", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthMagicLink_tokenHash_key" ON "AuthMagicLink"("tokenHash");
CREATE INDEX "AuthMagicLink_customerId_createdAt_idx" ON "AuthMagicLink"("customerId", "createdAt");
CREATE INDEX "AuthMagicLink_expiresAt_usedAt_idx" ON "AuthMagicLink"("expiresAt", "usedAt");

-- CreateIndex
CREATE INDEX "Order_supplierProductId_idx" ON "Order"("supplierProductId");
CREATE INDEX "AdminAuditLog_actorCustomerId_createdAt_idx" ON "AdminAuditLog"("actorCustomerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FulfilmentAttempt_idempotencyKey_key" ON "FulfilmentAttempt"("idempotencyKey");
CREATE UNIQUE INDEX "FulfilmentAttempt_providerOrderId_key" ON "FulfilmentAttempt"("providerOrderId");
CREATE INDEX "FulfilmentAttempt_orderId_createdAt_idx" ON "FulfilmentAttempt"("orderId", "createdAt");
CREATE INDEX "FulfilmentAttempt_provider_status_createdAt_idx" ON "FulfilmentAttempt"("provider", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthMagicLink" ADD CONSTRAINT "AuthMagicLink_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorCustomerId_fkey" FOREIGN KEY ("actorCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FulfilmentAttempt" ADD CONSTRAINT "FulfilmentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "WebhookStatus" AS ENUM (
  'RECEIVED',
  'PROCESSED',
  'IGNORED',
  'FAILED'
);

CREATE TABLE "PaymentWebhook" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT,
  "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
  "errorMessage" TEXT,
  "orderId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),

  CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorFingerprint" TEXT NOT NULL,
  "metadata" JSONB,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentWebhook_payloadHash_key"
  ON "PaymentWebhook"("payloadHash");
CREATE UNIQUE INDEX "PaymentWebhook_provider_eventId_key"
  ON "PaymentWebhook"("provider", "eventId");
CREATE INDEX "PaymentWebhook_status_receivedAt_idx"
  ON "PaymentWebhook"("status", "receivedAt");
CREATE INDEX "PaymentWebhook_orderId_receivedAt_idx"
  ON "PaymentWebhook"("orderId", "receivedAt");
CREATE INDEX "AdminAuditLog_orderId_createdAt_idx"
  ON "AdminAuditLog"("orderId", "createdAt");
CREATE INDEX "AdminAuditLog_createdAt_idx"
  ON "AdminAuditLog"("createdAt");

ALTER TABLE "PaymentWebhook"
  ADD CONSTRAINT "PaymentWebhook_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Recharza multi-channel support tickets and secure Telegram linking.

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "category" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'WEB',
  "replyChannel" TEXT NOT NULL,
  "requesterName" TEXT,
  "requesterEmail" TEXT,
  "telegramUsername" TEXT,
  "telegramUserId" TEXT,
  "telegramChatId" TEXT,
  "telegramConnectTokenHash" TEXT,
  "orderPublicId" TEXT,
  "gameSlug" TEXT,
  "customerId" TEXT,
  "orderId" TEXT,
  "metadata" JSONB,
  "telegramDeliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "telegramSupportMessageId" TEXT,
  "emailDeliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "emailProviderMessageId" TEXT,
  "lastStaffReplyAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportTicket_status_check" CHECK ("status" IN ('OPEN', 'ASSIGNED', 'WAITING_CUSTOMER', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED')),
  CONSTRAINT "SupportTicket_source_check" CHECK ("source" IN ('WEB', 'TELEGRAM')),
  CONSTRAINT "SupportTicket_reply_channel_check" CHECK ("replyChannel" IN ('TELEGRAM', 'EMAIL')),
  CONSTRAINT "SupportTicket_telegram_delivery_check" CHECK ("telegramDeliveryStatus" IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
  CONSTRAINT "SupportTicket_email_delivery_check" CHECK ("emailDeliveryStatus" IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED'))
);

CREATE UNIQUE INDEX "SupportTicket_publicId_key" ON "SupportTicket"("publicId");
CREATE UNIQUE INDEX "SupportTicket_telegramConnectTokenHash_key" ON "SupportTicket"("telegramConnectTokenHash");
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX "SupportTicket_customerId_createdAt_idx" ON "SupportTicket"("customerId", "createdAt");
CREATE INDEX "SupportTicket_orderId_createdAt_idx" ON "SupportTicket"("orderId", "createdAt");
CREATE INDEX "SupportTicket_telegramUserId_createdAt_idx" ON "SupportTicket"("telegramUserId", "createdAt");

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

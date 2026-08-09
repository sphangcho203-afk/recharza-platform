-- Durable Telegram support drafts, replay tracking, and delivery diagnostics.

CREATE TABLE IF NOT EXISTS "SupportBotSession" (
  "chatId" TEXT NOT NULL,
  "telegramUserId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "step" TEXT NOT NULL,
  "subject" TEXT,
  "orderPublicId" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportBotSession_pkey" PRIMARY KEY ("chatId"),
  CONSTRAINT "SupportBotSession_step_check" CHECK ("step" IN ('TITLE', 'ORDER', 'DESCRIPTION', 'REVIEW'))
);

DROP INDEX IF EXISTS "SupportBotSession_expiresAt_idx";
CREATE INDEX "SupportBotSession_expiresAt_idx" ON "SupportBotSession"("expiresAt");
DROP INDEX IF EXISTS "SupportBotSession_telegramUserId_updatedAt_idx";
CREATE INDEX "SupportBotSession_telegramUserId_updatedAt_idx" ON "SupportBotSession"("telegramUserId", "updatedAt");

CREATE TABLE IF NOT EXISTS "SupportTelegramUpdate" (
  "updateId" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTelegramUpdate_pkey" PRIMARY KEY ("updateId")
);

DROP INDEX IF EXISTS "SupportTelegramUpdate_processedAt_idx";
CREATE INDEX "SupportTelegramUpdate_processedAt_idx" ON "SupportTelegramUpdate"("processedAt");

ALTER TABLE "SupportTicket"
  ADD COLUMN IF NOT EXISTS "telegramDeliveryError" TEXT,
  ADD COLUMN IF NOT EXISTS "emailDeliveryError" TEXT;

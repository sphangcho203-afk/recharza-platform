-- Customer credentials, password recovery, persistent carts, and transactional email delivery records.

CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE "EmailMessageKind" AS ENUM ('ACCOUNT_CREATED', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'ORDER_COMPLETED', 'ORDER_FAILED');

ALTER TABLE "Customer"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "passwordUpdatedAt" TIMESTAMP(3);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cart" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "guestKeyHash" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "gameSlug" TEXT NOT NULL,
  "marketCode" TEXT,
  "packageId" TEXT NOT NULL,
  "packageName" TEXT NOT NULL,
  "amountInPaise" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "playerId" TEXT,
  "zoneId" TEXT,
  "verifiedNickname" TEXT,
  "verificationMode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailDelivery" (
  "id" TEXT NOT NULL,
  "kind" "EmailMessageKind" NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "payload" JSONB,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "customerId" TEXT,
  "orderId" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_customerId_createdAt_idx" ON "PasswordResetToken"("customerId", "createdAt");
CREATE INDEX "PasswordResetToken_expiresAt_usedAt_idx" ON "PasswordResetToken"("expiresAt", "usedAt");

CREATE UNIQUE INDEX "Cart_guestKeyHash_key" ON "Cart"("guestKeyHash");
CREATE INDEX "Cart_customerId_status_updatedAt_idx" ON "Cart"("customerId", "status", "updatedAt");
CREATE INDEX "Cart_status_updatedAt_idx" ON "Cart"("status", "updatedAt");

CREATE INDEX "CartItem_cartId_createdAt_idx" ON "CartItem"("cartId", "createdAt");
CREATE INDEX "CartItem_gameSlug_marketCode_packageId_idx" ON "CartItem"("gameSlug", "marketCode", "packageId");

CREATE INDEX "EmailDelivery_status_createdAt_idx" ON "EmailDelivery"("status", "createdAt");
CREATE INDEX "EmailDelivery_customerId_createdAt_idx" ON "EmailDelivery"("customerId", "createdAt");
CREATE INDEX "EmailDelivery_orderId_createdAt_idx" ON "EmailDelivery"("orderId", "createdAt");
CREATE INDEX "EmailDelivery_recipient_createdAt_idx" ON "EmailDelivery"("recipient", "createdAt");
CREATE INDEX "Customer_username_idx" ON "Customer"("username");

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Cart"
  ADD CONSTRAINT "Cart_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_cartId_fkey"
  FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailDelivery"
  ADD CONSTRAINT "EmailDelivery_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailDelivery"
  ADD CONSTRAINT "EmailDelivery_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

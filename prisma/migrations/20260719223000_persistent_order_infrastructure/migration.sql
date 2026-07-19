CREATE TYPE "OrderStatus" AS ENUM (
  'CREATED',
  'AWAITING_PAYMENT',
  'PAYMENT_PENDING',
  'PAID',
  'FULFILLING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "authSubject" TEXT,
  "emailVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "accessTokenHash" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
  "gameSlug" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "packageName" TEXT NOT NULL,
  "amountInPaise" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "playerId" TEXT NOT NULL,
  "zoneId" TEXT NOT NULL,
  "verificationMode" TEXT NOT NULL,
  "paymentProvider" TEXT,
  "paymentSessionId" TEXT,
  "customerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "orderId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
CREATE UNIQUE INDEX "Customer_authSubject_key" ON "Customer"("authSubject");
CREATE UNIQUE INDEX "Order_publicId_key" ON "Order"("publicId");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE UNIQUE INDEX "Order_paymentSessionId_key" ON "Order"("paymentSessionId");
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
CREATE INDEX "Order_playerId_zoneId_createdAt_idx" ON "Order"("playerId", "zoneId", "createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");
CREATE UNIQUE INDEX "RateLimitBucket_fingerprint_route_windowStart_key"
  ON "RateLimitBucket"("fingerprint", "route", "windowStart");
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderEvent"
  ADD CONSTRAINT "OrderEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD COLUMN "presentmentCurrency" TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN "presentmentAmountMinor" INTEGER,
  ADD COLUMN "fxRateFromInrMicros" INTEGER,
  ADD COLUMN "fxQuotedAt" TIMESTAMP(3),
  ADD COLUMN "billingName" TEXT,
  ADD COLUMN "billingEmail" TEXT,
  ADD COLUMN "billingPhone" TEXT,
  ADD COLUMN "billingLine1" TEXT,
  ADD COLUMN "billingLine2" TEXT,
  ADD COLUMN "billingCity" TEXT,
  ADD COLUMN "billingState" TEXT,
  ADD COLUMN "billingPostalCode" TEXT,
  ADD COLUMN "billingCountryCode" TEXT;

CREATE INDEX "Order_billingCountryCode_presentmentCurrency_createdAt_idx"
  ON "Order"("billingCountryCode", "presentmentCurrency", "createdAt");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_presentment_currency_format_check"
  CHECK ("presentmentCurrency" ~ '^[A-Z]{3}$');

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_billing_country_format_check"
  CHECK ("billingCountryCode" IS NULL OR "billingCountryCode" ~ '^[A-Z]{2}$');

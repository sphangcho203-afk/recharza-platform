CREATE TYPE "SupplierSyncStatus" AS ENUM (
  'RUNNING',
  'COMPLETED',
  'FAILED'
);

CREATE TABLE "PricingConfiguration" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "usdInrRatePaise" INTEGER NOT NULL DEFAULT 9650,
  "fxBufferBps" INTEGER NOT NULL DEFAULT 250,
  "gatewayFeeBps" INTEGER NOT NULL DEFAULT 250,
  "targetMarginBps" INTEGER NOT NULL DEFAULT 1200,
  "minimumMarginInPaise" INTEGER NOT NULL DEFAULT 1500,
  "overheadInPaise" INTEGER NOT NULL DEFAULT 500,
  "roundingInPaise" INTEGER NOT NULL DEFAULT 500,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PricingConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierProduct" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "gameSlug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "region" TEXT,
  "supplierCurrency" TEXT NOT NULL DEFAULT 'USD',
  "supplierPriceUsdMicros" INTEGER NOT NULL,
  "landedCostInPaise" INTEGER NOT NULL,
  "retailPriceInPaise" INTEGER NOT NULL,
  "expectedMarginInPaise" INTEGER NOT NULL,
  "expectedMarginBps" INTEGER NOT NULL,
  "available" BOOLEAN NOT NULL DEFAULT true,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "fields" JSONB,
  "raw" JSONB,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierSyncRun" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" "SupplierSyncStatus" NOT NULL DEFAULT 'RUNNING',
  "categoriesSynced" INTEGER NOT NULL DEFAULT 0,
  "offersSynced" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "SupplierSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierProduct_provider_offer_key"
  ON "SupplierProduct"("provider", "offerId");
CREATE INDEX "SupplierProduct_gameSlug_published_available_retailPriceInPaise_idx"
  ON "SupplierProduct"("gameSlug", "published", "available", "retailPriceInPaise");
CREATE INDEX "SupplierProduct_provider_categoryId_available_idx"
  ON "SupplierProduct"("provider", "categoryId", "available");
CREATE INDEX "SupplierProduct_syncedAt_idx" ON "SupplierProduct"("syncedAt");
CREATE INDEX "SupplierSyncRun_provider_startedAt_idx"
  ON "SupplierSyncRun"("provider", "startedAt");
CREATE INDEX "SupplierSyncRun_status_startedAt_idx"
  ON "SupplierSyncRun"("status", "startedAt");

INSERT INTO "PricingConfiguration" (
  "id",
  "usdInrRatePaise",
  "fxBufferBps",
  "gatewayFeeBps",
  "targetMarginBps",
  "minimumMarginInPaise",
  "overheadInPaise",
  "roundingInPaise",
  "updatedAt"
) VALUES (
  'default',
  9650,
  250,
  250,
  1200,
  1500,
  500,
  500,
  CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

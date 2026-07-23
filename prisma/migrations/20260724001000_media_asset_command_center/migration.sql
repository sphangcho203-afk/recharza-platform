CREATE TYPE "MediaAssetKind" AS ENUM (
  'GENERAL',
  'BRAND',
  'GAME_LOGO',
  'GAME_ARTWORK',
  'BANNER',
  'SOCIAL',
  'PRODUCT'
);

CREATE TYPE "MediaAssetStatus" AS ENUM (
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'ARCHIVED'
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "kind" "MediaAssetKind" NOT NULL DEFAULT 'GENERAL',
  "status" "MediaAssetStatus" NOT NULL DEFAULT 'DRAFT',
  "altText" TEXT NOT NULL,
  "notes" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdByCustomerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaPlacement" (
  "id" TEXT NOT NULL,
  "placementKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MediaPlacement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaAsset_checksum_key" ON "MediaAsset"("checksum");
CREATE INDEX "MediaAsset_status_kind_createdAt_idx" ON "MediaAsset"("status", "kind", "createdAt");
CREATE INDEX "MediaAsset_createdByCustomerId_createdAt_idx" ON "MediaAsset"("createdByCustomerId", "createdAt");
CREATE UNIQUE INDEX "MediaPlacement_placementKey_key" ON "MediaPlacement"("placementKey");
CREATE INDEX "MediaPlacement_assetId_updatedAt_idx" ON "MediaPlacement"("assetId", "updatedAt");

ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_createdByCustomerId_fkey"
  FOREIGN KEY ("createdByCustomerId") REFERENCES "Customer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MediaPlacement"
  ADD CONSTRAINT "MediaPlacement_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

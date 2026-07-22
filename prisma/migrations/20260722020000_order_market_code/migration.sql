ALTER TABLE "Order" ADD COLUMN "marketCode" TEXT;

CREATE INDEX "Order_gameSlug_marketCode_createdAt_idx"
ON "Order"("gameSlug", "marketCode", "createdAt");

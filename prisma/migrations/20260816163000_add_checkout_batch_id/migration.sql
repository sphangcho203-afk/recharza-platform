ALTER TABLE "Order" ADD COLUMN "checkoutBatchId" TEXT;

CREATE INDEX "Order_checkoutBatchId_createdAt_idx" ON "Order"("checkoutBatchId", "createdAt");

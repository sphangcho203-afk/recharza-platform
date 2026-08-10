-- Staff support inbox: operational assignment of tickets to staff accounts.

ALTER TABLE "SupportTicket"
  ADD COLUMN IF NOT EXISTS "assigneeCustomerId" TEXT;

ALTER TABLE "SupportTicket"
  DROP CONSTRAINT IF EXISTS "SupportTicket_assigneeCustomerId_fkey",
  ADD CONSTRAINT "SupportTicket_assigneeCustomerId_fkey"
  FOREIGN KEY ("assigneeCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "SupportTicket_assigneeCustomerId_status_createdAt_idx";
CREATE INDEX "SupportTicket_assigneeCustomerId_status_createdAt_idx"
  ON "SupportTicket"("assigneeCustomerId", "status", "createdAt");

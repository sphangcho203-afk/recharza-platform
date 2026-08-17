CREATE TABLE IF NOT EXISTS "StaffReplyRequest" (
    "workerChatId" TEXT NOT NULL,
    "workerUserId" TEXT NOT NULL,
    "ticketPublicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffReplyRequest_pkey" PRIMARY KEY ("workerChatId","workerUserId")
);

CREATE INDEX "StaffReplyRequest_expiresAt_idx" ON "StaffReplyRequest"("expiresAt");

BEGIN;

CREATE TABLE IF NOT EXISTS "StaffCredential" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "passwordVersion" INTEGER NOT NULL DEFAULT 1,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "lastFailedLoginAt" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StaffCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffCredential_password_version_positive" CHECK ("passwordVersion" > 0),
  CONSTRAINT "StaffCredential_failed_login_count_nonnegative" CHECK ("failedLoginCount" >= 0)
);

CREATE TABLE IF NOT EXISTS "StaffSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "passwordVersion" INTEGER NOT NULL,
  "idleExpiresAt" TIMESTAMP(3) NOT NULL,
  "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "userAgentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffSession_password_version_positive" CHECK ("passwordVersion" > 0),
  CONSTRAINT "StaffSession_expiry_order" CHECK ("idleExpiresAt" <= "absoluteExpiresAt")
);

DROP INDEX IF EXISTS "StaffCredential_customerId_key";
CREATE UNIQUE INDEX "StaffCredential_customerId_key"
  ON "StaffCredential"("customerId");
DROP INDEX IF EXISTS "StaffCredential_lockedUntil_idx";
CREATE INDEX "StaffCredential_lockedUntil_idx"
  ON "StaffCredential"("lockedUntil");
DROP INDEX IF EXISTS "StaffSession_tokenHash_key";
CREATE UNIQUE INDEX "StaffSession_tokenHash_key"
  ON "StaffSession"("tokenHash");
DROP INDEX IF EXISTS "StaffSession_customerId_revokedAt_absoluteExpiresAt_idx";
CREATE INDEX "StaffSession_customerId_revokedAt_absoluteExpiresAt_idx"
  ON "StaffSession"("customerId", "revokedAt", "absoluteExpiresAt");
DROP INDEX IF EXISTS "StaffSession_credentialId_revokedAt_idx";
CREATE INDEX "StaffSession_credentialId_revokedAt_idx"
  ON "StaffSession"("credentialId", "revokedAt");
DROP INDEX IF EXISTS "StaffSession_idleExpiresAt_absoluteExpiresAt_revokedAt_idx";
CREATE INDEX "StaffSession_idleExpiresAt_absoluteExpiresAt_revokedAt_idx"
  ON "StaffSession"("idleExpiresAt", "absoluteExpiresAt", "revokedAt");

ALTER TABLE "StaffCredential"
  DROP CONSTRAINT IF EXISTS "StaffCredential_customerId_fkey",
  ADD CONSTRAINT "StaffCredential_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffSession"
  DROP CONSTRAINT IF EXISTS "StaffSession_customerId_fkey",
  ADD CONSTRAINT "StaffSession_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  DROP CONSTRAINT IF EXISTS "StaffSession_credentialId_fkey",
  ADD CONSTRAINT "StaffSession_credentialId_fkey"
  FOREIGN KEY ("credentialId") REFERENCES "StaffCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION "guard_final_active_admin"()
RETURNS TRIGGER AS $$
DECLARE
  removes_active_admin BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    removes_active_admin := OLD."role" = 'ADMIN'::"AccountRole"
      AND OLD."accessStatus" = 'ACTIVE'::"AccountAccessStatus";
  ELSE
    removes_active_admin := OLD."role" = 'ADMIN'::"AccountRole"
      AND OLD."accessStatus" = 'ACTIVE'::"AccountAccessStatus"
      AND (
        NEW."role" <> 'ADMIN'::"AccountRole"
        OR NEW."accessStatus" <> 'ACTIVE'::"AccountAccessStatus"
      );
  END IF;

  IF removes_active_admin THEN
    PERFORM pg_advisory_xact_lock(hashtext('recharza-final-active-admin'));

    IF NOT EXISTS (
      SELECT 1
        FROM "Customer"
       WHERE "id" <> OLD."id"
         AND "role" = 'ADMIN'::"AccountRole"
         AND "accessStatus" = 'ACTIVE'::"AccountAccessStatus"
    ) THEN
      RAISE EXCEPTION 'RECHARZA_FINAL_ACTIVE_ADMIN_REQUIRED'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Customer_final_active_admin_guard" ON "Customer";
CREATE TRIGGER "Customer_final_active_admin_guard"
BEFORE UPDATE OF "role", "accessStatus" OR DELETE ON "Customer"
FOR EACH ROW
EXECUTE FUNCTION "guard_final_active_admin"();

CREATE OR REPLACE FUNCTION "revoke_staff_sessions_after_authority_change"()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."role" IS DISTINCT FROM NEW."role"
     OR OLD."accessStatus" IS DISTINCT FROM NEW."accessStatus" THEN
    UPDATE "StaffSession"
       SET "revokedAt" = COALESCE("revokedAt", CURRENT_TIMESTAMP)
     WHERE "customerId" = NEW."id"
       AND "revokedAt" IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Customer_staff_session_authority_revoke" ON "Customer";
CREATE TRIGGER "Customer_staff_session_authority_revoke"
AFTER UPDATE OF "role", "accessStatus" ON "Customer"
FOR EACH ROW
EXECUTE FUNCTION "revoke_staff_sessions_after_authority_change"();

CREATE OR REPLACE FUNCTION "revoke_staff_sessions_after_password_change"()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."passwordHash" IS DISTINCT FROM NEW."passwordHash"
     OR OLD."passwordVersion" IS DISTINCT FROM NEW."passwordVersion" THEN
    UPDATE "StaffSession"
       SET "revokedAt" = COALESCE("revokedAt", CURRENT_TIMESTAMP)
     WHERE "credentialId" = NEW."id"
       AND "revokedAt" IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "StaffCredential_password_session_revoke" ON "StaffCredential";
CREATE TRIGGER "StaffCredential_password_session_revoke"
AFTER UPDATE OF "passwordHash", "passwordVersion" ON "StaffCredential"
FOR EACH ROW
EXECUTE FUNCTION "revoke_staff_sessions_after_password_change"();

COMMIT;

-- Create account access lifecycle enum.
CREATE TYPE "AccountAccessStatus" AS ENUM (
  'ACTIVE',
  'ORDER_RESTRICTED',
  'SIGN_IN_RESTRICTED',
  'SUSPENDED'
);

-- Add customer access and scoped staff-permission state.
ALTER TABLE "Customer"
  ADD COLUMN "accessStatus" "AccountAccessStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "restrictionReason" TEXT,
  ADD COLUMN "restrictionUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "staffPermissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "staffPermissionsConfigured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Customer_role_accessStatus_createdAt_idx"
  ON "Customer"("role", "accessStatus", "createdAt");

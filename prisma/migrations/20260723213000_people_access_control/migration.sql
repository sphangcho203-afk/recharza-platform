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

-- Reject order inserts for any account that is not fully active. The application
-- also performs access checks, but this trigger protects future write paths too.
CREATE FUNCTION "enforce_customer_order_access"()
RETURNS TRIGGER AS $$
DECLARE
  current_access "AccountAccessStatus";
BEGIN
  SELECT "accessStatus"
    INTO current_access
    FROM "Customer"
   WHERE "id" = NEW."customerId";

  IF current_access IS DISTINCT FROM 'ACTIVE'::"AccountAccessStatus" THEN
    RAISE EXCEPTION 'RECHARZA_ORDER_ACCESS_BLOCKED'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Order_customer_access_gate"
BEFORE INSERT ON "Order"
FOR EACH ROW
EXECUTE FUNCTION "enforce_customer_order_access"();

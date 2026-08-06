CREATE UNIQUE INDEX IF NOT EXISTS "SupplierProduct_provider_categoryId_offerId_key"
ON public."SupplierProduct" ("provider", "categoryId", "offerId");

DROP INDEX IF EXISTS public."SupplierProduct_provider_offer_key";

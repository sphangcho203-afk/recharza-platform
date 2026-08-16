type ComparableSupplierOffer = {
  gameSlug: string;
  categoryId: string;
  name: string;
  retailPriceInPaise: number;
  landedCostInPaise: number;
};

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function isSuppressedSupplierOffer(input: { name: string; offerId?: string | null }) {
  const normalizedName = normalizeName(input.name);
  const normalizedOfferId = normalizeName(input.offerId ?? "");
  return normalizedName === "weekly elite pack" || normalizedOfferId === "weekly elite pack";
}

/**
 * Returns a stable semantic family only for recurring membership products.
 * Diamond/UC/VP quantities remain separate because they represent different
 * entitlements even when their display names contain similar words.
 */
export function getSupplierOfferIdentity(name: string) {
  const normalized = normalizeName(name);

  if (/\bweekly\s+(membership|pass|elite\s+pack)\b/.test(normalized)) {
    return "weekly-membership";
  }

  if (/\bmonthly\s+(membership|pass|elite\s+pack)\b/.test(normalized)) {
    return "monthly-membership";
  }

  return normalized;
}

/**
 * Keep the cheapest customer-visible offer for each game, supplier category,
 * and semantic product identity. Supplier cost is the tie-breaker so a lower
 * retail price never hides a more expensive supplier route accidentally.
 */
export function selectBestSupplierOffers<T extends ComparableSupplierOffer>(
  products: readonly T[],
) {
  const selected = new Map<string, T>();

  for (const product of products) {
    const key = `${product.gameSlug}:${product.categoryId}:${getSupplierOfferIdentity(product.name)}`;
    const current = selected.get(key);

    if (
      !current ||
      product.retailPriceInPaise < current.retailPriceInPaise ||
      (product.retailPriceInPaise === current.retailPriceInPaise &&
        product.landedCostInPaise < current.landedCostInPaise)
    ) {
      selected.set(key, product);
    }
  }

  return Array.from(selected.values());
}

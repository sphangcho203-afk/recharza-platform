export type PricingPolicy = {
  usdInrRatePaise: number;
  fxBufferBps: number;
  gatewayFeeBps: number;
  targetMarginBps: number;
  minimumMarginInPaise: number;
  overheadInPaise: number;
  roundingInPaise: number;
};

export type PriceCalculation = {
  supplierPriceUsdMicros: number;
  landedCostInPaise: number;
  retailPriceInPaise: number;
  gatewayFeeInPaise: number;
  expectedMarginInPaise: number;
  expectedMarginBps: number;
  targetMarginBps: number;
};

export const defaultPricingPolicy: PricingPolicy = {
  usdInrRatePaise: 9650,
  fxBufferBps: 250,
  gatewayFeeBps: 250,
  targetMarginBps: 1200,
  minimumMarginInPaise: 1500,
  overheadInPaise: 500,
  roundingInPaise: 500,
};

function assertInteger(name: string, value: number, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be a safe integer greater than or equal to ${minimum}.`);
  }
}

function ceilDivide(numerator: number, denominator: number) {
  if (denominator <= 0) {
    throw new Error("Pricing policy leaves no room for costs and margin.");
  }

  return Math.floor((numerator + denominator - 1) / denominator);
}

function roundUp(value: number, increment: number) {
  return ceilDivide(value, increment) * increment;
}

export function parseUsdToMicros(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();

  if (!/^\d+(?:\.\d{1,6})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  const micros = Number(whole) * 1_000_000 + Number(fraction.padEnd(6, "0"));

  return Number.isSafeInteger(micros) && micros > 0 ? micros : null;
}

export function chooseTargetMarginBps(
  supplierPriceUsdMicros: number,
  policy: PricingPolicy,
) {
  const baseCostInPaise = ceilDivide(
    supplierPriceUsdMicros * policy.usdInrRatePaise,
    1_000_000,
  );

  if (baseCostInPaise < 20_000) {
    return Math.max(policy.targetMarginBps, 1400);
  }

  if (baseCostInPaise < 50_000) {
    return Math.max(policy.targetMarginBps, 1200);
  }

  if (baseCostInPaise < 100_000) {
    return Math.max(1000, Math.min(policy.targetMarginBps, 1200));
  }

  return Math.max(800, Math.min(policy.targetMarginBps, 1000));
}

export function calculateRetailPrice(
  supplierPriceUsdMicros: number,
  policy: PricingPolicy = defaultPricingPolicy,
  targetMarginBps = chooseTargetMarginBps(supplierPriceUsdMicros, policy),
): PriceCalculation {
  assertInteger("supplierPriceUsdMicros", supplierPriceUsdMicros, 1);
  assertInteger("usdInrRatePaise", policy.usdInrRatePaise, 1);
  assertInteger("fxBufferBps", policy.fxBufferBps);
  assertInteger("gatewayFeeBps", policy.gatewayFeeBps);
  assertInteger("targetMarginBps", targetMarginBps);
  assertInteger("minimumMarginInPaise", policy.minimumMarginInPaise);
  assertInteger("overheadInPaise", policy.overheadInPaise);
  assertInteger("roundingInPaise", policy.roundingInPaise, 1);

  const baseCostInPaise = ceilDivide(
    supplierPriceUsdMicros * policy.usdInrRatePaise,
    1_000_000,
  );
  const bufferedCostInPaise = ceilDivide(
    baseCostInPaise * (10_000 + policy.fxBufferBps),
    10_000,
  );
  const landedCostInPaise = bufferedCostInPaise + policy.overheadInPaise;

  const marginDenominator = 10_000 - policy.gatewayFeeBps - targetMarginBps;
  const priceForPercentageMargin = ceilDivide(
    landedCostInPaise * 10_000,
    marginDenominator,
  );
  const priceForMinimumMargin = ceilDivide(
    (landedCostInPaise + policy.minimumMarginInPaise) * 10_000,
    10_000 - policy.gatewayFeeBps,
  );
  const retailPriceInPaise = roundUp(
    Math.max(priceForPercentageMargin, priceForMinimumMargin),
    policy.roundingInPaise,
  );
  const gatewayFeeInPaise = ceilDivide(
    retailPriceInPaise * policy.gatewayFeeBps,
    10_000,
  );
  const expectedMarginInPaise = Math.max(
    0,
    retailPriceInPaise - gatewayFeeInPaise - landedCostInPaise,
  );
  const expectedMarginBps = Math.floor(
    (expectedMarginInPaise * 10_000) / retailPriceInPaise,
  );

  return {
    supplierPriceUsdMicros,
    landedCostInPaise,
    retailPriceInPaise,
    gatewayFeeInPaise,
    expectedMarginInPaise,
    expectedMarginBps,
    targetMarginBps,
  };
}

export function formatUsdMicros(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value / 1_000_000);
}

import { verifyOperatorAccess } from "@/lib/operator-auth";
import {
  calculateRetailPrice,
  defaultPricingPolicy,
  type PricingPolicy,
} from "@/lib/pricing";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";
export const maxDuration = 60;

const FIELD_LIMITS: Record<keyof PricingPolicy, { min: number; max: number }> = {
  usdInrRatePaise: { min: 5_000, max: 20_000 },
  fxBufferBps: { min: 0, max: 2_000 },
  gatewayFeeBps: { min: 0, max: 1_000 },
  targetMarginBps: { min: 300, max: 4_000 },
  minimumMarginInPaise: { min: 0, max: 100_000 },
  overheadInPaise: { min: 0, max: 50_000 },
  roundingInPaise: { min: 100, max: 10_000 },
};

function parsePolicy(payload: unknown): PricingPolicy | null {
  if (!payload || typeof payload !== "object") return null;
  const object = payload as Record<string, unknown>;
  const policy = {} as PricingPolicy;

  for (const [key, limits] of Object.entries(FIELD_LIMITS) as Array<
    [keyof PricingPolicy, { min: number; max: number }]
  >) {
    const value = Number(object[key]);
    if (!Number.isSafeInteger(value) || value < limits.min || value > limits.max) return null;
    policy[key] = value;
  }

  return policy.gatewayFeeBps + policy.targetMarginBps >= 9_000 ? null : policy;
}

function toPricingPolicy(config: PricingPolicy): PricingPolicy {
  return {
    usdInrRatePaise: config.usdInrRatePaise,
    fxBufferBps: config.fxBufferBps,
    gatewayFeeBps: config.gatewayFeeBps,
    targetMarginBps: config.targetMarginBps,
    minimumMarginInPaise: config.minimumMarginInPaise,
    overheadInPaise: config.overheadInPaise,
    roundingInPaise: config.roundingInPaise,
  };
}

async function getPolicy() {
  return getPrisma().pricingConfiguration.upsert({
    where: { id: "default" },
    update: {},
    create: defaultPricingPolicy,
  });
}

export async function GET(request: Request) {
  try {
    const operator = await verifyOperatorAccess(request);
    if (!operator) {
      return Response.json({ ok: false, message: "Verified staff access is required." }, { status: 401 });
    }

    const prisma = getPrisma();
    const [policy, productCount, publishedCount, latestSync] = await Promise.all([
      getPolicy(),
      prisma.supplierProduct.count({ where: { provider: "fazercards" } }),
      prisma.supplierProduct.count({
        where: { provider: "fazercards", available: true, published: true },
      }),
      prisma.supplierSyncRun.findFirst({
        where: { provider: "fazercards" },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    return Response.json({
      ok: true,
      access: { mode: operator.mode, role: operator.role },
      policy: toPricingPolicy(policy),
      catalog: { productCount, publishedCount, latestSync },
    });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json({ ok: false, message: "Pricing controls are not configured yet." }, { status: 503 });
    }
    console.error("Pricing policy read failed", error);
    return Response.json({ ok: false, message: "Pricing controls are temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const operator = await verifyOperatorAccess(request);
    if (!operator) {
      return Response.json({ ok: false, message: "Verified staff access is required." }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    const policy = parsePolicy(payload);
    if (!policy) {
      return Response.json(
        { ok: false, message: "Pricing values are invalid or would leave insufficient room for fees and margin." },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const previous = toPricingPolicy(await getPolicy());
    const products = await prisma.supplierProduct.findMany({
      where: { provider: "fazercards" },
      select: { id: true, supplierPriceUsdMicros: true },
    });

    await prisma.pricingConfiguration.update({ where: { id: "default" }, data: policy });

    for (let index = 0; index < products.length; index += 100) {
      const batch = products.slice(index, index + 100);
      await prisma.$transaction(
        batch.map((product) => {
          const price = calculateRetailPrice(product.supplierPriceUsdMicros, policy);
          return prisma.supplierProduct.update({
            where: { id: product.id },
            data: {
              landedCostInPaise: price.landedCostInPaise,
              retailPriceInPaise: price.retailPriceInPaise,
              expectedMarginInPaise: price.expectedMarginInPaise,
              expectedMarginBps: price.expectedMarginBps,
            },
          });
        }),
      );
    }

    await prisma.adminAuditLog.create({
      data: {
        action: "PRICING_POLICY_UPDATED",
        actorFingerprint: operator.actorFingerprint,
        actorCustomerId: operator.actorCustomerId,
        metadata: {
          previous,
          next: policy,
          productsRepriced: products.length,
          actorRole: operator.role,
          accessMode: operator.mode,
        },
      },
    });

    return Response.json({ ok: true, policy, productsRepriced: products.length });
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json({ ok: false, message: "Pricing controls are not configured yet." }, { status: 503 });
    }
    console.error("Pricing policy update failed", error);
    return Response.json({ ok: false, message: "The pricing policy could not be updated safely." }, { status: 500 });
  }
}

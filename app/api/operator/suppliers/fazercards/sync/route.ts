import type { Prisma } from "@/generated/prisma/client";
import { verifyOperatorAccess } from "@/lib/operator-auth";
import {
  calculateRetailPrice,
  defaultPricingPolicy,
  parseUsdToMicros,
  type PricingPolicy,
} from "@/lib/pricing";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import {
  getApprovedFazerCardsCategoryIds,
  getFazerCardsTopupOffers,
  listFazerCardsTopupCategories,
} from "@/lib/suppliers/fazercards";

export const runtime = "nodejs";
export const maxDuration = 60;

function toPricingPolicy(config: {
  usdInrRatePaise: number;
  fxBufferBps: number;
  gatewayFeeBps: number;
  targetMarginBps: number;
  minimumMarginInPaise: number;
  overheadInPaise: number;
  roundingInPaise: number;
}): PricingPolicy {
  return { ...config };
}

function safeErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.slice(0, 500)
    : "Unknown supplier synchronization error.";
}

export async function POST(request: Request) {
  const operator = await verifyOperatorAccess(request);

  if (!operator) {
    return Response.json(
      { ok: false, message: "Verified staff access is required." },
      { status: 401 },
    );
  }

  const prisma = getPrisma();
  const syncRun = await prisma.supplierSyncRun.create({
    data: { provider: "fazercards", status: "RUNNING" },
  });

  try {
    const storedPolicy = await prisma.pricingConfiguration.upsert({
      where: { id: "default" },
      update: {},
      create: defaultPricingPolicy,
    });
    const policy = toPricingPolicy(storedPolicy);
    const approvedCategoryIds = getApprovedFazerCardsCategoryIds();
    const categories = (await listFazerCardsTopupCategories()).filter(
      (category) => category.gameSlug !== null,
    );

    let offersSynced = 0;
    let invalidOffers = 0;
    let publishedOffers = 0;

    for (const category of categories) {
      if (!category.gameSlug) continue;

      const group = await getFazerCardsTopupOffers(category.categoryId);
      await prisma.supplierProduct.updateMany({
        where: { provider: "fazercards", categoryId: category.categoryId },
        data: { available: false, syncedAt: new Date() },
      });

      for (const offer of group.offers) {
        const supplierPriceUsdMicros = parseUsdToMicros(offer.priceUsd);
        if (!supplierPriceUsdMicros) {
          invalidOffers += 1;
          continue;
        }

        const price = calculateRetailPrice(supplierPriceUsdMicros, policy);
        const published = approvedCategoryIds.has(category.categoryId);
        const fields = group.fields as Prisma.InputJsonValue;
        const raw = {
          categoryName: category.name,
          categoryNote: category.note,
          offer: offer.raw,
        } as Prisma.InputJsonValue;

        await prisma.supplierProduct.upsert({
          where: {
            provider_offer: {
              provider: "fazercards",
              offerId: offer.offerId,
            },
          },
          update: {
            categoryId: category.categoryId,
            gameSlug: category.gameSlug,
            name: offer.name,
            region: offer.region,
            supplierCurrency: "USD",
            supplierPriceUsdMicros,
            landedCostInPaise: price.landedCostInPaise,
            retailPriceInPaise: price.retailPriceInPaise,
            expectedMarginInPaise: price.expectedMarginInPaise,
            expectedMarginBps: price.expectedMarginBps,
            available: true,
            published,
            fields,
            raw,
            syncedAt: new Date(),
          },
          create: {
            provider: "fazercards",
            categoryId: category.categoryId,
            offerId: offer.offerId,
            gameSlug: category.gameSlug,
            name: offer.name,
            region: offer.region,
            supplierCurrency: "USD",
            supplierPriceUsdMicros,
            landedCostInPaise: price.landedCostInPaise,
            retailPriceInPaise: price.retailPriceInPaise,
            expectedMarginInPaise: price.expectedMarginInPaise,
            expectedMarginBps: price.expectedMarginBps,
            available: true,
            published,
            fields,
            raw,
            syncedAt: new Date(),
          },
        });

        offersSynced += 1;
        if (published) publishedOffers += 1;
      }
    }

    const completedAt = new Date();
    await prisma.supplierSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "COMPLETED",
        categoriesSynced: categories.length,
        offersSynced,
        completedAt,
      },
    });
    await prisma.adminAuditLog.create({
      data: {
        action: "FAZERCARDS_CATALOG_SYNCED",
        actorFingerprint: operator.actorFingerprint,
        actorCustomerId: operator.actorCustomerId,
        metadata: {
          syncRunId: syncRun.id,
          categoriesSynced: categories.length,
          offersSynced,
          invalidOffers,
          publishedOffers,
          approvedCategoryCount: approvedCategoryIds.size,
          actorRole: operator.role,
          accessMode: operator.mode,
        },
      },
    });

    return Response.json({
      ok: true,
      syncRunId: syncRun.id,
      completedAt: completedAt.toISOString(),
      categoriesSynced: categories.length,
      offersSynced,
      invalidOffers,
      publishedOffers,
      publicationMode:
        approvedCategoryIds.size > 0
          ? "approved-category allowlist"
          : "sync-only; no live offers published",
    });
  } catch (error) {
    const message = safeErrorMessage(error);

    await prisma.supplierSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      },
    });

    if (error instanceof RuntimeConfigurationError) {
      return Response.json({ ok: false, message }, { status: 503 });
    }

    console.error("FazerCards synchronization failed", error);
    return Response.json(
      { ok: false, message: "FazerCards synchronization failed safely." },
      { status: 502 },
    );
  }
}

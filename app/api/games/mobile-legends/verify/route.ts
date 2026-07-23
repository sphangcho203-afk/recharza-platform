import { getRequestSession } from "@/lib/auth";
import {
  isPackageAvailableForMarket,
  parseMobileLegendsMarket,
} from "@/lib/mobile-legends-market";
import { validateMobileLegendsPlayer } from "@/lib/order-validation";
import { getPrisma } from "@/lib/prisma";
import { consumeRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { getMobileLegendsPackageForCheckout } from "@/lib/storefront-catalog";
import { validateFazerCardsPlayer } from "@/lib/suppliers/fazercards-operations";

export const runtime = "nodejs";

const VERIFY_LIMIT = 20;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  let rateHeaders: Record<string, string> = {};

  try {
    const rateLimit = await consumeRateLimit({
      request,
      route: "POST:/api/games/mobile-legends/verify",
      limit: VERIFY_LIMIT,
      windowMs: VERIFY_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        { valid: false, message: "Too many validation attempts. Wait before retrying." },
        { status: 429, headers: rateHeaders },
      );
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return Response.json(
        { valid: false, message: "Player details are required." },
        { status: 400, headers: rateHeaders },
      );
    }

    const data = payload as Record<string, unknown>;
    const selectedMarket = parseMobileLegendsMarket(data.marketCode);
    if (!selectedMarket) {
      return Response.json(
        {
          valid: false,
          message: "Choose a supported Mobile Legends fulfilment market before validating the player.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const local = validateMobileLegendsPlayer(data.playerId, data.zoneId);
    if (!local.valid) {
      return Response.json(local, { status: 400, headers: rateHeaders });
    }

    const packageId = typeof data.packageId === "string" ? data.packageId.trim() : "";
    if (!packageId) {
      return Response.json(
        {
          ...local,
          marketCode: selectedMarket.code,
          confirmed: false,
          nickname: null,
          verificationMode: "local-format",
        },
        { headers: rateHeaders },
      );
    }

    const selectedPackage = await getMobileLegendsPackageForCheckout(packageId);
    if (!selectedPackage) {
      return Response.json(
        { valid: false, message: "That package is no longer available. Refresh the catalogue." },
        { status: 409, headers: rateHeaders },
      );
    }

    if (!isPackageAvailableForMarket(selectedPackage.region, selectedMarket.code)) {
      return Response.json(
        {
          valid: false,
          message: `That package is not approved for the ${selectedMarket.label} market.`,
        },
        { status: 409, headers: rateHeaders },
      );
    }

    if (selectedPackage.source !== "fazercards-live" || !selectedPackage.supplierProductId) {
      return Response.json(
        {
          ...local,
          marketCode: selectedMarket.code,
          confirmed: false,
          nickname: null,
          verificationMode: "local-format",
          message: `Player format is valid for the ${selectedMarket.label} route. Indicative packages cannot run supplier nickname validation.`,
        },
        { headers: rateHeaders },
      );
    }

    const session = await getRequestSession(request);
    if (!session) {
      return Response.json(
        {
          ...local,
          marketCode: selectedMarket.code,
          confirmed: false,
          nickname: null,
          verificationMode: "local-format",
          message: `Player format is valid for the ${selectedMarket.label} route. Sign in to run supplier nickname validation.`,
        },
        { headers: rateHeaders },
      );
    }

    const product = await getPrisma().supplierProduct.findFirst({
      where: {
        id: selectedPackage.supplierProductId,
        provider: "fazercards",
        available: true,
        published: true,
      },
      select: {
        categoryId: true,
        offerId: true,
        fields: true,
      },
    });

    if (!product) {
      return Response.json(
        { valid: false, message: "The supplier offer is no longer approved." },
        { status: 409, headers: rateHeaders },
      );
    }

    const supplier = await validateFazerCardsPlayer({
      categoryId: product.categoryId,
      offerId: product.offerId,
      playerId: local.playerId,
      zoneId: local.zoneId,
      fieldSchema: product.fields,
    });

    return Response.json(
      {
        valid: supplier.valid,
        confirmed: supplier.confirmed,
        nickname: supplier.nickname,
        verificationMode: supplier.mode,
        playerId: local.playerId,
        zoneId: local.zoneId,
        marketCode: selectedMarket.code,
        message: supplier.message,
      },
      { status: supplier.valid ? 200 : 400, headers: rateHeaders },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        { valid: false, message: "Supplier validation is not configured correctly." },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Mobile Legends validation failed", error);
    return Response.json(
      { valid: false, message: "Player validation is temporarily unavailable." },
      { status: 502, headers: rateHeaders },
    );
  }
}

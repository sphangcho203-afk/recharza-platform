import {
  isPackageAvailableForMarket,
  parseMobileLegendsMarket,
} from "@/lib/mobile-legends-market";
import { validateMobileLegendsIdentity } from "@/lib/player-identity-provider";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { getMobileLegendsPackageForCheckout } from "@/lib/storefront-catalog";

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
        {
          valid: false,
          message: "Too many validation attempts. Wait before retrying.",
        },
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
          message:
            "Choose a supported Mobile Legends account region before validating the player.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    const packageId =
      typeof data.packageId === "string" ? data.packageId.trim() : "";
    const selectedPackage = packageId
      ? await getMobileLegendsPackageForCheckout(packageId)
      : null;

    if (!selectedPackage) {
      return Response.json(
        {
          valid: false,
          message:
            "That package changed or is unavailable. Refresh the catalogue and choose again.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    if (
      !isPackageAvailableForMarket(
        selectedPackage.region,
        selectedMarket.code,
      )
    ) {
      return Response.json(
        {
          valid: false,
          message: `That package is not approved for ${selectedMarket.label}.`,
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const identity = await validateMobileLegendsIdentity({
      playerId: data.playerId,
      zoneId: data.zoneId,
    });

    return Response.json(
      {
        valid: identity.valid,
        confirmed: identity.confirmed,
        nickname: identity.nickname,
        verificationMode: identity.verificationMode,
        playerId: identity.playerId,
        zoneId: identity.zoneId,
        marketCode: selectedMarket.code,
        packageId: selectedPackage.id,
        message: identity.message,
      },
      {
        status: identity.valid ? 200 : 400,
        headers: rateHeaders,
      },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        {
          valid: false,
          message: "Account validation is not configured correctly.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    console.error("Mobile Legends validation failed", error);
    return Response.json(
      {
        valid: false,
        message: "Account validation is temporarily unavailable.",
      },
      { status: 502, headers: rateHeaders },
    );
  }
}

import { validateSupplierCheckoutIdentity } from "@/lib/commerce/game-identity";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { lookupShop2TopUpPlayerIdentity } from "@/lib/suppliers/shop2topup";
import {
  getPublishedGamePackageForCheckout,
  isSupplierCheckoutGameSlug,
} from "@/lib/storefront-game-catalog";
import {
  lookupVolseverGameIdentity,
  VolseverProviderError,
} from "@/lib/volsever";

export const runtime = "nodejs";

const VERIFY_LIMIT = 20;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;
const MAX_GAME_SLUG_LENGTH = 64;
const MAX_VERIFY_BODY_BYTES = 8 * 1024;

function jsonError(message: string, status: number, headers: Record<string, string>) {
  return Response.json({ valid: false, message }, { status, headers });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ gameSlug: string }> },
) {
  const { gameSlug } = await context.params;
  const slug = gameSlug.trim().toLowerCase();
  let rateHeaders: Record<string, string> = {};

  try {
    if (
      slug.length === 0 ||
      slug.length > MAX_GAME_SLUG_LENGTH ||
      !/^[a-z0-9-]+$/.test(slug)
    ) {
      return jsonError("That game is not registered for checkout.", 400, rateHeaders);
    }

    if (!isSupplierCheckoutGameSlug(slug)) {
      return jsonError("That game is not registered for checkout.", 400, rateHeaders);
    }

    const rateLimit = await consumeRateLimit({
      request,
      route: `POST:/api/games/${slug}/verify`,
      limit: VERIFY_LIMIT,
      windowMs: VERIFY_WINDOW_MS,
    });
    rateHeaders = createRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          valid: false,
          message: "Too many validation attempts. Please wait before retrying.",
        },
        { status: 429, headers: rateHeaders },
      );
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength) {
      const parsedLength = Number(contentLength);
      if (!Number.isSafeInteger(parsedLength) || parsedLength < 0 || parsedLength > MAX_VERIFY_BODY_BYTES) {
        return jsonError("Player details payload is too large.", 413, rateHeaders);
      }
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_VERIFY_BODY_BYTES) {
      return jsonError("Player details payload is too large.", 413, rateHeaders);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = null;
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return jsonError("Player details are required.", 400, rateHeaders);
    }

    const data = payload as Record<string, unknown>;
    const nestedIdentity =
      data.identity && typeof data.identity === "object" && !Array.isArray(data.identity)
        ? (data.identity as Record<string, unknown>)
        : null;
    const identityData = nestedIdentity ?? data;
    const packageId =
      typeof data.packageId === "string" ? data.packageId.trim() : "";
    const selectedPackage = packageId
      ? await getPublishedGamePackageForCheckout(slug, packageId)
      : null;

    if (!selectedPackage) {
      return Response.json(
        {
          valid: false,
          message:
            "This item is currently unavailable. Please refresh and try again.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const identity = validateSupplierCheckoutIdentity(
      slug,
      {
        playerId: identityData.playerId,
        zoneId: identityData.zoneId,
        serverId: identityData.serverId,
        riotId: identityData.riotId,
      },
      selectedPackage.fields,
    );

    if (!identity.valid) {
      return Response.json(
        { valid: false, message: identity.message },
        { status: 400, headers: rateHeaders },
      );
    }

    const provider = process.env.IGN_LOOKUP_PROVIDER?.trim().toLowerCase() ?? "";
    
    // Normalize game slug for provider lookup
    let lookupSlug = slug;
    if (slug === "mobile-legends") {
      const market = selectedPackage.marketCode?.toLowerCase() || "";
      if (market === "tr") lookupSlug = "mobile-legends-tr";
      else if (market === "br") lookupSlug = "mobile-legends-br";
    }

    if (provider !== "volsever" && provider !== "shop2topup") {
      return Response.json(
        {
          valid: true,
          confirmed: false,
          nickname: null,
          region: null,
          verificationMode: "format-only",
          playerId: identity.playerId,
          zoneId: identity.zoneId,
          marketCode: selectedPackage.marketCode,
          packageId: selectedPackage.id,
          message:
            "Account details are valid. Live confirmation is temporarily disabled.",
        },
        { status: 200, headers: rateHeaders },
      );
    }

    let result: Awaited<ReturnType<typeof lookupVolseverGameIdentity>> | null =
      null;
    let s2sUnavailable = false;

    if (provider === "shop2topup") {
      const outcome = await lookupShop2TopUpPlayerIdentity({
        gameSlug: lookupSlug,
        playerId: identity.playerId,
        zoneId: identity.zoneId,
        marketCode: selectedPackage.marketCode,
      });
      
      // If Shop2TopUp confirms the account, return it immediately.
      if (outcome.status === "valid") {
        return Response.json(
          {
            valid: outcome.result.valid,
            confirmed: outcome.result.confirmed,
            nickname: outcome.result.nickname,
            region: outcome.result.region,
            verificationMode: outcome.result.verificationMode,
            playerId: outcome.result.playerId,
            zoneId: outcome.result.zoneId,
            marketCode: selectedPackage.marketCode,
            packageId: selectedPackage.id,
            message: outcome.result.message,
          },
          { status: 200, headers: rateHeaders },
        );
      }
      
      // If Shop2TopUp is unavailable or failed to find the account, try Volsever as a strong backup.
      s2sUnavailable = true;
    }

    result = await lookupVolseverGameIdentity({
      gameSlug: lookupSlug,
      playerId: identity.playerId,
      zoneId: identity.zoneId,
      marketCode: selectedPackage.marketCode,
    });

    if (result.valid) {
      result.message = "Account confirmed successfully.";
    } else {
      result.message = "We could not verify your account details. Please ensure your Player ID and Zone ID are correct.";
    }

    return Response.json(
      {
        valid: result.valid,
        confirmed: result.confirmed,
        nickname: result.nickname,
        region: result.region,
        verificationMode: result.verificationMode,
        playerId: result.playerId,
        zoneId: result.zoneId,
        marketCode: selectedPackage.marketCode,
        packageId: selectedPackage.id,
        message: result.message,
      },
      {
        status: result.valid ? 200 : 400,
        headers: rateHeaders,
      },
    );
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) {
      return Response.json(
        {
          valid: false,
          message: "Account confirmation is temporarily unavailable.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    if (error instanceof VolseverProviderError) {
      return Response.json(
        {
          valid: false,
          message: "Account confirmation is temporarily unavailable.",
        },
        { status: 502, headers: rateHeaders },
      );
    }

    console.error(`Game verification failed for ${slug}`, error);
    return Response.json(
      {
        valid: false,
        message: "Account validation is temporarily unavailable.",
      },
      { status: 502, headers: rateHeaders },
    );
  }
}

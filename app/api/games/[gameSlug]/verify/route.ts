import { validateSupplierCheckoutIdentity } from "@/lib/commerce/game-identity";
import {
  consumeRateLimit,
  createRateLimitHeaders,
} from "@/lib/rate-limit";
import { RuntimeConfigurationError } from "@/lib/runtime-config";
import {
  getPublishedGamePackageForCheckout,
  isSupplierCheckoutGameSlug,
} from "@/lib/storefront-game-catalog";
import {
  isVolseverGameSlug,
  lookupVolseverGameIdentity,
  VolseverProviderError,
} from "@/lib/volsever";

export const runtime = "nodejs";

const VERIFY_LIMIT = 20;
const VERIFY_WINDOW_MS = 10 * 60 * 1000;

export async function POST(
  request: Request,
  context: { params: Promise<{ gameSlug: string }> },
) {
  const { gameSlug } = await context.params;
  const slug = gameSlug.trim().toLowerCase();
  let rateHeaders: Record<string, string> = {};

  try {
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
          message: "Too many validation attempts. Wait before retrying.",
        },
        { status: 429, headers: rateHeaders },
      );
    }

    if (slug === "mobile-legends") {
      return Response.json(
        {
          valid: false,
          message:
            "Mobile Legends has its own dedicated verification route.",
        },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!isSupplierCheckoutGameSlug(slug)) {
      return Response.json(
        {
          valid: false,
          message: "That game is not registered for checkout.",
        },
        { status: 400, headers: rateHeaders },
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
            "That package changed or is unavailable. Refresh the catalogue and choose again.",
        },
        { status: 409, headers: rateHeaders },
      );
    }

    const identity = validateSupplierCheckoutIdentity(
      slug,
      {
        playerId: data.playerId,
        zoneId: data.zoneId,
        serverId: data.serverId,
        riotId: data.riotId,
      },
      selectedPackage.fields,
    );

    if (!identity.valid) {
      return Response.json(
        { valid: false, message: identity.message },
        { status: 400, headers: rateHeaders },
      );
    }

    if (!isVolseverGameSlug(slug)) {
      return Response.json(
        {
          valid: true,
          confirmed: false,
          nickname: null,
          verificationMode: "format-only",
          playerId: identity.playerId,
          zoneId: identity.zoneId,
          marketCode: selectedPackage.marketCode,
          packageId: selectedPackage.id,
          message:
            "Player details are valid. Live account lookup is not configured for this game yet.",
        },
        { status: 200, headers: rateHeaders },
      );
    }

    if (process.env.IGN_LOOKUP_PROVIDER?.trim().toLowerCase() !== "volsever") {
      return Response.json(
        {
          valid: true,
          confirmed: false,
          nickname: null,
          verificationMode: "format-only",
          playerId: identity.playerId,
          zoneId: identity.zoneId,
          marketCode: selectedPackage.marketCode,
          packageId: selectedPackage.id,
          message:
            "Player details are valid. Live account lookup is temporarily disabled.",
        },
        { status: 200, headers: rateHeaders },
      );
    }

    const result = await lookupVolseverGameIdentity({
      gameSlug: slug,
      playerId: identity.playerId,
      zoneId: identity.zoneId,
    });

    return Response.json(
      {
        valid: result.valid,
        confirmed: result.confirmed,
        nickname: result.nickname,
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
          message: "Account validation is not configured correctly.",
        },
        { status: 503, headers: rateHeaders },
      );
    }

    if (error instanceof VolseverProviderError) {
      return Response.json(
        {
          valid: false,
          message: "Account validation is temporarily unavailable.",
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

import type {
  PlayerIdentityResult,
} from "@/lib/player-identity-provider";

/**
 * Shop2TopUp reseller API client — verification-only.
 *
 * We use Shop2TopUp's player validation endpoint (POST /player/validate) to
 * confirm customer accounts. Delivery remains Fazercards; this module never
 * creates orders, so no wallet balance is spent.
 *
 * Key behaviors observed on the live API (2026-08-19):
 *  - Validation is configured per purchasable item (sub_category_id), not per
 *    game. Voucher-type items return INVALID_PRODUCT_CONFIG; some direct
 *    top-up items return NO_PLAYER_VALIDATION_REQUIRED.
 *  - Valid player: success=true, validated=true, player.player_name echoes
 *    the in-game name. Fake/unknown players return PLAYER_NOT_FOUND.
 *  - The catalog endpoint rejects non-browser user agents (403) and the
 *    subcategory list ignores the category_id filter — so we pin one known
 *    validation item per game instead of discovering them at runtime.
 */

const BASE_URL = "https://shop2topup.com/api/endpoints/v1";

export type Shop2TopUpGameConfig = {
  /** Shop2TopUp catalog category id (for docs/requirements reference). */
  categoryId: number;
  /**
   * Subcategory items whose supplier API performs real player validation.
   * Multiple pinned items are tried in order so that accounts from different
   * catalogue regions (e.g. MENA vs CIS free-fire diamond packs) all resolve —
   * Shop2TopUp validation is regional to the pinned pack, not the player.
   */
  validateSubCategoryIds: number[];
  /** Requirement fields required by /player/validate for this game. */
  requiresZoneId: boolean;
  requiresServer?: boolean;
  /**
   * Region labels reported when each pinned item validates an account.
   * `default` is used when the validating pack's region cannot be narrowed
   * down (e.g. Mobile Legends accounts are global, so any pack works).
   */
  regionLabels?: Record<number, string> & { default?: string };
};

export const SHOP2TOPUP_GAME_CONFIG: Record<string, Shop2TopUpGameConfig> = {
  // Only games whose pinned items have been live-tested to perform real player
  // validation are mapped here. Everything else falls back to Volsever.
  // Verified on the live API 2026-08-19: fake player IDs return PLAYER_NOT_FOUND
  // (validation executed), while pubg-mobile (12/13), genshin (51), valorant
  // (23393), codm (4578) and wild-rift (4974) all return INVALID_PRODUCT_CONFIG /
  // INVALID_SUBCATEGORY — no validation configured for those items.
  "mobile-legends": {
    categoryId: 474,
    // MLBB accounts are global (Moonton server); pack 28 validates any region.
    validateSubCategoryIds: [28],
    requiresZoneId: true,
    regionLabels: { default: "Global" },
  },
  "free-fire": {
    categoryId: 4,
    // MENA packs (28-32) and CIS packs (33-50) both validate. Trying both
    // regional pack families makes Free Fire IGN lookup cross-region: an
    // account that only one pack family resolves is still accepted, with the
    // matching family's region label echoed back to the customer.
    validateSubCategoryIds: [28, 33],
    requiresZoneId: false,
    regionLabels: { 28: "Middle East & Africa", 33: "CIS", default: "Global" },
  },
};

// Round-3 extension probe (2026-08-19 night): live-tested sub_category ids
// 2-119 with fake player ids to find ALL validation-capable items:
//  - 28-32: FF "Mena Direct Topup" diamond packs — all validate (PLAYER_NOT_FOUND)
//  - 33-50: FF "Cis Direct Topup" diamonds, Weekly/Monthly Membership,
//    Level Up packages — all validate
//  - 101-119: unnamed/hidden items (ids absent from the catalogue list) that
//    validate numeric player ids and return REGION_MISMATCH for Genshin-style
//    UIDs — likely hidden Genshin validators, but unpinned and unpublished, so
//    they are NOT used in production until verified by name/requirements.
//  - pubg-mobile UC items (subs 2-10, 12-13): NO_PLAYER_VALIDATION_REQUIRED or
//    INVALID_PRODUCT_CONFIG — their UC products are voucher-redeem based with
//    no player validation configured on Shop2TopUp's side.
//  - genshin-impact Genesis Crystals (subs 51-56): all INVALID_PRODUCT_CONFIG.
//  So MLBB + FF remain the only reliably configurable validators today.

type Shop2TopUpPlayer = {
  player_id: string;
  player_name?: string;
  region?: string;
};

type Shop2TopUpValidateResponse = {
  success: boolean;
  player?: Shop2TopUpPlayer;
  data?: { validated?: boolean; reason?: string };
  error?: { code: string; message: string };
};

function apiKey(): string {
  const key = process.env.SHOP2TOPUP_API_KEY?.trim();
  if (!key) {
    throw new Error("SHOP2TOPUP_API_KEY environment variable is not configured.");
  }
  return key;
}

async function callValidate(body: Record<string, unknown>): Promise<Shop2TopUpValidateResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${BASE_URL}/player/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; RecharzaTopup/1.0)",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.status === 429) {
      throw Object.assign(new Error("Shop2TopUp rate limit reached."), { retryable: true });
    }
    // The API uses HTTP 400 for structured validation failures such as
    // PLAYER_NOT_FOUND and INVALID_PLAYER_ID — those are expected outcomes,
    // not transport errors, so always parse the JSON body first.
    const rawText = await response.text();
    let parsed: Shop2TopUpValidateResponse | null = null;
    try {
      parsed = JSON.parse(rawText) as Shop2TopUpValidateResponse;
    } catch {
      parsed = null;
    }
    if (parsed && (parsed.success || parsed.error)) {
      return parsed;
    }
    if (!response.ok) {
      throw Object.assign(new Error(`Shop2TopUp HTTP ${response.status}`), { retryable: response.status >= 500 });
    }
    if (parsed) return parsed;
    throw new Error(`Shop2TopUp returned an unexpected body: ${rawText.slice(0, 120)}`);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePlayerId(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().slice(0, maxLength);
}


/**
 * True when the response proves validation was configured AND executed —
 * anything else means this item cannot act as a verifier (fallback instead).
 */
function validationWasConfigured(result: Shop2TopUpValidateResponse): boolean {
  if (!result.success) {
    const code = result.error?.code ?? "";
    if (code === "INVALID_PRODUCT_CONFIG" || code === "MISSING_REQUIRED_FIELD") {
      return false;
    }
    return true; // PLAYER_NOT_FOUND / INVALID_PLAYER_ID / REGION_MISMATCH = validation ran
  }
  if (result.data?.validated === true) return true;
  if (result.data?.reason === "NO_PLAYER_VALIDATION_REQUIRED") return false;
  // success with player payload = validated account
  return Boolean(result.player?.player_name);
}

export type Shop2TopUpLookupInput = {
  gameSlug: string;
  playerId: string;
  zoneId?: string;
  marketCode?: string;
};

export type Shop2TopUpLookupOutcome =
  | { status: "valid"; result: PlayerIdentityResult }
  | { status: "invalid"; result: PlayerIdentityResult }
  | { status: "unavailable"; reason: string };

/**
 * Verify a player account through Shop2TopUp's validation endpoint.
 *
 * Returns "unavailable" when the pinned item has no validation API
 * configured — the caller should fall back to Volsever in that case.
 */
export async function lookupShop2TopUpPlayerIdentity(
  input: Shop2TopUpLookupInput,
): Promise<Shop2TopUpLookupOutcome> {
  const config = SHOP2TOPUP_GAME_CONFIG[input.gameSlug];
  if (!config) {
    return { status: "unavailable", reason: "No Shop2TopUp mapping for this game." };
  }

  const key = process.env.SHOP2TOPUP_API_KEY?.trim();
  if (!key) {
    return { status: "unavailable", reason: "Shop2TopUp provider is not configured." };
  }

  const playerId = normalizePlayerId(input.playerId, 64);
  const zoneId = normalizePlayerId(input.zoneId ?? "", 24);

  // Try every pinned validation pack in order. Each pack is regional to its
  // catalogue, so an account that only resolves through one pack family is
  // still accepted (cross-region lookup), and the matching pack's region is
  // echoed back to the customer.
  for (const subCategoryId of config.validateSubCategoryIds) {
    const body: Record<string, unknown> = {
      sub_category_id: subCategoryId,
      player_id: playerId,
    };
    if (config.requiresZoneId && zoneId) {
      body.zone_id = zoneId;
    }

    let result: Shop2TopUpValidateResponse;
    try {
      result = await callValidate(body);
    } catch (error) {
      const retryable = (error as { retryable?: boolean }).retryable;
      return {
        status: "unavailable",
        reason: retryable
          ? "Shop2TopUp is rate limited right now."
          : "Shop2TopUp lookup failed temporarily.",
      };
    }

    const resolvedRegion =
      config.regionLabels?.[subCategoryId] ?? config.regionLabels?.default ?? null;

    if (validationWasConfigured(result)) {
      if (result.success && result.player?.player_name) {
        return {
          status: "valid",
          result: {
            valid: true,
            confirmed: true,
            playerId,
            zoneId: String(body.zone_id ?? input.zoneId ?? ""),
            nickname: result.player.player_name,
            region: result.player.region || resolvedRegion,
            verificationMode: "shop2topup",
            message: "Account validated successfully.",
          },
        };
      }
      // PLAYER_NOT_FOUND / INVALID_PLAYER_ID = validation ran and no account
      // exists. REGION_MISMATCH means the pack's region rejects this account
      // — try the next pinned pack before declaring the account invalid.
      const code = result.error?.code ?? "";
      if (code !== "REGION_MISMATCH") {
        return {
          status: "invalid",
          result: {
            valid: false,
            confirmed: false,
            playerId,
            zoneId: String(body.zone_id ?? input.zoneId ?? ""),
            nickname: null,
            region: null,
            verificationMode: "shop2topup",
            message: "We could not find a game account with those details. Double-check the IDs.",
          },
        };
      }
      // REGION_MISMATCH on this pack → try the next candidate pack.
      continue;
    }

    // This pack has no validation configured; try the next pinned pack.
    continue;
  }

  return {
    status: "unavailable",
    reason: "Shop2TopUp has no validation configured for this game.",
  };
}

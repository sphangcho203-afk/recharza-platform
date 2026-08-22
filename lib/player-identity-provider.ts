import { createHash } from "node:crypto";

import { RuntimeConfigurationError } from "@/lib/runtime-config";
import { lookupVolseverGameIdentity } from "@/lib/volsever";
import { lookupShop2TopUpPlayerIdentity } from "@/lib/suppliers/shop2topup";

export type PlayerIdentityResult = {
  valid: boolean;
  confirmed: boolean;
  playerId: string;
  zoneId: string;
  nickname: string | null;
  /** Human-readable region the resolved account belongs to, e.g. "India". */
  region: string | null;
  verificationMode: string;
  message: string;
};

function normalizeNumeric(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\D/g, "").slice(0, maxLength);
}

function createPreviewNickname(playerId: string, zoneId: string) {
  const digest = createHash("sha256")
    .update(`${playerId}:${zoneId}:recharza`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  return `Player_${digest}`;
}

export async function validateMobileLegendsIdentity(input: {
  playerId: unknown;
  zoneId: unknown;
}): Promise<PlayerIdentityResult> {
  const playerId = normalizeNumeric(input.playerId, 24);
  const zoneId = normalizeNumeric(input.zoneId, 12);

  if (!playerId || !zoneId) {
    return {
      valid: false,
      confirmed: false,
      playerId,
      zoneId,
      nickname: null,
      region: null,
      verificationMode: "account-lookup",
      message: "Enter both the Player ID and Zone ID.",
    };
  }

  const provider = process.env.IGN_LOOKUP_PROVIDER?.trim().toLowerCase();

  if (provider === "internal") {
    return {
      valid: true,
      confirmed: true,
      playerId,
      zoneId,
      nickname: createPreviewNickname(playerId, zoneId),
      region: null,
      verificationMode: "account-lookup",
      message: "Account validated successfully.",
    };
  }

  // Shop2TopUp is the primary account verifier; Volsever is the backup when
  // the item Shop2TopUp pins for a game has no validation API configured,
  // when the provider is misconfigured, or when it is rate limited.
  if (provider === "shop2topup") {
    // Try Shop2TopUp first.
    const outcome = await lookupShop2TopUpPlayerIdentity({
      gameSlug: "mobile-legends",
      playerId,
      zoneId,
    });
    
    // If Shop2TopUp confirms the player, return it.
    if (outcome.status === "valid") {
      return outcome.result;
    }

    // If Shop2TopUp is unavailable or says the player is invalid, try Volsever as a strong backup.
    // Volsever is often more reliable for global accounts and region-agnostic lookups.
    const volsever = await lookupVolseverGameIdentity({
      gameSlug: "mobile-legends",
      playerId,
      zoneId,
    });
    
    if (volsever.valid) {
      return volsever;
    }

    // If both providers failed to find the account, return a professional error.
    // Use the message from Volsever if available, otherwise a generic professional message.
    return {
      ...volsever,
      message: volsever.message || "We could not verify your account details. Please ensure your Player ID and Zone ID are correct.",
    };
  }

  if (provider === "volsever") {
    return lookupVolseverGameIdentity({
      gameSlug: "mobile-legends",
      playerId,
      zoneId,
    });
  }

  if (provider === "rapidapi") {
    return {
      valid: false,
      confirmed: false,
      playerId,
      zoneId,
      nickname: null,
      region: null,
      verificationMode: "account-lookup",
      message: "Account lookup is temporarily unavailable.",
    };
  }

  throw new RuntimeConfigurationError(
    "IGN_LOOKUP_PROVIDER must be set to shop2topup, volsever, internal, or rapidapi.",
  );
}

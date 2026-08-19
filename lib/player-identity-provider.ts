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
      verificationMode: "account-lookup",
      message: "Account validated successfully.",
    };
  }

  // Shop2TopUp is the primary account verifier; Volsever is the backup when
  // the item Shop2TopUp pins for a game has no validation API configured,
  // when the provider is misconfigured, or when it is rate limited.
  if (provider === "shop2topup") {
    const outcome = await lookupShop2TopUpPlayerIdentity({
      gameSlug: "mobile-legends",
      playerId,
      zoneId,
    });
    if (outcome.status !== "unavailable") {
      return outcome.result;
    }
    const volsever = await lookupVolseverGameIdentity({
      gameSlug: "mobile-legends",
      playerId,
      zoneId,
    });
    if (volsever.valid || !volsever.message.includes("temporarily disabled")) {
      return volsever;
    }
    return {
      ...volsever,
      message:
        "Primary account lookup is temporarily busy. " + (volsever.message || "Please retry shortly."),
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
      verificationMode: "account-lookup",
      message: "Account lookup is temporarily unavailable.",
    };
  }

  throw new RuntimeConfigurationError(
    "IGN_LOOKUP_PROVIDER must be set to shop2topup, volsever, internal, or rapidapi.",
  );
}

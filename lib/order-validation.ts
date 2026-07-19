export type PlayerValidationResult =
  | {
      valid: true;
      playerId: string;
      zoneId: string;
      verificationMode: "format-only";
      message: string;
    }
  | {
      valid: false;
      message: string;
    };

function digitsOnly(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "") : "";
}

export function validateMobileLegendsPlayer(
  playerIdValue: unknown,
  zoneIdValue: unknown,
): PlayerValidationResult {
  const playerId = digitsOnly(playerIdValue);
  const zoneId = digitsOnly(zoneIdValue);

  if (!/^\d{5,15}$/.test(playerId)) {
    return {
      valid: false,
      message: "Player ID must contain 5 to 15 digits.",
    };
  }

  if (!/^\d{1,6}$/.test(zoneId)) {
    return {
      valid: false,
      message: "Zone ID must contain 1 to 6 digits.",
    };
  }

  return {
    valid: true,
    playerId,
    zoneId,
    verificationMode: "format-only",
    message:
      "The ID format is valid. Live nickname verification will activate after a game-provider API is connected.",
  };
}

export function validateCustomerEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

  return isValid ? email : null;
}

import type { SupplierCheckoutGameSlug } from "@/lib/storefront-game-catalog";

type SupplierFieldOption = {
  label: string;
  value: string;
};

type ValidIdentity = {
  valid: true;
  playerId: string;
  zoneId: string;
  verificationMode: "format-only";
};

type InvalidIdentity = {
  valid: false;
  field: string;
  message: string;
};

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getValue(values: Record<string, unknown>, key: string) {
  return readString(values[key]);
}

export function getSupplierSelectOptions(
  fieldSchema: unknown,
  matcher: RegExp,
): SupplierFieldOption[] {
  if (!Array.isArray(fieldSchema)) return [];

  for (const rawField of fieldSchema) {
    const field = asObject(rawField);
    const searchable = `${readString(field?.key)} ${readString(field?.name)} ${readString(field?.label)}`.toLowerCase();
    if (!matcher.test(searchable) || !Array.isArray(field?.options)) continue;

    return field.options
      .map((rawOption) => {
        const option = asObject(rawOption);
        const value = readString(option?.value);
        const label = readString(option?.label) || value;
        return value ? { label, value } : null;
      })
      .filter((option): option is SupplierFieldOption => Boolean(option));
  }

  return [];
}

export function validateSupplierCheckoutIdentity(
  gameSlug: SupplierCheckoutGameSlug,
  values: Record<string, unknown>,
  fieldSchema: unknown,
): ValidIdentity | InvalidIdentity {
  if (gameSlug === "valorant") {
    const riotId = getValue(values, "riotId");
    if (!riotId) {
      return { valid: false, field: "riotId", message: "Riot ID is required." };
    }
    if (riotId.length > 33 || !/^[^#\n]{2,24}#[A-Za-z0-9]{2,8}$/.test(riotId)) {
      return {
        valid: false,
        field: "riotId",
        message: "Enter the Riot ID as PlayerName#TAG.",
      };
    }

    return {
      valid: true,
      playerId: riotId,
      zoneId: "",
      verificationMode: "format-only",
    };
  }

  const playerId = getValue(values, "playerId").replace(/\s+/g, "");
  if (!playerId) {
    return {
      valid: false,
      field: "playerId",
      message:
        gameSlug === "genshin-impact" ? "UID is required." : "Player ID is required.",
    };
  }

  if (gameSlug === "mobile-legends") {
    const zoneId = getValue(values, "zoneId");
    const zoneOptions = getSupplierSelectOptions(fieldSchema, /zone|server/);
    if (!zoneId) {
      return {
        valid: false,
        field: "zoneId",
        message: "Zone ID is required for Mobile Legends.",
      };
    }
    if (
      zoneOptions.length > 0 &&
      !zoneOptions.some((option) => option.value === zoneId)
    ) {
      return {
        valid: false,
        field: "zoneId",
        message: "Choose a zone supported by this supplier offer.",
      };
    }

    return {
      valid: true,
      playerId,
      zoneId,
      verificationMode: "format-only",
    };
  }

  if (gameSlug === "genshin-impact") {
    if (!/^\d{9,10}$/.test(playerId)) {
      return {
        valid: false,
        field: "playerId",
        message: "Enter the 9 or 10 digit Genshin UID.",
      };
    }

    const serverId = getValue(values, "serverId");
    const serverOptions = getSupplierSelectOptions(fieldSchema, /server/);
    if (!serverId) {
      return {
        valid: false,
        field: "serverId",
        message: "Choose the account server.",
      };
    }
    if (
      serverOptions.length > 0 &&
      !serverOptions.some((option) => option.value === serverId)
    ) {
      return {
        valid: false,
        field: "serverId",
        message: "Choose a server supported by this supplier offer.",
      };
    }

    return {
      valid: true,
      playerId,
      zoneId: serverId,
      verificationMode: "format-only",
    };
  }

  if (!/^\d{5,20}$/.test(playerId)) {
    return {
      valid: false,
      field: "playerId",
      message: "Enter a numeric player ID between 5 and 20 digits.",
    };
  }

  return {
    valid: true,
    playerId,
    zoneId: "",
    verificationMode: "format-only",
  };
}

export type CheckoutLifecycle = "live" | "beta" | "planned";
export type CheckoutMode = "market-routed" | "single-route" | "voucher";
export type CheckoutInputMode = "numeric" | "text" | "email";

export type CheckoutFieldDefinition = {
  key: string;
  label: string;
  placeholder: string;
  help: string;
  required: boolean;
  inputMode: CheckoutInputMode;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
};

export type GameCheckoutDefinition = {
  gameSlug: string;
  title: string;
  lifecycle: CheckoutLifecycle;
  checkoutMode: CheckoutMode;
  route: string;
  supplierGameSlug: string;
  marketRequired: boolean;
  orderApiEnabled: boolean;
  fields: CheckoutFieldDefinition[];
  packageFamilies: string[];
  readinessNote: string;
};

const numericPlayerId: CheckoutFieldDefinition = {
  key: "playerId",
  label: "Player ID",
  placeholder: "Enter the numeric player ID",
  help: "Use the account identifier shown inside the game. Spaces are removed before validation.",
  required: true,
  inputMode: "numeric",
  pattern: "^\\d{5,20}$",
  minLength: 5,
  maxLength: 20,
};

const checkoutDefinitions: GameCheckoutDefinition[] = [
  {
    gameSlug: "mobile-legends",
    title: "Mobile Legends",
    lifecycle: "live",
    checkoutMode: "market-routed",
    route: "/games/mobile-legends",
    supplierGameSlug: "mobile-legends",
    marketRequired: true,
    orderApiEnabled: true,
    fields: [
      { ...numericPlayerId, maxLength: 15 },
      {
        key: "zoneId",
        label: "Zone ID",
        placeholder: "Enter the server or zone ID",
        help: "The number shown in brackets beside the Mobile Legends player ID.",
        required: true,
        inputMode: "numeric",
        pattern: "^\\d{1,6}$",
        minLength: 1,
        maxLength: 6,
      },
    ],
    packageFamilies: ["Diamonds", "Weekly Diamond Pass", "Twilight Pass"],
    readinessNote:
      "Regional catalogue, billing, order creation, test payment, tracking and dry-run fulfilment are connected.",
  },
  {
    gameSlug: "free-fire",
    title: "Free Fire MAX",
    lifecycle: "live",
    checkoutMode: "market-routed",
    route: "/games/free-fire",
    supplierGameSlug: "free-fire",
    marketRequired: true,
    orderApiEnabled: true,
    fields: [numericPlayerId],
    packageFamilies: ["Diamonds", "Weekly Membership", "Monthly Membership"],
    readinessNote:
      "Curated regional supplier packs, player ID validation, billing, order creation, Razorpay payment and tracking are connected.",
  },
  {
    gameSlug: "pubg-mobile",
    title: "PUBG Mobile",
    lifecycle: "live",
    checkoutMode: "single-route",
    route: "/games/pubg-mobile",
    supplierGameSlug: "pubg-mobile",
    marketRequired: false,
    orderApiEnabled: true,
    fields: [numericPlayerId],
    packageFamilies: ["Unknown Cash", "Elite Pass", "Prime Plus"],
    readinessNote:
      "The curated automatic supplier line, player ID validation, billing, order creation, Razorpay payment and tracking are connected.",
  },
  {
    gameSlug: "bgmi",
    title: "BGMI",
    lifecycle: "planned",
    checkoutMode: "single-route",
    route: "/games/bgmi",
    supplierGameSlug: "bgmi",
    marketRequired: false,
    orderApiEnabled: false,
    fields: [numericPlayerId],
    packageFamilies: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    readinessNote:
      "Checkout is registered, but an India-specific supplier catalogue is not available in the current integration.",
  },
  {
    gameSlug: "call-of-duty-mobile",
    title: "Call of Duty: Mobile",
    lifecycle: "planned",
    checkoutMode: "single-route",
    route: "/games/call-of-duty-mobile",
    supplierGameSlug: "call-of-duty-mobile",
    marketRequired: false,
    orderApiEnabled: false,
    fields: [numericPlayerId],
    packageFamilies: ["COD Points", "Battle Pass", "Vault Packs"],
    readinessNote:
      "Checkout is registered, but the supplier catalogue and account-region mapping are not approved.",
  },
  {
    gameSlug: "valorant",
    title: "VALORANT",
    lifecycle: "live",
    checkoutMode: "market-routed",
    route: "/games/valorant",
    supplierGameSlug: "valorant",
    marketRequired: true,
    orderApiEnabled: true,
    fields: [
      {
        key: "riotId",
        label: "Riot ID",
        placeholder: "PlayerName#TAG",
        help: "Enter the complete Riot ID, including the # and tagline, for the selected supplier region.",
        required: true,
        inputMode: "text",
        pattern: "^[^#\\n]{2,24}#[A-Za-z0-9]{2,8}$",
        minLength: 5,
        maxLength: 33,
      },
    ],
    packageFamilies: ["VALORANT Points"],
    readinessNote:
      "Curated regional VP packs, Riot ID validation, billing, order creation, Razorpay payment and tracking are connected.",
  },
  {
    gameSlug: "genshin-impact",
    title: "Genshin Impact",
    lifecycle: "live",
    checkoutMode: "single-route",
    route: "/games/genshin-impact",
    supplierGameSlug: "genshin-impact",
    marketRequired: false,
    orderApiEnabled: true,
    fields: [
      {
        ...numericPlayerId,
        label: "UID",
        placeholder: "Enter the 9 or 10 digit UID",
        minLength: 9,
        maxLength: 10,
        pattern: "^\\d{9,10}$",
      },
      {
        key: "serverId",
        label: "Server",
        placeholder: "Choose the account server",
        help: "The selected server must match the UID region before fulfilment.",
        required: true,
        inputMode: "text",
        maxLength: 24,
      },
    ],
    packageFamilies: [
      "Genesis Crystals",
      "Chronal Nexus",
      "Blessing of the Welkin Moon",
    ],
    readinessNote:
      "All password-free UID/server supplier offers, billing, order creation, Razorpay payment and tracking are connected.",
  },
  {
    gameSlug: "fortnite",
    title: "Fortnite",
    lifecycle: "planned",
    checkoutMode: "voucher",
    route: "/games/fortnite",
    supplierGameSlug: "fortnite",
    marketRequired: true,
    orderApiEnabled: false,
    fields: [],
    packageFamilies: ["V-Bucks", "Starter Packs", "Gift Cards"],
    readinessNote:
      "Voucher delivery and regional restrictions require a verified supplier catalogue.",
  },
];

export const gameCheckoutDefinitions = checkoutDefinitions.map((definition) => ({
  ...definition,
  fields: definition.fields.map((field) => ({ ...field })),
  packageFamilies: [...definition.packageFamilies],
}));

export function getGameCheckoutDefinition(value: unknown) {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  return (
    gameCheckoutDefinitions.find(
      (definition) => definition.gameSlug === slug,
    ) ?? null
  );
}

export function getPublicGameCheckoutDefinition(value: unknown) {
  const definition = getGameCheckoutDefinition(value);
  if (!definition) return null;

  return {
    gameSlug: definition.gameSlug,
    title: definition.title,
    lifecycle: definition.lifecycle,
    checkoutMode: definition.checkoutMode,
    route: definition.route,
    marketRequired: definition.marketRequired,
    orderApiEnabled: definition.orderApiEnabled,
    fields: definition.fields,
    packageFamilies: definition.packageFamilies,
    readinessNote: definition.readinessNote,
  };
}

export function validateCheckoutIdentity(
  gameSlug: unknown,
  values: Record<string, unknown>,
):
  | {
      valid: true;
      values: Record<string, string>;
      verificationMode: "format-only";
    }
  | { valid: false; message: string; field?: string } {
  const definition = getGameCheckoutDefinition(gameSlug);
  if (!definition) {
    return { valid: false, message: "That game is not registered for checkout." };
  }

  const normalized: Record<string, string> = {};

  for (const field of definition.fields) {
    const raw = values[field.key];
    let value = typeof raw === "string" ? raw.trim() : "";
    if (field.inputMode === "numeric") value = value.replace(/\s+/g, "");

    if (!value && field.required) {
      return {
        valid: false,
        field: field.key,
        message: `${field.label} is required.`,
      };
    }
    if (!value) continue;
    if (field.minLength && value.length < field.minLength) {
      return {
        valid: false,
        field: field.key,
        message: `${field.label} is too short.`,
      };
    }
    if (field.maxLength && value.length > field.maxLength) {
      return {
        valid: false,
        field: field.key,
        message: `${field.label} is too long.`,
      };
    }
    if (field.pattern && !new RegExp(field.pattern).test(value)) {
      return {
        valid: false,
        field: field.key,
        message: `${field.label} has an invalid format.`,
      };
    }

    normalized[field.key] = value;
  }

  return {
    valid: true,
    values: normalized,
    verificationMode: "format-only",
  };
}

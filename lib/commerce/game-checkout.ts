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
    lifecycle: "beta",
    checkoutMode: "single-route",
    route: "/games/free-fire",
    supplierGameSlug: "free-fire",
    marketRequired: false,
    orderApiEnabled: false,
    fields: [numericPlayerId],
    packageFamilies: ["Diamonds", "Membership", "Level Up Pass"],
    readinessNote:
      "The reusable identity and package contract is ready. Supplier category mapping and order submission remain deliberately locked.",
  },
  {
    gameSlug: "pubg-mobile",
    title: "PUBG Mobile",
    lifecycle: "planned",
    checkoutMode: "single-route",
    route: "/games/pubg-mobile",
    supplierGameSlug: "pubg-mobile",
    marketRequired: false,
    orderApiEnabled: false,
    fields: [numericPlayerId],
    packageFamilies: ["Unknown Cash", "Royale Pass", "Prime Plus"],
    readinessNote: "Checkout contract is registered; supplier fields and fulfilment mapping are not approved yet.",
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
    readinessNote: "Checkout contract is registered; India-specific supplier mapping remains pending.",
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
    readinessNote: "Checkout contract is registered; account-region and supplier-field review remain pending.",
  },
  {
    gameSlug: "valorant",
    title: "VALORANT",
    lifecycle: "planned",
    checkoutMode: "voucher",
    route: "/games/valorant",
    supplierGameSlug: "valorant",
    marketRequired: true,
    orderApiEnabled: false,
    fields: [
      {
        key: "riotId",
        label: "Riot ID",
        placeholder: "PlayerName",
        help: "Voucher fulfilment may not require an account ID; this field stays disabled until the supplier contract is reviewed.",
        required: false,
        inputMode: "text",
        maxLength: 32,
      },
      {
        key: "tagline",
        label: "Tagline",
        placeholder: "TAG",
        help: "The short value after # in a Riot ID.",
        required: false,
        inputMode: "text",
        maxLength: 8,
      },
    ],
    packageFamilies: ["VALORANT Points", "Regional Gift Cards"],
    readinessNote: "Voucher-region rules must be approved before this checkout can accept orders.",
  },
  {
    gameSlug: "genshin-impact",
    title: "Genshin Impact",
    lifecycle: "planned",
    checkoutMode: "single-route",
    route: "/games/genshin-impact",
    supplierGameSlug: "genshin-impact",
    marketRequired: true,
    orderApiEnabled: false,
    fields: [
      { ...numericPlayerId, label: "UID", placeholder: "Enter the 9 or 10 digit UID", minLength: 9, maxLength: 10, pattern: "^\\d{9,10}$" },
      {
        key: "serverId",
        label: "Server",
        placeholder: "Choose the account server",
        help: "The server must match the UID region before fulfilment.",
        required: true,
        inputMode: "text",
        maxLength: 24,
      },
    ],
    packageFamilies: ["Genesis Crystals", "Blessing of the Welkin Moon"],
    readinessNote: "UID and server fields are defined; supplier validation and package mapping remain pending.",
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
    readinessNote: "Voucher delivery and regional restrictions require supplier and policy review.",
  },
];

export const gameCheckoutDefinitions = checkoutDefinitions.map((definition) => ({
  ...definition,
  fields: definition.fields.map((field) => ({ ...field })),
  packageFamilies: [...definition.packageFamilies],
}));

export function getGameBySlug(slug: string) {
  return gameCheckoutDefinitions.find((definition) => definition.gameSlug === slug) ?? null;
}

export function getGameCheckoutDefinition(value: unknown) {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase();
  return getGameBySlug(slug);
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
  | { valid: true; values: Record<string, string>; verificationMode: "format-only" }
  | { valid: false; message: string; field?: string } {
  const definition = getGameCheckoutDefinition(gameSlug);
  if (!definition) return { valid: false, message: "That game is not registered for checkout." };

  const normalized: Record<string, string> = {};

  for (const field of definition.fields) {
    const raw = values[field.key];
    let value = typeof raw === "string" ? raw.trim() : "";
    if (field.inputMode === "numeric") value = value.replace(/\s+/g, "");

    if (!value && field.required) {
      return { valid: false, field: field.key, message: `${field.label} is required.` };
    }
    if (!value) continue;
    if (field.minLength && value.length < field.minLength) {
      return { valid: false, field: field.key, message: `${field.label} is too short.` };
    }
    if (field.maxLength && value.length > field.maxLength) {
      return { valid: false, field: field.key, message: `${field.label} is too long.` };
    }
    if (field.pattern && !new RegExp(field.pattern).test(value)) {
      return { valid: false, field: field.key, message: `${field.label} has an invalid format.` };
    }

    normalized[field.key] = value;
  }

  return { valid: true, values: normalized, verificationMode: "format-only" };
}

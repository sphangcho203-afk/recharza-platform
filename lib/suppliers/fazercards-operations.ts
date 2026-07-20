import "server-only";

import { requireEnvironmentVariable } from "@/lib/runtime-config";

const DEFAULT_BASE_URL = "https://api.fzr.cards/api/v2";

type ApiObject = Record<string, unknown>;

function asObject(value: unknown): ApiObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiObject)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBaseUrl() {
  return (process.env.FAZERCARDS_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function resolvePath(name: string) {
  const value = process.env[name]?.trim();
  if (!value) return null;
  return value.startsWith("/") ? value : `/${value}`;
}

async function postFazerCards(path: string, body: Record<string, unknown>) {
  const apiKey = requireEnvironmentVariable("FAZERCARDS_API_KEY", { minLength: 12 });
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`FazerCards returned non-JSON with status ${response.status}.`);
  }

  const object = asObject(payload);
  if (!response.ok) {
    throw new Error(asString(object?.message) || `FazerCards request failed with status ${response.status}.`);
  }

  return object ?? {};
}

function findNestedObject(object: ApiObject | null, key: string) {
  return asObject(object?.[key]);
}

function readNickname(payload: ApiObject) {
  const data = findNestedObject(payload, "data");
  return (
    asString(payload.nickname) ||
    asString(payload.username) ||
    asString(payload.ign) ||
    asString(data?.nickname) ||
    asString(data?.username) ||
    asString(data?.ign) ||
    null
  );
}

function readExplicitValidity(payload: ApiObject) {
  const data = findNestedObject(payload, "data");
  const candidates = [payload.valid, payload.is_valid, data?.valid, data?.is_valid];
  for (const value of candidates) {
    if (typeof value === "boolean") return value;
  }
  return null;
}

function buildSupplierFields(fieldSchema: unknown, playerId: string, zoneId: string) {
  const fields: Record<string, string> = {
    player_id: playerId,
    zone_id: zoneId,
  };

  if (!Array.isArray(fieldSchema)) return fields;

  for (const rawField of fieldSchema) {
    const field = asObject(rawField);
    const key =
      asString(field?.key) ||
      asString(field?.name) ||
      asString(field?.slug) ||
      asString(field?.id);
    if (!key) continue;

    const normalized = `${key} ${asString(field?.label)}`.toLowerCase();
    if (/zone|server/.test(normalized)) fields[key] = zoneId;
    else if (/player|user|account|game.?id|uid/.test(normalized)) fields[key] = playerId;
  }

  return fields;
}

export function getFazerCardsOperationConfiguration() {
  const validationPath = resolvePath("FAZERCARDS_PLAYER_VALIDATION_PATH");
  const orderCreatePath = resolvePath("FAZERCARDS_ORDER_CREATE_PATH");
  const orderStatusPath = resolvePath("FAZERCARDS_ORDER_STATUS_PATH");
  const writesEnabled = process.env.FAZERCARDS_ORDER_WRITES_ENABLED === "true";

  return {
    apiKeyConfigured: Boolean(process.env.FAZERCARDS_API_KEY?.trim()),
    validationPath,
    orderCreatePath,
    orderStatusPath,
    writesEnabled,
    writeReady: writesEnabled && Boolean(orderCreatePath),
  };
}

export async function validateFazerCardsPlayer(input: {
  categoryId: string;
  offerId: string;
  playerId: string;
  zoneId: string;
  fieldSchema: unknown;
}) {
  const path = resolvePath("FAZERCARDS_PLAYER_VALIDATION_PATH");
  if (!path) {
    return {
      confirmed: false,
      valid: true,
      nickname: null,
      mode: "local-format" as const,
      message: "Player format is valid. Supplier nickname validation is not configured yet.",
    };
  }

  const fields = buildSupplierFields(input.fieldSchema, input.playerId, input.zoneId);
  const payload = await postFazerCards(path, {
    category_id: input.categoryId,
    offer_id: input.offerId,
    player_id: input.playerId,
    zone_id: input.zoneId,
    fields,
  });
  const valid = readExplicitValidity(payload);

  if (valid === null) {
    return {
      confirmed: false,
      valid: false,
      nickname: null,
      mode: "supplier-unrecognized" as const,
      message: "The supplier response did not include an explicit validation result.",
    };
  }

  const nickname = readNickname(payload);
  return {
    confirmed: true,
    valid,
    nickname,
    mode: "fazercards-live" as const,
    message: valid
      ? nickname
        ? `Supplier confirmed player ${nickname}.`
        : "Supplier confirmed the player destination."
      : "The supplier rejected the player or zone details.",
  };
}

export async function createFazerCardsTopup(input: {
  recharzaOrderId: string;
  categoryId: string;
  offerId: string;
  playerId: string;
  zoneId: string;
  fieldSchema: unknown;
  idempotencyKey: string;
}) {
  const config = getFazerCardsOperationConfiguration();
  const fields = buildSupplierFields(input.fieldSchema, input.playerId, input.zoneId);
  const requestPayload = {
    category_id: input.categoryId,
    offer_id: input.offerId,
    external_id: input.recharzaOrderId,
    idempotency_key: input.idempotencyKey,
    player_id: input.playerId,
    zone_id: input.zoneId,
    fields,
  };

  if (!config.writeReady || !config.orderCreatePath) {
    return {
      mode: "dry-run" as const,
      providerOrderId: null,
      providerStatus: "planned",
      requestPayload,
      responsePayload: {
        writesEnabled: config.writesEnabled,
        orderCreatePathConfigured: Boolean(config.orderCreatePath),
      },
    };
  }

  const responsePayload = await postFazerCards(config.orderCreatePath, requestPayload);
  const data = findNestedObject(responsePayload, "data");
  const providerOrderId =
    asString(responsePayload.order_id) ||
    asString(responsePayload.id) ||
    asString(data?.order_id) ||
    asString(data?.id);

  if (!providerOrderId) {
    throw new Error("FazerCards order creation succeeded without a recognizable provider order ID.");
  }

  return {
    mode: "supplier-write" as const,
    providerOrderId,
    providerStatus:
      asString(responsePayload.status) || asString(data?.status) || "submitted",
    requestPayload,
    responsePayload,
  };
}

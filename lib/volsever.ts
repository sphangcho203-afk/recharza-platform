import "server-only";

import {
  requireEnvironmentVariable,
  RuntimeConfigurationError,
} from "@/lib/runtime-config";

export const VOLSEVER_DEFAULT_BASE_URL = "https://api.volsever.com";
export const VOLSEVER_LEGACY_BASE_URL = "https://gate.volsever.com";
export const VOLSEVER_DEFAULT_TIMEOUT_MS = 15_000;
export const VOLSEVER_MIN_TIMEOUT_MS = 1_000;
export const VOLSEVER_MAX_TIMEOUT_MS = 60_000;
export const VOLSEVER_VERIFICATION_MODE = "volsever-lookup";

export const volseverGameSlugs = {
  "mobile-legends": "mobile-legends",
  "genshin-impact": "genshin-impact",
  "pubg-mobile": "pubg-mobile-global",
} as const;

const currentGameCodes = {
  "mobile-legends": "mlbb",
  "genshin-impact": "genshin-impact",
  "pubg-mobile": "pubg-mobile",
} as const;

export type RecharzaVolseverGameSlug = keyof typeof volseverGameSlugs;

export function isVolseverGameSlug(value: unknown): value is RecharzaVolseverGameSlug {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(volseverGameSlugs, value)
  );
}

export function getVolseverGameSlug(value: unknown) {
  return isVolseverGameSlug(value) ? volseverGameSlugs[value] : null;
}

export type VolseverIdentityResult = {
  valid: boolean;
  confirmed: boolean;
  playerId: string;
  zoneId: string;
  nickname: string | null;
  verificationMode: string;
  message: string;
};

export class VolseverProviderError extends Error {
  constructor(message = "Volsever game account verification is unavailable.") {
    super(message);
    this.name = "VolseverProviderError";
  }
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown, maxLength = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function boundedNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getVolseverConfiguration() {
  const rawBaseUrl = process.env.VOLSEVER_API_BASE_URL?.trim();
  const baseUrl = rawBaseUrl
    ? rawBaseUrl.replace(/\/+$/, "")
    : VOLSEVER_DEFAULT_BASE_URL;

  const rawTimeout = Number(process.env.VOLSEVER_LOOKUP_TIMEOUT_MS);
  const timeoutMs =
    Number.isFinite(rawTimeout) && rawTimeout > 0
      ? Math.min(
          VOLSEVER_MAX_TIMEOUT_MS,
          Math.max(VOLSEVER_MIN_TIMEOUT_MS, Math.floor(rawTimeout)),
        )
      : VOLSEVER_DEFAULT_TIMEOUT_MS;

  return { baseUrl, timeoutMs };
}

function readIdentityPayload(payload: unknown, playerId: string, zoneId: string) {
  const object = asObject(payload);
  if (!object) return null;

  const data = asObject(object.data);
  const source = data ?? object;
  const status = object.status === true || object.valid === true;
  const code = boundedNumber(object.code);
  const message = readString(object.message) || "Game account validation could not be completed.";

  const echoedId = readString(source.user_id ?? source.player_id ?? source.id, 64);
  const username = readString(
    source.username ?? source.nickname ?? source.name ?? object.nickname,
    64,
  );
  const echoedZone = readString(source.zone ?? source.zone_id ?? source.server_id, 64);

  if (status && echoedId === playerId && username.length > 0) {
    return {
      valid: true,
      confirmed: true,
      playerId,
      zoneId: echoedZone || zoneId,
      nickname: username,
      verificationMode: VOLSEVER_VERIFICATION_MODE,
      message: "Account validated successfully.",
    } satisfies VolseverIdentityResult;
  }

  if (code !== null && code >= 400 && code < 500) {
    return {
      valid: false,
      confirmed: false,
      playerId,
      zoneId,
      nickname: null,
      verificationMode: VOLSEVER_VERIFICATION_MODE,
      message,
    } satisfies VolseverIdentityResult;
  }

  return null;
}

async function requestCurrentApi(
  baseUrl: string,
  apiKey: string,
  gameSlug: RecharzaVolseverGameSlug,
  playerId: string,
  zoneId: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
) {
  const url = new URL(`${baseUrl}/v2/game/id/check`);
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      game: currentGameCodes[gameSlug],
      user_id: playerId,
      ...(zoneId ? { server_id: zoneId } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const rawText = await response.text().catch(() => null);
  if (rawText === null) throw new VolseverProviderError();

  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new VolseverProviderError();
  }

  if (response.status === 401) {
    throw new RuntimeConfigurationError(
      "VOLSEVER_API_KEY was rejected by the Volsever service.",
    );
  }

  return readIdentityPayload(payload, playerId, zoneId);
}

async function requestLegacyApi(
  baseUrl: string,
  apiKey: string,
  gameSlug: RecharzaVolseverGameSlug,
  playerId: string,
  zoneId: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
) {
  const slug = volseverGameSlugs[gameSlug];
  const url = new URL(`${baseUrl}/proxy/api/game/${slug}`);
  url.searchParams.set("id", playerId);
  if (zoneId) url.searchParams.set("zone", zoneId);

  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  const rawText = await response.text().catch(() => null);
  if (rawText === null) throw new VolseverProviderError();

  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new VolseverProviderError();
  }

  if (response.status === 401) {
    throw new RuntimeConfigurationError(
      "VOLSEVER_API_KEY was rejected by the Volsever service.",
    );
  }

  return readIdentityPayload(payload, playerId, zoneId);
}

export async function lookupVolseverGameIdentity(
  input: {
    gameSlug: RecharzaVolseverGameSlug;
    playerId: string;
    zoneId: string;
  },
  options: {
    apiKey?: string;
    baseUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<VolseverIdentityResult> {
  const playerId = readString(input.playerId, 64);
  const zoneId = readString(input.zoneId, 64);
  const config = getVolseverConfiguration();
  const apiKey =
    options.apiKey && options.apiKey.trim().length > 0
      ? options.apiKey.trim()
      : requireEnvironmentVariable("VOLSEVER_API_KEY", { minLength: 12 });
  const configuredBaseUrl = (options.baseUrl ?? config.baseUrl).replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? config.timeoutMs;
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const current = await requestCurrentApi(
      VOLSEVER_DEFAULT_BASE_URL,
      apiKey,
      input.gameSlug,
      playerId,
      zoneId,
      timeoutMs,
      fetchImpl,
    );
    if (current) return current;
  } catch (error) {
    if (error instanceof RuntimeConfigurationError) throw error;
    if (configuredBaseUrl === VOLSEVER_DEFAULT_BASE_URL) throw error;
  }

  const legacy = await requestLegacyApi(
    configuredBaseUrl === VOLSEVER_DEFAULT_BASE_URL
      ? VOLSEVER_LEGACY_BASE_URL
      : configuredBaseUrl,
    apiKey,
    input.gameSlug,
    playerId,
    zoneId,
    timeoutMs,
    fetchImpl,
  );

  if (legacy) return legacy;
  throw new VolseverProviderError();
}

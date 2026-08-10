import "server-only";

import {
  requireEnvironmentVariable,
  RuntimeConfigurationError,
} from "@/lib/runtime-config";

export const VOLSEVER_DEFAULT_BASE_URL = "https://gate.volsever.com";
export const VOLSEVER_DEFAULT_TIMEOUT_MS = 15_000;
export const VOLSEVER_MIN_TIMEOUT_MS = 1_000;
export const VOLSEVER_MAX_TIMEOUT_MS = 60_000;
export const VOLSEVER_VERIFICATION_MODE = "volsever-lookup";

export const volseverGameSlugs = {
  "mobile-legends": "mobile-legends",
  "genshin-impact": "genshin-impact",
  "pubg-mobile": "pubg-mobile-global",
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
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export function getVolseverConfiguration() {
  const baseUrl =
    (process.env.VOLSEVER_API_BASE_URL ?? VOLSEVER_DEFAULT_BASE_URL)
      .trim()
      .replace(/\/+$/, "") || VOLSEVER_DEFAULT_BASE_URL;

  const rawTimeout = Number(process.env.VOLSEVER_LOOKUP_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0
    ? Math.min(VOLSEVER_MAX_TIMEOUT_MS, Math.max(VOLSEVER_MIN_TIMEOUT_MS, Math.floor(rawTimeout)))
    : VOLSEVER_DEFAULT_TIMEOUT_MS;

  return { baseUrl, timeoutMs };
}

function safeMessage(payload: Record<string, unknown>, fallback: string) {
  const message = readString(payload?.message);
  return message || fallback;
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
  const slug = volseverGameSlugs[input.gameSlug];
  const playerId = readString(input.playerId, 64);
  const zoneId = readString(input.zoneId, 64);

  const config = getVolseverConfiguration();
  const apiKey =
    options.apiKey && options.apiKey.trim().length > 0
      ? options.apiKey.trim()
      : requireEnvironmentVariable("VOLSEVER_API_KEY", { minLength: 12 });
  const baseUrl = (options.baseUrl ?? config.baseUrl).replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? config.timeoutMs;
  const fetchImpl = options.fetchImpl ?? fetch;

  const url = new URL(`${baseUrl}/proxy/api/game/${slug}`);
  url.searchParams.set("id", playerId);
  if (zoneId) url.searchParams.set("zone", zoneId);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new VolseverProviderError();
  }

  const rawText = await response.text().catch(() => null);
  if (rawText === null) throw new VolseverProviderError();

  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new VolseverProviderError();
  }

  const object = asObject(payload);
  if (!object) throw new VolseverProviderError();

  const code = boundedNumber(object.code);
  const status = object.status === true;
  const message = safeMessage(object, "Game account validation could not be completed.");
  const data = asObject(object.data);

  if (code === 401) {
    throw new RuntimeConfigurationError(
      "VOLSEVER_API_KEY was rejected by the Volsever service.",
    );
  }

  if (status && data) {
    const echoedId = readString(data.user_id, 64);
    const username = readString(data.username, 64);

    if (
      echoedId === playerId &&
      username.length > 0
    ) {
      return {
        valid: true,
        confirmed: true,
        playerId,
        zoneId,
        nickname: username,
        verificationMode: VOLSEVER_VERIFICATION_MODE,
        message: "Account validated successfully.",
      };
    }
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
    };
  }

  throw new VolseverProviderError();
}
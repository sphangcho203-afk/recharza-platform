import "server-only";

import {
  requireEnvironmentVariable,
  RuntimeConfigurationError,
} from "@/lib/runtime-config";

export const VOLSEVER_DEFAULT_BASE_URL = "https://gate.volsever.com";
export const VOLSEVER_DEFAULT_TIMEOUT_MS = 15_000;
export const VOLSEVER_MIN_TIMEOUT_MS = 1_000;
export const VOLSEVER_MAX_TIMEOUT_MS = 60_000;
export const VOLSEVER_MAX_RESPONSE_BYTES = 64 * 1024;
export const VOLSEVER_VERIFICATION_MODE = "volsever-lookup";

const volseverGameAliases: Record<string, string> = {
  "mobile-legends": "mobile-legends-wr",
  "free-fire": "free-fire-asia",
  "pubg-mobile": "pubg-mobile-global",
  valorant: "valorant-indonesia",
  "genshin-impact": "genshin-impact",
};

/**
 * Human-readable region labels for the Volsever game endpoints we query.
 * When a candidate endpoint successfully resolves the account, the label of
 * the endpoint that matched is returned as the account's region — this is how
 * cross-region resolution is surfaced to customers (e.g. a Free Fire India
 * account resolved from the "free-fire-india" endpoint).
 */
const VOLSEVER_ENDPOINT_REGION_LABELS: Record<string, string> = {
  "mobile-legends-wr": "Global",
  "free-fire-asia": "Asia",
  "free-fire-india": "India",
  "free-fire-indonesia": "Indonesia",
  "pubg-mobile-global": "Global",
  "valorant-indonesia": "Indonesia",
  "genshin-impact": "Global",
};

function getVolseverGameCandidates(value: unknown, marketCode?: unknown) {
  const normalized = normalizeGameSlug(value);
  if (!normalized) return [];

  if (normalized === "free-fire") {
    const market = typeof marketCode === "string" ? marketCode.trim().toLowerCase() : "";
    const isIndonesia = /(^|[-_])(id|indonesia)([-_]|$)/.test(market);

    // Volsever's India route is the validated default for the store's
    // region-neutral Free Fire ID flow. Keep the broader Asia route and the
    // explicit Indonesia route as fallbacks for accounts from other markets.
    return isIndonesia
      ? ["free-fire-india", "free-fire-indonesia", "free-fire-asia"]
      : ["free-fire-india", "free-fire-asia", "free-fire-indonesia"];
  }

  return [volseverGameAliases[normalized] ?? normalized];
}

export type RecharzaVolseverGameSlug = string;

function normalizeGameSlug(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  return normalized;
}

export function isVolseverGameSlug(value: unknown): value is RecharzaVolseverGameSlug {
  return Boolean(normalizeGameSlug(value));
}

export function getVolseverGameSlug(value: unknown) {
  const normalized = normalizeGameSlug(value);
  if (!normalized) return null;
  return volseverGameAliases[normalized] ?? normalized;
}

export type VolseverIdentityResult = {
  valid: boolean;
  confirmed: boolean;
  playerId: string;
  zoneId: string;
  nickname: string | null;
  /** Human-readable region the resolved account was found in, e.g. "India". */
  region: string | null;
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

function readIdentifier(value: unknown, maxLength = 64) {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return String(value).slice(0, maxLength);
  }
  return readString(value, maxLength);
}

function boundedNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

async function readResponseBody(response: Response, maxBytes: number) {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const length = Number(contentLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes) {
      throw new VolseverProviderError();
    }
  }

  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new VolseverProviderError();
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new VolseverProviderError();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
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
    marketCode?: string;
  },
  options: {
    apiKey?: string;
    baseUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<VolseverIdentityResult> {
  const slugs = getVolseverGameCandidates(input.gameSlug, input.marketCode);
  if (slugs.length === 0) throw new VolseverProviderError("Invalid Volsever game slug.");

  const playerId = readString(input.playerId, 64);
  const zoneId = readString(input.zoneId, 64);
  const config = getVolseverConfiguration();
  const apiKey =
    options.apiKey?.trim() || requireEnvironmentVariable("VOLSEVER_API_KEY", { minLength: 12 });
  const baseUrl = (options.baseUrl ?? config.baseUrl).replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? config.timeoutMs;
  const fetchImpl = options.fetchImpl ?? fetch;

  let lastInvalidResult: VolseverIdentityResult | null = null;

  for (const slug of slugs) {
    let url: URL;
    try {
      url = new URL(`${baseUrl}/proxy/api/game/${slug}`);
    } catch {
      throw new RuntimeConfigurationError("VOLSEVER_API_BASE_URL is not a valid URL.");
    }

    if (url.protocol !== "https:") {
      throw new RuntimeConfigurationError("VOLSEVER_API_BASE_URL must use HTTPS.");
    }

    url.searchParams.set("id", playerId);
    if (zoneId) url.searchParams.set("zone", zoneId);

    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: { Accept: "application/json", "X-API-Key": apiKey },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new VolseverProviderError();
    }

    const rawText = await readResponseBody(response, VOLSEVER_MAX_RESPONSE_BYTES).catch(
      (error) => {
        if (error instanceof VolseverProviderError) throw error;
        throw new VolseverProviderError();
      },
    );

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
      throw new RuntimeConfigurationError("VOLSEVER_API_KEY was rejected by the Volsever service.");
    }

    if (status && data) {
      const echoedId = readIdentifier(data.user_id, 64);
      const username = readString(data.username ?? data.nickname, 64);
      const echoedZone = readIdentifier(data.zone, 64);

      if (
        echoedId === playerId &&
        username.length > 0 &&
        (!zoneId || !echoedZone || echoedZone === zoneId)
      ) {
        return {
          valid: true,
          confirmed: true,
          playerId,
          zoneId: echoedZone || zoneId,
          nickname: username,
          region: VOLSEVER_ENDPOINT_REGION_LABELS[slug] ?? null,
          verificationMode: VOLSEVER_VERIFICATION_MODE,
          message: "Account validated successfully.",
        };
      }
    }

    if (code !== null && code >= 400 && code < 500) {
      lastInvalidResult = {
        valid: false,
        confirmed: false,
        playerId,
        zoneId,
        nickname: null,
        region: null,
        verificationMode: VOLSEVER_VERIFICATION_MODE,
        message,
      };
      continue;
    }

    throw new VolseverProviderError();
  }

  return lastInvalidResult ?? {
    valid: false,
    confirmed: false,
    playerId,
    zoneId,
    nickname: null,
    region: null,
    verificationMode: VOLSEVER_VERIFICATION_MODE,
    message: "Game account validation could not be completed.",
  };
}

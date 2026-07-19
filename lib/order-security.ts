import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { requireEnvironmentVariable } from "@/lib/runtime-config";

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9:_-]{16,128}$/;

export function normalizeIdempotencyKey(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return IDEMPOTENCY_KEY_PATTERN.test(normalized) ? normalized : null;
}

export function createClientFingerprint(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown-client";
  const salt = requireEnvironmentVariable("RATE_LIMIT_SALT", {
    minLength: 32,
  });

  return createHmac("sha256", salt).update(address).digest("hex");
}

export function deriveOrderAccessToken(
  publicOrderId: string,
  idempotencyKey: string,
) {
  const secret = requireEnvironmentVariable("ORDER_ACCESS_SECRET", {
    minLength: 32,
  });

  return createHmac("sha256", secret)
    .update(`${publicOrderId}:${idempotencyKey}`)
    .digest("base64url");
}

export function hashOrderAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyOrderAccessToken(token: string, expectedHash: string) {
  const tokenHash = hashOrderAccessToken(token);
  const actual = Buffer.from(tokenHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

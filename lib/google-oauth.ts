import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { OAuth2Client } from "google-auth-library";

import { sanitizeReturnPath } from "@/lib/auth";

const GOOGLE_OAUTH_COOKIE = "recharza_google_oauth";
const GOOGLE_OAUTH_STATE_TTL_SECONDS = 10 * 60;
const GOOGLE_OAUTH_STATE_TTL_MS = GOOGLE_OAUTH_STATE_TTL_SECONDS * 1000;

type GoogleOAuthStatePayload = {
  nonce: string;
  returnTo: string;
  expiresAt: number;
};

type GoogleOAuthConfiguration = {
  clientId: string;
  clientSecret: string;
  stateSecret: string;
  callbackUrl: string;
};

function requiredValue(name: string) {
  const current = process.env[name]?.trim();
  if (!current) throw new Error(`${name} is not configured.`);
  return current;
}

function secureCookieSuffix() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

function parseCookie(request: Request, name: string) {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [cookieName, ...rest] = part.trim().split("=");
    if (cookieName === name && rest.length) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function signState(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest();
}

function encodeState(payload: GoogleOAuthStatePayload, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signState(encodedPayload, secret).toString("base64url");
  return `${encodedPayload}.${signature}`;
}

function decodeState(state: string, secret: string) {
  const parts = state.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) return null;

  let suppliedSignature: Buffer;
  try {
    suppliedSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }

  const expectedSignature = signState(encodedPayload, secret);
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<GoogleOAuthStatePayload>;

    if (
      typeof payload.nonce !== "string" ||
      payload.nonce.length < 32 ||
      typeof payload.returnTo !== "string" ||
      typeof payload.expiresAt !== "number" ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload as GoogleOAuthStatePayload;
  } catch {
    return null;
  }
}

export function getGoogleOAuthConfiguration(): GoogleOAuthConfiguration {
  const clientId = requiredValue("GOOGLE_CLIENT_ID");
  const clientSecret = requiredValue("GOOGLE_CLIENT_SECRET");
  const stateSecret = requiredValue("GOOGLE_OAUTH_STATE_SECRET");
  if (stateSecret.length < 32) {
    throw new Error("GOOGLE_OAUTH_STATE_SECRET must contain at least 32 characters.");
  }

  const appUrl = new URL(requiredValue("NEXT_PUBLIC_APP_URL"));
  const callbackUrl = new URL("/api/auth/google/callback", appUrl).toString();

  return { clientId, clientSecret, stateSecret, callbackUrl };
}

export function createGoogleOAuthClient() {
  const configuration = getGoogleOAuthConfiguration();
  const client = new OAuth2Client({
    clientId: configuration.clientId,
    clientSecret: configuration.clientSecret,
    redirectUri: configuration.callbackUrl,
  });

  return { client, configuration };
}

export function createGoogleAuthorizationRequest(returnTo: unknown) {
  const { client, configuration } = createGoogleOAuthClient();
  const nonce = randomBytes(32).toString("base64url");
  const payload: GoogleOAuthStatePayload = {
    nonce,
    returnTo: sanitizeReturnPath(returnTo, "/account"),
    expiresAt: Date.now() + GOOGLE_OAUTH_STATE_TTL_MS,
  };
  const state = encodeState(payload, configuration.stateSecret);
  const authorizationUrl = client.generateAuthUrl({
    access_type: "online",
    include_granted_scopes: false,
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  });
  const cookie = `${GOOGLE_OAUTH_COOKIE}=${encodeURIComponent(nonce)}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${GOOGLE_OAUTH_STATE_TTL_SECONDS}${secureCookieSuffix()}`;

  return { authorizationUrl, cookie };
}

export function consumeGoogleOAuthState(state: unknown, request: Request) {
  if (typeof state !== "string" || state.length < 64 || state.length > 2048) {
    return null;
  }

  const { stateSecret } = getGoogleOAuthConfiguration();
  const payload = decodeState(state, stateSecret);
  const cookieNonce = parseCookie(request, GOOGLE_OAUTH_COOKIE);

  if (!payload || !cookieNonce) return null;

  const expected = Buffer.from(payload.nonce);
  const received = Buffer.from(cookieNonce);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  return { returnTo: sanitizeReturnPath(payload.returnTo, "/account") };
}

export function clearGoogleOAuthCookie() {
  return `${GOOGLE_OAUTH_COOKIE}=; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=0${secureCookieSuffix()}`;
}

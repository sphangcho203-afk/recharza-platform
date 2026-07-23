import { createHash, randomBytes } from "node:crypto";

import type {
  AccountAccessStatus,
  AccountRole,
} from "@/generated/prisma/client";
import { isSessionAllowed, isSignInAllowed } from "@/lib/access-control";
import { getPrisma } from "@/lib/prisma";

const SESSION_COOKIE = "recharza_session";
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_TOUCH_INTERVAL_MS = 15 * 60 * 1000;

export type AuthenticatedCustomer = {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  role: AccountRole;
  accessStatus: AccountAccessStatus;
  staffPermissions: string[];
  staffPermissionsConfigured: boolean;
  emailVerifiedAt: Date | null;
};

export type AuthSessionResult = {
  sessionId: string;
  customer: AuthenticatedCustomer;
  expiresAt: Date;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

function parseEmailAllowlist(name: string) {
  return new Set(
    (process.env[name] ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

function resolveBootstrapRole(email: string): AccountRole {
  if (parseEmailAllowlist("AUTH_ADMIN_EMAILS").has(email)) return "ADMIN";
  if (parseEmailAllowlist("AUTH_STAFF_EMAILS").has(email)) return "STAFF";
  return "CUSTOMER";
}

function parseCookies(request: Request) {
  const cookies = new Map<string, string>();
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name && rest.length) cookies.set(name, decodeURIComponent(rest.join("=")));
  }
  return cookies;
}

function hashUserAgent(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim();
  return userAgent ? createHash("sha256").update(userAgent).digest("hex").slice(0, 32) : null;
}

function serializeAuthenticatedCustomer(customer: {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  role: AccountRole;
  accessStatus: AccountAccessStatus;
  staffPermissions: string[];
  staffPermissionsConfigured: boolean;
  emailVerifiedAt: Date | null;
}): AuthenticatedCustomer {
  return {
    id: customer.id,
    email: customer.email,
    displayName: customer.displayName,
    username: customer.username,
    role: customer.role,
    accessStatus: customer.accessStatus,
    staffPermissions: customer.staffPermissions,
    staffPermissionsConfigured: customer.staffPermissionsConfigured,
    emailVerifiedAt: customer.emailVerifiedAt,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function createSessionCookie(token: string, expiresAt: Date) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function sanitizeReturnPath(value: unknown, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path.slice(0, 500);
}

export async function createMagicLink(input: {
  email: unknown;
  requestedFingerprint: string;
  returnTo?: unknown;
}) {
  const email = normalizeEmail(input.email);
  if (!email) return null;

  const prisma = getPrisma();
  const role = resolveBootstrapRole(email);
  const customer = await prisma.customer.upsert({
    where: { email },
    update: role === "CUSTOMER" ? {} : { role },
    create: { email, role },
  });

  if (!isSignInAllowed(customer.accessStatus)) return null;

  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);

  await prisma.$transaction([
    prisma.authMagicLink.updateMany({
      where: { customerId: customer.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.authMagicLink.create({
      data: {
        tokenHash,
        customerId: customer.id,
        requestedFingerprint: input.requestedFingerprint,
        expiresAt,
      },
    }),
  ]);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
  const returnTo = sanitizeReturnPath(input.returnTo);
  const url = new URL("/api/auth/consume", appUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("returnTo", returnTo);

  return { customer, email, url: url.toString(), expiresAt };
}

export async function consumeMagicLink(token: unknown, request: Request) {
  if (typeof token !== "string" || token.length < 32 || token.length > 256) return null;

  const tokenHash = hashToken(token.trim());
  const prisma = getPrisma();
  const magicLink = await prisma.authMagicLink.findUnique({
    where: { tokenHash },
    include: { customer: true },
  });

  if (
    !magicLink ||
    magicLink.usedAt ||
    magicLink.expiresAt <= new Date() ||
    !isSignInAllowed(magicLink.customer.accessStatus)
  ) {
    return null;
  }

  const sessionToken = createOpaqueToken();
  const sessionHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const bootstrapRole = resolveBootstrapRole(magicLink.customer.email);

  const result = await prisma.$transaction(async (transaction) => {
    const currentCustomer = await transaction.customer.findUnique({
      where: { id: magicLink.customerId },
    });
    if (!currentCustomer || !isSignInAllowed(currentCustomer.accessStatus)) return null;

    const consumed = await transaction.authMagicLink.updateMany({
      where: { id: magicLink.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return null;

    const customer = await transaction.customer.update({
      where: { id: magicLink.customerId },
      data: {
        emailVerifiedAt: currentCustomer.emailVerifiedAt ?? new Date(),
        lastLoginAt: new Date(),
        ...(bootstrapRole === "CUSTOMER" ? {} : { role: bootstrapRole }),
      },
    });

    await transaction.authSession.create({
      data: {
        tokenHash: sessionHash,
        customerId: customer.id,
        expiresAt,
        userAgentHash: hashUserAgent(request),
      },
    });

    return customer;
  });

  return result ? { sessionToken, expiresAt, customer: result } : null;
}

export async function getRequestSession(request: Request): Promise<AuthSessionResult | null> {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token || token.length < 32 || token.length > 256) return null;

  const prisma = getPrisma();
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  if (!session.customer.emailVerifiedAt || !isSessionAllowed(session.customer.accessStatus)) {
    return null;
  }

  if (Date.now() - session.lastUsedAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
    void prisma.authSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => undefined);
  }

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    customer: serializeAuthenticatedCustomer(session.customer),
  };
}

export async function revokeRequestSession(request: Request) {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token) return;
  await getPrisma().authSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function hasStaffRole(role: AccountRole) {
  return role === "STAFF" || role === "ADMIN";
}

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import argon2 from "./argon2-wasm";

import type {
  AccountAccessStatus,
  AccountRole,
} from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

const STAFF_SESSION_COOKIE = "recharza_staff_session";
const STAFF_CSRF_COOKIE = "recharza_staff_csrf";
const STAFF_CSRF_HEADER = "x-recharza-csrf-token";
const STAFF_IDLE_TTL_MS = 30 * 60 * 1000;
const STAFF_ABSOLUTE_TTL_MS = 12 * 60 * 60 * 1000;
const STAFF_SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const STAFF_MAX_FAILED_LOGINS = 5;
const STAFF_LOGIN_COOLDOWN_MS = 15 * 60 * 1000;
const STAFF_PASSWORD_MIN_LENGTH = 14;
const STAFF_PASSWORD_MAX_LENGTH = 128;
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$XtLr8WsSO4FWT5YmJdpoJQ$qmH1Uqe76dlePCrXSgqb4lVzLUR7XxMuWyYPH/h8Dh4";

export type StaffRole = "ADMIN" | "OPERATOR";

export type StaffSessionResult = {
  sessionId: string;
  role: StaffRole;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  mustChangePassword: boolean;
  account: {
    id: string;
    email: string;
    displayName: string | null;
    username: string | null;
    role: AccountRole;
    accessStatus: AccountAccessStatus;
    staffPermissions: string[];
    staffPermissionsConfigured: boolean;
  };
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

function secureCookieAttribute() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function hashUserAgent(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim();
  return userAgent
    ? createHash("sha256").update(userAgent).digest("hex").slice(0, 32)
    : null;
}

function emailFingerprint(email: string | null) {
  return email
    ? createHash("sha256").update(email).digest("hex").slice(0, 24)
    : "invalid-email";
}

function toStaffRole(role: AccountRole): StaffRole | null {
  if (role === "ADMIN") return "ADMIN";
  if (role === "STAFF") return "OPERATOR";
  return null;
}

function createAuditFingerprint(accountId: string, role: StaffRole) {
  return createHash("sha256")
    .update(`staff:${accountId}:${role}`)
    .digest("hex")
    .slice(0, 24);
}

function serializeStaffSession(session: {
  id: string;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  credential: { mustChangePassword: boolean };
  customer: {
    id: string;
    email: string;
    displayName: string | null;
    username: string | null;
    role: AccountRole;
    accessStatus: AccountAccessStatus;
    staffPermissions: string[];
    staffPermissionsConfigured: boolean;
  };
}): StaffSessionResult | null {
  const role = toStaffRole(session.customer.role);
  if (!role) return null;

  return {
    sessionId: session.id,
    role,
    idleExpiresAt: session.idleExpiresAt,
    absoluteExpiresAt: session.absoluteExpiresAt,
    mustChangePassword: session.credential.mustChangePassword,
    account: {
      id: session.customer.id,
      email: session.customer.email,
      displayName: session.customer.displayName,
      username: session.customer.username,
      role: session.customer.role,
      accessStatus: session.customer.accessStatus,
      staffPermissions: session.customer.staffPermissions,
      staffPermissionsConfigured: session.customer.staffPermissionsConfigured,
    },
  };
}

export function normalizeStaffEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

export function validateStaffPassword(value: unknown) {
  if (typeof value !== "string") return "Password is required.";
  if (value.length < STAFF_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${STAFF_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (value.length > STAFF_PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${STAFF_PASSWORD_MAX_LENGTH} characters.`;
  }
  if (/\0/.test(value)) return "Password contains an unsupported character.";
  return null;
}

export function hashStaffPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

export function getStaffSessionCookieName() {
  return STAFF_SESSION_COOKIE;
}

export function getStaffCsrfCookieName() {
  return STAFF_CSRF_COOKIE;
}

export function getStaffCsrfHeaderName() {
  return STAFF_CSRF_HEADER;
}

export function parseRequestCookies(request: Request) {
  const cookies = new Map<string, string>();
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name || rest.length === 0) continue;
    try {
      cookies.set(name, decodeURIComponent(rest.join("=")));
    } catch {
      continue;
    }
  }
  return cookies;
}

export function createStaffSessionCookie(token: string, expiresAt: Date) {
  return `${STAFF_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Expires=${expiresAt.toUTCString()}${secureCookieAttribute()}`;
}

export function createStaffCsrfCookie(token: string, expiresAt: Date) {
  return `${STAFF_CSRF_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Strict; Expires=${expiresAt.toUTCString()}${secureCookieAttribute()}`;
}

export function clearStaffSessionCookie() {
  return `${STAFF_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureCookieAttribute()}`;
}

export function clearStaffCsrfCookie() {
  return `${STAFF_CSRF_COOKIE}=; Path=/; SameSite=Strict; Max-Age=0${secureCookieAttribute()}`;
}

export function createStaffCsrfToken() {
  return createOpaqueToken();
}

export function validateStaffRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let expectedOrigin: string;
  try {
    const configuredOrigin =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL?.trim()
        : null;
    expectedOrigin = new URL(configuredOrigin || request.url).origin;
  } catch {
    return false;
  }

  if (origin !== expectedOrigin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin";
}

export function validateStaffMutationRequest(request: Request) {
  if (!validateStaffRequestOrigin(request)) return false;

  const csrfCookie = parseRequestCookies(request).get(STAFF_CSRF_COOKIE) ?? "";
  const csrfHeader = request.headers.get(STAFF_CSRF_HEADER)?.trim() ?? "";
  if (
    csrfCookie.length < 32 ||
    csrfCookie.length > 256 ||
    csrfHeader.length < 32 ||
    csrfHeader.length > 256
  ) {
    return false;
  }
  return constantTimeEqual(csrfCookie, csrfHeader);
}

async function appendLoginAudit(input: {
  action: string;
  actorFingerprint: string;
  accountId?: string | null;
  email: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await getPrisma().adminAuditLog.create({
    data: {
      action: input.action,
      actorFingerprint: input.actorFingerprint,
      actorCustomerId: input.accountId ?? null,
      metadata: {
        emailFingerprint: emailFingerprint(input.email),
        ...input.metadata,
      },
    },
  });
}

export async function authenticateStaffCredentials(input: {
  request: Request;
  email: unknown;
  password: unknown;
  actorFingerprint: string;
}) {
  const email = normalizeStaffEmail(input.email);
  const password =
    typeof input.password === "string" && input.password.length <= 256
      ? input.password
      : "";
  const prisma = getPrisma();
  const credential = email
    ? await prisma.staffCredential.findFirst({
        where: { customer: { email } },
        include: { customer: true },
      })
    : null;
  const passwordHash = credential?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await argon2.verify(passwordHash, password).catch(() => false);
  const now = new Date();
  const role = credential ? toStaffRole(credential.customer.role) : null;
  const cooldownActive = Boolean(
    credential?.lockedUntil && credential.lockedUntil > now,
  );
  const valid =
    Boolean(credential) &&
    passwordMatches &&
    !cooldownActive &&
    role !== null &&
    credential?.customer.accessStatus === "ACTIVE";

  if (!credential || !valid || !role) {
    if (credential && !cooldownActive) {
      const failedLoginCount = credential.failedLoginCount + 1;
      await prisma.staffCredential.update({
        where: { id: credential.id },
        data: {
          failedLoginCount,
          lastFailedLoginAt: now,
          lockedUntil:
            failedLoginCount >= STAFF_MAX_FAILED_LOGINS
              ? new Date(now.getTime() + STAFF_LOGIN_COOLDOWN_MS)
              : null,
        },
      });
    }

    await appendLoginAudit({
      action: "STAFF_LOGIN_REJECTED",
      actorFingerprint: input.actorFingerprint,
      accountId: credential?.customerId,
      email,
      metadata: {
        cooldownActive,
        accessAllowed: credential?.customer.accessStatus === "ACTIVE",
        staffRole: Boolean(role),
      },
    });
    return null;
  }

  const sessionToken = createOpaqueToken();
  const csrfToken = createStaffCsrfToken();
  const idleExpiresAt = new Date(now.getTime() + STAFF_IDLE_TTL_MS);
  const absoluteExpiresAt = new Date(now.getTime() + STAFF_ABSOLUTE_TTL_MS);
  const session = await prisma.$transaction(async (transaction) => {
    const current = await transaction.staffCredential.findUnique({
      where: { id: credential.id },
      include: { customer: true },
    });
    const currentRole = current ? toStaffRole(current.customer.role) : null;
    if (
      !current ||
      current.passwordVersion !== credential.passwordVersion ||
      current.customer.accessStatus !== "ACTIVE" ||
      !currentRole
    ) {
      return null;
    }

    await transaction.staffCredential.update({
      where: { id: current.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastFailedLoginAt: null,
        lastLoginAt: now,
      },
    });
    await transaction.customer.update({
      where: { id: current.customerId },
      data: { lastLoginAt: now },
    });
    const created = await transaction.staffSession.create({
      data: {
        tokenHash: hashToken(sessionToken),
        customerId: current.customerId,
        credentialId: current.id,
        passwordVersion: current.passwordVersion,
        idleExpiresAt,
        absoluteExpiresAt,
        userAgentHash: hashUserAgent(input.request),
      },
      include: { customer: true, credential: true },
    });
    await transaction.adminAuditLog.create({
      data: {
        action: "STAFF_LOGIN_SUCCEEDED",
        actorFingerprint: input.actorFingerprint,
        actorCustomerId: current.customerId,
        metadata: {
          sessionId: created.id,
          role: currentRole,
          absoluteExpiresAt: absoluteExpiresAt.toISOString(),
        },
      },
    });
    return created;
  });

  if (!session) return null;
  const serialized = serializeStaffSession(session);
  return serialized
    ? { session: serialized, sessionToken, csrfToken }
    : null;
}

export async function getStaffSessionByToken(
  token: string | null | undefined,
): Promise<StaffSessionResult | null> {
  if (!token || token.length < 32 || token.length > 256) return null;

  const prisma = getPrisma();
  const session = await prisma.staffSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true, credential: true },
  });
  const now = new Date();
  const role = session ? toStaffRole(session.customer.role) : null;
  if (
    !session ||
    session.revokedAt ||
    session.idleExpiresAt <= now ||
    session.absoluteExpiresAt <= now ||
    session.passwordVersion !== session.credential.passwordVersion ||
    session.customer.accessStatus !== "ACTIVE" ||
    !role
  ) {
    if (session && !session.revokedAt) {
      await prisma.staffSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now },
      });
    }
    return null;
  }

  if (
    now.getTime() - session.lastUsedAt.getTime() >
    STAFF_SESSION_TOUCH_INTERVAL_MS
  ) {
    const idleExpiresAt = new Date(
      Math.min(
        now.getTime() + STAFF_IDLE_TTL_MS,
        session.absoluteExpiresAt.getTime(),
      ),
    );
    await prisma.staffSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
        passwordVersion: session.credential.passwordVersion,
      },
      data: { lastUsedAt: now, idleExpiresAt },
    });
    session.idleExpiresAt = idleExpiresAt;
  }

  return serializeStaffSession(session);
}

export async function requireStaffSession(
  request: Request,
): Promise<StaffSessionResult | null> {
  const token = parseRequestCookies(request).get(STAFF_SESSION_COOKIE);
  return getStaffSessionByToken(token);
}

export async function requireRole(
  roles: readonly StaffRole[],
  request: Request,
): Promise<StaffSessionResult | null> {
  const session = await requireStaffSession(request);
  const mutation = !["GET", "HEAD", "OPTIONS"].includes(
    request.method.toUpperCase(),
  );
  if (
    !session ||
    session.mustChangePassword ||
    !roles.includes(session.role) ||
    (mutation && !validateStaffMutationRequest(request))
  ) {
    return null;
  }
  return session;
}

export function getStaffActor(session: StaffSessionResult) {
  return {
    actorFingerprint: createAuditFingerprint(
      session.account.id,
      session.role,
    ),
    actorCustomerId: session.account.id,
    role: session.role,
    sessionId: session.sessionId,
  };
}

export async function revokeStaffRequestSession(request: Request) {
  const token = parseRequestCookies(request).get(STAFF_SESSION_COOKIE);
  if (!token) return null;
  const session = await getStaffSessionByToken(token);
  const now = new Date();
  await getPrisma().staffSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: now },
  });
  if (session) {
    await getPrisma().adminAuditLog.create({
      data: {
        action: "STAFF_LOGOUT",
        actorFingerprint: createAuditFingerprint(
          session.account.id,
          session.role,
        ),
        actorCustomerId: session.account.id,
        metadata: { sessionId: session.sessionId },
      },
    });
  }
  return session;
}

export async function changeStaffPassword(input: {
  session: StaffSessionResult;
  currentPassword: unknown;
  newPassword: unknown;
}) {
  const newPasswordError = validateStaffPassword(input.newPassword);
  if (
    typeof input.currentPassword !== "string" ||
    newPasswordError ||
    typeof input.newPassword !== "string"
  ) {
    return false;
  }

  const prisma = getPrisma();
  const credential = await prisma.staffCredential.findUnique({
    where: { customerId: input.session.account.id },
  });
  if (!credential) return false;
  const matches = await argon2
    .verify(credential.passwordHash, input.currentPassword)
    .catch(() => false);
  if (!matches) return false;

  const nextHash = await hashStaffPassword(input.newPassword);
  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    const updated = await transaction.staffCredential.updateMany({
      where: {
        id: credential.id,
        passwordVersion: credential.passwordVersion,
      },
      data: {
        passwordHash: nextHash,
        passwordVersion: { increment: 1 },
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
        lastFailedLoginAt: null,
        passwordChangedAt: now,
      },
    });
    if (updated.count !== 1) throw new Error("Credential changed concurrently.");

    await transaction.staffSession.updateMany({
      where: { credentialId: credential.id, revokedAt: null },
      data: { revokedAt: now },
    });
    await transaction.adminAuditLog.create({
      data: {
        action: "STAFF_PASSWORD_CHANGED",
        actorFingerprint: createAuditFingerprint(
          input.session.account.id,
          input.session.role,
        ),
        actorCustomerId: input.session.account.id,
        metadata: { revokedAllStaffSessions: true },
      },
    });
  });
  return true;
}

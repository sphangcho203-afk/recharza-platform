import type {
  AccountAccessStatus,
  AccountRole,
} from "@/generated/prisma/client";
import {
  LEGACY_STAFF_PERMISSIONS,
  STAFF_PERMISSION_DEFINITIONS,
  resolveStaffPermissions,
  sanitizeStaffPermissions,
} from "@/lib/access-control";
import { getRequestSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ACCESS_STATUSES = new Set<AccountAccessStatus>([
  "ACTIVE",
  "ORDER_RESTRICTED",
  "SIGN_IN_RESTRICTED",
  "SUSPENDED",
]);
const MANAGEABLE_ROLES = new Set<AccountRole>(["CUSTOMER", "STAFF"]);
const OPERATIONS = new Set([
  "set-access",
  "set-role",
  "set-permissions",
  "revoke-sessions",
]);

async function requireAdmin(request: Request) {
  const session = await getRequestSession(request);
  return session?.customer.role === "ADMIN" ? session : null;
}

function serializeCustomer(
  customer: {
    id: string;
    email: string;
    displayName: string | null;
    username: string | null;
    role: AccountRole;
    accessStatus: AccountAccessStatus;
    restrictionReason: string | null;
    restrictionUpdatedAt: Date | null;
    staffPermissions: string[];
    staffPermissionsConfigured: boolean;
    emailVerifiedAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { orders: number; sessions: number };
  },
  activeSessions: number,
) {
  return {
    id: customer.id,
    email: customer.email,
    displayName: customer.displayName,
    username: customer.username,
    role: customer.role,
    accessStatus: customer.accessStatus,
    restrictionReason: customer.restrictionReason,
    restrictionUpdatedAt: customer.restrictionUpdatedAt?.toISOString() ?? null,
    permissions: resolveStaffPermissions({
      role: customer.role,
      staffPermissions: customer.staffPermissions,
      staffPermissionsConfigured: customer.staffPermissionsConfigured,
    }),
    permissionsConfigured: customer.staffPermissionsConfigured,
    verifiedAt: customer.emailVerifiedAt?.toISOString() ?? null,
    lastLoginAt: customer.lastLoginAt?.toISOString() ?? null,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    counts: {
      orders: customer._count.orders,
      sessions: customer._count.sessions,
      activeSessions,
    },
  };
}

async function loadCustomer(customerId: string) {
  const prisma = getPrisma();
  const [customer, activeSessions] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        role: true,
        accessStatus: true,
        restrictionReason: true,
        restrictionUpdatedAt: true,
        staffPermissions: true,
        staffPermissionsConfigured: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true, sessions: true } },
      },
    }),
    prisma.authSession.count({
      where: {
        customerId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  return customer ? serializeCustomer(customer, activeSessions) : null;
}

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const prisma = getPrisma();
  const now = new Date();
  const [customers, activeSessionGroups] = await Promise.all([
    prisma.customer.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
      take: 500,
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        role: true,
        accessStatus: true,
        restrictionReason: true,
        restrictionUpdatedAt: true,
        staffPermissions: true,
        staffPermissionsConfigured: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true, sessions: true } },
      },
    }),
    prisma.authSession.groupBy({
      by: ["customerId"],
      where: { revokedAt: null, expiresAt: { gt: now } },
      _count: { _all: true },
    }),
  ]);

  const activeSessions = new Map(
    activeSessionGroups.map((group) => [group.customerId, group._count._all]),
  );

  return Response.json(
    {
      ok: true,
      currentAdminId: session.customer.id,
      permissionDefinitions: STAFF_PERMISSION_DEFINITIONS,
      people: customers.map((customer) =>
        serializeCustomer(customer, activeSessions.get(customer.id) ?? 0),
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const operation = typeof body?.operation === "string" ? body.operation : "";
  const customerId = typeof body?.customerId === "string" ? body.customerId.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 300) : "";

  if (!OPERATIONS.has(operation) || !customerId || reason.length < 8) {
    return Response.json(
      {
        ok: false,
        message: "A valid operation, customer, and audit reason of at least 8 characters are required.",
      },
      { status: 400 },
    );
  }

  if (customerId === session.customer.id) {
    return Response.json(
      { ok: false, message: "The active administrator cannot modify or revoke their own access." },
      { status: 409 },
    );
  }

  const prisma = getPrisma();
  const target = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!target) {
    return Response.json({ ok: false, message: "Customer record not found." }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    return Response.json(
      { ok: false, message: "Administrator accounts require a separate dual-approval workflow." },
      { status: 409 },
    );
  }

  const now = new Date();
  let revokedSessions = 0;

  await prisma.$transaction(async (transaction) => {
    if (operation === "set-access") {
      const accessStatus =
        typeof body?.accessStatus === "string"
          ? (body.accessStatus.toUpperCase() as AccountAccessStatus)
          : null;
      if (!accessStatus || !ACCESS_STATUSES.has(accessStatus)) {
        throw new Error("INVALID_ACCESS_STATUS");
      }

      await transaction.customer.update({
        where: { id: target.id },
        data: {
          accessStatus,
          restrictionReason: accessStatus === "ACTIVE" ? null : reason,
          restrictionUpdatedAt: now,
        },
      });

      if (accessStatus === "SIGN_IN_RESTRICTED" || accessStatus === "SUSPENDED") {
        const revoked = await transaction.authSession.updateMany({
          where: { customerId: target.id, revokedAt: null },
          data: { revokedAt: now },
        });
        revokedSessions = revoked.count;
      }

      await transaction.adminAuditLog.create({
        data: {
          action: "CUSTOMER_ACCESS_UPDATED",
          actorFingerprint: session.sessionId,
          actorCustomerId: session.customer.id,
          metadata: {
            targetCustomerId: target.id,
            previousAccessStatus: target.accessStatus,
            accessStatus,
            reason,
            revokedSessions,
          },
        },
      });
      return;
    }

    if (operation === "set-role") {
      const role =
        typeof body?.role === "string" ? (body.role.toUpperCase() as AccountRole) : null;
      if (!role || !MANAGEABLE_ROLES.has(role)) throw new Error("INVALID_ROLE");

      const promotingToStaff = role === "STAFF" && target.role !== "STAFF";
      await transaction.customer.update({
        where: { id: target.id },
        data: {
          role,
          staffPermissions:
            role === "STAFF"
              ? promotingToStaff
                ? LEGACY_STAFF_PERMISSIONS
                : target.staffPermissions
              : [],
          staffPermissionsConfigured:
            role === "STAFF" ? promotingToStaff || target.staffPermissionsConfigured : true,
        },
      });

      const revoked = await transaction.authSession.updateMany({
        where: { customerId: target.id, revokedAt: null },
        data: { revokedAt: now },
      });
      revokedSessions = revoked.count;

      await transaction.adminAuditLog.create({
        data: {
          action: "CUSTOMER_ROLE_UPDATED",
          actorFingerprint: session.sessionId,
          actorCustomerId: session.customer.id,
          metadata: {
            targetCustomerId: target.id,
            previousRole: target.role,
            role,
            reason,
            revokedSessions,
          },
        },
      });
      return;
    }

    if (operation === "set-permissions") {
      if (target.role !== "STAFF") throw new Error("TARGET_NOT_STAFF");
      const permissions = sanitizeStaffPermissions(body?.permissions);

      await transaction.customer.update({
        where: { id: target.id },
        data: {
          staffPermissions: permissions,
          staffPermissionsConfigured: true,
        },
      });
      await transaction.adminAuditLog.create({
        data: {
          action: "STAFF_PERMISSIONS_UPDATED",
          actorFingerprint: session.sessionId,
          actorCustomerId: session.customer.id,
          metadata: {
            targetCustomerId: target.id,
            previousPermissions: resolveStaffPermissions({
              role: target.role,
              staffPermissions: target.staffPermissions,
              staffPermissionsConfigured: target.staffPermissionsConfigured,
            }),
            permissions,
            reason,
          },
        },
      });
      return;
    }

    const revoked = await transaction.authSession.updateMany({
      where: { customerId: target.id, revokedAt: null },
      data: { revokedAt: now },
    });
    revokedSessions = revoked.count;
    await transaction.adminAuditLog.create({
      data: {
        action: "CUSTOMER_SESSIONS_REVOKED",
        actorFingerprint: session.sessionId,
        actorCustomerId: session.customer.id,
        metadata: {
          targetCustomerId: target.id,
          revokedSessions,
          reason,
        },
      },
    });
  }).catch((error: unknown) => {
    if (error instanceof Error) throw error;
    throw new Error("PEOPLE_ACCESS_UPDATE_FAILED");
  });

  const customer = await loadCustomer(target.id);
  return Response.json({
    ok: true,
    operation,
    revokedSessions,
    customer,
  });
}

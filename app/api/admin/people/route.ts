import type {
  AccountAccessStatus,
  AccountRole,
} from "@/generated/prisma/client";
import {
  LEGACY_STAFF_PERMISSIONS,
  resolveStaffPermissions,
  sanitizeStaffPermissions,
} from "@/lib/access-control";
import {
  getAdminPeopleSnapshot,
  getAdminPersonById,
} from "@/lib/admin-people";
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

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const snapshot = await getAdminPeopleSnapshot();
  return Response.json(
    {
      ok: true,
      currentAdminId: session.customer.id,
      ...snapshot,
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

  const accessStatus =
    operation === "set-access" && typeof body?.accessStatus === "string"
      ? (body.accessStatus.toUpperCase() as AccountAccessStatus)
      : null;
  if (operation === "set-access" && (!accessStatus || !ACCESS_STATUSES.has(accessStatus))) {
    return Response.json(
      { ok: false, message: "Choose a valid account access state." },
      { status: 400 },
    );
  }

  const role =
    operation === "set-role" && typeof body?.role === "string"
      ? (body.role.toUpperCase() as AccountRole)
      : null;
  if (operation === "set-role" && (!role || !MANAGEABLE_ROLES.has(role))) {
    return Response.json(
      { ok: false, message: "Only customer and staff roles can be assigned here." },
      { status: 400 },
    );
  }

  if (operation === "set-permissions" && target.role !== "STAFF") {
    return Response.json(
      { ok: false, message: "Permissions can only be assigned to a staff account." },
      { status: 409 },
    );
  }

  const permissions =
    operation === "set-permissions" ? sanitizeStaffPermissions(body?.permissions) : [];
  const now = new Date();
  let revokedSessions = 0;

  await prisma.$transaction(async (transaction) => {
    if (operation === "set-access" && accessStatus) {
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

    if (operation === "set-role" && role) {
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
  });

  const customer = await getAdminPersonById(target.id);
  return Response.json({
    ok: true,
    operation,
    revokedSessions,
    customer,
  });
}

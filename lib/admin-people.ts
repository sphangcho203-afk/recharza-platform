import "server-only";

import type {
  AccountAccessStatus,
  AccountRole,
} from "@/generated/prisma/client";
import {
  STAFF_PERMISSION_DEFINITIONS,
  resolveStaffPermissions,
} from "@/lib/access-control";
import { getPrisma } from "@/lib/prisma";

export type AdminPersonRecord = {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  role: AccountRole;
  accessStatus: AccountAccessStatus;
  restrictionReason: string | null;
  restrictionUpdatedAt: string | null;
  permissions: string[];
  permissionsConfigured: boolean;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  counts: {
    orders: number;
    sessions: number;
    activeSessions: number;
  };
};

export type AdminPeopleSnapshot = {
  permissionDefinitions: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  people: AdminPersonRecord[];
};

const customerSelect = {
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
} as const;

type SelectedCustomer = {
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
};

function serializeCustomer(
  customer: SelectedCustomer,
  activeSessions: number,
): AdminPersonRecord {
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

export async function getAdminPersonById(customerId: string) {
  const prisma = getPrisma();
  const now = new Date();
  const [customer, activeSessions] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: customerSelect,
    }),
    prisma.authSession.count({
      where: {
        customerId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    }),
  ]);

  return customer ? serializeCustomer(customer, activeSessions) : null;
}

export async function getAdminPeopleSnapshot(): Promise<AdminPeopleSnapshot> {
  const prisma = getPrisma();
  const now = new Date();
  const [customers, activeSessionGroups] = await Promise.all([
    prisma.customer.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
      take: 500,
      select: customerSelect,
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

  return {
    permissionDefinitions: STAFF_PERMISSION_DEFINITIONS.map((permission) => ({
      id: permission.id,
      label: permission.label,
      description: permission.description,
    })),
    people: customers.map((customer) =>
      serializeCustomer(customer, activeSessions.get(customer.id) ?? 0),
    ),
  };
}

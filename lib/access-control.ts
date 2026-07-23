import type {
  AccountAccessStatus,
  AccountRole,
} from "@/generated/prisma/client";

export const STAFF_PERMISSION_DEFINITIONS = [
  {
    id: "orders.read",
    label: "Read orders",
    description: "View protected order queues and operational order details.",
  },
  {
    id: "orders.manage",
    label: "Manage order states",
    description: "Apply approved non-payment order status transitions with an audit reason.",
  },
  {
    id: "fulfilment.manage",
    label: "Manage fulfilment",
    description: "Plan or retry protected fulfilment after verified payment.",
  },
  {
    id: "customers.read",
    label: "Read customer context",
    description: "View masked customer context required for support and order operations.",
  },
  {
    id: "catalogue.read",
    label: "Read catalogue operations",
    description: "Inspect published products, availability, and supplier catalogue state.",
  },
  {
    id: "support.manage",
    label: "Manage support work",
    description: "Work on assigned customer cases when the support module is enabled.",
  },
  {
    id: "audit.read",
    label: "Read audit evidence",
    description: "Inspect permitted operational history without changing security records.",
  },
] as const;

export type StaffPermission = (typeof STAFF_PERMISSION_DEFINITIONS)[number]["id"];

const STAFF_PERMISSION_SET = new Set<string>(
  STAFF_PERMISSION_DEFINITIONS.map((permission) => permission.id),
);

export const LEGACY_STAFF_PERMISSIONS: StaffPermission[] = [
  "orders.read",
  "orders.manage",
  "fulfilment.manage",
  "customers.read",
  "catalogue.read",
];

export function sanitizeStaffPermissions(value: unknown): StaffPermission[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.filter(
        (permission): permission is StaffPermission =>
          typeof permission === "string" && STAFF_PERMISSION_SET.has(permission),
      ),
    ),
  );
}

export function resolveStaffPermissions(input: {
  role: AccountRole;
  staffPermissions: string[];
  staffPermissionsConfigured: boolean;
}): StaffPermission[] {
  if (input.role === "ADMIN") {
    return STAFF_PERMISSION_DEFINITIONS.map((permission) => permission.id);
  }

  if (input.role !== "STAFF") return [];
  if (!input.staffPermissionsConfigured) return [...LEGACY_STAFF_PERMISSIONS];
  return sanitizeStaffPermissions(input.staffPermissions);
}

export function hasStaffPermission(
  input: {
    role: AccountRole;
    staffPermissions: string[];
    staffPermissionsConfigured: boolean;
  },
  permission: StaffPermission,
) {
  if (input.role === "ADMIN") return true;
  return resolveStaffPermissions(input).includes(permission);
}

export function isSessionAllowed(status: AccountAccessStatus) {
  return status === "ACTIVE" || status === "ORDER_RESTRICTED";
}

export function isSignInAllowed(status: AccountAccessStatus) {
  return isSessionAllowed(status);
}

export function canCreateOrders(status: AccountAccessStatus) {
  return status === "ACTIVE";
}

export function getAccessStatusLabel(status: AccountAccessStatus) {
  if (status === "ORDER_RESTRICTED") return "Order restricted";
  if (status === "SIGN_IN_RESTRICTED") return "Sign-in restricted";
  if (status === "SUSPENDED") return "Suspended";
  return "Active";
}

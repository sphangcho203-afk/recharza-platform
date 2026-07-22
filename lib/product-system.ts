import type { AccountRole } from "@/generated/prisma/client";

export type ProductAudience = "customer" | "staff" | "admin";
export type ProductModuleState = "live" | "beta" | "planned" | "hidden";
export type Workspace = "customer" | "staff" | "admin";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  description: string;
  state: ProductModuleState;
  audiences: ProductAudience[];
  external?: boolean;
};

export type WorkspaceModule = NavigationItem & {
  metricLabel?: string;
  icon: "home" | "orders" | "catalogue" | "pricing" | "supplier" | "payments" | "customers" | "staff" | "promotions" | "support" | "audit" | "settings" | "queue" | "escalations" | "activity";
};

export const customerNavigation: NavigationItem[] = [
  {
    id: "games",
    label: "Games",
    href: "/#games",
    description: "Browse supported games and markets.",
    state: "live",
    audiences: ["customer", "staff", "admin"],
  },
  {
    id: "track",
    label: "Track order",
    href: "/orders/lookup",
    description: "Open private order tracking.",
    state: "live",
    audiences: ["customer", "staff", "admin"],
  },
  {
    id: "account",
    label: "Account",
    href: "/account",
    description: "Orders, saved players, rewards, and security.",
    state: "live",
    audiences: ["customer", "staff", "admin"],
  },
  {
    id: "support",
    label: "Support",
    href: "/account#support",
    description: "Get help with an order or account.",
    state: "beta",
    audiences: ["customer", "staff", "admin"],
  },
];

export const adminModules: WorkspaceModule[] = [
  { id: "overview", label: "Overview", href: "/admin#overview", description: "Business health and priorities.", state: "live", audiences: ["admin"], icon: "home" },
  { id: "orders", label: "Orders", href: "/admin#orders", description: "Review and recover orders.", state: "live", audiences: ["admin"], icon: "orders", metricLabel: "Needs review" },
  { id: "catalogue", label: "Products", href: "/admin#catalogue", description: "Published games, markets, and packages.", state: "beta", audiences: ["admin"], icon: "catalogue" },
  { id: "pricing", label: "Pricing rules", href: "/admin#pricing", description: "Margin, FX, gateway, and rounding policy.", state: "live", audiences: ["admin"], icon: "pricing" },
  { id: "suppliers", label: "Suppliers", href: "/admin#suppliers", description: "Supplier sync, health, and fulfilment gates.", state: "live", audiences: ["admin"], icon: "supplier" },
  { id: "payments", label: "Payments", href: "/admin#payments", description: "Test checkout and webhook reconciliation.", state: "beta", audiences: ["admin"], icon: "payments" },
  { id: "customers", label: "Customers", href: "/admin#customers", description: "Verified accounts and order ownership.", state: "planned", audiences: ["admin"], icon: "customers" },
  { id: "staff", label: "Staff and roles", href: "/admin#staff", description: "Roles, access, and shift controls.", state: "planned", audiences: ["admin"], icon: "staff" },
  { id: "promotions", label: "Promotions", href: "/admin#promotions", description: "Campaigns, vouchers, and offers.", state: "planned", audiences: ["admin"], icon: "promotions" },
  { id: "support", label: "Support tickets", href: "/admin#support", description: "Customer cases and escalations.", state: "planned", audiences: ["admin"], icon: "support" },
  { id: "audit", label: "Audit log", href: "/admin#audit", description: "Staff actions and security evidence.", state: "beta", audiences: ["admin"], icon: "audit" },
  { id: "settings", label: "Settings", href: "/admin#settings", description: "Store, email, maintenance, and deployment controls.", state: "planned", audiences: ["admin"], icon: "settings" },
];

export const staffModules: WorkspaceModule[] = [
  { id: "queue", label: "Assigned work", href: "/staff#queue", description: "Orders and cases assigned to the shift.", state: "beta", audiences: ["staff", "admin"], icon: "queue" },
  { id: "orders", label: "Order operations", href: "/staff#orders", description: "Protected order review and fulfilment recovery.", state: "live", audiences: ["staff", "admin"], icon: "orders" },
  { id: "support", label: "Support inbox", href: "/staff#support", description: "Assigned customer conversations.", state: "planned", audiences: ["staff", "admin"], icon: "support" },
  { id: "escalations", label: "Escalations", href: "/staff#escalations", description: "Exceptions requiring admin review.", state: "planned", audiences: ["staff", "admin"], icon: "escalations" },
  { id: "activity", label: "Shift activity", href: "/staff#activity", description: "Completed work and response metrics.", state: "beta", audiences: ["staff", "admin"], icon: "activity" },
];

export function getAudienceForRole(role: AccountRole): ProductAudience {
  if (role === "ADMIN") return "admin";
  if (role === "STAFF") return "staff";
  return "customer";
}

export function getWorkspaceForRole(role: AccountRole): Workspace {
  if (role === "ADMIN") return "admin";
  if (role === "STAFF") return "staff";
  return "customer";
}

export function canAccessWorkspace(role: AccountRole, workspace: Workspace) {
  if (workspace === "customer") return true;
  if (workspace === "admin") return role === "ADMIN";
  return role === "STAFF" || role === "ADMIN";
}

export function getWorkspaceModules(workspace: Exclude<Workspace, "customer">) {
  return workspace === "admin" ? adminModules : staffModules;
}

export function getVisibleModules<T extends NavigationItem>(items: T[]) {
  return items.filter((item) => item.state !== "hidden");
}

export function isInteractiveModule(state: ProductModuleState) {
  return state === "live" || state === "beta";
}

export function getModuleStateLabel(state: ProductModuleState) {
  if (state === "live") return "Live";
  if (state === "beta") return "Beta";
  if (state === "planned") return "Planned";
  return "Hidden";
}

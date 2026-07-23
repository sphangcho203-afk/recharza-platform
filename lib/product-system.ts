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
  icon:
    | "home"
    | "orders"
    | "catalogue"
    | "pricing"
    | "supplier"
    | "payments"
    | "customers"
    | "staff"
    | "promotions"
    | "support"
    | "audit"
    | "settings"
    | "queue"
    | "escalations"
    | "activity";
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
  {
    id: "overview",
    label: "Overview",
    href: "/admin#overview",
    description: "Business health, module status, and priorities.",
    state: "live",
    audiences: ["admin"],
    icon: "home",
  },
  {
    id: "interfaces",
    label: "Website interfaces",
    href: "/admin#interfaces",
    description: "Open every customer, staff, admin, tracking, and regional interface.",
    state: "live",
    audiences: ["admin"],
    icon: "home",
  },
  {
    id: "orders",
    label: "Orders",
    href: "/admin#orders",
    description: "Review, recover, fulfil, cancel, and audit orders.",
    state: "live",
    audiences: ["admin"],
    icon: "orders",
    metricLabel: "Needs review",
  },
  {
    id: "catalogue",
    label: "Games and products",
    href: "/admin#catalogue",
    description: "Publish games, regional packages, product names, icons, and bundle media.",
    state: "live",
    audiences: ["admin"],
    icon: "catalogue",
  },
  {
    id: "pricing",
    label: "Pricing and FX",
    href: "/admin#pricing",
    description: "Supplier cost, margin, FX buffer, gateway fees, and rounding policy.",
    state: "live",
    audiences: ["admin"],
    icon: "pricing",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    href: "/admin#suppliers",
    description: "Supplier sync, health, category approval, and fulfilment gates.",
    state: "live",
    audiences: ["admin"],
    icon: "supplier",
  },
  {
    id: "payments",
    label: "Payments",
    href: "/admin#payments",
    description: "Payment sessions, signed webhooks, reconciliation cases, refund review, and disputes.",
    state: "live",
    audiences: ["admin"],
    icon: "payments",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/admin#customers",
    description: "Verified identities, access restrictions, order ownership, and session revocation.",
    state: "live",
    audiences: ["admin"],
    icon: "customers",
  },
  {
    id: "staff",
    label: "Staff and roles",
    href: "/admin#staff",
    description: "Role grants, scoped permissions, access review, and revocation.",
    state: "live",
    audiences: ["admin"],
    icon: "staff",
  },
  {
    id: "promotions",
    label: "Promotions",
    href: "/admin#promotions",
    description: "Campaigns, vouchers, regional offers, referrals, and rewards.",
    state: "planned",
    audiences: ["admin"],
    icon: "promotions",
  },
  {
    id: "support",
    label: "Support tickets",
    href: "/admin#support",
    description: "Customer cases, attachments, assignments, SLAs, and escalations.",
    state: "planned",
    audiences: ["admin"],
    icon: "support",
  },
  {
    id: "localization",
    label: "Regions and localization",
    href: "/admin#localization",
    description: "Countries, languages, currencies, billing rules, and regional storefronts.",
    state: "planned",
    audiences: ["admin"],
    icon: "settings",
  },
  {
    id: "content",
    label: "Content and storefront",
    href: "/admin#content",
    description: "Versioned homepage sections, announcements, game presentation, navigation, policy pages, and safe feature flags.",
    state: "live",
    audiences: ["admin"],
    icon: "catalogue",
  },
  {
    id: "media",
    label: "Media asset library",
    href: "/admin#media",
    description: "Upload, review, approve, classify, assign, export, and deliver store, game, brand, banner, and social imagery.",
    state: "live",
    audiences: ["admin"],
    icon: "catalogue",
  },
  {
    id: "domains",
    label: "Domains and routing",
    href: "/admin#domains",
    description: "Customer, account, staff, admin, identity, and status hostnames.",
    state: "planned",
    audiences: ["admin"],
    icon: "settings",
  },
  {
    id: "security",
    label: "Security",
    href: "/admin#security",
    description: "MFA, sessions, rate limits, suspicious access, secrets, and emergency locks.",
    state: "planned",
    audiences: ["admin"],
    icon: "audit",
  },
  {
    id: "integrations",
    label: "Integrations and webhooks",
    href: "/admin#integrations",
    description: "Supplier APIs, payment webhooks, email, analytics, and automation.",
    state: "planned",
    audiences: ["admin"],
    icon: "supplier",
  },
  {
    id: "audit",
    label: "Audit and logs",
    href: "/admin#audit",
    description: "Administrator actions, system events, exports, and security evidence.",
    state: "planned",
    audiences: ["admin"],
    icon: "audit",
  },
  {
    id: "settings",
    label: "Platform settings",
    href: "/admin#settings",
    description: "Operational feature flags, maintenance, deployment, backups, and global defaults.",
    state: "planned",
    audiences: ["admin"],
    icon: "settings",
  },
];

export const staffModules: WorkspaceModule[] = [
  {
    id: "queue",
    label: "Assigned work",
    href: "/staff#queue",
    description: "Orders and cases assigned to the shift.",
    state: "beta",
    audiences: ["staff", "admin"],
    icon: "queue",
  },
  {
    id: "orders",
    label: "Order operations",
    href: "/staff#orders",
    description: "Protected order review and fulfilment recovery.",
    state: "live",
    audiences: ["staff", "admin"],
    icon: "orders",
  },
  {
    id: "support",
    label: "Support inbox",
    href: "/staff#support",
    description: "Assigned customer conversations.",
    state: "planned",
    audiences: ["staff", "admin"],
    icon: "support",
  },
  {
    id: "escalations",
    label: "Escalations",
    href: "/staff#escalations",
    description: "Exceptions requiring admin review.",
    state: "planned",
    audiences: ["staff", "admin"],
    icon: "escalations",
  },
  {
    id: "activity",
    label: "Shift activity",
    href: "/staff#activity",
    description: "Completed work and response metrics.",
    state: "beta",
    audiences: ["staff", "admin"],
    icon: "activity",
  },
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

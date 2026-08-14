import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { games } from "@/lib/games";
import { getPrisma } from "@/lib/prisma";
import { customerNavigation } from "@/lib/product-system";

export type StorefrontAnnouncementTone = "info" | "success" | "warning";
export type StorefrontPolicyKey = "terms" | "privacy" | "refunds" | "cookies";

export type StorefrontStep = {
  number: string;
  title: string;
  description: string;
};

export type StorefrontBenefit = {
  title: string;
  description: string;
};

export type StorefrontPolicy = {
  title: string;
  visible: boolean;
  body: string;
};

export type StorefrontContent = {
  hero: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  announcement: {
    enabled: boolean;
    tone: StorefrontAnnouncementTone;
    title: string;
    message: string;
    linkLabel: string;
    href: string;
  };
  navigation: {
    visibleIds: string[];
    ctaEnabled: boolean;
    ctaLabel: string;
    ctaHref: string;
  };
  catalogue: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    description: string;
    showRegionalMarkets: boolean;
  };
  process: {
    enabled: boolean;
    eyebrow: string;
    steps: StorefrontStep[];
  };
  benefits: {
    enabled: boolean;
    items: StorefrontBenefit[];
  };
  footer: {
    enabled: boolean;
    copyright: string;
  };
  featuredGameSlugs: string[];
  hiddenGameSlugs: string[];
  privateFlags: {
    showDevelopmentBadges: boolean;
    showPricingSnapshots: boolean;
  };
  policies: Record<StorefrontPolicyKey, StorefrontPolicy>;
};

export type StorefrontVersionHistoryItem = {
  action: "draft-saved" | "published" | "draft-restored";
  revision: number;
  reason: string;
  actorEmail: string | null;
  createdAt: string;
};

export type AdminStorefrontSnapshot = {
  draft: StorefrontContent;
  published: StorefrontContent;
  draftRevision: number;
  publishedRevision: number;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  history: StorefrontVersionHistoryItem[];
  availableGames: Array<{
    slug: string;
    title: string;
    status: string;
    available: boolean;
  }>;
  navigationOptions: Array<{
    id: string;
    label: string;
    description: string;
    state: string;
  }>;
};

export const STOREFRONT_POLICY_KEYS: StorefrontPolicyKey[] = [
  "terms",
  "privacy",
  "refunds",
  "cookies",
];

const DEFAULT_STEPS: StorefrontStep[] = [
  {
    number: "01",
    title: "Pick a game market",
    description:
      "Choose the game and supplier fulfilment market connected to the player account.",
  },
  {
    number: "02",
    title: "Verify and bill",
    description:
      "Confirm player details, billing country, address, package, and display currency.",
  },
  {
    number: "03",
    title: "Track the order",
    description:
      "Follow the order from review through fulfilment on one private page.",
  },
];

const DEFAULT_BENEFITS: StorefrontBenefit[] = [
  {
    title: "Choose the correct game market",
    description:
      "Select the fulfilment catalogue linked to the Mobile Legends account before entering player details.",
  },
  {
    title: "Pay with a clear price snapshot",
    description:
      "Review the protected INR settlement amount together with a local-currency display estimate.",
  },
  {
    title: "Track every update",
    description:
      "Use private order tracking to follow review, payment, fulfilment, and completion.",
  },
];

export const DEFAULT_STOREFRONT_CONTENT: StorefrontContent = {
  hero: {
    enabled: true,
    eyebrow: "Regional Mobile Legends catalogue",
    title: "Game top-ups,",
    accent: "priced for the correct market.",
    description:
      "Lock the player-account market, browse approved regional packs, verify the destination, and review local-currency and billing details before creating the order.",
    primaryCtaLabel: "Choose an MLBB market",
    primaryCtaHref: "/games/mobile-legends",
    secondaryCtaLabel: "Browse all games",
    secondaryCtaHref: "#games",
  },
  announcement: {
    enabled: false,
    tone: "info",
    title: "Store update",
    message: "Recharza is under private development.",
    linkLabel: "Learn more",
    href: "#games",
  },
  navigation: {
    visibleIds: ["games", "track", "account", "support"],
    ctaEnabled: true,
    ctaLabel: "Top up MLBB",
    ctaHref: "/games/mobile-legends",
  },
  catalogue: {
    enabled: true,
    eyebrow: "Game store",
    title: "Find your game",
    description:
      "Mobile Legends has a broader supplier-market registry. A market becomes commercially usable only after its exact supplier category is reviewed, synchronized, and published.",
    showRegionalMarkets: true,
  },
  process: {
    enabled: true,
    eyebrow: "How it works",
    steps: DEFAULT_STEPS,
  },
  benefits: {
    enabled: true,
    items: DEFAULT_BENEFITS,
  },
  footer: {
    enabled: true,
    copyright:
      "© 2026 Recharza. Game names and artwork belong to their respective publishers.",
  },
  featuredGameSlugs: [
    "mobile-legends",
    "call-of-duty-mobile",
    "pubg-mobile",
  ],
  hiddenGameSlugs: [],
  privateFlags: {
    showDevelopmentBadges: true,
    showPricingSnapshots: true,
  },
  policies: {
    terms: {
      title: "Terms of service",
      visible: true,
      body: `Last updated: August 2026\n\nRecharza provides digital game top-up products and related account-verification services. By using the store, you agree to provide accurate player and billing information, use the service lawfully, and review each order before payment. Digital fulfilment may begin after payment confirmation, so please check the game, market, player ID, package, and amount before placing an order.\n\nYou must not misuse the store, attempt unauthorized access, submit fraudulent payment details, or request fulfilment for an account you do not control. Recharza may pause an order for verification, supplier review, payment reconciliation, or suspected abuse. Product availability and delivery timing can vary by game, region, supplier, and payment status.\n\nThese terms are a working storefront draft and should be reviewed by qualified counsel for the jurisdictions in which Recharza operates.`,
    },
    privacy: {
      title: "Privacy policy",
      visible: true,
      body: `Last updated: August 2026\n\nRecharza may process the information needed to verify a game account, price and fulfil an order, process payment, provide support, prevent abuse, and maintain security. Depending on the transaction, this may include your email address, player ID, server or zone details, billing information, order status, device or session evidence, and communications with support.\n\nWe use information only for legitimate store operations, security, compliance, analytics, and customer support. Payment details are handled by the applicable payment provider where available. We retain operational and audit records only for as long as reasonably needed for these purposes or as required by law. Contact Recharza through the support channel shown on the store if you need to request access, correction, or deletion subject to applicable requirements.\n\nThis policy is a working storefront draft and should be reviewed by qualified counsel for the jurisdictions in which Recharza operates.`,
    },
    refunds: {
      title: "Refund policy",
      visible: true,
      body: `Last updated: August 2026\n\nBecause game top-ups are digital products, refund eligibility depends on whether fulfilment has started, whether the game publisher or supplier accepted the top-up, and whether the payment was successfully captured. Contact support promptly with the order ID if a package was not delivered, was delivered to the wrong destination because of a Recharza error, or a payment was captured without a corresponding order.\n\nOrders that were correctly fulfilled to the player details confirmed at checkout may not be reversible. Duplicate charges, failed fulfilment, payment reversals, and supplier-side exceptions are reviewed against the order and payment records. Recharza may request transaction evidence before issuing an eligible refund or correction.\n\nThis policy is a working storefront draft and should be reviewed by qualified counsel and payment partners for the jurisdictions in which Recharza operates.`,
    },
    cookies: {
      title: "Cookie notice",
      visible: true,
      body: `Last updated: August 2026\n\nRecharza may use essential cookies or equivalent browser storage to keep the store, account, checkout, security, preferences, and session features working. Optional analytics or preference technologies should be enabled only where configured and permitted by applicable law.\n\nYou can manage browser storage through your browser settings. Blocking essential storage may prevent account access, checkout, verification, or order tracking from working correctly.\n\nThis notice is a working storefront draft and should be reviewed by qualified counsel for the jurisdictions in which Recharza operates.`,
    },
  },
};

const mainGameSlugs = new Set(
  games.filter((game) => game.kind === "game").map((game) => game.slug),
);
const navigationIds = new Set(customerNavigation.map((item) => item.id));
const announcementTones = new Set<StorefrontAnnouncementTone>([
  "info",
  "success",
  "warning",
]);
function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

function cleanMultiline(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function cleanBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function cleanInternalHref(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const href = value.trim().slice(0, 240);
  if (href.startsWith("#")) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return fallback;
}

function cleanKnownList(value: unknown, allowed: Set<string>, fallback: string[]) {
  if (!Array.isArray(value)) return [...fallback];
  return Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === "string" && allowed.has(item),
      ),
    ),
  );
}

function cleanSteps(value: unknown): StorefrontStep[] {
  const rows = asArray(value).slice(0, 4);
  if (!rows.length) return DEFAULT_STEPS.map((step) => ({ ...step }));

  return rows.map((row, index) => {
    const object = asObject(row);
    const fallback = DEFAULT_STEPS[index] ?? {
      number: String(index + 1).padStart(2, "0"),
      title: "Store step",
      description: "Explain this customer step.",
    };
    return {
      number: cleanText(object.number, fallback.number, 8),
      title: cleanText(object.title, fallback.title, 90),
      description: cleanText(
        object.description,
        fallback.description,
        280,
      ),
    };
  });
}

function cleanBenefits(value: unknown): StorefrontBenefit[] {
  const rows = asArray(value).slice(0, 6);
  if (!rows.length) return DEFAULT_BENEFITS.map((item) => ({ ...item }));

  return rows.map((row, index) => {
    const object = asObject(row);
    const fallback = DEFAULT_BENEFITS[index] ?? {
      title: "Customer benefit",
      description: "Explain the customer benefit clearly.",
    };
    return {
      title: cleanText(object.title, fallback.title, 100),
      description: cleanText(
        object.description,
        fallback.description,
        320,
      ),
    };
  });
}

function cleanPolicy(
  value: unknown,
  fallback: StorefrontPolicy,
): StorefrontPolicy {
  const object = asObject(value);

  return {
    title: cleanText(object.title, fallback.title, 120),
    visible: cleanBoolean(object.visible, fallback.visible),
    body: cleanMultiline(object.body, fallback.body, 40_000),
  };
}

export function sanitizeStorefrontContent(value: unknown): StorefrontContent {
  const root = asObject(value);
  const hero = asObject(root.hero);
  const announcement = asObject(root.announcement);
  const navigation = asObject(root.navigation);
  const catalogue = asObject(root.catalogue);
  const process = asObject(root.process);
  const benefits = asObject(root.benefits);
  const footer = asObject(root.footer);
  const privateFlags = asObject(root.privateFlags);
  const policies = asObject(root.policies);

  const featuredGameSlugs = cleanKnownList(
    root.featuredGameSlugs,
    mainGameSlugs,
    DEFAULT_STOREFRONT_CONTENT.featuredGameSlugs,
  ).slice(0, 3);

  return {
    hero: {
      enabled: cleanBoolean(
        hero.enabled,
        DEFAULT_STOREFRONT_CONTENT.hero.enabled,
      ),
      eyebrow: cleanText(
        hero.eyebrow,
        DEFAULT_STOREFRONT_CONTENT.hero.eyebrow,
        90,
      ),
      title: cleanText(
        hero.title,
        DEFAULT_STOREFRONT_CONTENT.hero.title,
        100,
      ),
      accent: cleanText(
        hero.accent,
        DEFAULT_STOREFRONT_CONTENT.hero.accent,
        120,
      ),
      description: cleanText(
        hero.description,
        DEFAULT_STOREFRONT_CONTENT.hero.description,
        420,
      ),
      primaryCtaLabel: cleanText(
        hero.primaryCtaLabel,
        DEFAULT_STOREFRONT_CONTENT.hero.primaryCtaLabel,
        60,
      ),
      primaryCtaHref: cleanInternalHref(
        hero.primaryCtaHref,
        DEFAULT_STOREFRONT_CONTENT.hero.primaryCtaHref,
      ),
      secondaryCtaLabel: cleanText(
        hero.secondaryCtaLabel,
        DEFAULT_STOREFRONT_CONTENT.hero.secondaryCtaLabel,
        60,
      ),
      secondaryCtaHref: cleanInternalHref(
        hero.secondaryCtaHref,
        DEFAULT_STOREFRONT_CONTENT.hero.secondaryCtaHref,
      ),
    },
    announcement: {
      enabled: cleanBoolean(
        announcement.enabled,
        DEFAULT_STOREFRONT_CONTENT.announcement.enabled,
      ),
      tone:
        typeof announcement.tone === "string" &&
        announcementTones.has(
          announcement.tone as StorefrontAnnouncementTone,
        )
          ? (announcement.tone as StorefrontAnnouncementTone)
          : DEFAULT_STOREFRONT_CONTENT.announcement.tone,
      title: cleanText(
        announcement.title,
        DEFAULT_STOREFRONT_CONTENT.announcement.title,
        90,
      ),
      message: cleanText(
        announcement.message,
        DEFAULT_STOREFRONT_CONTENT.announcement.message,
        280,
      ),
      linkLabel: cleanText(
        announcement.linkLabel,
        DEFAULT_STOREFRONT_CONTENT.announcement.linkLabel,
        50,
      ),
      href: cleanInternalHref(
        announcement.href,
        DEFAULT_STOREFRONT_CONTENT.announcement.href,
      ),
    },
    navigation: {
      visibleIds: cleanKnownList(
        navigation.visibleIds,
        navigationIds,
        DEFAULT_STOREFRONT_CONTENT.navigation.visibleIds,
      ),
      ctaEnabled: cleanBoolean(
        navigation.ctaEnabled,
        DEFAULT_STOREFRONT_CONTENT.navigation.ctaEnabled,
      ),
      ctaLabel: cleanText(
        navigation.ctaLabel,
        DEFAULT_STOREFRONT_CONTENT.navigation.ctaLabel,
        50,
      ),
      ctaHref: cleanInternalHref(
        navigation.ctaHref,
        DEFAULT_STOREFRONT_CONTENT.navigation.ctaHref,
      ),
    },
    catalogue: {
      enabled: cleanBoolean(
        catalogue.enabled,
        DEFAULT_STOREFRONT_CONTENT.catalogue.enabled,
      ),
      eyebrow: cleanText(
        catalogue.eyebrow,
        DEFAULT_STOREFRONT_CONTENT.catalogue.eyebrow,
        80,
      ),
      title: cleanText(
        catalogue.title,
        DEFAULT_STOREFRONT_CONTENT.catalogue.title,
        100,
      ),
      description: cleanText(
        catalogue.description,
        DEFAULT_STOREFRONT_CONTENT.catalogue.description,
        420,
      ),
      showRegionalMarkets: cleanBoolean(
        catalogue.showRegionalMarkets,
        DEFAULT_STOREFRONT_CONTENT.catalogue.showRegionalMarkets,
      ),
    },
    process: {
      enabled: cleanBoolean(
        process.enabled,
        DEFAULT_STOREFRONT_CONTENT.process.enabled,
      ),
      eyebrow: cleanText(
        process.eyebrow,
        DEFAULT_STOREFRONT_CONTENT.process.eyebrow,
        80,
      ),
      steps: cleanSteps(process.steps),
    },
    benefits: {
      enabled: cleanBoolean(
        benefits.enabled,
        DEFAULT_STOREFRONT_CONTENT.benefits.enabled,
      ),
      items: cleanBenefits(benefits.items),
    },
    footer: {
      enabled: cleanBoolean(
        footer.enabled,
        DEFAULT_STOREFRONT_CONTENT.footer.enabled,
      ),
      copyright: cleanText(
        footer.copyright,
        DEFAULT_STOREFRONT_CONTENT.footer.copyright,
        240,
      ),
    },
    featuredGameSlugs: featuredGameSlugs.length
      ? featuredGameSlugs
      : [...DEFAULT_STOREFRONT_CONTENT.featuredGameSlugs],
    hiddenGameSlugs: cleanKnownList(
      root.hiddenGameSlugs,
      mainGameSlugs,
      DEFAULT_STOREFRONT_CONTENT.hiddenGameSlugs,
    ),
    privateFlags: {
      showDevelopmentBadges: cleanBoolean(
        privateFlags.showDevelopmentBadges,
        DEFAULT_STOREFRONT_CONTENT.privateFlags.showDevelopmentBadges,
      ),
      showPricingSnapshots: cleanBoolean(
        privateFlags.showPricingSnapshots,
        DEFAULT_STOREFRONT_CONTENT.privateFlags.showPricingSnapshots,
      ),
    },
    policies: {
      terms: cleanPolicy(
        policies.terms,
        DEFAULT_STOREFRONT_CONTENT.policies.terms,
      ),
      privacy: cleanPolicy(
        policies.privacy,
        DEFAULT_STOREFRONT_CONTENT.policies.privacy,
      ),
      refunds: cleanPolicy(
        policies.refunds,
        DEFAULT_STOREFRONT_CONTENT.policies.refunds,
      ),
      cookies: cleanPolicy(
        policies.cookies,
        DEFAULT_STOREFRONT_CONTENT.policies.cookies,
      ),
    },
  };
}

function readRevision(metadata: unknown) {
  const value = asObject(metadata).revision;
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : 1;
}

function readReason(metadata: unknown) {
  return cleanText(asObject(metadata).reason, "No reason recorded.", 300);
}

function readContent(metadata: unknown) {
  return sanitizeStorefrontContent(asObject(metadata).content);
}

const STOREFRONT_ACTIONS = [
  "STOREFRONT_CONTENT_DRAFT_SAVED",
  "STOREFRONT_CONTENT_PUBLISHED",
  "STOREFRONT_CONTENT_DRAFT_RESTORED",
] as const;

export async function getPublishedStorefrontContent(): Promise<StorefrontContent> {
  try {
    const published = await getPrisma().adminAuditLog.findFirst({
      where: { action: "STOREFRONT_CONTENT_PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    });
    return published
      ? readContent(published.metadata)
      : sanitizeStorefrontContent(DEFAULT_STOREFRONT_CONTENT);
  } catch (error) {
    console.error("Published storefront content could not be loaded", error);
    return sanitizeStorefrontContent(DEFAULT_STOREFRONT_CONTENT);
  }
}

export async function getAdminStorefrontSnapshot(): Promise<AdminStorefrontSnapshot> {
  const logs = await getPrisma().adminAuditLog.findMany({
    where: { action: { in: [...STOREFRONT_ACTIONS] } },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      action: true,
      metadata: true,
      createdAt: true,
      actorCustomer: { select: { email: true } },
    },
  });

  const draftLog = logs.find(
    (log) =>
      log.action === "STOREFRONT_CONTENT_DRAFT_SAVED" ||
      log.action === "STOREFRONT_CONTENT_DRAFT_RESTORED",
  );
  const publishedLog = logs.find(
    (log) => log.action === "STOREFRONT_CONTENT_PUBLISHED",
  );

  const published = publishedLog
    ? readContent(publishedLog.metadata)
    : sanitizeStorefrontContent(DEFAULT_STOREFRONT_CONTENT);
  const draft = draftLog ? readContent(draftLog.metadata) : published;

  return {
    draft,
    published,
    draftRevision: draftLog ? readRevision(draftLog.metadata) : 1,
    publishedRevision: publishedLog ? readRevision(publishedLog.metadata) : 1,
    draftUpdatedAt: draftLog?.createdAt.toISOString() ?? null,
    publishedAt: publishedLog?.createdAt.toISOString() ?? null,
    history: logs.map((log) => ({
      action:
        log.action === "STOREFRONT_CONTENT_PUBLISHED"
          ? "published"
          : log.action === "STOREFRONT_CONTENT_DRAFT_RESTORED"
            ? "draft-restored"
            : "draft-saved",
      revision: readRevision(log.metadata),
      reason: readReason(log.metadata),
      actorEmail: log.actorCustomer?.email ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
    availableGames: games
      .filter((game) => game.kind === "game")
      .map((game) => ({
        slug: game.slug,
        title: game.title,
        status: game.status,
        available: game.available === true,
      })),
    navigationOptions: customerNavigation.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      state: item.state,
    })),
  };
}

export async function writeStorefrontVersion(input: {
  action:
    | "STOREFRONT_CONTENT_DRAFT_SAVED"
    | "STOREFRONT_CONTENT_PUBLISHED"
    | "STOREFRONT_CONTENT_DRAFT_RESTORED";
  content: StorefrontContent;
  revision: number;
  reason: string;
  actorCustomerId: string;
  actorFingerprint: string;
}) {
  return getPrisma().adminAuditLog.create({
    data: {
      action: input.action,
      actorCustomerId: input.actorCustomerId,
      actorFingerprint: input.actorFingerprint,
      metadata: {
        revision: input.revision,
        reason: input.reason,
        content: input.content,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export function getPublishedPolicy(
  content: StorefrontContent,
  key: StorefrontPolicyKey,
) {
  const policy = content.policies[key];
  return policy.visible && policy.body.trim() ? policy : null;
}

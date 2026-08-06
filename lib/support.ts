export const SUPPORT_CATEGORIES = [
  {
    value: "ORDER_NOT_RECEIVED",
    label: "Top-up not received",
    description: "The order completed or was paid, but the product has not reached the account.",
  },
  {
    value: "ORDER_PROCESSING",
    label: "Order still processing",
    description: "The order has remained pending or fulfilling longer than expected.",
  },
  {
    value: "PAYMENT_FAILED",
    label: "Payment failed",
    description: "Checkout failed, timed out, or would not open correctly.",
  },
  {
    value: "PAYMENT_DEDUCTED",
    label: "Money deducted",
    description: "Payment was charged but the order status did not update.",
  },
  {
    value: "WRONG_PLAYER",
    label: "Player ID or server issue",
    description: "The player destination, zone, server, or account details need review.",
  },
  {
    value: "WRONG_PACKAGE",
    label: "Wrong package or amount",
    description: "The selected product, quantity, or delivered amount appears incorrect.",
  },
  {
    value: "REGION_ISSUE",
    label: "Region or market issue",
    description: "The account market, currency, or regional catalogue does not match.",
  },
  {
    value: "BONUS_PROMO",
    label: "Bonus or promotion issue",
    description: "A published bonus, pass, or promotion was not applied as expected.",
  },
  {
    value: "REFUND_CANCELLATION",
    label: "Refund or cancellation",
    description: "Request a review under the published refund and cancellation policy.",
  },
  {
    value: "ACCOUNT_ACCESS",
    label: "Account or sign-in problem",
    description: "Help with verification, login, password recovery, or account ownership.",
  },
  {
    value: "SUSPICIOUS_ACTIVITY",
    label: "Suspicious activity",
    description: "Report impersonation, an unknown order, phishing, or account misuse.",
  },
  {
    value: "OTHER",
    label: "Something else",
    description: "Describe a problem that is not listed above.",
  },
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]["value"];
export type SupportReplyChannel = "TELEGRAM" | "EMAIL";

export type SupportTicketInput = {
  category: SupportCategory;
  subject: string;
  description: string;
  orderId: string | null;
  game: string | null;
  replyChannel: SupportReplyChannel;
  name: string | null;
  email: string | null;
  telegramUsername: string | null;
};

type ValidationResult =
  | { ok: true; data: SupportTicketInput }
  | { ok: false; field: string; message: string };

const CATEGORY_VALUES = new Set<string>(
  SUPPORT_CATEGORIES.map((category) => category.value),
);

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanMultiline(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value: unknown) {
  const email = cleanText(value, 254).toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeTelegramUsername(value: unknown) {
  const username = cleanText(value, 33).replace(/^@/, "");
  if (!username) return null;
  return /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : null;
}

function normalizeOrderId(value: unknown) {
  const orderId = cleanText(value, 32).toUpperCase();
  if (!orderId) return null;
  return /^RZ-[A-Z0-9]{6,24}$/.test(orderId) ? orderId : null;
}

export function supportCategoryLabel(category: SupportCategory) {
  return (
    SUPPORT_CATEGORIES.find((item) => item.value === category)?.label ??
    "Support request"
  );
}

export function validateSupportTicketInput(value: unknown): ValidationResult {
  const data = asObject(value);
  if (!data) {
    return { ok: false, field: "form", message: "Support details are required." };
  }

  const category = cleanText(data.category, 40);
  if (!CATEGORY_VALUES.has(category)) {
    return { ok: false, field: "category", message: "Choose a valid support category." };
  }

  const subject = cleanText(data.subject, 120);
  if (subject.length < 5) {
    return { ok: false, field: "subject", message: "Add a short issue title." };
  }

  const description = cleanMultiline(data.description, 2_000);
  if (description.length < 20) {
    return {
      ok: false,
      field: "description",
      message: "Describe what happened in at least 20 characters.",
    };
  }

  const rawOrderId = cleanText(data.orderId, 32);
  const orderId = normalizeOrderId(data.orderId);
  if (rawOrderId && !orderId) {
    return {
      ok: false,
      field: "orderId",
      message: "Use a valid Recharza order ID such as RZ-XXXXXXXXXXXX.",
    };
  }

  const replyChannel = cleanText(data.replyChannel, 16).toUpperCase();
  if (replyChannel !== "TELEGRAM" && replyChannel !== "EMAIL") {
    return {
      ok: false,
      field: "replyChannel",
      message: "Choose Telegram or email for the reply.",
    };
  }

  const rawEmail = cleanText(data.email, 254);
  const email = normalizeEmail(data.email);
  if (rawEmail && !email) {
    return { ok: false, field: "email", message: "Enter a valid email address." };
  }
  if (replyChannel === "EMAIL" && !email) {
    return {
      ok: false,
      field: "email",
      message: "An email address is required for email replies.",
    };
  }

  const rawTelegram = cleanText(data.telegramUsername, 33);
  const telegramUsername = normalizeTelegramUsername(data.telegramUsername);
  if (rawTelegram && !telegramUsername) {
    return {
      ok: false,
      field: "telegramUsername",
      message: "Enter a valid Telegram username without spaces.",
    };
  }

  return {
    ok: true,
    data: {
      category: category as SupportCategory,
      subject,
      description,
      orderId,
      game: cleanText(data.game, 80) || null,
      replyChannel: replyChannel as SupportReplyChannel,
      name: cleanText(data.name, 80) || null,
      email,
      telegramUsername,
    },
  };
}

import "server-only";

import { createHash } from "node:crypto";

import { sendSystemEmail } from "@/lib/mail-delivery";
import { getPrisma } from "@/lib/prisma";

const BRAND = "Recharza";
const SUPPORT_EMAIL = "recherzatopup@gmail.com";

export type LifecycleEmailTone = "info" | "success" | "security" | "warning" | "danger";

type LifecycleEmailDetail = {
  label: string;
  value: string;
};

type LifecycleEmailInput = {
  to: string;
  subject: string;
  eyebrow: string;
  title: string;
  message: string;
  tone?: LifecycleEmailTone;
  preheader?: string;
  details?: LifecycleEmailDetail[];
  action?: { label: string; url: string };
  footer?: string;
  idempotencyKey: string;
};

const tones: Record<LifecycleEmailTone, { accent: string; soft: string; border: string; label: string }> = {
  info: { accent: "#67e8f9", soft: "#0d2430", border: "#164e63", label: "System update" },
  success: { accent: "#6ee7b7", soft: "#0b211b", border: "#14532d", label: "Confirmed" },
  security: { accent: "#c4b5fd", soft: "#1b1530", border: "#4c1d95", label: "Security" },
  warning: { accent: "#fcd34d", soft: "#2a2110", border: "#713f12", label: "Attention" },
  danger: { accent: "#fda4af", soft: "#2a1318", border: "#881337", label: "Action required" },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}

function logoUrl() {
  return `${appUrl()}/assets/brand/recharza-line-electric-mark.png`;
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function renderHtml(input: LifecycleEmailInput) {
  const tone = tones[input.tone ?? "info"];
  const preheader = escapeHtml(input.preheader ?? input.message);
  const details = (input.details ?? [])
    .map(
      (item) => `<tr>
        <td style="padding:14px 15px;border-bottom:1px solid #252536;color:#7f879b;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(item.label)}</td>
        <td style="padding:14px 15px;border-bottom:1px solid #252536;color:#f8fafc;font-size:13px;font-weight:800;text-align:right;">${escapeHtml(item.value)}</td>
      </tr>`,
    )
    .join("");

  const action = input.action
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td align="center">
        <a href="${escapeHtml(input.action.url)}" style="display:block;background:#f8fafc;color:#08080d;text-decoration:none;border-radius:12px;padding:15px 18px;font-size:13px;font-weight:900;letter-spacing:.01em;">${escapeHtml(input.action.label)}</a>
      </td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#06060a;color:#f8fafc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#06060a;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border-collapse:separate;border-spacing:0;background:#0f0f17;border:1px solid #282838;border-radius:22px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.45);">
        <tr>
          <td style="padding:20px 22px;background:#09090f;border-bottom:1px solid #242433;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
              <td valign="middle">
                <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                  <td width="40" height="40" align="center" valign="middle" style="width:40px;height:40px;">
                    <img src="${logoUrl()}" width="38" height="38" alt="Recharza" style="display:block;width:38px;height:38px;object-fit:contain;border:0;">
                  </td>
                  <td style="padding-left:11px;">
                    <div style="color:#ffffff;font-size:17px;font-weight:950;letter-spacing:-.04em;text-transform:uppercase;">RECHARZA</div>
                    <div style="margin-top:2px;color:#8b5cf6;font-size:9px;font-weight:850;letter-spacing:.19em;text-transform:uppercase;">Play · Pay · Delivered</div>
                  </td>
                </tr></table>
              </td>
              <td align="right" valign="middle" style="color:#5f6677;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;">Transactional mail</td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td style="padding:30px 22px 28px;background:#151522;border-bottom:1px solid #2a2a3d;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="padding:7px 10px;border-radius:999px;background:${tone.soft};border:1px solid ${tone.border};color:${tone.accent};font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;">${escapeHtml(input.eyebrow || tone.label)}</td>
            </tr></table>
            <h1 style="margin:15px 0 0;color:#ffffff;font-size:28px;line-height:1.12;letter-spacing:-.04em;font-weight:900;">${escapeHtml(input.title)}</h1>
            <p style="margin:13px 0 0;color:#b8c0cf;font-size:14px;line-height:1.75;">${escapeHtml(input.message)}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:22px;">
            ${details ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border:1px solid #28283a;border-radius:14px;overflow:hidden;background:#0a0a10;">${details}</table>` : ""}
            ${action}

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;background:#0b1715;border:1px solid #1f3a35;border-radius:12px;">
              <tr><td style="padding:14px;color:#91cfc1;font-size:11px;line-height:1.7;">
                <strong style="display:block;margin-bottom:3px;color:#d1fae5;font-size:11px;">Security reminder</strong>
                Recharza will never ask for your password, OTP, UPI PIN, card PIN, or remote-device access by email, chat, or call.
              </td></tr>
            </table>

            <p style="margin:20px 0 0;color:#697184;font-size:11px;line-height:1.7;">${escapeHtml(input.footer ?? "This notification was generated automatically from activity on your Recharza account or order.")}</p>
            <p style="margin:8px 0 0;color:#697184;font-size:11px;line-height:1.7;">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#c4b5fd;text-decoration:none;font-weight:800;">${SUPPORT_EMAIL}</a></p>
          </td>
        </tr>

        <tr><td style="padding:14px 22px;background:#09090f;border-top:1px solid #242433;text-align:center;color:#4e5566;font-size:9px;line-height:1.6;">
          © ${new Date().getUTCFullYear()} ${BRAND}. Automated transactional notification. Game names and trademarks belong to their respective owners.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderText(input: LifecycleEmailInput) {
  return [
    `RECHARZA — ${input.eyebrow}`,
    input.title,
    "",
    input.message,
    ...(input.details ?? []).flatMap((item) => [`${item.label}: ${item.value}`]),
    input.action ? "" : null,
    input.action ? `${input.action.label}: ${input.action.url}` : null,
    "",
    input.footer ?? "This notification was generated automatically from activity on your Recharza account or order.",
    `Support: ${SUPPORT_EMAIL}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

async function sendLifecycleEmail(input: LifecycleEmailInput) {
  return sendSystemEmail({
    to: input.to,
    subject: input.subject,
    html: renderHtml(input),
    text: renderText(input),
    idempotencyKey: input.idempotencyKey,
  });
}

export function getRequestDeviceFingerprint(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim() || "unknown";
  return createHash("sha256").update(userAgent).digest("hex").slice(0, 32);
}

export function describeRequestDevice(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  const platform = /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iOS / iPadOS"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Macintosh|Mac OS X/i.test(ua)
          ? "macOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown device";
  const browser = /Edg\//i.test(ua)
    ? "Microsoft Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome / Chromium"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : /Safari\//i.test(ua)
            ? "Safari"
            : "Web browser";
  return `${browser} on ${platform}`;
}

export async function isKnownCustomerDevice(customerId: string, request: Request) {
  const fingerprint = getRequestDeviceFingerprint(request);
  const existing = await getPrisma().authSession.findFirst({
    where: { customerId, userAgentHash: fingerprint },
    select: { id: true },
  });
  return Boolean(existing);
}

export function sendAccountSignInEmail(input: {
  customerId: string;
  email: string;
  displayName?: string | null;
  request: Request;
  newDevice: boolean;
  signedInAt: Date;
  sessionId: string;
  method: "password" | "magic-link" | "google";
}) {
  const device = describeRequestDevice(input.request);
  return sendLifecycleEmail({
    to: input.email,
    subject: input.newDevice ? "New device signed in to Recharza" : "Recharza sign-in successful",
    eyebrow: input.newDevice ? "New device sign-in" : "Account sign-in",
    title: input.newDevice ? "A new device accessed your account." : "You’re signed in.",
    message: input.newDevice
      ? "We noticed a successful sign-in from a device profile we have not seen on this account before."
      : "A successful sign-in to your Recharza account was recorded.",
    tone: "security",
    details: [
      { label: "Account", value: input.displayName || input.email },
      { label: "Device", value: device },
      { label: "Method", value: input.method === "magic-link" ? "Email link" : input.method === "google" ? "Google" : "Password" },
      { label: "Time", value: formatTimestamp(input.signedInAt) },
    ],
    action: { label: "Review my account", url: `${appUrl()}/account` },
    footer: input.newDevice
      ? "If this was not you, change your password and contact Recharza support immediately."
      : "If you do not recognize this activity, secure your account immediately.",
    idempotencyKey: `account-signin-${input.customerId}-${input.sessionId}`,
  });
}

export function sendAccountSignOutEmail(input: {
  customerId: string;
  email: string;
  displayName?: string | null;
  request: Request;
  signedOutAt: Date;
  sessionId: string;
}) {
  return sendLifecycleEmail({
    to: input.email,
    subject: "You signed out of Recharza",
    eyebrow: "Session ended",
    title: "Signed out successfully.",
    message: "The active Recharza session was revoked and its browser cookie was cleared.",
    tone: "security",
    details: [
      { label: "Account", value: input.displayName || input.email },
      { label: "Device", value: describeRequestDevice(input.request) },
      { label: "Time", value: formatTimestamp(input.signedOutAt) },
    ],
    action: { label: "Sign in again", url: `${appUrl()}/account` },
    footer: "If you did not sign out this session, review your account security before signing in again.",
    idempotencyKey: `account-signout-${input.customerId}-${input.sessionId}`,
  });
}

function gameLabel(gameSlug: string) {
  const known: Record<string, string> = {
    "mobile-legends": "Mobile Legends",
    "free-fire": "Free Fire MAX",
    "pubg-mobile": "PUBG Mobile",
    valorant: "VALORANT",
    "genshin-impact": "Genshin Impact",
    bgmi: "BGMI",
    "call-of-duty-mobile": "Call of Duty: Mobile",
  };
  return known[gameSlug] ?? gameSlug.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatInr(amountInPaise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amountInPaise / 100);
}

function orderPlayerLabel(input: { playerId: string; zoneId?: string | null; nickname?: string | null }) {
  if (input.nickname) return input.zoneId ? `${input.nickname} · ${input.playerId} (${input.zoneId})` : `${input.nickname} · ${input.playerId}`;
  return input.zoneId ? `${input.playerId} (${input.zoneId})` : input.playerId;
}

type OrderLifecycleInput = {
  databaseOrderId: string;
  publicOrderId: string;
  customerId: string;
  email: string;
  gameSlug: string;
  packageName: string;
  amountInPaise: number;
  playerId: string;
  zoneId?: string | null;
  nickname?: string | null;
  occurredAt: Date;
};

function orderDetails(input: OrderLifecycleInput) {
  return [
    { label: "Order", value: input.publicOrderId },
    { label: "Game", value: gameLabel(input.gameSlug) },
    { label: "Package", value: input.packageName },
    { label: "Player", value: orderPlayerLabel(input) },
    { label: "Amount", value: formatInr(input.amountInPaise) },
  ];
}

export function sendOrderCreatedLifecycleEmail(input: OrderLifecycleInput) {
  return sendLifecycleEmail({
    to: input.email,
    subject: `Order ${input.publicOrderId} received`,
    eyebrow: "Order received",
    title: "Your top-up order is locked in.",
    message: "Recharza saved your order details and verified the server-side package price. Payment or fulfilment will continue from this order record.",
    tone: "info",
    details: [...orderDetails(input), { label: "Created", value: formatTimestamp(input.occurredAt) }],
    action: { label: "Track this order", url: `${appUrl()}/orders/${encodeURIComponent(input.publicOrderId)}` },
    idempotencyKey: `order-created-${input.databaseOrderId}`,
  });
}

export function sendPaymentConfirmedLifecycleEmail(input: OrderLifecycleInput) {
  return sendLifecycleEmail({
    to: input.email,
    subject: `Payment confirmed for ${input.publicOrderId}`,
    eyebrow: "Payment confirmed",
    title: "Payment received securely.",
    message: "The payment provider confirmed this order. Recharza can now move the top-up into fulfilment.",
    tone: "success",
    details: [...orderDetails(input), { label: "Confirmed", value: formatTimestamp(input.occurredAt) }],
    action: { label: "View fulfilment status", url: `${appUrl()}/orders/${encodeURIComponent(input.publicOrderId)}` },
    idempotencyKey: `payment-confirmed-${input.databaseOrderId}`,
  });
}

export function sendTopupProcessingLifecycleEmail(input: OrderLifecycleInput) {
  return sendLifecycleEmail({
    to: input.email,
    subject: `Top-up processing · ${input.publicOrderId}`,
    eyebrow: "Top-up processing",
    title: "Your top-up is being delivered.",
    message: "Payment is confirmed and the order has entered fulfilment. Keep the same player account details active until delivery finishes.",
    tone: "info",
    details: [...orderDetails(input), { label: "Started", value: formatTimestamp(input.occurredAt) }],
    action: { label: "Follow live order status", url: `${appUrl()}/orders/${encodeURIComponent(input.publicOrderId)}` },
    idempotencyKey: `topup-processing-${input.databaseOrderId}`,
  });
}

export function sendOrderCancelledLifecycleEmail(input: OrderLifecycleInput & { reason?: string }) {
  return sendLifecycleEmail({
    to: input.email,
    subject: `Order ${input.publicOrderId} was cancelled`,
    eyebrow: "Order cancelled",
    title: "This order will not continue.",
    message: "The order was cancelled before successful completion. Review the order page for the latest payment or refund state.",
    tone: "warning",
    details: [
      ...orderDetails(input),
      ...(input.reason ? [{ label: "Reason", value: input.reason }] : []),
      { label: "Cancelled", value: formatTimestamp(input.occurredAt) },
    ],
    action: { label: "Review order", url: `${appUrl()}/orders/${encodeURIComponent(input.publicOrderId)}` },
    idempotencyKey: `order-cancelled-${input.databaseOrderId}`,
  });
}

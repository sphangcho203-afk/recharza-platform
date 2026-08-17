import type { EmailMessageKind } from "@/generated/prisma/client";
import { sendSystemEmail } from "@/lib/mail-delivery";
import { getPrisma } from "@/lib/prisma";

const BRAND_NAME = "Recharza";
const SUPPORT_EMAIL = "recherzatopup@gmail.com";
const BRAND_TAGLINE = "PLAY · PAY · DELIVERED";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function logoUrl() {
  return `${appUrl()}/assets/brand/recharza-line-electric-mark.png`;
}

type EmailDetail = {
  label: string;
  value: string;
};

type TransactionalEmailInput = {
  kind: EmailMessageKind;
  to: string;
  subject: string;
  eyebrow: string;
  title: string;
  message: string;
  details?: EmailDetail[];
  action?: { label: string; url: string };
  footer?: string;
  customerId?: string;
  orderId?: string;
};

type Accent = {
  primary: string;
  soft: string;
  border: string;
};

const ACCENTS: Record<EmailMessageKind, Accent> = {
  ACCOUNT_CREATED: {
    primary: "#67e8f9",
    soft: "#0c2029",
    border: "#155e75",
  },
  PASSWORD_RESET: {
    primary: "#fcd34d",
    soft: "#2a2110",
    border: "#713f12",
  },
  PASSWORD_CHANGED: {
    primary: "#c4b5fd",
    soft: "#1a1530",
    border: "#4c1d95",
  },
  ORDER_COMPLETED: {
    primary: "#6ee7b7",
    soft: "#0b211b",
    border: "#14532d",
  },
  ORDER_FAILED: {
    primary: "#fda4af",
    soft: "#2a1318",
    border: "#881337",
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function renderEmail(input: TransactionalEmailInput) {
  const accent = ACCENTS[input.kind];
  const details = (input.details ?? [])
    .map((item, index, items) => {
      const isEmphasis = /^(amount|total)$/i.test(item.label);
      const divider = index < items.length - 1 ? "border-bottom:1px solid #272938;" : "";
      return `<tr>
        <td style="padding:13px 16px;color:#8d93a6;font-size:10px;font-weight:700;letter-spacing:.105em;text-transform:uppercase;${divider}">${escapeHtml(item.label)}</td>
        <td style="padding:13px 16px;color:${isEmphasis ? accent.primary : "#f4f6fb"};font-size:${isEmphasis ? "16px" : "13px"};font-weight:${isEmphasis ? "800" : "650"};letter-spacing:${isEmphasis ? "-.015em" : "0"};text-align:right;${divider}">${escapeHtml(item.value)}</td>
      </tr>`;
    })
    .join("");

  const action = input.action
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td align="left">
        <a href="${escapeHtml(input.action.url)}" style="display:inline-block;padding:13px 20px;background:#8b5cf6;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px;font-size:13px;font-weight:750;letter-spacing:.005em;box-shadow:0 6px 18px rgba(139,92,246,.24);">${escapeHtml(input.action.label)} &nbsp;→</a>
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
  <style>
    @media screen and (max-width: 640px) {
      .email-shell { padding: 16px 8px !important; }
      .email-card { border-radius: 12px !important; }
      .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .email-title { font-size: 24px !important; }
      .email-meta { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#08090d;color:#f4f6fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.message)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="width:100%;background:#08090d;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="email-card" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:#11131a;border:1px solid #292c38;border-radius:14px;overflow:hidden;box-shadow:0 14px 36px rgba(0,0,0,.32);">
        <tr>
          <td class="email-pad" style="padding:20px 28px 18px;background:#0d0f14;border-bottom:1px solid #292c38;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
              <td valign="middle">
                <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                  <td width="34" height="34" align="center" valign="middle" style="width:34px;height:34px;">
                    <img src="${escapeHtml(logoUrl())}" width="34" height="34" alt="R" style="display:block;width:34px;height:34px;object-fit:contain;border:0;">
                  </td>
                  <td style="padding-left:10px;">
                    <div style="color:#f4f6fb;font-size:16px;font-weight:800;letter-spacing:.015em;">RECHARZA</div>
                    <div style="margin-top:4px;color:#9097aa;font-size:8px;font-weight:700;letter-spacing:.16em;">${BRAND_TAGLINE}</div>
                  </td>
                </tr></table>
              </td>
              <td class="email-meta" align="right" valign="middle" style="color:#747b8d;font-size:9px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;">TRANSACTIONAL EMAIL</td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td class="email-pad" style="padding:30px 28px 28px;background:linear-gradient(145deg,#171a25 0%,#1b1930 100%);border-bottom:1px solid #292c38;">
            <div style="display:inline-block;padding:6px 9px;border:1px solid ${accent.border};border-radius:999px;background:${accent.soft};color:${accent.primary};font-size:9px;font-weight:750;letter-spacing:.13em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</div>
            <h1 class="email-title" style="margin:13px 0 0;color:#f7f8fb;font-size:28px;line-height:1.16;letter-spacing:-.028em;font-weight:750;">${escapeHtml(input.title)}</h1>
            <p style="margin:15px 0 0;color:#b8becb;font-size:15px;line-height:1.7;letter-spacing:-.005em;">${escapeHtml(input.message)}</p>
          </td>
        </tr>

        <tr>
          <td class="email-pad" style="padding:24px 28px 28px;background:#11131a;background:linear-gradient(180deg,#11131a 0%,#10121a 100%);">
            ${details ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border:1px solid #2f3342;border-radius:8px;overflow:hidden;background:#0b0d13;">${details}</table>` : ""}
            ${action}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-top:1px solid #292c38;">
              <tr><td style="padding:18px 0 0;color:#9dbfae;font-size:11px;line-height:1.7;">
                <strong style="display:block;margin-bottom:4px;color:#d1e7da;font-size:11px;font-weight:750;">Security note</strong>
                Recharza will never ask for your password, OTP, UPI PIN, card PIN, or remote-device access by email, chat, or call.
              </td></tr>
            </table>
            <p style="margin:20px 0 0;color:#737b8d;font-size:12px;line-height:1.7;">${escapeHtml(input.footer ?? "This is an automated notification from your Recharza account or order.")}</p>
            <p style="margin:8px 0 0;color:#737b8d;font-size:12px;line-height:1.7;">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#b8a5ff;text-decoration:none;font-weight:700;">${SUPPORT_EMAIL}</a></p>
          </td>
        </tr>

        <tr><td class="email-pad" style="padding:15px 28px;background:#0d0f14;border-top:1px solid #292c38;color:#666e80;font-size:9px;line-height:1.6;">
          © ${new Date().getUTCFullYear()} ${BRAND_NAME} · Automated transactional notification<br>Game names and trademarks belong to their respective owners.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderTextEmail(input: TransactionalEmailInput) {
  const detailLines = (input.details ?? []).map((item) => `${item.label}: ${item.value}`);
  return [
    `RECHARZA — ${input.eyebrow}`,
    input.title,
    "",
    input.message,
    detailLines.length ? "" : null,
    ...detailLines,
    input.action ? "" : null,
    input.action ? `${input.action.label}: ${input.action.url}` : null,
    "",
    input.footer ?? "This notification was generated automatically from activity on your Recharza account or order.",
    `Support: ${SUPPORT_EMAIL}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const prisma = getPrisma();
  const delivery = await prisma.emailDelivery.create({
    data: {
      kind: input.kind,
      recipient: input.to.toLowerCase(),
      subject: input.subject,
      customerId: input.customerId,
      orderId: input.orderId,
      payload: {
        eyebrow: input.eyebrow,
        title: input.title,
        details: input.details ?? [],
        actionLabel: input.action?.label ?? null,
      },
    },
  });

  try {
    const result = await sendSystemEmail({
      to: input.to,
      subject: input.subject,
      html: renderEmail(input),
      text: renderTextEmail(input),
      idempotencyKey: `transactional-${delivery.id}`,
    });

    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT",
        attempts: 1,
        providerMessageId: result.messageId,
        sentAt: new Date(),
        payload: {
          eyebrow: input.eyebrow,
          title: input.title,
          details: input.details ?? [],
          actionLabel: input.action?.label ?? null,
          provider: result.provider,
        },
      },
    });

    return {
      ok: true as const,
      deliveryId: delivery.id,
      provider: result.provider,
      providerMessageId: result.messageId,
    };
  } catch (error) {
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        attempts: 1,
        errorMessage:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Unknown email delivery failure.",
      },
    });
    return { ok: false as const, deliveryId: delivery.id };
  }
}

export function sendAccountCreatedEmail(input: {
  customerId: string;
  email: string;
  displayName: string;
  username: string;
  createdAt: Date;
}) {
  return sendTransactionalEmail({
    kind: "ACCOUNT_CREATED",
    to: input.email,
    subject: "Welcome to Recharza — your account is ready",
    eyebrow: "Account created",
    title: `Welcome, ${input.displayName}.`,
    message:
      "Your Recharza account is active. Orders, saved player details, billing information, account security, and support now live in one protected workspace.",
    details: [
      { label: "Username", value: input.username },
      { label: "Email", value: input.email },
      { label: "Created", value: formatTimestamp(input.createdAt) },
    ],
    action: {
      label: "Open my Recharza account",
      url: `${appUrl()}/account`,
    },
    customerId: input.customerId,
  });
}

export function sendPasswordResetEmail(input: {
  customerId: string;
  email: string;
  resetUrl: string;
  requestedAt: Date;
  expiresAt: Date;
}) {
  return sendTransactionalEmail({
    kind: "PASSWORD_RESET",
    to: input.email,
    subject: "Reset your Recharza password",
    eyebrow: "Password reset requested",
    title: "Create a new password.",
    message:
      "A password reset was requested for your Recharza account. The secure link is single-use and expires after 20 minutes.",
    details: [
      { label: "Requested", value: formatTimestamp(input.requestedAt) },
      { label: "Expires", value: formatTimestamp(input.expiresAt) },
    ],
    action: { label: "Reset password securely", url: input.resetUrl },
    footer:
      "If you did not request this change, do not open the reset link. Your current password remains active.",
    customerId: input.customerId,
  });
}

export function sendPasswordChangedEmail(input: {
  customerId: string;
  email: string;
  changedAt: Date;
}) {
  return sendTransactionalEmail({
    kind: "PASSWORD_CHANGED",
    to: input.email,
    subject: "Your Recharza password was changed",
    eyebrow: "Security update",
    title: "Password changed successfully.",
    message:
      "Your account password was changed and existing account sessions were revoked. Sign in again with the new password.",
    details: [{ label: "Changed", value: formatTimestamp(input.changedAt) }],
    action: {
      label: "Sign in to Recharza",
      url: `${appUrl()}/account`,
    },
    footer:
      "If you did not make this change, contact Recharza support immediately and secure the email account linked to Recharza.",
    customerId: input.customerId,
  });
}

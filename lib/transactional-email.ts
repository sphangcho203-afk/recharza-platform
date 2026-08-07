import type { EmailMessageKind } from "@/generated/prisma/client";
import { sendSystemEmail } from "@/lib/mail-delivery";
import { getPrisma } from "@/lib/prisma";

const BRAND_NAME = "Recharza";
const SUPPORT_EMAIL = "recherzatopup@gmail.com";

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

function renderEmail(input: TransactionalEmailInput) {
  const accent = ACCENTS[input.kind];
  const details = (input.details ?? [])
    .map(
      (item) => `<tr>
        <td style="padding:14px 15px;color:#7f879b;font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #252536;">${escapeHtml(item.label)}</td>
        <td style="padding:14px 15px;color:#f8fafc;font-size:13px;font-weight:850;text-align:right;border-bottom:1px solid #252536;">${escapeHtml(item.value)}</td>
      </tr>`,
    )
    .join("");

  const action = input.action
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td align="center">
        <a href="${escapeHtml(input.action.url)}" style="display:block;padding:15px 18px;background:#f8fafc;color:#08080d;text-decoration:none;text-align:center;border-radius:12px;font-size:13px;font-weight:950;letter-spacing:.01em;">${escapeHtml(input.action.label)}</a>
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.message)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#06060a;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border-collapse:separate;border-spacing:0;background:#0f0f17;border:1px solid #282838;border-radius:22px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.45);">
        <tr>
          <td style="padding:20px 22px;background:#09090f;border-bottom:1px solid #242433;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
              <td valign="middle">
                <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                  <td width="40" height="40" align="center" valign="middle" style="width:40px;height:40px;background:#7c3aed;border-radius:12px;color:#ffffff;font-size:20px;font-style:italic;font-weight:950;">R</td>
                  <td style="padding-left:11px;">
                    <div style="color:#ffffff;font-size:17px;font-weight:950;letter-spacing:-.04em;text-transform:uppercase;">RECHARZA</div>
                    <div style="margin-top:2px;color:#8b5cf6;font-size:9px;font-weight:850;letter-spacing:.19em;text-transform:uppercase;">Play · Pay · Delivered</div>
                  </td>
                </tr></table>
              </td>
              <td align="right" valign="middle" style="color:#5f6677;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;">Secure notification</td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td style="padding:30px 22px 28px;background:#151522;border-bottom:1px solid #2a2a3d;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="padding:7px 10px;border-radius:999px;background:${accent.soft};border:1px solid ${accent.border};color:${accent.primary};font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</td>
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
          © ${new Date().getUTCFullYear()} ${BRAND_NAME}. Automated transactional notification. Game names and trademarks belong to their respective owners.
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
      url: `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/account`,
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
      url: `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/account`,
    },
    footer:
      "If you did not make this change, contact Recharza support immediately and secure the email account linked to Recharza.",
    customerId: input.customerId,
  });
}

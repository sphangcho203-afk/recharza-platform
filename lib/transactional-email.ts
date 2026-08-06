import type { EmailMessageKind } from "@/generated/prisma/client";
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
  const details = (input.details ?? [])
    .map(
      (item) => `
        <tr>
          <td style="padding:13px 14px;color:#8b93a7;font-size:11px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #262636;">${escapeHtml(item.label)}</td>
          <td style="padding:13px 14px;color:#ffffff;font-size:14px;font-weight:750;text-align:right;border-bottom:1px solid #262636;">${escapeHtml(item.value)}</td>
        </tr>`,
    )
    .join("");

  const action = input.action
    ? `<a href="${escapeHtml(input.action.url)}" style="display:block;margin-top:24px;padding:15px 18px;background:#f8fafc;color:#09090f;text-decoration:none;text-align:center;border-radius:13px;font-size:14px;font-weight:900;box-shadow:0 12px 30px rgba(255,255,255,.08);">${escapeHtml(input.action.label)}</a>`
    : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#07070b;color:#ffffff;font-family:Inter,Arial,sans-serif;">
    <div style="padding:32px 14px;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #252535;border-radius:24px;overflow:hidden;background:#101018;box-shadow:0 24px 70px rgba(0,0,0,.42);">
        <div style="padding:22px 24px;border-bottom:1px solid #262638;background:#0a0a11;">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="vertical-align:middle;">
                <table role="presentation" style="border-collapse:collapse;">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#67e8f9,#8b5cf6 52%,#f472b6);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:23px;font-weight:950;font-style:italic;box-shadow:0 0 28px rgba(124,58,237,.28);">R</div>
                    </td>
                    <td style="padding-left:12px;vertical-align:middle;">
                      <div style="font-size:18px;font-weight:950;letter-spacing:-.045em;text-transform:uppercase;">RECHARZA</div>
                      <div style="margin-top:3px;color:#a78bfa;font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;">Play. Pay. Delivered.</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="text-align:right;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Secure notification</td>
            </tr>
          </table>
        </div>

        <div style="padding:30px 24px;background:radial-gradient(circle at top left,#312e81 0,#171728 48%,#101018 100%);border-bottom:1px solid #2c2c43;">
          <div style="color:#c4b5fd;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</div>
          <h1 style="margin:10px 0 0;font-size:30px;line-height:1.12;letter-spacing:-.04em;">${escapeHtml(input.title)}</h1>
          <p style="margin:14px 0 0;max-width:540px;color:#cbd5e1;font-size:15px;line-height:1.72;">${escapeHtml(input.message)}</p>
        </div>

        <div style="padding:24px;">
          ${details ? `<table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #27273a;border-radius:15px;overflow:hidden;background:#0a0a11;">${details}</table>` : ""}
          ${action}

          <div style="margin-top:24px;padding:15px;border:1px solid #1f3a35;border-radius:13px;background:#0b1715;color:#9dd9cc;font-size:12px;line-height:1.65;">
            <strong style="display:block;margin-bottom:4px;color:#d1fae5;">Security reminder</strong>
            Recharza support will never ask for your password, OTP, UPI PIN, card PIN, or remote-device access.
          </div>

          <p style="margin:22px 0 0;color:#6b7280;font-size:12px;line-height:1.65;">${escapeHtml(input.footer ?? "This is an automated Recharza account and order message. Keep account and tracking credentials private.")}</p>
          <p style="margin:10px 0 0;color:#6b7280;font-size:12px;line-height:1.65;">Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:#c4b5fd;text-decoration:none;font-weight:700;">${SUPPORT_EMAIL}</a></p>
        </div>

        <div style="padding:16px 24px;border-top:1px solid #252535;background:#0a0a10;color:#525a6d;font-size:10px;line-height:1.6;text-align:center;">
          Game names, artwork, currencies, and trademarks belong to their respective publishers. Recharza is an independent digital top-up platform unless a specific partnership is stated.
        </div>
      </div>
    </div>
  </body>
</html>`;
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

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        attempts: 1,
        errorMessage: "Resend delivery is not configured.",
      },
    });
    return { ok: false as const, deliveryId: delivery.id };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: renderEmail(input),
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; error?: { message?: string } }
      | null;

    if (!response.ok || !result?.id) {
      const message =
        result?.message ||
        result?.error?.message ||
        `Resend returned HTTP ${response.status}.`;
      await prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          attempts: 1,
          errorMessage: message.slice(0, 500),
        },
      });
      return { ok: false as const, deliveryId: delivery.id };
    }

    await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT",
        attempts: 1,
        providerMessageId: result.id,
        sentAt: new Date(),
      },
    });

    return {
      ok: true as const,
      deliveryId: delivery.id,
      providerMessageId: result.id,
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
            : "Unknown Resend delivery failure.",
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
    subject: "Your Recharza account is ready",
    eyebrow: "Account created",
    title: `Welcome to ${BRAND_NAME}, ${input.displayName}`,
    message:
      "Your account was created successfully. You can now manage orders, saved players, billing details, security, and support from one workspace.",
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
    title: "Create a new password",
    message:
      "We received a request to reset your Recharza password. The link is single-use and expires after 20 minutes.",
    details: [
      { label: "Requested", value: formatTimestamp(input.requestedAt) },
      { label: "Expires", value: formatTimestamp(input.expiresAt) },
    ],
    action: { label: "Reset password", url: input.resetUrl },
    footer:
      "If you did not request this change, ignore this email. Your current password remains active.",
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
    title: "Password changed successfully",
    message:
      "Your password was changed and existing account sessions were revoked. Sign in again with the new password.",
    details: [{ label: "Changed", value: formatTimestamp(input.changedAt) }],
    action: {
      label: "Sign in to Recharza",
      url: `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/account`,
    },
    footer:
      "If you did not make this change, contact Recharza support immediately.",
    customerId: input.customerId,
  });
}

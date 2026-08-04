import type { EmailMessageKind } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

const BRAND_NAME = "Recharza";

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
          <td style="padding:10px 12px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #27273a;">${escapeHtml(item.label)}</td>
          <td style="padding:10px 12px;color:#ffffff;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #27273a;">${escapeHtml(item.value)}</td>
        </tr>`,
    )
    .join("");

  const action = input.action
    ? `<a href="${escapeHtml(input.action.url)}" style="display:block;margin-top:24px;padding:14px 18px;background:#7c3aed;color:#ffffff;text-decoration:none;text-align:center;border-radius:12px;font-weight:800;">${escapeHtml(input.action.label)}</a>`
    : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#080810;color:#ffffff;font-family:Inter,Arial,sans-serif;">
    <div style="padding:28px 14px;">
      <div style="max-width:620px;margin:0 auto;border:1px solid #262638;border-radius:22px;overflow:hidden;background:#11111c;box-shadow:0 20px 60px rgba(0,0,0,.35);">
        <div style="padding:24px;background:radial-gradient(circle at top left,#312e81 0,#171728 52%,#11111c 100%);border-bottom:1px solid #2c2c43;">
          <div style="font-size:18px;font-weight:900;letter-spacing:-.02em;">RECHARZA</div>
          <div style="margin-top:18px;color:#c4b5fd;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</div>
          <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;letter-spacing:-.03em;">${escapeHtml(input.title)}</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">${escapeHtml(input.message)}</p>
          ${details ? `<table role="presentation" style="width:100%;margin-top:22px;border-collapse:collapse;border:1px solid #27273a;border-radius:14px;overflow:hidden;background:#0b0b13;">${details}</table>` : ""}
          ${action}
          <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">${escapeHtml(input.footer ?? "This is an automated Recharza account and order message. Keep account and tracking credentials private.")}</p>
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

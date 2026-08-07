import { getMailDeliveryConfiguration, sendSystemEmail } from "@/lib/mail-delivery";

type MagicLinkDeliveryResult =
  | { mode: "gmail" | "resend"; messageId: string }
  | { mode: "development-preview"; previewUrl: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendMagicLinkEmail(input: {
  email: string;
  url: string;
  expiresAt: Date;
  idempotencyKey: string;
}): Promise<MagicLinkDeliveryResult> {
  const developmentPreviewAllowed =
    process.env.NODE_ENV !== "production" &&
    (process.env.AUTH_EMAIL_DELIVERY_MODE?.trim() || "development") === "development";

  if (!getMailDeliveryConfiguration().provider) {
    if (developmentPreviewAllowed) {
      return { mode: "development-preview", previewUrl: input.url };
    }
    throw new Error("Verified email delivery is not configured.");
  }

  const safeUrl = escapeHtml(input.url);
  const result = await sendSystemEmail({
    to: input.email,
    subject: "Sign in to Recharza",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h1>Sign in to Recharza</h1><p>Use the secure button below to verify your email and sign in.</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#6d28d9;color:white;text-decoration:none;font-weight:700">Verify email and sign in</a></p><p>This link expires at ${escapeHtml(input.expiresAt.toISOString())} and can be used once.</p><p>If you did not request this, ignore this email.</p></div>`,
    text: `Sign in to Recharza: ${input.url}\n\nThis one-time link expires at ${input.expiresAt.toISOString()}.`,
    idempotencyKey: input.idempotencyKey,
  });

  return { mode: result.provider, messageId: result.messageId };
}

type MagicLinkDeliveryResult =
  | { mode: "resend"; messageId: string }
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
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const developmentPreviewAllowed =
    process.env.NODE_ENV !== "production" &&
    (process.env.AUTH_EMAIL_DELIVERY_MODE?.trim() || "development") === "development";

  if (!apiKey || !from) {
    if (developmentPreviewAllowed) {
      return { mode: "development-preview", previewUrl: input.url };
    }
    throw new Error("Verified email delivery is not configured.");
  }

  const safeUrl = escapeHtml(input.url);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: "Sign in to Recharza",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h1>Sign in to Recharza</h1><p>Use the secure button below to verify your email and sign in.</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#6d28d9;color:white;text-decoration:none;font-weight:700">Verify email and sign in</a></p><p>This link expires at ${escapeHtml(input.expiresAt.toISOString())} and can be used once.</p><p>If you did not request this, ignore this email.</p></div>`,
      text: `Sign in to Recharza: ${input.url}\n\nThis one-time link expires at ${input.expiresAt.toISOString()}.`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: unknown; message?: unknown }
    | null;

  if (!response.ok || typeof payload?.id !== "string") {
    const message = typeof payload?.message === "string" ? payload.message : "Email delivery failed.";
    throw new Error(message);
  }

  return { mode: "resend", messageId: payload.id };
}

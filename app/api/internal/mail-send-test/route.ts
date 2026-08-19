import "server-only";

import { EmailMessageKind } from "@/generated/prisma/enums";
import { sendSystemEmail } from "@/lib/mail-delivery";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://recharza-platform-2o3wxy8mj-stand-still.vercel.app";
import { renderEmail } from "@/lib/transactional-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const key = authHeader.replace(/^Bearer\s+/i, "").trim();
  const secret = process.env.INTERNAL_HEALTH_SECRET;

  if (!secret || key !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const to =
      (body && typeof body.to === "string" && body.to.trim()) ||
      "phangchosongja02@gmail.com";

    const rawKind =
      (body && typeof body.kind === "string" && body.kind) || "ACCOUNT_CREATED";
    const templateKind: EmailMessageKind =
      EmailMessageKind[
        rawKind as keyof typeof EmailMessageKind
      ] ?? EmailMessageKind.ACCOUNT_CREATED;
    const isPreview = rawKind !== "ACCOUNT_CREATED";

    const templateConfigs: Record<string, { subject: string; eyebrow: string; title: string; message: string; details: Array<{ label: string; value: string }>; action?: { label: string; url: string } }> = {
      ACCOUNT_CREATED: {
        subject: "Recharza — Live Email Delivery Test",
        eyebrow: "System test",
        title: "Your Recharza emails are working.",
        message:
          "This is an automated delivery test from the Recharza production mail system. If you received this message, transactional emails — signup, login, order confirmations, and password resets — are flowing correctly. This preview uses the exact same premium template your customers receive.",
        details: [
          { label: "Recipient", value: to },
          { label: "Sent at", value: new Date().toUTCString() },
          { label: "Transport", value: "Gmail SMTP" },
        ],
        action: { label: "Open my account", url: BASE_URL + "/account" },
      },
      PASSWORD_RESET: {
        subject: "Recharza — Password Reset Preview",
        eyebrow: "Preview · Password reset email",
        title: "Reset your password.",
        message:
          "This is a preview of the password reset email your customers receive. In production, the button below would contain a one-time secure reset link sent to the account owner only.",
        details: [
          { label: "Preview for", value: to },
          { label: "Sent at", value: new Date().toUTCString() },
          { label: "Template", value: "Premium · Password reset" },
        ],
        action: { label: "Reset password", url: BASE_URL + "/account" },
      },
      ORDER_COMPLETED: {
        subject: "Recharza — Order Completed Preview",
        eyebrow: "Preview · Order completed email",
        title: "Your top-up is complete.",
        message:
          "This is a preview of the order completion email your customers receive after a successful top-up. In production, the details below reflect the real order.",
        details: [
          { label: "Order", value: "ORD-PREVIEW-00001" },
          { label: "Game", value: "Mobile Legends: Bang Bang" },
          { label: "Player", value: "player_id (1269818455)" },
          { label: "Package", value: "86 Diamonds" },
          { label: "Amount", value: "INR 129" },
          { label: "Completed", value: new Date().toUTCString() },
        ],
        action: { label: "Open order tracking", url: BASE_URL + "/orders" },
      },
      ORDER_FAILED: {
        subject: "Recharza — Order Attention Preview",
        eyebrow: "Preview · Order needs attention email",
        title: "Your order needs attention.",
        message:
          "This is a preview of the order attention email your customers receive when a top-up cannot be completed. In production, the reason below explains the specific issue.",
        details: [
          { label: "Order", value: "ORD-PREVIEW-00002" },
          { label: "Game", value: "Garena Free Fire" },
          { label: "Reason", value: "Payment could not be verified" },
          { label: "Sent at", value: new Date().toUTCString() },
          { label: "Template", value: "Premium · Order attention" },
        ],
        action: { label: "Retry or contact support", url: BASE_URL + "/orders" },
      },
    };

    const config = templateConfigs[rawKind] ?? templateConfigs.ACCOUNT_CREATED;

    const html = renderEmail({
      kind: templateKind,
      to,
      subject: config.subject,
      eyebrow: config.eyebrow,
      title: config.title,
      message: config.message,
      details: config.details,
      ...(config.action ? { action: config.action } : {}),
      footer: isPreview
        ? "System diagnostic preview of the live template — no action required."
        : "This is a system diagnostic email — no action required.",
    });

    const result = await sendSystemEmail({
      to,
      subject: config.subject,
      html,
      text: "Recharza live email template preview — premium dark template.",
      idempotencyKey: `live-send-test-${templateKind}-${Date.now()}`,
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

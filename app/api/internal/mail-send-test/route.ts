import "server-only";

import { sendSystemEmail } from "@/lib/mail-delivery";
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

    const html = renderEmail({
      kind: "ACCOUNT_CREATED",
      to,
      subject: "Recharza — Live Email Delivery Test",
      eyebrow: "System test",
      title: "Your Recharza emails are working.",
      message:
        "This is an automated delivery test from the Recharza production mail system. If you received this message, transactional emails — signup, login, order confirmations, and password resets — are flowing correctly. This preview uses the exact same premium template your customers receive.",
      details: [
        { label: "Recipient", value: to },
        { label: "Sent at", value: formatTimestamp(new Date()) },
        { label: "Transport", value: "Gmail SMTP" },
      ],
      action: { label: "Open my account", url: appUrl() + "/account" },
      footer: "This is a system diagnostic email — no action required.",
    });

    const result = await sendSystemEmail({
      to,
      subject: "Recharza — Live Email Delivery Test",
      html,
      text: "Recharza live email delivery test — transactional email system is working.",
      idempotencyKey: `live-send-test-${Date.now()}`,
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

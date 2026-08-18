import "server-only";

import { sendSystemEmail } from "@/lib/mail-delivery";

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

    const result = await sendSystemEmail({
      to,
      subject: "Recharza — Live Email Delivery Test",
      html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
<p style="color:#6b7280;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Recharza · System Test</p>
<h1 style="font-size:22px;color:#111827;margin:8px 0 12px;">Your Recharza emails are working.</h1>
<p style="color:#374151;font-size:15px;line-height:1.6;">This is an automated delivery test from the Recharza production mail system. If you received this message, transactional emails (signup, login, order confirmations, and password resets) are flowing correctly.</p>
<p style="color:#6b7280;font-size:13px;margin-top:16px;">Sent at ${new Date().toISOString()}</p>
</div>`,
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

import { timingSafeEqual } from "node:crypto";

import {
  getMailDeliveryConfiguration,
  sendSystemEmail,
} from "@/lib/mail-delivery";

export const runtime = "nodejs";

function secretsMatch(received: string | null, expected: string | undefined) {
  const expectedValue = expected?.trim();
  if (!received || !expectedValue) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expectedValue);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function addressDomain(value: string) {
  const match = value.match(/<([^>]+)>/)?.[1] ?? value;
  return match.split("@")[1]?.trim().toLowerCase() || null;
}

export async function POST(request: Request) {
  const diagnosticSecret =
    process.env.SUPPORT_DIAGNOSTICS_SECRET?.trim() ||
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (!secretsMatch(request.headers.get("x-recharza-diagnostics-secret"), diagnosticSecret)) {
    return Response.json({ ok: false, message: "Invalid diagnostics secret." }, { status: 401 });
  }

  const configuration = getMailDeliveryConfiguration();
  const to =
    process.env.SUPPORT_NOTIFICATION_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    "";

  const configured = {
    provider: configuration.provider,
    recipient: Boolean(to),
    gmail: {
      clientId: configuration.gmail.clientId,
      clientSecret: configuration.gmail.clientSecret,
      refreshToken: configuration.gmail.refreshToken,
      configured: configuration.gmail.configured,
    },
    resend: {
      apiKey: configuration.resend.apiKey,
      from: configuration.resend.from,
      configured: configuration.resend.configured,
    },
  };

  if (!configuration.provider || !to) {
    return Response.json(
      {
        ok: false,
        configured,
        recipientDomain: to ? addressDomain(to) : null,
        message: "Recharza email delivery configuration is incomplete.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await sendSystemEmail({
      to,
      subject: "Recharza support email diagnostic",
      html: "<div style=\"font-family:Arial,sans-serif\"><h2>Recharza Support</h2><p>Email delivery is connected.</p><p>This diagnostic contains no customer data.</p></div>",
      text: "Recharza Support email delivery is connected. This diagnostic contains no customer data.",
      idempotencyKey: `support-diagnostic-${Date.now()}`,
    });

    return Response.json({
      ok: true,
      configured,
      provider: result.provider,
      senderDomain:
        result.provider === "gmail"
          ? addressDomain(configuration.gmail.from)
          : process.env.RESEND_FROM_EMAIL
            ? addressDomain(process.env.RESEND_FROM_EMAIL)
            : null,
      recipientDomain: addressDomain(to),
      providerMessageId: result.messageId,
      message: `Diagnostic email accepted by ${result.provider === "gmail" ? "Gmail API" : "Resend"}.`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        configured,
        provider: configuration.provider,
        recipientDomain: addressDomain(to),
        providerError: error instanceof Error ? error.message : "Email request failed.",
      },
      { status: 502 },
    );
  }
}

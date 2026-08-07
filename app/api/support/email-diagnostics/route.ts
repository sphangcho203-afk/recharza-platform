import { timingSafeEqual } from "node:crypto";

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

  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "";
  const to =
    process.env.SUPPORT_NOTIFICATION_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    "";

  const configured = {
    apiKey: Boolean(apiKey),
    from: Boolean(from),
    recipient: Boolean(to),
  };

  if (!configured.apiKey || !configured.from || !configured.recipient) {
    return Response.json(
      {
        ok: false,
        configured,
        senderDomain: from ? addressDomain(from) : null,
        recipientDomain: to ? addressDomain(to) : null,
        message: "Resend support email configuration is incomplete.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `support-diagnostic-${Date.now()}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Recharza support email diagnostic",
        html: "<div style=\"font-family:Arial,sans-serif\"><h2>Recharza Support</h2><p>Email delivery is connected.</p><p>This diagnostic contains no customer data.</p></div>",
        text: "Recharza Support email delivery is connected. This diagnostic contains no customer data.",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: unknown; message?: unknown; name?: unknown; statusCode?: unknown }
      | null;

    const safe = {
      configured,
      senderDomain: addressDomain(from),
      recipientDomain: addressDomain(to),
      usingResendTestingDomain: addressDomain(from) === "resend.dev",
      providerHttpStatus: response.status,
    };

    if (!response.ok || typeof payload?.id !== "string") {
      return Response.json(
        {
          ok: false,
          ...safe,
          providerError:
            typeof payload?.message === "string"
              ? payload.message.slice(0, 1_000)
              : `Resend returned HTTP ${response.status}.`,
        },
        { status: 502 },
      );
    }

    return Response.json({
      ok: true,
      ...safe,
      providerMessageId: payload.id,
      message: "Diagnostic email accepted by Resend.",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        configured,
        senderDomain: addressDomain(from),
        recipientDomain: addressDomain(to),
        usingResendTestingDomain: addressDomain(from) === "resend.dev",
        providerError: error instanceof Error ? error.message : "Resend request failed.",
      },
      { status: 502 },
    );
  }
}

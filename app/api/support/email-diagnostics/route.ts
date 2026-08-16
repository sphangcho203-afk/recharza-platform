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

function resultLabel(provider: string) {
  if (provider === "gmail-smtp") return "Gmail SMTP";
  if (provider === "gmail") return "Gmail API";
  return "Resend";
}

function normalizeDiagnosticRecipient(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length > 254 ||
    /[\r\n]/.test(normalized) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function renderDiagnosticHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Recharza email delivery test</title>
</head>
<body style="margin:0;padding:0;background:#06060a;color:#f8fafc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">A protected Recharza Gmail API delivery test reached this inbox.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#06060a;padding:30px 12px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;background:#101018;border:1px solid #28283a;border-radius:22px;overflow:hidden;">
        <tr><td style="padding:20px 22px;background:#09090f;border-bottom:1px solid #242433;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0"><tr>
                <td width="40" height="40" align="center" style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#22d3ee,#7c3aed 55%,#ec4899);color:#fff;font-size:20px;font-weight:950;font-style:italic;">R</td>
                <td style="padding-left:11px;">
                  <div style="color:#fff;font-size:17px;font-weight:950;letter-spacing:-.04em;text-transform:uppercase;">RECHARZA</div>
                  <div style="margin-top:2px;color:#a78bfa;font-size:9px;font-weight:850;letter-spacing:.18em;text-transform:uppercase;">Play · Pay · Delivered</div>
                </td>
              </tr></table>
            </td>
            <td align="right" style="color:#64748b;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;">Protected delivery test</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 22px;background:radial-gradient(circle at top left,#312e81 0,#171724 48%,#101018 100%);">
          <div style="display:inline-block;padding:7px 10px;border-radius:999px;border:1px solid #164e63;background:#0d2430;color:#67e8f9;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;">External delivery confirmed</div>
          <h1 style="margin:16px 0 0;color:#fff;font-size:28px;line-height:1.12;letter-spacing:-.04em;">Recharza reached your inbox.</h1>
          <p style="margin:14px 0 0;color:#cbd5e1;font-size:14px;line-height:1.75;">This message was sent through the same protected email transport used by Recharza account, security, order, payment, and top-up notifications.</p>
        </td></tr>
        <tr><td style="padding:22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#0b1715;border:1px solid #1f3a35;border-radius:12px;">
            <tr><td style="padding:14px;color:#91cfc1;font-size:11px;line-height:1.7;">
              <strong style="display:block;margin-bottom:3px;color:#d1fae5;">What this proves</strong>
              Transport authentication, MIME/HTML rendering, sender configuration, and delivery to an external mailbox all completed for this test.
            </td></tr>
          </table>
          <p style="margin:20px 0 0;color:#697184;font-size:11px;line-height:1.7;">This is a protected diagnostic message and contains no customer or payment data.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  const diagnosticSecret =
    process.env.SUPPORT_DIAGNOSTICS_SECRET?.trim() ||
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (
    !secretsMatch(
      request.headers.get("x-recharza-diagnostics-secret"),
      diagnosticSecret,
    )
  ) {
    return Response.json(
      { ok: false, message: "Invalid diagnostics secret." },
      { status: 401 },
    );
  }

  const configuration = getMailDeliveryConfiguration();
  const recipientHeader = request.headers.get("x-recharza-diagnostics-recipient");
  const overrideRecipient = normalizeDiagnosticRecipient(recipientHeader);

  if (recipientHeader && !overrideRecipient) {
    return Response.json(
      {
        ok: false,
        message: "The diagnostic recipient header must contain one valid email address.",
      },
      { status: 400 },
    );
  }

  const supportRecipient =
    process.env.SUPPORT_NOTIFICATION_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    "";
  const to = overrideRecipient || supportRecipient;
  const recipientSource = overrideRecipient ? "explicit-test-recipient" : "support-default";

  const configured = {
    requestedProvider: configuration.requestedProvider,
    activeProvider: configuration.provider,
    recipient: Boolean(to),
    recipientSource,
    gmail: {
      clientId: configuration.gmail.clientId,
      clientSecret: configuration.gmail.clientSecret,
      refreshToken: configuration.gmail.refreshToken,
      configured: configuration.gmail.configured,
      usingSharedGoogleClient: configuration.gmail.usingSharedGoogleClient,
      missing: configuration.gmail.missing,
    },
    smtp: {
      host: configuration.smtp.host,
      port: configuration.smtp.port,
      user: configuration.smtp.user,
      password: configuration.smtp.password,
      from: addressDomain(configuration.smtp.from),
      configured: configuration.smtp.configured,
      missing: configuration.smtp.missing,
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
        message:
          configuration.requestedProvider === "gmail"
            ? "Recharza requires Gmail delivery, but the Gmail OAuth transport is incomplete."
            : configuration.requestedProvider === "gmail-smtp"
              ? "Recharza requires Gmail SMTP delivery, but the SMTP transport is incomplete."
              : "Recharza email delivery configuration is incomplete.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await sendSystemEmail({
      to,
      subject: `Recharza ${resultLabel(configuration.requestedProvider)} external delivery test`,
      html: renderDiagnosticHtml(),
      text:
        `RECHARZA — ${resultLabel(configuration.requestedProvider)} external delivery test\n\nRecharza reached this inbox through the same ${resultLabel(configuration.requestedProvider)} transport used for account, security, order, payment, and top-up notifications.\n\nThis protected diagnostic contains no customer or payment data.`,
      idempotencyKey: `gmail-external-diagnostic-${Date.now()}`,
    });

    return Response.json({
      ok: true,
      configured,
      provider: result.provider,
      senderDomain:
        result.provider === "gmail"
          ? addressDomain(configuration.gmail.from)
          : result.provider === "gmail-smtp"
            ? addressDomain(configuration.smtp.from)
            : process.env.RESEND_FROM_EMAIL
              ? addressDomain(process.env.RESEND_FROM_EMAIL)
              : null,
      recipientDomain: addressDomain(to),
      recipientSource,
      providerMessageId: result.messageId,
      message: `External diagnostic accepted by ${resultLabel(result.provider)}.`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        configured,
        provider: configuration.requestedProvider,
        recipientDomain: addressDomain(to),
        recipientSource,
        providerError:
          error instanceof Error ? error.message : "Email request failed.",
      },
      { status: 502 },
    );
  }
}

import "server-only";

import { getMailDeliveryConfiguration } from "@/lib/mail-delivery";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const key = authHeader.replace(/^Bearer\s+/i, "").trim();
  const secret = process.env.INTERNAL_HEALTH_SECRET;

  if (!secret || key !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mailConfig = getMailDeliveryConfiguration();
    return Response.json({
      requestedProvider: mailConfig.requestedProvider,
      provider: mailConfig.provider,
      gmailOAuth: {
        configured: mailConfig.gmail.configured,
        usingSharedGoogleClient: mailConfig.gmail.usingSharedGoogleClient,
        missing: mailConfig.gmail.missing,
      },
      smtp: {
        configured: mailConfig.smtp.configured,
        user: mailConfig.smtp.user,
        password: mailConfig.smtp.password,
        host: mailConfig.smtp.host,
        port: mailConfig.smtp.port,
        from: mailConfig.smtp.from,
        missing: mailConfig.smtp.missing,
      },
      resend: {
        configured: mailConfig.resend.configured,
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Mail config inspection failed" },
      { status: 500 },
    );
  }
}

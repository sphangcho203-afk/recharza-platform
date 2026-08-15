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

type TelegramResponse = {
  ok?: boolean;
  result?: unknown;
  description?: string;
};

export async function POST(request: Request) {
  if (
    !secretsMatch(
      request.headers.get("x-recharza-setup-secret"),
      process.env.TELEGRAM_WEBHOOK_SECRET,
    )
  ) {
    return Response.json(
      { ok: false, message: "Invalid setup secret." },
      { status: 401 },
    );
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!token || !webhookSecret) {
    return Response.json(
      {
        ok: false,
        message: "Telegram bot token or webhook secret is missing from this deployment.",
      },
      { status: 503 },
    );
  }

  const incomingUrl = new URL(request.url);
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const canonicalOrigin = configuredAppUrl || (productionUrl ? (productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`) : new URL(request.url).origin);
  const webhookUrl = new URL("/api/telegram/webhook", canonicalOrigin);
  const protectionBypass =
    incomingUrl.searchParams.get("x-vercel-protection-bypass")?.trim() ||
    request.headers.get("x-vercel-protection-bypass")?.trim() ||
    "";

  if (protectionBypass) {
    webhookUrl.searchParams.set("x-vercel-protection-bypass", protectionBypass);
  }

  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl.toString(),
        secret_token: webhookSecret,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  const payload = (await telegramResponse.json().catch(() => null)) as
    | TelegramResponse
    | null;

  if (!telegramResponse.ok || !payload?.ok) {
    return Response.json(
      {
        ok: false,
        message:
          payload?.description ||
          `Telegram returned HTTP ${telegramResponse.status}.`,
      },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    webhookUrl: webhookUrl.toString(),
    telegram: payload,
  });
}

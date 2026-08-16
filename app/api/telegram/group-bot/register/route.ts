import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function secretsMatch(received: string | null, expected: string | undefined) {
  const expectedValue = expected?.trim();
  if (!received || !expectedValue) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expectedValue);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function canonicalAppUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return production.startsWith("http") ? production : `https://${production}`;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_GROUP_BOT_WEBHOOK_SECRET?.trim();
  if (!secretsMatch(request.headers.get("x-recharza-setup-secret"), secret)) {
    return Response.json({ ok: false, message: "Invalid group-bot setup secret." }, { status: 401 });
  }

  const token = process.env.TELEGRAM_GROUP_BOT_TOKEN?.trim();
  if (!token || !secret) {
    return Response.json({ ok: false, message: "Group bot token or webhook secret is missing." }, { status: 503 });
  }

  const url = new URL("/api/telegram/group-bot/webhook", canonicalAppUrl(request));
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: url.toString(),
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !payload?.ok) {
    return Response.json({ ok: false, message: payload?.description || `Telegram returned HTTP ${response.status}.` }, { status: 502 });
  }
  return Response.json({ ok: true, webhookUrl: url.toString() });
}

export async function GET() {
  return Response.json({ ok: true, service: "recharza-telegram-group-support-register" });
}

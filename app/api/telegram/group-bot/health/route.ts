const TELEGRAM_API = "https://api.telegram.org";

type TelegramEnvelope<T> = { ok?: boolean; result?: T; description?: string };
type TelegramBot = { id: number; username?: string; first_name?: string };
type TelegramWebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  allowed_updates?: string[];
};

async function telegramGet<T>(token: string, method: string) {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const payload = (await response.json().catch(() => null)) as TelegramEnvelope<T> | null;
  if (!response.ok || !payload?.ok || payload.result === undefined) throw new Error(payload?.description || `Telegram returned HTTP ${response.status}.`);
  return payload.result;
}

async function telegramSetWebhook(token: string, url: string, secret: string) {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json().catch(() => null)) as TelegramEnvelope<boolean> | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.description || `Telegram returned HTTP ${response.status}.`);
}

function canonicalAppUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return configured || (production ? (production.startsWith("http") ? production : `https://${production}`) : new URL(request.url).origin);
}

export async function GET(request: Request) {
  const token = process.env.TELEGRAM_GROUP_BOT_TOKEN?.trim() || "";
  const expectedUrl = new URL("/api/telegram/group-bot/webhook", canonicalAppUrl(request)).toString();
  if (!token) return Response.json({ ok: false, configured: false, expectedUrl, message: "TELEGRAM_GROUP_BOT_TOKEN is missing." }, { status: 503 });
  try {
    const [bot, webhook] = await Promise.all([
      telegramGet<TelegramBot>(token, "getMe"),
      telegramGet<TelegramWebhookInfo>(token, "getWebhookInfo"),
    ]);
    const actualUrl = webhook.url || "";
    const webhookSecret = process.env.TELEGRAM_GROUP_BOT_WEBHOOK_SECRET?.trim() || "";
    let repaired = false;
    let repairError: string | null = null;
    if (actualUrl !== expectedUrl && webhookSecret) {
      try {
        await telegramSetWebhook(token, expectedUrl, webhookSecret);
        repaired = true;
      } catch (error) {
        repairError = error instanceof Error ? error.message : "Group webhook repair failed.";
      }
    }
    return Response.json({
      ok: actualUrl === expectedUrl || repaired,
      configured: true,
      bot: { id: bot.id, username: bot.username || null, name: bot.first_name || null },
      webhook: {
        expectedUrl,
        actualUrl: repaired ? expectedUrl : actualUrl || null,
        matchesDeployment: actualUrl === expectedUrl || repaired,
        repairAttempted: actualUrl !== expectedUrl && Boolean(webhookSecret),
        repairError,
        pendingUpdates: webhook.pending_update_count ?? 0,
        lastErrorDate: webhook.last_error_date ?? null,
        lastErrorMessage: webhook.last_error_message ?? null,
        allowedUpdates: webhook.allowed_updates ?? [],
      },
    });
  } catch (error) {
    return Response.json({ ok: false, configured: true, expectedUrl, message: error instanceof Error ? error.message : "Group bot health check failed." }, { status: 502 });
  }
}

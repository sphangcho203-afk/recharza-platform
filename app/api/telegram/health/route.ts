export const runtime = "nodejs";

const TELEGRAM_API = "https://api.telegram.org";

type TelegramEnvelope<T> = {
  ok?: boolean;
  result?: T;
  description?: string;
};

type TelegramBot = {
  id: number;
  username?: string;
  first_name?: string;
};

type TelegramWebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
};

async function telegramGet<T>(token: string, method: string) {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  const payload = (await response.json().catch(() => null)) as TelegramEnvelope<T> | null;
  if (!response.ok || !payload?.ok || payload.result === undefined) {
    throw new Error(payload?.description || `Telegram returned HTTP ${response.status}.`);
  }
  return payload.result;
}

export async function GET(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const secretConfigured = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim());
  const workerChatConfigured = Boolean(process.env.TELEGRAM_SUPPORT_CHAT_ID?.trim());
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const canonicalOrigin = configuredAppUrl || (productionUrl ? (productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`) : new URL(request.url).origin);
  const expectedWebhookUrl = new URL("/api/telegram/webhook", canonicalOrigin).toString();

  if (!token) {
    return Response.json(
      {
        ok: false,
        service: "recharza-telegram-support",
        configured: {
          botToken: false,
          webhookSecret: secretConfigured,
          workerChat: workerChatConfigured,
        },
        expectedWebhookUrl,
        message: "TELEGRAM_BOT_TOKEN is missing from this deployment.",
      },
      { status: 503 },
    );
  }

  try {
    const [bot, webhook] = await Promise.all([
      telegramGet<TelegramBot>(token, "getMe"),
      telegramGet<TelegramWebhookInfo>(token, "getWebhookInfo"),
    ]);
    const actualWebhookUrl = webhook.url || "";

    return Response.json({
      ok: actualWebhookUrl === expectedWebhookUrl,
      service: "recharza-telegram-support",
      configured: {
        botToken: true,
        webhookSecret: secretConfigured,
        workerChat: workerChatConfigured,
      },
      bot: {
        id: bot.id,
        username: bot.username || null,
        name: bot.first_name || null,
      },
      webhook: {
        expectedUrl: expectedWebhookUrl,
        actualUrl: actualWebhookUrl || null,
        matchesDeployment: actualWebhookUrl === expectedWebhookUrl,
        pendingUpdates: webhook.pending_update_count ?? 0,
        lastErrorDate: webhook.last_error_date ?? null,
        lastErrorMessage: webhook.last_error_message ?? null,
        allowedUpdates: webhook.allowed_updates ?? [],
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "recharza-telegram-support",
        configured: {
          botToken: true,
          webhookSecret: secretConfigured,
          workerChat: workerChatConfigured,
        },
        expectedWebhookUrl,
        message: error instanceof Error ? error.message : "Telegram health check failed.",
      },
      { status: 502 },
    );
  }
}

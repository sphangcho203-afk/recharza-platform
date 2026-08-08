const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

function fail(message) {
  console.error(`Telegram support webhook: ${message}`);
  process.exit(1);
}

if (!token) fail("TELEGRAM_BOT_TOKEN is required.");
if (!secret || secret.length < 16 || secret.length > 256) {
  fail("TELEGRAM_WEBHOOK_SECRET must contain 16 to 256 characters.");
}
if (!appUrl) fail("NEXT_PUBLIC_APP_URL is required.");

let webhookUrl;
try {
  webhookUrl = new URL("/api/telegram/webhook", appUrl);
} catch {
  fail("NEXT_PUBLIC_APP_URL is not a valid URL.");
}

if (webhookUrl.protocol !== "https:") {
  fail("Telegram webhooks require an HTTPS application URL.");
}

const endpoint = `https://api.telegram.org/bot${token}/setWebhook`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl.toString(),
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  }),
  signal: AbortSignal.timeout(15_000),
});

const payload = await response.json().catch(() => null);
if (!response.ok || !payload?.ok) {
  fail(payload?.description || `Telegram returned HTTP ${response.status}.`);
}

console.log(`Telegram support webhook configured: ${webhookUrl.toString()}`);

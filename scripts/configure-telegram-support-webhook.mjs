const primaryToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const primarySecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const groupToken = process.env.TELEGRAM_GROUP_BOT_TOKEN?.trim();
const groupSecret = process.env.TELEGRAM_GROUP_BOT_WEBHOOK_SECRET?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

function fail(message) {
  console.error(`Telegram support webhook: ${message}`);
  process.exit(1);
}

if (!primaryToken) fail("TELEGRAM_BOT_TOKEN is required.");
if (!primarySecret || primarySecret.length < 16 || primarySecret.length > 256) {
  fail("TELEGRAM_WEBHOOK_SECRET must contain 16 to 256 characters.");
}
if (!appUrl) fail("NEXT_PUBLIC_APP_URL is required.");

let appOrigin;
try {
  appOrigin = new URL(appUrl);
} catch {
  fail("NEXT_PUBLIC_APP_URL is not a valid URL.");
}
if (appOrigin.protocol !== "https:") fail("Telegram webhooks require an HTTPS application URL.");

async function setWebhook({ token, secret, path, label, allowedUpdates }) {
  const webhookUrl = new URL(path, appOrigin);
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl.toString(),
      secret_token: secret,
      allowed_updates: allowedUpdates,
      drop_pending_updates: false,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) fail(`${label} registration failed: ${payload?.description || `HTTP ${response.status}`}`);
  console.log(`${label} webhook configured: ${webhookUrl.toString()}`);
}

await setWebhook({
  token: primaryToken,
  secret: primarySecret,
  path: "/api/telegram/webhook",
  label: "Primary support bot",
  allowedUpdates: ["message", "callback_query"],
});

if (groupToken || groupSecret) {
  if (!groupToken || !groupSecret || groupSecret.length < 16 || groupSecret.length > 256) {
    fail("TELEGRAM_GROUP_BOT_TOKEN and TELEGRAM_GROUP_BOT_WEBHOOK_SECRET must both be configured; group secret must contain 16 to 256 characters.");
  }
  await setWebhook({
    token: groupToken,
    secret: groupSecret,
    path: "/api/telegram/group-bot/webhook",
    label: "Group support bot",
    allowedUpdates: ["message"],
  });
} else {
  console.log("Group support bot variables are not configured; primary webhook was still registered.");
}

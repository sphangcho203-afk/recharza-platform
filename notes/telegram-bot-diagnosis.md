# Telegram bot diagnosis

Checked production endpoints on 2026-08-15:

- Private health: https://recharza-platform.vercel.app/api/telegram/health
  - TELEGRAM_BOT_TOKEN configured and bot identity returned: @recherzaSupportbot
  - webhook expected and actual URL match
  - pending updates 0
  - last Telegram error null
- Group health: https://recharza-platform.vercel.app/api/telegram/group-bot/health
  - TELEGRAM_GROUP_BOT_TOKEN configured and bot identity returned: @rzsupport_bot
  - webhook expected and actual URL match
  - pending updates 0
  - last Telegram error null
- Vercel environment-variable page confirmed GEMINI_API_KEY, GEMINI_MODEL, TELEGRAM_BOT_TOKEN, TELEGRAM_GROUP_BOT_TOKEN, and webhook secrets exist for production/preview without exposing values.
- Vercel runtime log at https://vercel.com/stand-still/recharza-platform/logs showed: "Gemini group support fallback This model models/gemini-2.5-flash-lite is no longer available to new users. Please update your code to use a newer model..."

Patch applied in lib/gemini-support-agent.ts: try configured GEMINI_MODEL first and retry gemini-2.5-flash automatically for 400/404 model errors, preventing deterministic repeated fallback replies when the environment still has the obsolete flash-lite value.

Validation note: npm run typec is not present in this checkout; use the actual scripts from npm run and npx tsc --noEmit / npm run build as applicable.

External factual source captured from Vercel runtime logs and production health endpoints above; no secret values were opened or recorded.

POSIX

# Recharza Telegram Live-Support Group Bot

This feature is a **separate Telegram bot** for the live support group. It does not replace, modify, or share the dispatch flow of the existing private support bot at `/api/telegram/webhook`.

## Role

The group bot is a public support assistant. It responds in group chats only when users mention the configured bot username, for example `@RecharzaGroupBot how long do top-ups take?`. It can answer general questions about the Recharza catalogue, regions, verification, payment guidance, and delivery expectations.

The bot does not act as an operator. It cannot change orders, issue refunds, confirm payments, reveal database records, or claim that a human has taken action. It also does not read or expose private support-bot sessions.

## Privacy policy

The bot never displays order details, access tokens, customer emails, phone numbers, payment information, or database data in the group. If a message mentions an order, payment, refund, transaction, account, delivery status, or order ID, the group bot replies with a private-support instruction instead of calling the order database.

The customer must start a private chat with the group bot before sharing order information. The bot’s private-chat link is generated from `TELEGRAM_GROUP_BOT_USERNAME`. Customers should provide the order ID and the private access token from their order confirmation only in that private chat.

## Endpoint

The separate webhook endpoint is:

```text
https://recharza-platform.vercel.app/api/telegram/group-bot/webhook
```

Configure Telegram with a separate bot token and secret. Do not reuse `TELEGRAM_BOT_TOKEN` or `TELEGRAM_WEBHOOK_SECRET`, which belong to the existing private support bot.

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_GROUP_BOT_TOKEN}/setWebhook" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://recharza-platform.vercel.app/api/telegram/group-bot/webhook","secret_token":"REPLACE_WITH_TELEGRAM_GROUP_BOT_WEBHOOK_SECRET","allowed_updates":["message"]}'
```

For the group bot to receive ordinary group messages for mention detection, configure Telegram privacy mode appropriately in BotFather. The application still ignores group messages that do not mention the bot, so it does not become a background listener or noisy responder.

## Environment variables

Set these in the deployment provider’s encrypted environment settings:

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_GROUP_BOT_TOKEN` | Token for the separate live-support-group bot. |
| `TELEGRAM_GROUP_BOT_WEBHOOK_SECRET` | Secret token verified on every webhook request. |
| `TELEGRAM_GROUP_BOT_USERNAME` | Bot username without `@`, used for mention detection and private links. |
| `GEMINI_API_KEY` | Optional server-side Gemini API key. |
| `GEMINI_MODEL` | Defaults to `gemini-2.5-flash`. |

If `GEMINI_API_KEY` is not configured, the bot still handles privacy routing and help commands but returns a safe fallback for general questions.

## Supported interactions

| Message | Behavior |
| --- | --- |
| `@Bot how do I top up PUBG?` | Answers as a general support question through Gemini when configured. |
| `@Bot help` | Shows the bot’s support role and privacy rules. |
| `@Bot what is the status of RZ-ABC123?` | Refuses to expose order details in the group and sends the private-support instruction. |
| Unmentioned group message | Ignored. |
| Private `/start` or `/help` | Shows private-chat guidance. |

The deterministic order-status lookup remains intentionally outside this group bot until a separate private-chat identity and access-token flow is explicitly approved. This keeps the group bot support-only and prevents accidental disclosure.

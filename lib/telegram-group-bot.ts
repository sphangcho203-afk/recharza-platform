import { getGeminiSupportReply } from "@/lib/gemini-support-agent";

export type GroupTelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type GroupTelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; type?: string; title?: string };
  from?: GroupTelegramUser;
  entities?: Array<{ type: string; offset: number; length: number; user?: GroupTelegramUser }>;
};

export type GroupTelegramCallbackQuery = {
  id: string;
  from: GroupTelegramUser;
  data?: string;
  message?: GroupTelegramMessage;
};

export type GroupTelegramUpdate = {
  update_id?: number;
  message?: GroupTelegramMessage;
  callback_query?: GroupTelegramCallbackQuery;
};

export type GroupSupportIntent = "GENERAL" | "ORDER_STATUS" | "ORDER_SUPPORT";

function botToken() {
  return process.env.TELEGRAM_GROUP_BOT_TOKEN?.trim() || null;
}

export function getGroupWebhookSecret() {
  return process.env.TELEGRAM_GROUP_BOT_WEBHOOK_SECRET?.trim() || null;
}

export function getGroupBotUsername() {
  return (process.env.TELEGRAM_GROUP_BOT_USERNAME || "").trim().replace(/^@/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 2_000);
}

async function telegramRequest<T>(method: string, body: Record<string, unknown>) {
  const token = botToken();
  if (!token) throw new Error("Telegram group bot token is not configured.");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!response.ok || !payload?.ok) throw new Error(payload?.description || `Telegram returned HTTP ${response.status}.`);
  return payload.result as T;
}

export async function sendGroupMessage(chatId: string, text: string, extra: Record<string, unknown> = {}) {
  return telegramRequest<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

export async function sendPrivateMessage(userId: number, text: string, extra: Record<string, unknown> = {}) {
  return sendGroupMessage(String(userId), text, extra);
}

export async function answerGroupCallback(callbackQueryId: string, text?: string) {
  return telegramRequest<boolean>("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export function messageMentionsGroupBot(message: GroupTelegramMessage) {
  const text = message.text || "";
  const username = getGroupBotUsername();
  if (!username) return false;
  if (new RegExp(`(^|\\s)@${username}(\\b|$)`, "i").test(text)) return true;
  return Boolean(message.entities?.some((entity) => entity.type === "mention" && text.slice(entity.offset, entity.offset + entity.length).toLowerCase() === `@${username.toLowerCase()}`));
}

export function stripGroupBotMention(text: string) {
  const username = getGroupBotUsername();
  if (!username) return cleanText(text);
  return cleanText(text.replace(new RegExp(`@${username}\\b`, "ig"), ""));
}

export function groupUserLabel(user?: GroupTelegramUser) {
  if (!user) return "there";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || (user.username ? `@${user.username}` : "there");
}

export function extractOrderId(text: string) {
  return text.match(/\bRZ-[A-Z0-9]{6,24}\b/i)?.[0]?.toUpperCase() || null;
}

export function detectSupportIntent(text: string, rememberedOrderId?: string | null): GroupSupportIntent {
  const normalized = text.toLowerCase();
  const asksStatus = /\b(status|track|tracking|where|delivered|delivery|pending|complete|completed|failed|success|successful|still waiting|when will|arrived)\b/.test(normalized);
  const asksOrderHelp = /\b(order|payment|paid|charged|refund|receipt|transaction|top.?up|recharge|not received|missing)\b/.test(normalized);
  if (asksStatus || (rememberedOrderId && /\bmy\b|\bit\b|\bthat\b|\bthis\b/.test(normalized))) return "ORDER_STATUS";
  if (asksOrderHelp || extractOrderId(text)) return "ORDER_SUPPORT";
  return "GENERAL";
}

function deterministicSupportReply(message: string, intent: GroupSupportIntent, isPrivate: boolean) {
  const text = message.toLowerCase().trim();
  const variants = (items: string[]) => items[Math.abs([...text].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % items.length];
  if (/^(hi|hello|hey|yo|good morning|good evening)\b/.test(text)) {
    return variants([
      "Hey! I’m Recharza Support. What would you like to sort out today?",
      "Hello! I’m here to help with a game top-up, player verification, checkout, or an existing order.",
      "Hi there—tell me what you’re trying to do and I’ll guide you through the right next step.",
    ]);
  }
  if (/\b(link|url|website|site|store|shop)\b/.test(text)) {
    return "Here is the Recharza store: https://recharza-platform.vercel.app/ — choose your game, region, package, and continue through the guided checkout.";
  }
  if (intent === "ORDER_STATUS") {
    return isPrivate
      ? "I can check that. Please send the Order ID from your confirmation; if you already sent it, the next thing I need is the private access token."
      : "I can help with that, but order details must stay private. I’ve moved the next step to your private chat—please continue there with the Order ID only first.";
  }
  if (intent === "ORDER_SUPPORT") {
    return isPrivate
      ? "I can help investigate the payment or delivery issue. Send the Order ID and briefly tell me what went wrong; don’t send OTPs, card details, or UPI PINs."
      : "I can help with the order or payment issue. Let’s continue privately so no order, payment, or access information is exposed in the group.";
  }
  if (/\b(verify|validation|username|ign|player.?id|uid|zone|server|riot)\b/.test(text)) {
    return "For player verification, open the correct game and region, enter the requested player ID details, and tap Verify. If the name does not appear, tell me the game, region, and the exact error—never send a password or OTP.";
  }
  if (/\b(price|cost|rate|currency|usd|inr|try|brl|php|sar|aed|conversion)\b/.test(text)) {
    return "Prices are shown in the currency selected at the top of the store. Tell me the game, region, and package you want, and I’ll help you find the right option.";
  }
  if (/\b(game|available|top.?up|recharge|diamond|uc|crystal|points|membership|pass|pack)\b/.test(text)) {
    return "Recharza supports regional top-ups for Mobile Legends, Free Fire, PUBG Mobile, VALORANT, Genshin Impact, and other listed games. Tell me the game and region, and I’ll point you to the correct packages.";
  }
  if (/\b(how|where|buy|purchase|checkout|pay|payment|cart)\b/.test(text)) {
    return "Choose a game and region, select a package, verify the player details, enter billing information, review the order, and then continue to secure payment. I can guide you through any step.";
  }
  return variants(isPrivate
    ? [
        "I can help with the store, game packages, player verification, checkout, payments, or order status. What are you trying to do right now?",
        "Tell me the exact problem in your own words and I’ll narrow it down—game, region, player ID, package, payment, or order.",
        "I’m with you. What happened, and which game or order is it related to?",
      ]
    : [
        "I can help with general store questions. For order or payment details, I’ll move the conversation to private support.",
        "Tell me what you need help with—game selection, packages, verification, checkout, or payment—and I’ll point you in the right direction.",
        "I’m here for Recharza store support. What are you trying to complete?",
      ]);
}

export function formatConversationHistory(turns: Array<{ role: "user" | "assistant"; text: string }>) {
  if (!turns.length) return "No earlier conversation.";
  return turns.map((turn) => `${turn.role === "user" ? "Customer" : "Recharza Support"}: ${turn.text}`).join("\n");
}

export async function getGroupBotReply(input: {
  message: string;
  user?: GroupTelegramUser;
  conversationHistory?: string;
  intent?: GroupSupportIntent;
  isPrivate?: boolean;
}) {
  const cleanMessage = stripGroupBotMention(input.message);
  const intent = input.intent || detectSupportIntent(cleanMessage);
  try {
    const reply = await getGeminiSupportReply({
      userMessage: cleanMessage,
      userName: groupUserLabel(input.user),
      conversationHistory: input.conversationHistory,
      intent,
      isPrivate: input.isPrivate,
    });
    if (reply) return escapeHtml(reply);
  } catch (error) {
    console.error("Gemini group support fallback", error instanceof Error ? error.message : "unknown error");
  }
  return escapeHtml(deterministicSupportReply(cleanMessage, intent, Boolean(input.isPrivate)));
}

export function groupPrivacyNotice() {
  return "For privacy, I’ll continue this order or payment conversation privately. Never post access tokens, OTPs, card details, or UPI PINs in this group.";
}

export function privateBotLink(orderId?: string | null) {
  const username = getGroupBotUsername();
  if (!username) return null;
  const payload = orderId ? `order_${orderId}` : "support";
  return `https://t.me/${username}?start=${encodeURIComponent(payload)}`;
}

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

export type GroupTelegramUpdate = {
  update_id?: number;
  message?: GroupTelegramMessage;
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
  const text = message.toLowerCase();
  if (intent === "ORDER_STATUS") {
    return isPrivate
      ? "I understand you want to check the order status. Send the Order ID from your confirmation; if you have already sent it, send the private access token next."
      : "I can help check that order. I’ll move this to private support so your order details and access token stay protected.";
  }
  if (intent === "ORDER_SUPPORT") {
    return isPrivate
      ? "I understand this is about a specific order or payment. Send the Order ID from your confirmation and I’ll guide you through the next safe step."
      : "I understand this is about an order or payment. I’ll continue privately so no order details or payment information are exposed here.";
  }
  if (/price|cost|rate|currency|usd|inr|try|brl|php/.test(text)) {
    return "Prices depend on the game, region, package, and selected currency. Tell me the game and region, and I’ll point you to the correct catalogue before checkout.";
  }
  if (/game|available|support|top.?up|recharge/.test(text)) {
    return "Recharza offers regional top-ups for Mobile Legends, Free Fire, PUBG Mobile, VALORANT, and Genshin Impact. Which game and region are you trying to top up?";
  }
  if (/how|where|buy|purchase|checkout|pay|payment/.test(text)) {
    return "Choose a game and region, enter the required player details, select a package, and complete checkout. If payment was already made, tell me that privately with your Order ID.";
  }
  return isPrivate
    ? "I’m following you. Tell me whether you need help choosing a game, verifying a player ID, completing checkout, or checking an order."
    : "I can help with games, regions, player-ID verification, packages, checkout, and order support. Tell me what you are trying to do, and I’ll guide you from there.";
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

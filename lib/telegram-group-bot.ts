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

function deterministicSupportReply(message: string) {
  const text = message.toLowerCase();
  if (/price|cost|rate|currency|usd|inr|try|brl|php/.test(text)) {
    return "I can help you find the right game and region. Open the Recharza store to see the current local-currency price before checkout.";
  }
  if (/game|support|available|top.?up|recharge/.test(text)) {
    return "Recharza supports popular game top-ups across regional catalogues, including Mobile Legends, Free Fire, PUBG Mobile, VALORANT, and Genshin Impact. Tell me the game and region you need.";
  }
  if (/how|where|buy|purchase|checkout|pay|payment/.test(text)) {
    return "Choose your game and region, enter the required player details, select a package, and complete checkout. For payment or order-specific help, message me privately.";
  }
  return "I can help with game availability, regions, packages, checkout, and general top-up questions. Mention me with your question; for order or payment help, continue privately.";
}

export async function getGroupBotReply(input: {
  message: string;
  user?: GroupTelegramUser;
}) {
  const cleanMessage = stripGroupBotMention(input.message);
  const prompt = [
    "This is a public Recharza Telegram live-support group. Reply to the user’s message in a helpful, concise way.",
    "Do not reveal order details, access tokens, emails, phone numbers, payment data, or database information in the group.",
    "If the message contains an order ID or asks for account-specific help, tell the user to continue privately. Do not invent order data.",
    "Never claim that you changed an order, issued a refund, confirmed payment, or contacted a human unless the message context explicitly proves it.",
    "Answer general questions about Recharza game top-ups, regions, verification, payments, and delivery using cautious language. If uncertain, recommend private support.",
    "Keep the reply warm, natural, and under 700 characters.",
    `User: ${groupUserLabel(input.user)}`,
    `Message: ${cleanMessage}`,
  ].join("\n");

  try {
    const reply = await getGeminiSupportReply({ userMessage: prompt, userName: groupUserLabel(input.user) });
    if (reply) return escapeHtml(reply);
  } catch (error) {
    console.error("Gemini group support fallback", error instanceof Error ? error.message : "unknown error");
  }
  return escapeHtml(deterministicSupportReply(cleanMessage));
}

export function groupPrivacyNotice() {
  return "For privacy, I’ll continue this order or payment conversation privately. Please use the private chat button below and send your order ID there. Never post access tokens, OTPs, card details, or UPI PINs in this group.";
}

export function extractOrderId(text: string) {
  return text.match(/\bRZ-[A-Z0-9]{6,24}\b/i)?.[0]?.toUpperCase() || null;
}

export function privateBotLink(orderId?: string | null) {
  const username = getGroupBotUsername();
  if (!username) return null;
  const payload = orderId ? `order_${orderId}` : "support";
  return `https://t.me/${username}?start=${encodeURIComponent(payload)}`;
}

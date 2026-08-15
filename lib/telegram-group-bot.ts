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

export async function getGroupBotReply(input: {
  message: string;
  user?: GroupTelegramUser;
}) {
  const prompt = [
    "This is a public Recharza Telegram live-support group. Reply to the user’s message in a helpful, concise way.",
    "Do not reveal order details, access tokens, emails, phone numbers, payment data, or database information in the group.",
    "If the message contains an order ID or asks for account-specific help, tell the user to start a private chat with the support bot and provide the order ID plus private access token there.",
    "Never claim that you changed an order, issued a refund, confirmed payment, or contacted a human unless the message context explicitly proves it.",
    "Answer general questions about Recharza game top-ups, regions, verification, payments, and delivery using cautious language. If uncertain, ask them to use /support privately.",
    `User: ${groupUserLabel(input.user)}`,
    `Message: ${stripGroupBotMention(input.message)}`,
  ].join("\n");

  const reply = await getGeminiSupportReply({ userMessage: prompt, userName: groupUserLabel(input.user) });
  if (!reply) return null;
  return escapeHtml(reply);
}

export function groupPrivacyNotice() {
  return "For privacy, I can’t show order or payment details in this group. Please start a private chat with me and send your order ID plus the private access token from your confirmation.";
}

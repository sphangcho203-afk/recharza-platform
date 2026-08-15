import { timingSafeEqual } from "node:crypto";
import {
  getGroupBotReply,
  getGroupBotUsername,
  getGroupWebhookSecret,
  groupPrivacyNotice,
  messageMentionsGroupBot,
  sendGroupMessage,
  stripGroupBotMention,
  type GroupTelegramUpdate,
} from "@/lib/telegram-group-bot";

export const runtime = "nodejs";

function secretsMatch(received: string | null, expected: string | null) {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isGroup(type?: string) {
  return type === "group" || type === "supergroup";
}

function looksAccountSpecific(text: string) {
  return /\b(order|payment|refund|charged|transaction|account|my top.?up|status|delivery)\b/i.test(text) || /\bRZ-[A-Z0-9]{6,24}\b/i.test(text);
}

async function processGroupUpdate(update: GroupTelegramUpdate) {
  const message = update.message;
  if (!message?.text) return;

  const text = message.text.trim();
  const group = isGroup(message.chat.type);

  if (group && !messageMentionsGroupBot(message)) return;
  if (!group && !/^\/(?:start|help|support|order|status)\b/i.test(text)) return;

  const prompt = stripGroupBotMention(text);
  const chatId = String(message.chat.id);
  const username = getGroupBotUsername();

  if (/^\/(?:start|help)\b/i.test(prompt)) {
    await sendGroupMessage(
      chatId,
      `<b>RECHARZA LIVE SUPPORT</b>\n\nI’m the support assistant for this group. Mention @${username || "the bot"} for general store help.\n\nFor order or payment details, start a private chat with me. Never post access tokens, OTPs, card details, or UPI PINs in this group.`,
    );
    return;
  }

  if (looksAccountSpecific(prompt)) {
    await sendGroupMessage(
      chatId,
      `<b>PRIVATE SUPPORT REQUIRED</b>\n\n${groupPrivacyNotice()}${username ? `\n\nPrivate chat: https://t.me/${username}` : ""}`,
    );
    return;
  }

  try {
    const reply = await getGroupBotReply({ message: prompt, user: message.from });
    await sendGroupMessage(
      chatId,
      reply
        ? `<b>RECHARZA SUPPORT</b>\n\n${reply}`
        : "I can help with general store questions. For order-specific or payment help, please start a private chat and send /support.",
    );
  } catch (error) {
    console.error("Telegram group bot reply failed", error);
    await sendGroupMessage(chatId, "I’m temporarily unable to answer. Please try again or start a private chat with /support.");
  }
}

export async function POST(request: Request) {
  const expectedSecret = getGroupWebhookSecret();
  if (!expectedSecret || !secretsMatch(request.headers.get("x-telegram-bot-api-secret-token"), expectedSecret)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as GroupTelegramUpdate | null;
  if (!update) return Response.json({ ok: true });

  try {
    await processGroupUpdate(update);
  } catch (error) {
    console.error("Telegram group bot update failed", error);
  }
  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({ ok: true, service: "recharza-telegram-group-support" });
}

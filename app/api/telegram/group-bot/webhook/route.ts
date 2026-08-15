import { timingSafeEqual } from "node:crypto";
import {
  extractOrderId,
  getGroupBotReply,
  getGroupBotUsername,
  getGroupWebhookSecret,
  groupPrivacyNotice,
  messageMentionsGroupBot,
  privateBotLink,
  sendGroupMessage,
  sendPrivateMessage,
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
  return /\b(order|payment|refund|charged|transaction|account|my top.?up|status|delivery|receipt)\b/i.test(text) || Boolean(extractOrderId(text));
}

function isStartOrHelp(text: string) {
  return /^\/(?:start|help)\b/i.test(text);
}

function isPrivateSupportCommand(text: string) {
  return /^\/(?:support|order|status)\b/i.test(text);
}

async function processGroupUpdate(update: GroupTelegramUpdate) {
  const message = update.message;
  if (!message?.text || !message.from) return;

  const text = message.text.trim();
  const group = isGroup(message.chat.type);

  // In groups, the bot is quiet unless explicitly mentioned. In private chat,
  // every ordinary message is a support turn; no mention is required.
  if (group && !messageMentionsGroupBot(message)) return;
  const prompt = group ? stripGroupBotMention(text) : text.replace(/^\/(?:start|help|support|order|status)\b/i, "").trim();
  const chatId = String(message.chat.id);
  const username = getGroupBotUsername();

  if (isStartOrHelp(text)) {
    await sendGroupMessage(
      chatId,
      `<b>RECHARZA SUPPORT</b>\n\n${group ? `Mention @${username || "the bot"} for general store help.` : "Send your question here directly; mentions are not required in private chat."}\n\nFor order or payment help, continue privately. Never send access tokens, OTPs, card details, or UPI PINs in a group.`,
    );
    return;
  }

  if (group && looksAccountSpecific(prompt)) {
    const orderId = extractOrderId(prompt);
    const link = privateBotLink(orderId);
    let dmSent = false;
    try {
      await sendPrivateMessage(
        message.from.id,
        `<b>PRIVATE RECHARZA SUPPORT</b>\n\nI’ve privately opened your support path. ${orderId ? `I detected order <code>${orderId}</code>.` : "Please send your order ID there."}\n\nSend the order ID and any private access token from your confirmation in this chat. Never share tokens, OTPs, card details, or UPI PINs in the group.`,
      );
      dmSent = true;
    } catch (error) {
      console.error("Telegram group bot private handoff failed", error instanceof Error ? error.message : "unknown error");
    }

    const publicText = dmSent
      ? `<b>PRIVATE SUPPORT</b>\n\n${groupPrivacyNotice()}\n\nI’ve sent you a private message. Please continue there.`
      : `<b>PRIVATE SUPPORT</b>\n\n${groupPrivacyNotice()}${link ? `\n\n<a href="${link}">Open private support</a>` : ""}`;
    await sendGroupMessage(chatId, publicText);
    return;
  }

  if (!group && isPrivateSupportCommand(text) && !prompt) {
    await sendPrivateMessage(message.from.id, "<b>RECHARZA SUPPORT</b>\n\nSend your order ID and the private access token from your confirmation, or ask a general store question.");
    return;
  }

  try {
    const reply = await getGroupBotReply({ message: prompt || text, user: message.from });
    await (group ? sendGroupMessage(chatId, `<b>RECHARZA SUPPORT</b>\n\n${reply}`) : sendPrivateMessage(message.from.id, `<b>RECHARZA SUPPORT</b>\n\n${reply}`));
  } catch (error) {
    console.error("Telegram group bot reply failed", error instanceof Error ? error.message : "unknown error");
    const fallback = "I can help with general Recharza store questions. For order or payment help, send your order ID in this private chat.";
    await (group ? sendGroupMessage(chatId, fallback) : sendPrivateMessage(message.from.id, fallback));
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
    console.error("Telegram group bot update failed", error instanceof Error ? error.message : "unknown error");
  }
  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({ ok: true, service: "recharza-telegram-group-support" });
}

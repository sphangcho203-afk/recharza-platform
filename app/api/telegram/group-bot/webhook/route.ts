import { timingSafeEqual } from "node:crypto";

import { getPrisma } from "@/lib/prisma";
import { verifyOrderAccessToken } from "@/lib/order-security";
import {
  detectSupportIntent,
  extractOrderId,
  formatConversationHistory,
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
import {
  appendGroupTurn as appendSessionTurn,
  getGroupBotSession,
  saveGroupBotSession,
} from "@/lib/telegram-group-session";

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

function isStartOrHelp(text: string) {
  return /^\/(?:start|help)\b/i.test(text);
}

function isPrivateSupportCommand(text: string) {
  return /^\/(?:support|order|status)\b/i.test(text);
}

function commandPrompt(text: string) {
  return text.replace(/^\/(?:start|help|support|order|status)\b/i, "").trim();
}

function extractAccessToken(text: string) {
  const candidates = text.match(/\b[A-Za-z0-9_-]{40,96}\b/g) || [];
  return candidates.find((candidate) => !/^RZ-/i.test(candidate)) || null;
}

function safe(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function statusLabel(status: string) {
  return status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

async function lookupOrderStatus(orderId: string, accessToken: string) {
  const order = await getPrisma().order.findUnique({
    where: { publicId: orderId },
    select: {
      publicId: true,
      status: true,
      gameSlug: true,
      packageName: true,
      currency: true,
      amountInPaise: true,
      accessTokenHash: true,
      updatedAt: true,
    },
  });
  if (!order) return { kind: "not-found" as const };
  if (!verifyOrderAccessToken(accessToken, order.accessTokenHash)) return { kind: "invalid-token" as const };
  return { kind: "ok" as const, order };
}

async function processGroupUpdate(update: GroupTelegramUpdate) {
  const message = update.message;
  if (!message?.text || !message.from) return;

  const text = message.text.trim();
  const group = isGroup(message.chat.type);
  if (group && !messageMentionsGroupBot(message)) return;

  const userId = String(message.from.id);
  const chatId = String(message.chat.id);
  const currentSession = await getGroupBotSession(chatId, userId);
  const privateSession = !group ? currentSession : await getGroupBotSession(userId, userId);
  const currentState = privateSession?.state || currentSession?.state || {
    turns: [],
    orderId: null,
    pendingIntent: "GENERAL" as const,
    updatedAt: new Date().toISOString(),
  };
  const prompt = group ? stripGroupBotMention(text) : commandPrompt(text);
  const intent = detectSupportIntent(prompt || text, currentState.orderId);
  const username = getGroupBotUsername();

  if (isStartOrHelp(text)) {
    await sendGroupMessage(
      chatId,
      `<b>RECHARZA SUPPORT</b>\n\n${group ? `Mention @${username || "the bot"} for general store help.` : "Send your question here directly; mentions are not required in private chat."}\n\nI remember the recent conversation, so you can ask follow-up questions naturally. For order or payment help, continue privately. Never send access tokens, OTPs, card details, or UPI PINs in a group.`,
    );
    return;
  }

  if (group && (intent === "ORDER_STATUS" || intent === "ORDER_SUPPORT")) {
    const orderId = extractOrderId(prompt) || currentState.orderId;
    const nextState = appendSessionTurn(
      currentState,
      { role: "user", text: prompt },
      { orderId, pendingIntent: intent },
    );
    await saveGroupBotSession({ chatId, telegramUserId: userId, state: nextState });
    await saveGroupBotSession({ chatId: userId, telegramUserId: userId, state: nextState });

    const link = privateBotLink(orderId);
    let dmSent = false;
    try {
      await sendPrivateMessage(
        message.from.id,
        `<b>PRIVATE RECHARZA SUPPORT</b>\n\nI’m continuing your conversation here. ${orderId ? `I remembered order <code>${safe(orderId)}</code>.` : "Tell me the Order ID when you are ready."}\n\nYou can now ask follow-up questions normally. For a status check, I’ll ask only for the missing Order ID or private access token. Never share tokens, OTPs, card details, or UPI PINs in the group.`,
      );
      dmSent = true;
    } catch (error) {
      console.error("Telegram group bot private handoff failed", error instanceof Error ? error.message : "unknown error");
    }

    const publicText = dmSent
      ? `<b>PRIVATE SUPPORT</b>\n\n${groupPrivacyNotice()}\n\nI’ve continued this conversation in your private chat. You can ask the next question there without mentioning me.`
      : `<b>PRIVATE SUPPORT</b>\n\n${groupPrivacyNotice()}${link ? `\n\n<a href="${link}">Open private support</a>` : ""}`;
    await sendGroupMessage(chatId, publicText);
    return;
  }

  if (!group && (intent === "ORDER_STATUS" || currentState.pendingIntent === "ORDER_STATUS" || isPrivateSupportCommand(text))) {
    const orderId = extractOrderId(prompt) || currentState.orderId;
    const accessToken = extractAccessToken(prompt);
    let nextState = appendSessionTurn(currentState, { role: "user", text: prompt || text }, {
      orderId,
      pendingIntent: "ORDER_STATUS",
    });

    if (!orderId) {
      await saveGroupBotSession({ chatId, telegramUserId: userId, state: nextState });
      await sendPrivateMessage(message.from.id, "<b>ORDER STATUS</b>\n\nI can check that for you. Please send the Order ID from your confirmation, for example <code>RZ-ABC123</code>.");
      return;
    }
    if (!accessToken) {
      await saveGroupBotSession({ chatId, telegramUserId: userId, state: nextState });
      await sendPrivateMessage(message.from.id, `<b>ORDER STATUS</b>\n\nI found order <code>${safe(orderId)}</code>. Please send the private access token from that order’s confirmation. I will use it only to verify this status and will not repeat it.`);
      return;
    }

    try {
      const result = await lookupOrderStatus(orderId, accessToken);
      if (result.kind === "not-found") {
        await sendPrivateMessage(message.from.id, "I couldn’t find that Order ID. Please check the confirmation and send the exact ID again.");
        return;
      }
      if (result.kind === "invalid-token") {
        await sendPrivateMessage(message.from.id, "The access token did not match that Order ID. Please copy the private token from the same order confirmation and try again.");
        return;
      }
      const reply = `<b>ORDER STATUS</b>\n\nOrder <code>${safe(result.order.publicId)}</code> is <b>${safe(statusLabel(result.order.status))}</b>.\nGame: ${safe(result.order.gameSlug)}\nPackage: ${safe(result.order.packageName)}\nLast updated: ${safe(result.order.updatedAt.toISOString())}\n\nIf this status does not match what you expected, tell me what happened and I’ll guide you through the next support step.`;
      nextState = appendSessionTurn(nextState, { role: "assistant", text: `Order status checked: ${result.order.status}` }, { pendingIntent: "GENERAL" });
      await saveGroupBotSession({ chatId, telegramUserId: userId, state: nextState });
      await sendPrivateMessage(message.from.id, reply);
      return;
    } catch (error) {
      console.error("Group bot order lookup failed", error instanceof Error ? error.message : "unknown error");
      await sendPrivateMessage(message.from.id, "Order tracking is temporarily unavailable. Please try again in a moment or ask for human support.");
      return;
    }
  }

  const history = formatConversationHistory(currentState.turns);
  const reply = await getGroupBotReply({
    message: prompt || text,
    user: message.from,
    conversationHistory: history,
    intent,
    isPrivate: !group,
  });
  const nextState = appendSessionTurn(
    currentState,
    { role: "user", text: prompt || text },
    { pendingIntent: intent },
  );
  const finalState = appendSessionTurn(nextState, { role: "assistant", text: reply });
  await saveGroupBotSession({ chatId, telegramUserId: userId, state: finalState });
  await (group
    ? sendGroupMessage(chatId, `<b>RECHARZA SUPPORT</b>\n\n${reply}`)
    : sendPrivateMessage(message.from.id, `<b>RECHARZA SUPPORT</b>\n\n${reply}`));
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

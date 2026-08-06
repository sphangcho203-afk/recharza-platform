import { timingSafeEqual } from "node:crypto";

import {
  answerTelegramCallback,
  getTelegramSupportChatId,
  sendTelegramCustomerMessage,
} from "@/lib/support-delivery";
import {
  createAndDeliverSupportTicket,
  getSupportTicketForWorker,
  linkTelegramSupportTicket,
  markSupportTicketReplied,
  updateSupportTicketStatus,
} from "@/lib/support-service";
import {
  SUPPORT_CATEGORIES,
  supportCategoryLabel,
  type SupportCategory,
  validateSupportTicketInput,
} from "@/lib/support";

export const runtime = "nodejs";

const MAX_UPDATE_BYTES = 64_000;

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
  type?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: TelegramChat;
  from?: TelegramUser;
  reply_to_message?: {
    text?: string;
  };
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

function secretsMatch(received: string | null, expected: string | undefined) {
  const expectedValue = expected?.trim();
  if (!received || !expectedValue) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expectedValue);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function customerName(user: TelegramUser | undefined) {
  if (!user) return null;
  const value = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return value.slice(0, 80) || null;
}

function categoryKeyboard() {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let index = 0; index < SUPPORT_CATEGORIES.length; index += 2) {
    rows.push(
      SUPPORT_CATEGORIES.slice(index, index + 2).map((category) => ({
        text: category.label,
        callback_data: `support:${category.value}`,
      })),
    );
  }
  return { inline_keyboard: rows };
}

async function showSupportMenu(chatId: string) {
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>Recharza Support</b>",
      "",
      "How can we help? Choose the closest problem below.",
      "",
      "Never send passwords, OTPs, UPI PINs, card PINs, or remote-access codes.",
    ].join("\n"),
    { reply_markup: categoryKeyboard() },
  );
}

function categoryFromCallback(value: string | undefined) {
  if (!value?.startsWith("support:")) return null;
  const requested = value.slice("support:".length);
  return (
    SUPPORT_CATEGORIES.find((category) => category.value === requested)?.value ??
    null
  );
}

function categoryFromPrompt(prompt: string | undefined) {
  if (!prompt) return null;
  return (
    SUPPORT_CATEGORIES.find((category) => prompt.includes(category.label))?.value ??
    null
  );
}

function parseCustomerReply(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  const lines = normalized.split("\n");
  const firstLine = (lines.shift() ?? "").trim();
  const orderId = /^(NO ORDER|NONE|N\/A)$/i.test(firstLine)
    ? ""
    : firstLine;
  const description = lines.join("\n").trim();
  return { orderId, description };
}

async function handleStart(message: TelegramMessage, payload: string) {
  const chatId = String(message.chat.id);
  const user = message.from;

  if (payload.startsWith("link_")) {
    const parts = payload.match(/^(link)_(RZS-[A-Z0-9]{16})_([A-Za-z0-9]{32})$/);
    if (!parts) {
      await sendTelegramCustomerMessage(
        chatId,
        "That support link is invalid or incomplete. Open the support page and create a new request.",
      );
      return;
    }

    try {
      const linked = await linkTelegramSupportTicket({
        publicId: parts[2],
        token: parts[3],
        telegramUserId: String(user?.id ?? message.chat.id),
        telegramChatId: chatId,
        telegramUsername: user?.username ?? null,
      });

      if (!linked) {
        await sendTelegramCustomerMessage(
          chatId,
          "This ticket link has expired, was already connected, or is invalid.",
        );
        return;
      }

      await sendTelegramCustomerMessage(
        chatId,
        [
          "<b>Telegram connected</b>",
          "",
          `Ticket <code>${linked.publicId}</code> is now linked to this chat.`,
          "Support replies for this ticket can arrive here.",
        ].join("\n"),
      );
      return;
    } catch (error) {
      console.error("Telegram ticket linking failed", error);
      await sendTelegramCustomerMessage(
        chatId,
        "Ticket linking is temporarily unavailable. Keep your ticket ID and try again later.",
      );
      return;
    }
  }

  await showSupportMenu(chatId);
}

async function handleCategoryCallback(callback: TelegramCallbackQuery) {
  const category = categoryFromCallback(callback.data);
  const chatId = callback.message ? String(callback.message.chat.id) : null;
  if (!category || !chatId) return false;

  await answerTelegramCallback(callback.id, supportCategoryLabel(category));
  await sendTelegramCustomerMessage(
    chatId,
    [
      `<b>${supportCategoryLabel(category)}</b>`,
      "",
      "Reply to this message using:",
      "",
      "<code>RZ-ORDER-ID</code> or <code>NO ORDER</code>",
      "Then describe what happened on the next line.",
      "",
      "Example:",
      "<code>RZ-ABC123456789",
      "Payment was deducted, but the order still shows unpaid.</code>",
    ].join("\n"),
    {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: "Order ID or NO ORDER, then describe the issue",
        selective: true,
      },
    },
  );
  return true;
}

async function handleCustomerFormReply(message: TelegramMessage) {
  const category = categoryFromPrompt(message.reply_to_message?.text);
  if (!category || !message.text) return false;

  const chatId = String(message.chat.id);
  const parsed = parseCustomerReply(message.text);
  const validation = validateSupportTicketInput({
    category,
    subject: supportCategoryLabel(category),
    description: parsed.description,
    orderId: parsed.orderId,
    game: "",
    replyChannel: "TELEGRAM",
    name: customerName(message.from),
    email: "",
    telegramUsername: message.from?.username ?? "",
  });

  if (!validation.ok) {
    await sendTelegramCustomerMessage(
      chatId,
      `${validation.message}\n\nReply to the support form again with the order ID on the first line and a clear description below it.`,
    );
    return true;
  }

  try {
    const ticket = await createAndDeliverSupportTicket({
      ...validation.data,
      source: "TELEGRAM",
      telegramUserId: String(message.from?.id ?? message.chat.id),
      telegramChatId: chatId,
      metadata: { telegramMessageId: message.message_id },
    });

    await sendTelegramCustomerMessage(
      chatId,
      [
        "<b>Support request submitted</b>",
        "",
        `Ticket: <code>${ticket.publicId}</code>`,
        `Category: ${supportCategoryLabel(category)}`,
        "Status: Open",
        "",
        "Keep the ticket ID. A support reply can arrive in this chat.",
      ].join("\n"),
    );
  } catch (error) {
    console.error("Telegram support submission failed", error);
    await sendTelegramCustomerMessage(
      chatId,
      "The support request could not be submitted right now. Try again or use WhatsApp, Instagram, or Gmail from the Recharza support page.",
    );
  }

  return true;
}

function isWorkerChat(chatId: string) {
  const workerChatId = getTelegramSupportChatId();
  return Boolean(workerChatId && workerChatId === chatId);
}

async function notifyTicketCustomer(
  ticket: Awaited<ReturnType<typeof getSupportTicketForWorker>>,
  text: string,
) {
  if (!ticket?.telegramChatId) return;
  await sendTelegramCustomerMessage(
    ticket.telegramChatId,
    [
      `<b>Recharza Support · ${ticket.publicId}</b>`,
      "",
      text,
    ].join("\n"),
  ).catch((error) => console.error("Customer Telegram notification failed", error));
}

async function handleWorkerCallback(callback: TelegramCallbackQuery) {
  const data = callback.data ?? "";
  const match = data.match(/^worker:(claim|pending|resolve):(RZS-[A-Z0-9]{16})$/);
  const chatId = callback.message ? String(callback.message.chat.id) : null;
  if (!match || !chatId || !isWorkerChat(chatId)) return false;

  const action = match[1];
  const publicId = match[2];
  const status =
    action === "claim"
      ? "ASSIGNED"
      : action === "pending"
        ? "WAITING_CUSTOMER"
        : "RESOLVED";

  try {
    const ticket = await updateSupportTicketStatus(publicId, status);
    if (!ticket) {
      await answerTelegramCallback(callback.id, "Ticket not found");
      return true;
    }

    await answerTelegramCallback(
      callback.id,
      action === "claim"
        ? "Ticket claimed"
        : action === "pending"
          ? "Marked pending"
          : "Ticket resolved",
    );

    if (action === "pending") {
      await notifyTicketCustomer(
        ticket,
        "Your request is waiting for more information. Reply in this chat when support asks a question.",
      );
    } else if (action === "resolve") {
      await notifyTicketCustomer(
        ticket,
        "Your support request has been marked resolved. Reply here if the problem is not fixed.",
      );
    }
  } catch (error) {
    console.error("Worker support action failed", error);
    await answerTelegramCallback(callback.id, "Action failed").catch(() => undefined);
  }

  return true;
}

async function handleWorkerCommand(message: TelegramMessage) {
  const chatId = String(message.chat.id);
  if (!isWorkerChat(chatId) || !message.text) return false;

  const replyMatch = message.text.match(/^\/reply(?:@\w+)?\s+(RZS-[A-Z0-9]{16})\s+([\s\S]{1,2000})$/i);
  if (replyMatch) {
    const publicId = replyMatch[1].toUpperCase();
    const reply = replyMatch[2].trim();
    try {
      const ticket = await getSupportTicketForWorker(publicId);
      if (!ticket) {
        await sendTelegramCustomerMessage(chatId, `Ticket <code>${publicId}</code> was not found.`);
        return true;
      }
      if (!ticket.telegramChatId) {
        await sendTelegramCustomerMessage(
          chatId,
          `Ticket <code>${publicId}</code> is not connected to Telegram. Reply through the recorded email channel.`,
        );
        return true;
      }

      await notifyTicketCustomer(ticket, reply);
      await markSupportTicketReplied(publicId);
      await sendTelegramCustomerMessage(chatId, `Reply sent for <code>${publicId}</code>.`);
    } catch (error) {
      console.error("Worker ticket reply failed", error);
      await sendTelegramCustomerMessage(chatId, `Reply failed for <code>${publicId}</code>.`);
    }
    return true;
  }

  const resolveMatch = message.text.match(/^\/resolve(?:@\w+)?\s+(RZS-[A-Z0-9]{16})$/i);
  if (resolveMatch) {
    const publicId = resolveMatch[1].toUpperCase();
    try {
      const ticket = await updateSupportTicketStatus(publicId, "RESOLVED");
      if (!ticket) {
        await sendTelegramCustomerMessage(chatId, `Ticket <code>${publicId}</code> was not found.`);
        return true;
      }
      await notifyTicketCustomer(ticket, "Your support request has been marked resolved.");
      await sendTelegramCustomerMessage(chatId, `Resolved <code>${publicId}</code>.`);
    } catch (error) {
      console.error("Worker resolve command failed", error);
      await sendTelegramCustomerMessage(chatId, `Could not resolve <code>${publicId}</code>.`);
    }
    return true;
  }

  return false;
}

async function processUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    if (await handleWorkerCallback(update.callback_query)) return;
    if (await handleCategoryCallback(update.callback_query)) return;
    await answerTelegramCallback(update.callback_query.id).catch(() => undefined);
    return;
  }

  const message = update.message;
  if (!message?.text) return;

  if (await handleWorkerCommand(message)) return;

  const startMatch = message.text.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  if (startMatch) {
    await handleStart(message, (startMatch[1] ?? "").trim());
    return;
  }

  if (await handleCustomerFormReply(message)) return;

  if (message.chat.type === "private") {
    await showSupportMenu(String(message.chat.id));
  }
}

export async function POST(request: Request) {
  if (
    !secretsMatch(
      request.headers.get("x-telegram-bot-api-secret-token"),
      process.env.TELEGRAM_WEBHOOK_SECRET,
    )
  ) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_UPDATE_BYTES) {
    return Response.json({ ok: true, ignored: true });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) return Response.json({ ok: true, ignored: true });

  try {
    await processUpdate(update);
  } catch (error) {
    console.error("Telegram support webhook processing failed", error);
  }

  return Response.json({ ok: true });
}

import { timingSafeEqual } from "node:crypto";

import {
  clearSupportBotSession,
  getSupportBotSession,
  markTelegramUpdateProcessed,
  setPendingStaffReply,
  startSupportBotSession,
  telegramUpdateAlreadyProcessed,
  updateSupportBotSession,
  type SupportBotSession,
} from "@/lib/support-bot-session";
import {
  answerTelegramCallback,
  getTelegramSupportChatId,
  sendTelegramCustomerMessage,
  sendTelegramReplyRequest,
} from "@/lib/support-delivery";
import {
  createAndDeliverSupportTicket,
  getSupportTicketForTelegram,
  getSupportTicketForWorker,
  linkTelegramSupportTicket,
  markSupportTicketReplied,
  recordSupportStaffReply,
  updateSupportTicketStatus,
} from "@/lib/support-service";
import {
  SUPPORT_CATEGORIES,
  supportCategoryLabel,
  supportTicketStatusLabel,
  validateSupportTicketInput,
  type SupportCategory,
} from "@/lib/support";
import { PRIMARY_TELEGRAM_HELP } from "@/lib/telegram-support-menu";

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanLine(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanDetails(value: string, maxLength = 2_000) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

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

function categoryButtonLabel(category: SupportCategory) {
  const labels: Record<SupportCategory, string> = {
    ORDER_NOT_RECEIVED: "⚡ Top-up missing",
    ORDER_PROCESSING: "⏳ Order processing",
    PAYMENT_FAILED: "💳 Payment failed",
    PAYMENT_DEDUCTED: "💸 Money deducted",
    WRONG_PLAYER: "🎯 Player / server",
    WRONG_PACKAGE: "📦 Wrong package",
    REGION_ISSUE: "🌐 Region / market",
    BONUS_PROMO: "🎁 Bonus / promo",
    REFUND_CANCELLATION: "↩️ Refund / cancel",
    ACCOUNT_ACCESS: "🔐 Account access",
    SUSPICIOUS_ACTIVITY: "🛡️ Suspicious activity",
    OTHER: "🧩 Something else",
  };
  return labels[category];
}

function categoryKeyboard() {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let index = 0; index < SUPPORT_CATEGORIES.length; index += 2) {
    rows.push(
      SUPPORT_CATEGORIES.slice(index, index + 2).map((category) => ({
        text: categoryButtonLabel(category.value),
        callback_data: `support:${category.value}`,
      })),
    );
  }
  rows.push([
    { text: "📌 Check ticket status", callback_data: "support:status" },
    { text: "❔ Help & commands", callback_data: "support:help" },
  ]);
  return { inline_keyboard: rows };
}

async function showSupportMenu(chatId: string) {
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>👋 Recharza Support</b>",
      "<code>● SUPPORT ONLINE</code>",
      "",
      "I’m ready to help. What happened? Pick the closest option and I’ll guide you from there.",
      "We’ll sort it out together in four quick steps—just reply naturally and I’ll keep up.",
      "",
      "<i>For your safety, never send passwords, OTPs, UPI PINs, card PINs, or remote-access codes.</i>",
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

async function showSupportHelp(chatId: string) {
  await sendTelegramCustomerMessage(chatId, PRIMARY_TELEGRAM_HELP, {
    reply_markup: categoryKeyboard(),
  });
}

async function askForTicketStatus(chatId: string) {
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>📌 Check ticket status</b>",
      "",
      "Send the Recharza support ticket ID that is already linked to this Telegram chat.",
      "Example: <code>/status RZS-ABCDEF1234567890</code>",
      "",
      "For order delivery status, use the secure tracking link from your order email. The bot will not expose order details from an unverified chat.",
    ].join("\n"),
    { reply_markup: categoryKeyboard() },
  );
}

function telegramUserId(user: TelegramUser | undefined, chat: TelegramChat) {
  return String(user?.id ?? chat.id);
}

async function askForTitle(chatId: string, category: SupportCategory) {
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>🧭 Step 1 of 4 · Issue type</b>",
      `<code>${escapeHtml(supportCategoryLabel(category).toUpperCase())}</code>`,
      "",
      "Give this issue a short title so I can keep the request organized.",
      "",
      "Example: <i>Payment completed but order stayed unpaid</i>",
    ].join("\n"),
    {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: "Short issue title",
        selective: true,
      },
    },
  );
}

async function askForOrder(chatId: string) {
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>🔗 Step 2 of 4 · Order link</b>",
      "<code>ORDER LINK</code>",
      "",
      "Do you have a Recharza order ID for this issue? Send it here and I’ll attach it securely.",
      "No order? That’s completely fine—use the button below and we’ll continue.",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [[{ text: "➡️ Continue without an order", callback_data: "draft:no-order" }]],
      },
    },
  );
}

async function askForDescription(chatId: string) {
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>📝 Step 3 of 4 · What happened?</b>",
      "<code>DETAILS</code>",
      "",
      "Tell me what happened in your own words.",
      "What did you expect, what happened instead, and did you see an error message? The more context you share, the faster I can help.",
      "",
      "<i>Do not include passwords, OTPs, PINs, full card numbers, or login codes.</i>",
    ].join("\n"),
    {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: "Describe the issue clearly",
        selective: true,
      },
    },
  );
}

async function showDraftReview(chatId: string, session: SupportBotSession) {
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>✅ Step 4 of 4 · Review</b>",
      "<code>READY TO SEND</code>",
      "",
      `<b>Category</b>  ${escapeHtml(supportCategoryLabel(session.category))}`,
      `<b>Title</b>  ${escapeHtml(session.subject || "Not entered")}`,
      `<b>Order</b>  <code>${escapeHtml(session.orderPublicId || "NO ORDER")}</code>`,
      "",
      `<b>Report</b>\n${escapeHtml(session.description || "Not entered")}`,
      "",
      "Does everything look right? Send it when you’re ready and the support team will take it from there.",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🚀 SEND TO SUPPORT", callback_data: "draft:submit" },
            { text: "✏️ EDIT", callback_data: "draft:edit" },
          ],
          [{ text: "✕ CANCEL", callback_data: "draft:cancel" }],
        ],
      },
    },
  );
}

async function handleTicketStatus(message: TelegramMessage, order: string) {
  const chatId = String(message.chat.id);
  const publicId = order.trim().toUpperCase();
  if (!/^RZS-[A-Z0-9]{16}$/.test(publicId)) {
    await sendTelegramCustomerMessage(
      chatId,
      "Use a valid support ticket ID, for example <code>/status RZS-ABCDEF1234567890</code>.",
      { reply_markup: categoryKeyboard() },
    );
    return;
  }

  const ticket = await getSupportTicketForTelegram({
    publicId,
    telegramChatId: chatId,
  });
  if (!ticket) {
    await sendTelegramCustomerMessage(
      chatId,
      "I could not find a ticket with that ID linked to this Telegram chat. Check the ID or open the original Recharza support link.",
      { reply_markup: categoryKeyboard() },
    );
    return;
  }

  const status = String(ticket.status).toUpperCase();
  const statusLabel =
    status === "OPEN" || status === "ASSIGNED" || status === "WAITING_CUSTOMER" || status === "UNDER_REVIEW" || status === "RESOLVED" || status === "CLOSED"
      ? supportTicketStatusLabel(status)
      : status;
  await sendTelegramCustomerMessage(
    chatId,
    [
      `<b>📌 Ticket ${escapeHtml(ticket.publicId)}</b>`,
      "",
      `<b>Status:</b> ${escapeHtml(statusLabel)}`,
      `<b>Issue:</b> ${escapeHtml(supportCategoryLabel(ticket.category))}`,
      `<b>Subject:</b> ${escapeHtml(ticket.subject)}`,
      "",
      status === "RESOLVED" || status === "CLOSED"
        ? "If the problem is still present, start a new request and include this ticket ID."
        : "Your request is still with support. Keep this chat open for the next reply.",
    ].join("\n"),
    { reply_markup: categoryKeyboard() },
  );
}

async function handleStart(message: TelegramMessage, payload: string) {
  const chatId = String(message.chat.id);
  const userId = telegramUserId(message.from, message.chat);

  if (!payload.startsWith("link_")) {
    await clearSupportBotSession(chatId, userId).catch(() => undefined);
    await showSupportMenu(chatId);
    return;
  }

  const parts = payload.match(/^(link)_(RZS-[A-Z0-9]{16})_([A-Za-z0-9]{32})$/);
  if (!parts) {
    await sendTelegramCustomerMessage(
      chatId,
      "That support link is invalid or incomplete. Open the Recharza support page and create a new request.",
    );
    return;
  }

  const linked = await linkTelegramSupportTicket({
    publicId: parts[2],
    token: parts[3],
    telegramUserId: userId,
    telegramChatId: chatId,
    telegramUsername: message.from?.username ?? null,
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
      "<b>LINK ESTABLISHED // RECHARZA SUPPORT</b>",
      "",
      `Ticket <code>${linked.publicId}</code> is connected to this chat.`,
      "Support replies can now arrive here.",
    ].join("\n"),
  );
}

async function handleSupportCallback(callback: TelegramCallbackQuery) {
  const data = callback.data ?? "";
  const message = callback.message;
  if (!message || message.chat.type !== "private") return false;

  const chatId = String(message.chat.id);
  if (data === "support:help") {
    await answerTelegramCallback(callback.id, "Help and commands");
    await showSupportHelp(chatId);
    return true;
  }
  if (data === "support:status") {
    await answerTelegramCallback(callback.id, "Ticket status");
    await askForTicketStatus(chatId);
    return true;
  }
  return false;
}

async function handleCategoryCallback(callback: TelegramCallbackQuery) {
  const category = categoryFromCallback(callback.data);
  const message = callback.message;
  if (!category || !message || message.chat.type !== "private") return false;

  const chatId = String(message.chat.id);
  const userId = String(callback.from.id);
  await startSupportBotSession({ chatId, telegramUserId: userId, category });
  await answerTelegramCallback(callback.id, supportCategoryLabel(category));
  await askForTitle(chatId, category);
  return true;
}

async function handleDraftMessage(message: TelegramMessage) {
  if (message.chat.type !== "private" || !message.text) return false;
  const chatId = String(message.chat.id);
  const userId = telegramUserId(message.from, message.chat);
  const session = await getSupportBotSession(chatId, userId);
  if (!session) return false;

  if (session.step === "TITLE") {
    const subject = cleanLine(message.text, 120);
    if (subject.length < 5) {
      await sendTelegramCustomerMessage(chatId, "That title is a little short 🙂 Please use at least 5 characters so I know what to focus on.");
      await askForTitle(chatId, session.category);
      return true;
    }
    await updateSupportBotSession(chatId, userId, { subject, step: "ORDER" });
    await askForOrder(chatId);
    return true;
  }

  if (session.step === "ORDER") {
    const value = cleanLine(message.text, 32).toUpperCase();
    if (/^(NO ORDER|NONE|N\/A)$/i.test(value)) {
      await updateSupportBotSession(chatId, userId, {
        orderPublicId: null,
        step: "DESCRIPTION",
      });
      await askForDescription(chatId);
      return true;
    }
    if (!/^RZ-[A-Z0-9]{6,24}$/.test(value)) {
      await sendTelegramCustomerMessage(
        chatId,
        "Hmm, that doesn’t look like a Recharza order ID yet. Please send something like <code>RZ-XXXXXXXXXXXX</code>, or tap <b>Continue without an order</b>.",
      );
      await askForOrder(chatId);
      return true;
    }
    await updateSupportBotSession(chatId, userId, {
      orderPublicId: value,
      step: "DESCRIPTION",
    });
    await askForDescription(chatId);
    return true;
  }

  if (session.step === "DESCRIPTION") {
    const description = cleanDetails(message.text);
    if (description.length < 20) {
      await sendTelegramCustomerMessage(
        chatId,
        "Could you add a little more detail? A sentence or two will help the support team understand what went wrong 🙂",
      );
      await askForDescription(chatId);
      return true;
    }
    const updated = await updateSupportBotSession(chatId, userId, {
      description,
      step: "REVIEW",
    });
    if (updated) await showDraftReview(chatId, updated);
    return true;
  }

  if (session.step === "REVIEW") {
    await sendTelegramCustomerMessage(
      chatId,
      "Your support request is ready above. Tap <b>Send to support</b> when it looks right, or choose <b>Edit</b> if you want to change anything.",
    );
    return true;
  }

  return false;
}

async function submitDraft(callback: TelegramCallbackQuery, session: SupportBotSession) {
  const message = callback.message;
  if (!message) return;
  const chatId = String(message.chat.id);
  const userId = String(callback.from.id);

  const validation = validateSupportTicketInput({
    category: session.category,
    subject: session.subject,
    description: session.description,
    orderId: session.orderPublicId,
    game: "",
    replyChannel: "TELEGRAM",
    name: customerName(callback.from),
    email: "",
    telegramUsername: callback.from.username ?? "",
  });

  if (!validation.ok) {
    await answerTelegramCallback(callback.id, "Draft needs attention");
    await sendTelegramCustomerMessage(
      chatId,
      `${escapeHtml(validation.message)}\n\nChoose EDIT and correct the draft.`,
    );
    return;
  }

  const ticket = await createAndDeliverSupportTicket({
    ...validation.data,
    source: "TELEGRAM",
    telegramUserId: userId,
    telegramChatId: chatId,
    metadata: { telegramReviewMessageId: message.message_id },
  });

  await clearSupportBotSession(chatId, userId);
  await answerTelegramCallback(callback.id, "Ticket transmitted");
  await sendTelegramCustomerMessage(
    chatId,
    [
      "<b>🎉 Request sent</b>",
      "<code>RECHARZA SUPPORT</code>",
      "",
      `Ticket  <code>${ticket.publicId}</code>`,
      `Category  ${escapeHtml(supportCategoryLabel(session.category))}`,
      "Status  <b>OPEN</b>",
      "",
      "Keep the ticket ID—our support team can reply right here. I’m glad you reached out.",
    ].join("\n"),
    {
      reply_markup: {
        inline_keyboard: [[{ text: "➕ New request", callback_data: "draft:new" }]],
      },
    },
  );
}

async function handleDraftCallback(callback: TelegramCallbackQuery) {
  const action = callback.data ?? "";
  if (!action.startsWith("draft:")) return false;
  const message = callback.message;
  if (!message || message.chat.type !== "private") return false;

  const chatId = String(message.chat.id);
  const userId = String(callback.from.id);

  if (action === "draft:new") {
    await clearSupportBotSession(chatId, userId).catch(() => undefined);
    await answerTelegramCallback(callback.id, "New request");
    await showSupportMenu(chatId);
    return true;
  }

  const session = await getSupportBotSession(chatId, userId);
  if (!session) {
    await answerTelegramCallback(callback.id, "Draft expired");
    await sendTelegramCustomerMessage(
      chatId,
      "This draft expired. Start a new support request.",
      { reply_markup: categoryKeyboard() },
    );
    return true;
  }

  if (action === "draft:no-order" && session.step === "ORDER") {
    await updateSupportBotSession(chatId, userId, {
      orderPublicId: null,
      step: "DESCRIPTION",
    });
    await answerTelegramCallback(callback.id, "Continuing without order ID");
    await askForDescription(chatId);
    return true;
  }

  if (action === "draft:edit") {
    await updateSupportBotSession(chatId, userId, {
      step: "TITLE",
      subject: null,
      orderPublicId: null,
      description: null,
    });
    await answerTelegramCallback(callback.id, "Editing draft");
    await askForTitle(chatId, session.category);
    return true;
  }

  if (action === "draft:cancel") {
    await clearSupportBotSession(chatId, userId);
    await answerTelegramCallback(callback.id, "Draft cancelled");
    await sendTelegramCustomerMessage(chatId, "Draft deleted. No ticket was created.");
    await showSupportMenu(chatId);
    return true;
  }

  if (action === "draft:submit" && session.step === "REVIEW") {
    await submitDraft(callback, session);
    return true;
  }

  if (action === "worker:quickreply") {
    await handleWorkerQuickReply(callback, "WORKER");
    return true;
  }

  await answerTelegramCallback(callback.id, "That action is no longer available");
  return true;
}

async function handleWorkerQuickReply(
  callback: TelegramCallbackQuery,
  mode: "WORKER" | "GROUP",
) {
  const data = callback.data ?? "";
  const match = data.match(/^worker:quickreply:(RZS-[A-Z0-9]{16})$/);
  const chatId = callback.message ? String(callback.message.chat.id) : null;
  if (!match || !chatId) return;
  const workerUserId = String(callback.from.id ?? chatId);
  if (mode === "WORKER" && !isWorkerActionAuthorized(chatId, workerUserId)) {
    await answerTelegramCallback(callback.id, "Worker action not authorized");
    return;
  }
  const ticket = await getSupportTicketForWorker(match[1]);
  if (!ticket) {
    await answerTelegramCallback(callback.id, "Ticket not found");
    return;
  }
  if (!ticket.telegramChatId) {
    await answerTelegramCallback(
      callback.id,
      "This ticket is not connected to Telegram. Use its recorded email channel.",
    );
    return;
  }
  const stored = await setPendingStaffReply({
    workerChatId: chatId,
    workerUserId,
    ticketPublicId: ticket.publicId,
  });
  if (!stored) {
    await answerTelegramCallback(callback.id, "Could not open the reply flow. Try again.");
    return;
  }
  await answerTelegramCallback(callback.id, `Reply mode · ${ticket.publicId}`);
  await sendTelegramReplyRequest(chatId, ticket.publicId);
}

function workerUserIds() {
  return new Set(
    (process.env.TELEGRAM_WORKER_USER_IDS || "")
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value)),
  );
}

function isWorkerActionAuthorized(chatId: string, userId: string | null) {
  const workerChatId = getTelegramSupportChatId();
  if (!workerChatId || workerChatId !== chatId || !userId) return false;
  const allowed = workerUserIds();
  return allowed.size > 0 && allowed.has(userId);
}

async function notifyTicketCustomer(
  ticket: Awaited<ReturnType<typeof getSupportTicketForWorker>>,
  text: string,
) {
  if (!ticket?.telegramChatId) return { sent: false, messageId: null };
  try {
    const result = await sendTelegramCustomerMessage(
      ticket.telegramChatId,
      [
        `<b>RECHARZA SUPPORT // ${ticket.publicId}</b>`,
        "",
        escapeHtml(text),
      ].join("\n"),
    );
    return { sent: true, messageId: String(result.message_id) };
  } catch (error) {
    console.error("Customer Telegram notification failed", error);
    return { sent: false, messageId: null };
  }
}

async function handleWorkerCallback(callback: TelegramCallbackQuery) {
  const data = callback.data ?? "";
  const match = data.match(/^worker:(claim|pending|resolve):(RZS-[A-Z0-9]{16})$/);
  const chatId = callback.message ? String(callback.message.chat.id) : null;
  if (!match || !chatId) return false;
  if (!isWorkerActionAuthorized(chatId, String(callback.from.id))) {
    await answerTelegramCallback(callback.id, "Worker action not authorized");
    return true;
  }

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
        "Your request is waiting for more information. Reply when support asks a question.",
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

async function handlePrimaryCommand(message: TelegramMessage) {
  if (!message.text || message.chat.type !== "private") return false;
  const match = message.text.match(/^\/(help|menu|new|status|cancel)(?:@\w+)?(?:\s+([\s\S]+))?$/i);
  if (!match) return false;

  const command = match[1].toLowerCase();
  const argument = (match[2] ?? "").trim();
  const chatId = String(message.chat.id);
  const userId = telegramUserId(message.from, message.chat);

  if (command === "help") {
    await showSupportHelp(chatId);
    return true;
  }
  if (command === "menu" || command === "start") {
    await clearSupportBotSession(chatId, userId).catch(() => undefined);
    await showSupportMenu(chatId);
    return true;
  }
  if (command === "new") {
    await clearSupportBotSession(chatId, userId).catch(() => undefined);
    await showSupportMenu(chatId);
    return true;
  }
  if (command === "cancel") {
    await clearSupportBotSession(chatId, userId).catch(() => undefined);
    await sendTelegramCustomerMessage(chatId, "Draft deleted. No ticket was created.");
    await showSupportMenu(chatId);
    return true;
  }
  if (command === "status") {
    await handleTicketStatus(message, argument);
    return true;
  }
  return false;
}

async function handleWorkerCommand(message: TelegramMessage) {
  const chatId = String(message.chat.id);
  if (!message.text || message.chat.type === "private") return false;
  const userId = message.from ? String(message.from.id) : null;

  const looksLikeWorkerCommand = /^\/(reply|resolve)(?:@\w+)?\b/i.test(message.text);
  if (!looksLikeWorkerCommand) return false;
  if (!isWorkerActionAuthorized(chatId, userId)) {
    await sendTelegramCustomerMessage(
      chatId,
      "Worker command denied. This Telegram user is not in <code>TELEGRAM_WORKER_USER_IDS</code>.",
    );
    return true;
  }

  const replyMatch = message.text.match(
    /^\/reply(?:@\w+)?\s+(RZS-[A-Z0-9]{16})\s+([\s\S]{1,2000})$/i,
  );
  if (replyMatch) {
    const publicId = replyMatch[1].toUpperCase();
    const reply = cleanDetails(replyMatch[2], 2_000);
    const ticket = await getSupportTicketForWorker(publicId);
    if (!ticket) {
      await sendTelegramCustomerMessage(chatId, `Ticket <code>${publicId}</code> was not found.`);
      return true;
    }
    if (!ticket.telegramChatId) {
      await sendTelegramCustomerMessage(
        chatId,
        `Ticket <code>${publicId}</code> is not connected to Telegram. Use its recorded email channel.`,
      );
      return true;
    }
    const delivered = await notifyTicketCustomer(ticket, reply);
    await markSupportTicketReplied(publicId);
    await recordSupportStaffReply({
      publicId,
      text: reply,
      actorFingerprint: `telegram-worker:${userId ?? "unknown"}`,
      actorLabel: "Telegram worker",
      channel: "TELEGRAM",
      delivery: delivered.sent ? "SENT" : "FAILED",
      messageId: delivered.messageId,
      deliveredAt: new Date(),
    });
    await sendTelegramCustomerMessage(chatId, `Reply sent for <code>${publicId}</code>.`);
    return true;
  }

  const resolveMatch = message.text.match(
    /^\/resolve(?:@\w+)?\s+(RZS-[A-Z0-9]{16})$/i,
  );
  if (resolveMatch) {
    const publicId = resolveMatch[1].toUpperCase();
    const ticket = await updateSupportTicketStatus(publicId, "RESOLVED");
    if (!ticket) {
      await sendTelegramCustomerMessage(chatId, `Ticket <code>${publicId}</code> was not found.`);
      return true;
    }
    await notifyTicketCustomer(ticket, "Your support request has been marked resolved.");
    await sendTelegramCustomerMessage(chatId, `Resolved <code>${publicId}</code>.`);
    return true;
  }

  await sendTelegramCustomerMessage(
    chatId,
    "Worker command format:\n<code>/reply RZS-... message</code>\n<code>/resolve RZS-...</code>",
  );
  return true;
}

async function processUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    if (await handleWorkerCallback(update.callback_query)) return;
    if (await handleDraftCallback(update.callback_query)) return;
    if (await handleSupportCallback(update.callback_query)) return;
    if (await handleCategoryCallback(update.callback_query)) return;
    await answerTelegramCallback(update.callback_query.id).catch(() => undefined);
    return;
  }

  const message = update.message;
  if (!message?.text) return;
  if (await handleWorkerCommand(message)) return;
  if (await handlePrimaryCommand(message)) return;

  const startMatch = message.text.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  if (startMatch) {
    await handleStart(message, (startMatch[1] ?? "").trim());
    return;
  }

  if (/^\/cancel(?:@\w+)?$/i.test(message.text) && message.chat.type === "private") {
    const chatId = String(message.chat.id);
    const userId = telegramUserId(message.from, message.chat);
    await clearSupportBotSession(chatId, userId).catch(() => undefined);
    await sendTelegramCustomerMessage(chatId, "Draft deleted. No ticket was created.");
    await showSupportMenu(chatId);
    return;
  }

  if (await handleDraftMessage(message)) return;

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
    return Response.json({ ok: false, code: "UPDATE_TOO_LARGE" }, { status: 413 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  if (!update) return Response.json({ ok: false, code: "INVALID_UPDATE" }, { status: 400 });

  const updateId = typeof update.update_id === "number" ? String(update.update_id) : null;

  try {
    if (updateId && (await telegramUpdateAlreadyProcessed(updateId))) {
      return Response.json({ ok: true, duplicate: true });
    }

    await processUpdate(update);

    if (updateId) await markTelegramUpdateProcessed(updateId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram support webhook processing failed", error);
    return Response.json(
      { ok: false, code: "PROCESSING_FAILED" },
      { status: 500 },
    );
  }
}

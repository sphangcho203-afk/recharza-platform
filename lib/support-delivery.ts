import "server-only";

import { sendSystemEmail } from "@/lib/mail-delivery";
import { getSupportNotificationEmail } from "@/lib/support-config";
import { supportCategoryLabel, type SupportCategory } from "@/lib/support";

export type SupportDeliveryTicket = {
  publicId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  orderPublicId: string | null;
  gameSlug: string | null;
  requesterName: string | null;
  requesterEmail: string | null;
  telegramUsername: string | null;
  telegramChatId: string | null;
  replyChannel: "TELEGRAM" | "EMAIL";
  source: "WEB" | "TELEGRAM";
  createdAt: Date;
};

export type DeliveryResult =
  | { status: "SENT"; messageId: string }
  | { status: "SKIPPED"; reason: string }
  | { status: "FAILED"; reason: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function telegramToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export function getTelegramSupportChatId() {
  return process.env.TELEGRAM_SUPPORT_CHAT_ID?.trim() || null;
}

async function telegramRequest<T>(method: string, body: Record<string, unknown>) {
  const token = telegramToken();
  if (!token) throw new Error("Telegram bot token is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; result?: T; description?: string }
    | null;

  if (!response.ok || !payload?.ok || payload.result === undefined) {
    throw new Error(payload?.description || `Telegram returned HTTP ${response.status}.`);
  }

  return payload.result;
}

export async function sendTelegramCustomerMessage(
  chatId: string,
  text: string,
  extra: Record<string, unknown> = {},
) {
  return telegramRequest<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...extra,
  });
}

export async function answerTelegramCallback(callbackQueryId: string, text?: string) {
  return telegramRequest<boolean>("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function sendTelegramSupportNotification(
  ticket: SupportDeliveryTicket,
): Promise<DeliveryResult> {
  const chatId = getTelegramSupportChatId();
  if (!telegramToken() || !chatId) {
    return { status: "SKIPPED", reason: "Telegram worker delivery is not configured." };
  }

  const requester =
    ticket.telegramUsername
      ? `@${ticket.telegramUsername}`
      : ticket.requesterEmail || ticket.requesterName || "Not provided";
  const text = [
    "<b>NEW RECHARZA SUPPORT TICKET</b>",
    "",
    `<b>Ticket:</b> <code>${escapeHtml(ticket.publicId)}</code>`,
    `<b>Category:</b> ${escapeHtml(supportCategoryLabel(ticket.category))}`,
    `<b>Source:</b> ${escapeHtml(ticket.source)}`,
    `<b>Reply:</b> ${escapeHtml(ticket.replyChannel)}`,
    `<b>Customer:</b> ${escapeHtml(requester)}`,
    `<b>Order:</b> ${escapeHtml(ticket.orderPublicId || "Not provided")}`,
    `<b>Game:</b> ${escapeHtml(ticket.gameSlug || "Not provided")}`,
    "",
    `<b>${escapeHtml(ticket.subject)}</b>`,
    escapeHtml(ticket.description),
    "",
    `<i>Created ${escapeHtml(ticket.createdAt.toISOString())}</i>`,
  ].join("\n");

  try {
    const result = await telegramRequest<{ message_id: number }>("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Claim", callback_data: `worker:claim:${ticket.publicId}` },
            { text: "Pending", callback_data: `worker:pending:${ticket.publicId}` },
            { text: "Resolve", callback_data: `worker:resolve:${ticket.publicId}` },
          ],
        ],
      },
    });
    return { status: "SENT", messageId: String(result.message_id) };
  } catch (error) {
    return {
      status: "FAILED",
      reason: error instanceof Error ? error.message : "Telegram delivery failed.",
    };
  }
}

export async function sendSupportEmailNotification(
  ticket: SupportDeliveryTicket,
): Promise<DeliveryResult> {
  const to = getSupportNotificationEmail();
  if (!to) {
    return { status: "SKIPPED", reason: "Support notification recipient is not configured." };
  }

  const details = [
    ["Ticket", ticket.publicId],
    ["Category", supportCategoryLabel(ticket.category)],
    ["Reply channel", ticket.replyChannel],
    ["Order", ticket.orderPublicId || "Not provided"],
    ["Game", ticket.gameSlug || "Not provided"],
    ["Customer", ticket.requesterName || "Not provided"],
    ["Email", ticket.requesterEmail || "Not provided"],
    ["Telegram", ticket.telegramUsername ? `@${ticket.telegramUsername}` : "Not provided"],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 12px;color:#64748b;border-bottom:1px solid #242432">${escapeHtml(label)}</td><td style="padding:10px 12px;color:#fff;font-weight:700;text-align:right;border-bottom:1px solid #242432">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  try {
    const result = await sendSystemEmail({
      to,
      replyTo: ticket.requesterEmail || undefined,
      subject: `[${ticket.publicId}] ${ticket.subject}`,
      html: `<div style="background:#07070b;padding:28px;font-family:Arial,sans-serif;color:#fff"><div style="max-width:680px;margin:auto;border:1px solid #29293a;border-radius:20px;overflow:hidden;background:#101018"><div style="padding:22px 24px;background:linear-gradient(135deg,#172554,#312e81);"><div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#a5f3fc;font-weight:800">Recharza support</div><h1 style="margin:10px 0 0;font-size:28px">${escapeHtml(ticket.subject)}</h1></div><div style="padding:22px 24px"><table style="width:100%;border-collapse:collapse;border:1px solid #242432">${details}</table><p style="margin:22px 0 0;white-space:pre-wrap;line-height:1.7;color:#cbd5e1">${escapeHtml(ticket.description)}</p><p style="margin:20px 0 0;color:#64748b;font-size:12px">Never request passwords, OTPs, UPI PINs, card PINs, or remote-device access.</p></div></div></div>`,
      text: `Ticket: ${ticket.publicId}\nCategory: ${supportCategoryLabel(ticket.category)}\nOrder: ${ticket.orderPublicId || "Not provided"}\nGame: ${ticket.gameSlug || "Not provided"}\n\n${ticket.subject}\n${ticket.description}`,
      idempotencyKey: `support-${ticket.publicId}`,
    });

    return { status: "SENT", messageId: result.messageId };
  } catch (error) {
    return {
      status: "FAILED",
      reason: error instanceof Error ? error.message : "Email delivery failed.",
    };
  }
}

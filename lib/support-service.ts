import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { sendSystemEmail } from "@/lib/mail-delivery";
import { getPrisma } from "@/lib/prisma";
import {
  sendSupportEmailNotification,
  sendTelegramCustomerMessage,
  sendTelegramSupportNotification,
  type DeliveryResult,
  type SupportDeliveryTicket,
} from "@/lib/support-delivery";
import {
  supportCategoryLabel,
  type SupportCategory,
  type SupportReplyChannel,
  type SupportTicketInput,
  type SupportTicketStatus,
} from "@/lib/support";

export type SupportTicketSource = "WEB" | "TELEGRAM";

export type CreateSupportTicketRequest = SupportTicketInput & {
  source: SupportTicketSource;
  customerId?: string | null;
  orderDatabaseId?: string | null;
  telegramUserId?: string | null;
  telegramChatId?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreatedSupportTicket = {
  publicId: string;
  persisted: boolean;
  telegramConnectToken: string | null;
  telegramDelivery: DeliveryResult;
  emailDelivery: DeliveryResult;
};

type StoredSupportTicket = {
  publicId: string;
  status: string;
  category: SupportCategory;
  subject: string;
  description: string;
  replyChannel: SupportReplyChannel;
  requesterEmail: string | null;
  telegramUsername: string | null;
  telegramChatId: string | null;
};

function publicTicketId() {
  return `RZS-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function missingSupportTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("SupportTicket") &&
    (message.includes("does not exist") ||
      message.includes("P2010") ||
      message.includes("42P01"))
  );
}

function deliveryStatus(result: DeliveryResult) {
  return result.status;
}

function deliveryMessageId(result: DeliveryResult) {
  return result.status === "SENT" ? result.messageId : null;
}

function deliveryError(result: DeliveryResult) {
  if (result.status === "FAILED" || result.status === "SKIPPED") {
    return result.reason.slice(0, 1_000);
  }
  return null;
}

export async function createAndDeliverSupportTicket(
  input: CreateSupportTicketRequest,
): Promise<CreatedSupportTicket> {
  const prisma = getPrisma();
  const id = randomUUID();
  const publicId = publicTicketId();
  const createdAt = new Date();
  const connectToken =
    input.source === "WEB" &&
    input.replyChannel === "TELEGRAM" &&
    !input.telegramChatId
      ? randomUUID().replaceAll("-", "")
      : null;
  const connectTokenHash = connectToken ? tokenHash(connectToken) : null;
  let persisted = false;

  try {
    await prisma.$executeRaw`
      INSERT INTO "SupportTicket" (
        "id",
        "publicId",
        "status",
        "category",
        "subject",
        "description",
        "source",
        "replyChannel",
        "requesterName",
        "requesterEmail",
        "telegramUsername",
        "telegramUserId",
        "telegramChatId",
        "telegramConnectTokenHash",
        "orderPublicId",
        "gameSlug",
        "customerId",
        "orderId",
        "metadata",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${publicId},
        'OPEN',
        ${input.category},
        ${input.subject},
        ${input.description},
        ${input.source},
        ${input.replyChannel},
        ${input.name},
        ${input.email},
        ${input.telegramUsername},
        ${input.telegramUserId ?? null},
        ${input.telegramChatId ?? null},
        ${connectTokenHash},
        ${input.orderId},
        ${input.game},
        ${input.customerId ?? null},
        ${input.orderDatabaseId ?? null},
        ${JSON.stringify(input.metadata ?? {})}::jsonb,
        ${createdAt},
        ${createdAt}
      )
    `;
    persisted = true;
  } catch (error) {
    if (!missingSupportTable(error)) throw error;
    console.warn(
      "Support ticket table is not deployed; continuing with delivery-only mode.",
    );
  }

  const deliveryTicket: SupportDeliveryTicket = {
    publicId,
    category: input.category,
    subject: input.subject,
    description: input.description,
    orderPublicId: input.orderId,
    gameSlug: input.game,
    requesterName: input.name,
    requesterEmail: input.email,
    telegramUsername: input.telegramUsername,
    telegramChatId: input.telegramChatId ?? null,
    replyChannel: input.replyChannel,
    source: input.source,
    createdAt,
  };

  const [telegramDelivery, emailDelivery] = await Promise.all([
    sendTelegramSupportNotification(deliveryTicket),
    sendSupportEmailNotification(deliveryTicket),
  ]);

  if (persisted) {
    try {
      await prisma.$executeRaw`
        UPDATE "SupportTicket"
        SET
          "telegramDeliveryStatus" = ${deliveryStatus(telegramDelivery)},
          "telegramSupportMessageId" = ${deliveryMessageId(telegramDelivery)},
          "telegramDeliveryError" = ${deliveryError(telegramDelivery)},
          "emailDeliveryStatus" = ${deliveryStatus(emailDelivery)},
          "emailProviderMessageId" = ${deliveryMessageId(emailDelivery)},
          "emailDeliveryError" = ${deliveryError(emailDelivery)},
          "updatedAt" = ${new Date()}
        WHERE "publicId" = ${publicId}
      `;
    } catch (error) {
      console.error("Support delivery status update failed", error);
    }
  }

  return {
    publicId,
    persisted,
    telegramConnectToken: persisted ? connectToken : null,
    telegramDelivery,
    emailDelivery,
  };
}

export async function linkTelegramSupportTicket(input: {
  publicId: string;
  token: string;
  telegramUserId: string;
  telegramChatId: string;
  telegramUsername: string | null;
}) {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<StoredSupportTicket[]>`
    UPDATE "SupportTicket"
    SET
      "telegramUserId" = ${input.telegramUserId},
      "telegramChatId" = ${input.telegramChatId},
      "telegramUsername" = COALESCE(${input.telegramUsername}, "telegramUsername"),
      "telegramConnectTokenHash" = NULL,
      "updatedAt" = ${new Date()}
    WHERE
      "publicId" = ${input.publicId}
      AND "telegramConnectTokenHash" = ${tokenHash(input.token)}
      AND "telegramChatId" IS NULL
    RETURNING
      "publicId",
      "status",
      "category",
      "subject",
      "description",
      "replyChannel",
      "requesterEmail",
      "telegramUsername",
      "telegramChatId"
  `;
  return rows[0] ?? null;
}

export async function getSupportTicketForWorker(publicId: string) {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<StoredSupportTicket[]>`
    SELECT
      "publicId",
      "status",
      "category",
      "subject",
      "description",
      "replyChannel",
      "requesterEmail",
      "telegramUsername",
      "telegramChatId"
    FROM "SupportTicket"
    WHERE "publicId" = ${publicId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getSupportTicketForTelegram(input: {
  publicId: string;
  telegramChatId: string;
}) {
  const rows = await getPrisma().$queryRaw<StoredSupportTicket[]>`
    SELECT
      "publicId",
      "status",
      "category",
      "subject",
      "description",
      "replyChannel",
      "requesterEmail",
      "telegramUsername",
      "telegramChatId"
    FROM "SupportTicket"
    WHERE "publicId" = ${input.publicId}
      AND "telegramChatId" = ${input.telegramChatId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function updateSupportTicketStatus(
  publicId: string,
  status:
    | "ASSIGNED"
    | "WAITING_CUSTOMER"
    | "UNDER_REVIEW"
    | "RESOLVED"
    | "CLOSED",
) {
  const prisma = getPrisma();
  const resolvedAt = status === "RESOLVED" || status === "CLOSED" ? new Date() : null;
  const rows = await prisma.$queryRaw<StoredSupportTicket[]>`
    UPDATE "SupportTicket"
    SET
      "status" = ${status},
      "resolvedAt" = COALESCE(${resolvedAt}, "resolvedAt"),
      "updatedAt" = ${new Date()}
    WHERE "publicId" = ${publicId}
    RETURNING
      "publicId",
      "status",
      "category",
      "subject",
      "description",
      "replyChannel",
      "requesterEmail",
      "telegramUsername",
      "telegramChatId"
  `;
  return rows[0] ?? null;
}

export async function markSupportTicketReplied(publicId: string) {
  const prisma = getPrisma();
  await prisma.$executeRaw`
    UPDATE "SupportTicket"
    SET
      "status" = 'WAITING_CUSTOMER',
      "lastStaffReplyAt" = ${new Date()},
      "updatedAt" = ${new Date()}
    WHERE "publicId" = ${publicId}
  `;
}

export type SupportStaffReplyRecord = {
  text: string;
  at: string;
  actor: string;
  actorLabel: string;
  channel: string;
  delivery: string;
  messageId: string | null;
};

export function getSupportStaffReplies(metadata: unknown): SupportStaffReplyRecord[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const replies = (metadata as Record<string, unknown>).staffReplies;
  if (!Array.isArray(replies)) return [];
  return replies.filter(
    (item): item is SupportStaffReplyRecord =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as SupportStaffReplyRecord).text === "string" &&
      typeof (item as SupportStaffReplyRecord).at === "string",
  );
}

export function maskSupportEmail(email: string | null | undefined) {
  if (!email) return null;
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "hidden";
  return `${localPart.slice(0, 2)}${"*".repeat(Math.max(2, localPart.length - 2))}@${domain}`;
}

export async function listSupportTickets(input: {
  status?: SupportTicketStatus;
  search?: string;
  assignee?: "me" | "unassigned";
  actorCustomerId: string | null;
  limit: number;
}) {
  const where: Prisma.SupportTicketWhereInput = {};
  if (input.status) where.status = input.status;
  if (input.assignee === "me" && input.actorCustomerId) {
    where.assigneeCustomerId = input.actorCustomerId;
  } else if (input.assignee === "unassigned") {
    where.assigneeCustomerId = null;
  }

  const query = input.search?.trim();
  if (query) {
    where.OR = [
      { publicId: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const tickets = await getPrisma().supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: input.limit,
    select: {
      id: true,
      publicId: true,
      status: true,
      category: true,
      subject: true,
      source: true,
      replyChannel: true,
      requesterEmail: true,
      orderPublicId: true,
      gameSlug: true,
      assigneeCustomerId: true,
      assignee: { select: { id: true, displayName: true, email: true } },
      createdAt: true,
      updatedAt: true,
      lastStaffReplyAt: true,
    },
  });

  return tickets.map((ticket) => ({
    publicId: ticket.publicId,
    status: ticket.status as SupportTicketStatus,
    category: ticket.category as SupportCategory,
    categoryLabel: supportCategoryLabel(ticket.category as SupportCategory),
    subject: ticket.subject,
    source: ticket.source,
    replyChannel: ticket.replyChannel,
    requesterEmail: maskSupportEmail(ticket.requesterEmail),
    orderPublicId: ticket.orderPublicId,
    gameSlug: ticket.gameSlug,
    assignee: ticket.assignee
      ? {
          id: ticket.assignee.id,
          displayName: ticket.assignee.displayName,
          email: maskSupportEmail(ticket.assignee.email),
        }
      : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    lastStaffReplyAt: ticket.lastStaffReplyAt?.toISOString() ?? null,
  }));
}

export async function getSupportTicketDetail(publicId: string) {
  const ticket = await getPrisma().supportTicket.findUnique({
    where: { publicId },
    include: {
      customer: { select: { id: true, email: true, displayName: true, username: true } },
      order: { select: { id: true, publicId: true, status: true } },
      assignee: { select: { id: true, displayName: true, email: true, role: true } },
    },
  });
  if (!ticket) return null;

  return {
    publicId: ticket.publicId,
    status: ticket.status as SupportTicketStatus,
    category: ticket.category as SupportCategory,
    categoryLabel: supportCategoryLabel(ticket.category as SupportCategory),
    subject: ticket.subject,
    description: ticket.description,
    source: ticket.source,
    replyChannel: ticket.replyChannel,
    requesterName: ticket.requesterName,
    requesterEmail: maskSupportEmail(ticket.requesterEmail),
    telegramUsername: ticket.telegramUsername,
    orderPublicId: ticket.orderPublicId,
    gameSlug: ticket.gameSlug,
    customer: ticket.customer
      ? {
          id: ticket.customer.id,
          displayName: ticket.customer.displayName,
          email: maskSupportEmail(ticket.customer.email),
        }
      : null,
    order: ticket.order
      ? { publicId: ticket.order.publicId, status: ticket.order.status }
      : null,
    assignee: ticket.assignee
      ? {
          id: ticket.assignee.id,
          displayName: ticket.assignee.displayName,
          email: maskSupportEmail(ticket.assignee.email),
          role: ticket.assignee.role,
        }
      : null,
    delivery: {
      telegramStatus: ticket.telegramDeliveryStatus,
      emailStatus: ticket.emailDeliveryStatus,
    },
    replies: getSupportStaffReplies(ticket.metadata),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    lastStaffReplyAt: ticket.lastStaffReplyAt?.toISOString() ?? null,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
  };
}

export async function listSupportAssigneeCandidates() {
  const candidates = await getPrisma().customer.findMany({
    where: {
      role: { in: ["STAFF", "ADMIN"] },
      accessStatus: "ACTIVE",
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      role: true,
      staffPermissions: true,
      staffPermissionsConfigured: true,
    },
    orderBy: [{ role: "asc" }, { displayName: "asc" }],
    take: 100,
  });

  return candidates
    .filter((candidate) =>
      candidate.role === "ADMIN" ||
      candidate.staffPermissions.includes("support.manage") ||
      !candidate.staffPermissionsConfigured,
    )
    .map((candidate) => ({
      id: candidate.id,
      displayName: candidate.displayName,
      email: maskSupportEmail(candidate.email),
      role: candidate.role,
    }));
}

export async function assignSupportTicket(input: {
  publicId: string;
  assigneeCustomerId: string | null;
}) {
  const prisma = getPrisma();
  return prisma.supportTicket.update({
    where: { publicId: input.publicId },
    data: { assigneeCustomerId: input.assigneeCustomerId },
  });
}

export async function changeSupportTicketStatus(
  publicId: string,
  status: SupportTicketStatus,
) {
  const prisma = getPrisma();
  const resolvedAt =
    status === "RESOLVED" || status === "CLOSED" ? new Date() : null;
  return prisma.supportTicket.update({
    where: { publicId },
    data: {
      status,
      resolvedAt: resolvedAt ? resolvedAt : undefined,
    },
  });
}

export async function recordSupportStaffReply(input: {
  publicId: string;
  text: string;
  actorFingerprint: string;
  actorLabel: string;
  channel: "TELEGRAM" | "EMAIL";
  delivery: string;
  messageId: string | null;
  deliveredAt: Date;
}) {
  const prisma = getPrisma();
  await prisma.$executeRaw`
    UPDATE "SupportTicket"
    SET
      "metadata" = COALESCE("metadata", '{}'::jsonb)
        || jsonb_build_object(
          'staffReplies',
          COALESCE("metadata"->'staffReplies', '[]'::jsonb)
            || jsonb_build_array(
              jsonb_build_object(
                'text', CAST(${input.text.slice(0, 2_000)} AS TEXT),
                'at', CAST(${input.deliveredAt.toISOString()} AS TEXT),
                'actor', CAST(${input.actorFingerprint} AS TEXT),
                'actorLabel', CAST(${input.actorLabel} AS TEXT),
                'channel', CAST(${input.channel} AS TEXT),
                'delivery', CAST(${input.delivery.slice(0, 20)} AS TEXT),
                'messageId', CAST(${input.messageId} AS TEXT)
              )
            )
        ),
      "updatedAt" = ${input.deliveredAt}
    WHERE "publicId" = ${input.publicId}
  `;
}

export async function deliverStaffSupportReply(input: {
  publicId: string;
  text: string;
  actorFingerprint: string;
  actorLabel: string;
}): Promise<{
  ticket: Awaited<ReturnType<typeof getSupportTicketDetail>>;
  delivery: DeliveryResult;
}> {
  const prisma = getPrisma();
  const stored = await prisma.supportTicket.findUnique({
    where: { publicId: input.publicId },
    select: {
      publicId: true,
      subject: true,
      replyChannel: true,
      requesterEmail: true,
      telegramChatId: true,
    },
  });
  if (!stored) {
    throw new Error("Ticket not found");
  }

  const payload = [
    `<b>RECHARZA SUPPORT // ${stored.publicId}</b>`,
    "",
    input.text
      .split("\n")
      .map((line) => escapeSupportHtml(line))
      .join("<br/>"),
  ].join("\n");

  let delivery: DeliveryResult;
  if (stored.replyChannel === "TELEGRAM") {
    const chatId = stored.telegramChatId;
    if (!chatId) {
      delivery = {
        status: "SKIPPED",
        reason: "Ticket is not connected to a Telegram chat.",
      };
    } else {
      try {
        const result = await sendTelegramCustomerMessage(chatId, payload);
        delivery = { status: "SENT", messageId: String(result.message_id) };
      } catch (error) {
        delivery = {
          status: "FAILED",
          reason: error instanceof Error ? error.message : "Telegram delivery failed.",
        };
      }
    }
  } else {
    if (!stored.requesterEmail) {
      delivery = {
        status: "SKIPPED",
        reason: "Ticket has no recorded requester email address.",
      };
    } else {
      try {
        const result = await sendSystemEmail({
          to: stored.requesterEmail,
          subject: `[${stored.publicId}] ${stored.subject}`,
          html: `<p style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">${escapeSupportHtml(input.text).replaceAll("\n", "<br/>")}</p><p style="font-family:Arial,sans-serif;color:#64748b;font-size:12px">Recharza Support · ${stored.publicId}</p>`,
          text: `Recharza Support · ${stored.publicId}\n\n${input.text}`,
          idempotencyKey: `support-reply-${stored.publicId}-${Date.now()}`,
        });
        delivery = { status: "SENT", messageId: result.messageId };
      } catch (error) {
        delivery = {
          status: "FAILED",
          reason: error instanceof Error ? error.message : "Email delivery failed.",
        };
      }
    }
  }

  await recordSupportStaffReply({
    publicId: stored.publicId,
    text: input.text,
    actorFingerprint: input.actorFingerprint,
    actorLabel: input.actorLabel,
    channel: stored.replyChannel as "TELEGRAM" | "EMAIL",
    delivery: delivery.status,
    messageId: delivery.status === "SENT" ? delivery.messageId : null,
    deliveredAt: new Date(),
  });
  await markSupportTicketReplied(stored.publicId);

  return { ticket: await getSupportTicketDetail(stored.publicId), delivery };
}

function escapeSupportHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

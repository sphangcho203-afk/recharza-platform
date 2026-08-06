import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { getPrisma } from "@/lib/prisma";
import {
  sendSupportEmailNotification,
  sendTelegramSupportNotification,
  type DeliveryResult,
  type SupportDeliveryTicket,
} from "@/lib/support-delivery";
import type {
  SupportCategory,
  SupportReplyChannel,
  SupportTicketInput,
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
          "emailDeliveryStatus" = ${deliveryStatus(emailDelivery)},
          "emailProviderMessageId" = ${deliveryMessageId(emailDelivery)},
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

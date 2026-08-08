import "server-only";

import { getPrisma } from "@/lib/prisma";
import type { SupportCategory } from "@/lib/support";

export type SupportBotStep = "TITLE" | "ORDER" | "DESCRIPTION" | "REVIEW";

export type SupportBotSession = {
  chatId: string;
  telegramUserId: string;
  category: SupportCategory;
  step: SupportBotStep;
  subject: string | null;
  orderPublicId: string | null;
  description: string | null;
  expiresAt: Date;
};

const SESSION_TTL_MS = 30 * 60 * 1000;

function expiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

export async function startSupportBotSession(input: {
  chatId: string;
  telegramUserId: string;
  category: SupportCategory;
}) {
  const now = new Date();
  const rows = await getPrisma().$queryRaw<SupportBotSession[]>`
    INSERT INTO "SupportBotSession" (
      "chatId", "telegramUserId", "category", "step", "subject",
      "orderPublicId", "description", "createdAt", "updatedAt", "expiresAt"
    ) VALUES (
      ${input.chatId}, ${input.telegramUserId}, ${input.category}, 'TITLE', NULL,
      NULL, NULL, ${now}, ${now}, ${expiry()}
    )
    ON CONFLICT ("chatId") DO UPDATE SET
      "telegramUserId" = EXCLUDED."telegramUserId",
      "category" = EXCLUDED."category",
      "step" = 'TITLE',
      "subject" = NULL,
      "orderPublicId" = NULL,
      "description" = NULL,
      "updatedAt" = EXCLUDED."updatedAt",
      "expiresAt" = EXCLUDED."expiresAt"
    RETURNING
      "chatId", "telegramUserId", "category", "step", "subject",
      "orderPublicId", "description", "expiresAt"
  `;
  return rows[0] ?? null;
}

export async function getSupportBotSession(chatId: string, telegramUserId: string) {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<SupportBotSession[]>`
    SELECT
      "chatId", "telegramUserId", "category", "step", "subject",
      "orderPublicId", "description", "expiresAt"
    FROM "SupportBotSession"
    WHERE "chatId" = ${chatId}
      AND "telegramUserId" = ${telegramUserId}
      AND "expiresAt" > ${new Date()}
    LIMIT 1
  `;

  if (rows[0]) return rows[0];

  await prisma.$executeRaw`
    DELETE FROM "SupportBotSession"
    WHERE "chatId" = ${chatId} AND "expiresAt" <= ${new Date()}
  `;
  return null;
}

export async function updateSupportBotSession(
  chatId: string,
  telegramUserId: string,
  patch: {
    step?: SupportBotStep;
    subject?: string | null;
    orderPublicId?: string | null;
    description?: string | null;
  },
) {
  const current = await getSupportBotSession(chatId, telegramUserId);
  if (!current) return null;

  const step = patch.step ?? current.step;
  const subject = patch.subject !== undefined ? patch.subject : current.subject;
  const orderPublicId =
    patch.orderPublicId !== undefined ? patch.orderPublicId : current.orderPublicId;
  const description =
    patch.description !== undefined ? patch.description : current.description;

  const rows = await getPrisma().$queryRaw<SupportBotSession[]>`
    UPDATE "SupportBotSession"
    SET
      "step" = ${step},
      "subject" = ${subject},
      "orderPublicId" = ${orderPublicId},
      "description" = ${description},
      "updatedAt" = ${new Date()},
      "expiresAt" = ${expiry()}
    WHERE "chatId" = ${chatId} AND "telegramUserId" = ${telegramUserId}
    RETURNING
      "chatId", "telegramUserId", "category", "step", "subject",
      "orderPublicId", "description", "expiresAt"
  `;
  return rows[0] ?? null;
}

export async function clearSupportBotSession(chatId: string, telegramUserId: string) {
  await getPrisma().$executeRaw`
    DELETE FROM "SupportBotSession"
    WHERE "chatId" = ${chatId} AND "telegramUserId" = ${telegramUserId}
  `;
}

export async function telegramUpdateAlreadyProcessed(updateId: string) {
  const rows = await getPrisma().$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS(
      SELECT 1 FROM "SupportTelegramUpdate" WHERE "updateId" = ${updateId}
    ) AS "exists"
  `;
  return Boolean(rows[0]?.exists);
}

export async function markTelegramUpdateProcessed(updateId: string) {
  await getPrisma().$executeRaw`
    INSERT INTO "SupportTelegramUpdate" ("updateId", "processedAt")
    VALUES (${updateId}, ${new Date()})
    ON CONFLICT ("updateId") DO NOTHING
  `;

  await getPrisma().$executeRaw`
    DELETE FROM "SupportTelegramUpdate"
    WHERE "processedAt" < ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
  `;
}

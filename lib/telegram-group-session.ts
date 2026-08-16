import { getPrisma } from "@/lib/prisma";

const SESSION_PREFIX = "group-support:";
const SESSION_CATEGORY = "GROUP_BOT";
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_TURNS = 10;

export type GroupConversationTurn = {
  role: "user" | "assistant";
  text: string;
};

export type GroupConversationState = {
  turns: GroupConversationTurn[];
  orderId: string | null;
  pendingIntent: "GENERAL" | "ORDER_STATUS" | "ORDER_SUPPORT";
  updatedAt: string;
};

export type GroupBotSession = {
  chatId: string;
  telegramUserId: string;
  state: GroupConversationState;
  expiresAt: Date;
};

function dbChatId(chatId: string, telegramUserId?: string) {
  return `${SESSION_PREFIX}${chatId}${telegramUserId ? `:${telegramUserId}` : ""}`;
}

function expiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function emptyState(): GroupConversationState {
  return {
    turns: [],
    orderId: null,
    pendingIntent: "GENERAL",
    updatedAt: new Date().toISOString(),
  };
}

function parseState(description: string | null): GroupConversationState {
  if (!description) return emptyState();
  try {
    const parsed = JSON.parse(description) as Partial<GroupConversationState>;
    const turns = Array.isArray(parsed.turns)
      ? parsed.turns.filter(
          (turn): turn is GroupConversationTurn =>
            Boolean(turn) &&
            (turn as GroupConversationTurn).role !== undefined &&
            ((turn as GroupConversationTurn).role === "user" ||
              (turn as GroupConversationTurn).role === "assistant") &&
            typeof (turn as GroupConversationTurn).text === "string",
        )
      : [];
    return {
      turns: turns.slice(-MAX_TURNS),
      orderId: typeof parsed.orderId === "string" ? parsed.orderId : null,
      pendingIntent:
        parsed.pendingIntent === "ORDER_STATUS" || parsed.pendingIntent === "ORDER_SUPPORT"
          ? parsed.pendingIntent
          : "GENERAL",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyState();
  }
}

export async function getGroupBotSession(chatId: string, telegramUserId: string) {
  const rows = await getPrisma().$queryRaw<
    Array<{ chatId: string; telegramUserId: string; description: string | null; expiresAt: Date }>
  >`
    SELECT "chatId", "telegramUserId", "description", "expiresAt"
    FROM "SupportBotSession"
    WHERE "chatId" = ${dbChatId(chatId, telegramUserId)}
      AND "telegramUserId" = ${telegramUserId}
      AND "category" = ${SESSION_CATEGORY}
      AND "expiresAt" > ${new Date()}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    chatId,
    telegramUserId,
    state: parseState(row.description),
    expiresAt: row.expiresAt,
  } satisfies GroupBotSession;
}

export async function saveGroupBotSession(input: {
  chatId: string;
  telegramUserId: string;
  state: GroupConversationState;
}) {
  const now = new Date();
  const state = {
    ...input.state,
    turns: input.state.turns.slice(-MAX_TURNS),
    updatedAt: now.toISOString(),
  } satisfies GroupConversationState;
  const serialized = JSON.stringify(state).slice(0, 12_000);
  await getPrisma().$executeRaw`
    INSERT INTO "SupportBotSession" (
      "chatId", "telegramUserId", "category", "step", "subject",
      "orderPublicId", "description", "createdAt", "updatedAt", "expiresAt"
    ) VALUES (
      ${dbChatId(input.chatId, input.telegramUserId)}, ${input.telegramUserId}, ${SESSION_CATEGORY}, 'CONTEXT', NULL,
      ${state.orderId}, ${serialized}, ${now}, ${now}, ${expiry()}
    )
    ON CONFLICT ("chatId") DO UPDATE SET
      "telegramUserId" = EXCLUDED."telegramUserId",
      "category" = EXCLUDED."category",
      "step" = 'CONTEXT',
      "orderPublicId" = EXCLUDED."orderPublicId",
      "description" = EXCLUDED."description",
      "updatedAt" = EXCLUDED."updatedAt",
      "expiresAt" = EXCLUDED."expiresAt"
  `;
  return state;
}

export async function clearGroupBotSession(chatId: string, telegramUserId: string) {
  await getPrisma().$executeRaw`
    DELETE FROM "SupportBotSession"
    WHERE "chatId" = ${dbChatId(chatId, telegramUserId)} AND "telegramUserId" = ${telegramUserId}
  `;
}

export function appendGroupTurn(
  state: GroupConversationState,
  turn: GroupConversationTurn,
  patch: Partial<Pick<GroupConversationState, "orderId" | "pendingIntent">> = {},
) {
  return {
    ...state,
    ...patch,
    turns: [...state.turns, turn].slice(-MAX_TURNS),
    updatedAt: new Date().toISOString(),
  } satisfies GroupConversationState;
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_REPLY_LENGTH = 2_000;
const SUPPORT_AGENT_ROLE = [
  "You are Recharza Support, a natural, context-aware customer-support assistant for a digital game top-up store.",
  "Understand the current message together with the recent conversation. Answer the actual question instead of repeating a generic help menu.",
  "If the user says it, that, this, my order, or asks a follow-up, resolve the reference from the conversation history before replying.",
  "You are support-only: never act as an admin, never change orders, never issue refunds, never promise fulfilment, and never claim a human was contacted unless explicitly confirmed.",
  "Never reveal order details, access tokens, emails, phone numbers, payment data, or private customer information in a public group.",
  "For an order-status request, identify whether the user still needs an order ID or private access token. Ask for only the missing item in private chat.",
  "Never ask for passwords, OTPs, card numbers, UPI PINs, private keys, or remote access.",
  "Use concise, warm, specific replies. Do not restart the conversation with a generic introduction unless the user greets you or asks what you can do.",
].join(" ");

function geminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim() || null;
}

function modelName() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function cleanReply(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, MAX_REPLY_LENGTH);
}

export async function getGeminiSupportReply(input: {
  userMessage: string;
  userName?: string | null;
  conversationHistory?: string;
  intent?: string;
  isPrivate?: boolean;
}) {
  const apiKey = geminiKey();
  if (!apiKey) return null;
  const userMessage = input.userMessage.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 2_000);
  if (!userMessage) return null;
  const history = (input.conversationHistory || "No earlier conversation.")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(-6_000);
  const scope = input.isPrivate
    ? "This is a private Telegram chat. You may discuss support steps, but never echo or store access tokens in your response."
    : "This is a public Telegram group. Keep account-specific information private and move order or payment support to the private chat.";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName())}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SUPPORT_AGENT_ROLE }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  scope,
                  `Customer name: ${(input.userName || "Customer").slice(0, 80)}`,
                  `Detected intent: ${input.intent || "GENERAL"}`,
                  "Recent conversation:",
                  history,
                  `Current customer message: ${userMessage}`,
                  "Reply directly to the current message using the conversation context.",
                ].join("\n"),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.55,
          maxOutputTokens: 350,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );
  const payload = (await response.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gemini returned HTTP ${response.status}.`);
  }
  const reply = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join(" ");
  return reply ? cleanReply(reply) : null;
}

export const geminiSupportAgentRole = SUPPORT_AGENT_ROLE;

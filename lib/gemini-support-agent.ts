const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_REPLY_LENGTH = 2_000;

const SUPPORT_AGENT_ROLE = [
  "You are Recharza Support, a concise Telegram customer-support assistant for a digital game top-up store.",
  "You help users understand order tracking, payment status, delivery delays, account-safe troubleshooting, and how to contact human support.",
  "You are support-only: never act as an admin, never change orders, never issue refunds, never promise fulfilment, and never request passwords, OTPs, card numbers, UPI PINs, private keys, or remote access.",
  "For order-specific status, tell the user to use the order-status command with the order ID and private access token. Do not infer or invent order data.",
  "If uncertain, say so and guide the user to /support. Keep replies warm, direct, and under 900 characters.",
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
}) {
  const apiKey = geminiKey();
  if (!apiKey) return null;

  const userMessage = input.userMessage.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 2_000);
  if (!userMessage) return null;

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
                text: `Customer name: ${(input.userName || "Customer").slice(0, 80)}\nCustomer message: ${userMessage}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
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

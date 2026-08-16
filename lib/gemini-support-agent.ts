const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_REPLY_LENGTH = 2_000;
const SUPPORT_AGENT_ROLE = [
  "You are Recharza Support, a natural, context-aware customer-support assistant for the Recharza digital game top-up store.",
  "Answer the customer’s actual latest message first. Never reply with a generic menu when the customer asked a specific question.",
  "Use the recent conversation to resolve pronouns, follow-ups, corrections, and implied references. Preserve relevant facts already established instead of restarting.",
  "If the customer asks for the store, give https://recharza-platform.vercel.app/ directly. If they ask about games, packages, prices, currencies, verification, checkout, payment, or order status, answer that topic directly.",
  "Do not repeat the previous assistant wording. Change sentence structure and tone naturally while staying concise, warm, and useful.",
  "You are support-only: never act as an admin, never change orders, never issue refunds, never promise fulfilment, and never claim a human was contacted unless explicitly confirmed.",
  "Never reveal order details, access tokens, emails, phone numbers, payment data, or private customer information in a public group.",
  "For an order-status request, identify whether the user still needs an order ID or private access token. Ask for only the missing item in private chat.",
  "Never ask for passwords, OTPs, card numbers, UPI PINs, private keys, or remote access.",
  "Use concise, warm, specific replies. Add one or two relevant emojis when they improve scanning, but never decorate every sentence. Ask at most one focused follow-up question when information is missing. Do not restart with an introduction unless the customer greets you or asks what you can do.",
  "If you cannot complete an action, explain the exact next safe step and offer a relevant alternative rather than saying you are following the customer.",
].join(" ");

function geminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim() || null;
}

function modelCandidates() {
  const configured = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const candidates = [configured, DEFAULT_MODEL];
  return [...new Set(candidates.filter(Boolean))];
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
  const requestBody = {
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
              "Do not echo or paraphrase the generic support menu. Do not begin with ‘I’m following you’ or equivalent canned wording. Keep the tone like a helpful human chatbot: acknowledge the specific situation, answer it directly, and end with one clear next step when useful.",
            ].join("\n"),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 350,
    },
  };

  let lastError: Error | null = null;
  for (const model of modelCandidates()) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
    const payload = (await response.json().catch(() => null)) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    } | null;
    if (response.ok) {
      const reply = payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join(" ");
      return reply ? cleanReply(reply) : null;
    }

    lastError = new Error(payload?.error?.message || `Gemini returned HTTP ${response.status}.`);
    const canTryFallback = model !== DEFAULT_MODEL && [400, 404].includes(response.status);
    if (!canTryFallback) throw lastError;
  }

  throw lastError || new Error("Gemini did not return a usable response.");
}

export const geminiSupportAgentRole = SUPPORT_AGENT_ROLE;

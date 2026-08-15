import { getGeminiSupportReply } from "@/lib/gemini-support-agent";

export const runtime = "nodejs";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 700;

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_LENGTH)
    : "";
}

function looksSensitive(text: string) {
  return /\b(otp|one[- ]time|upi\s*pin|card\s*(number|pin|cvv)|password|private\s*key|access\s*token)\b/i.test(text);
}

function websiteFallback(message: string) {
  const text = message.toLowerCase();
  if (/order|status|track|delivery|payment|charged|refund/.test(text)) {
    return "I can help you understand an order or payment issue. For live order details, use Track order with your Order ID and private access token, or open a support request so our team can review it securely.";
  }
  if (/verify|username|player|ign|nickname|id/.test(text)) {
    return "Choose your game and region first, then enter the player ID details requested on that game’s page. Recharza verifies supported game accounts before checkout when the provider allows it.";
  }
  if (/game|available|support|top.?up|recharge|region/.test(text)) {
    return "I can guide you through the games and regional catalogues available on Recharza. Tell me the game and country or region you need.";
  }
  if (/price|cost|currency|usd|inr|try|brl|php/.test(text)) {
    return "Prices depend on the game, region, package, and currency selected at checkout. Open the relevant game catalogue to see the current local price.";
  }
  return "I’m here to help with games, regions, player verification, packages, checkout, and order support. What are you trying to do?";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null;
  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const messages = rawMessages
    .slice(-MAX_MESSAGES)
    .map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
        text: cleanText(row.text),
      };
    })
    .filter((item) => item.text);
  const latest = messages.at(-1);
  if (!latest || latest.role !== "user") {
    return Response.json({ ok: false, message: "Send a support question to continue." }, { status: 400 });
  }

  if (looksSensitive(latest.text)) {
    return Response.json({
      ok: true,
      reply: "For your security, please do not send passwords, OTPs, card details, UPI PINs, or private access tokens in chat. Use Track order or create a support request without including those secrets.",
    });
  }

  const history = messages
    .slice(0, -1)
    .map((item) => `${item.role === "assistant" ? "Recharza Support" : "Customer"}: ${item.text}`)
    .join("\n") || "No earlier conversation.";

  try {
    const reply = await getGeminiSupportReply({
      userMessage: latest.text,
      userName: "Website customer",
      conversationHistory: history,
      intent: "WEBSITE_SUPPORT",
      isPrivate: true,
    });
    return Response.json({ ok: true, reply: reply || websiteFallback(latest.text) });
  } catch (error) {
    console.error("Website support chat failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ ok: true, reply: websiteFallback(latest.text), degraded: true });
  }
}

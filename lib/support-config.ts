export type PublicSupportChannel = {
  id: "telegram" | "whatsapp" | "instagram" | "email";
  label: string;
  detail: string;
  href: string | null;
  available: boolean;
};

function normalizeUsername(value: string | undefined) {
  return (value ?? "").trim().replace(/^@/, "");
}

function normalizePhone(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function supportEmail() {
  return (
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.SUPPORT_NOTIFICATION_EMAIL?.trim() ||
    "recherzatopup@gmail.com"
  );
}

export function getTelegramBotUsername() {
  return normalizeUsername(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME);
}

export function createTelegramStartUrl(start = "recharza_support") {
  const username = getTelegramBotUsername();
  return username
    ? `https://t.me/${encodeURIComponent(username)}?start=${encodeURIComponent(start)}`
    : null;
}

export function getPublicSupportChannels(): PublicSupportChannel[] {
  const telegramUsername = getTelegramBotUsername();
  const whatsappNumber = normalizePhone(
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER,
  );
  const instagramUsername = normalizeUsername(
    process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME,
  );
  const email = supportEmail();
  const whatsappMessage = encodeURIComponent(
    "Hello Recharza Support, I need help with an order or account issue.",
  );

  return [
    {
      id: "telegram",
      label: "Telegram bot",
      detail: telegramUsername ? `@${telegramUsername}` : "Guided support bot",
      href: telegramUsername
        ? `https://t.me/${encodeURIComponent(telegramUsername)}?start=recharza_support`
        : null,
      available: Boolean(telegramUsername),
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      detail: whatsappNumber ? "Message support" : "Direct support channel",
      href: whatsappNumber
        ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
        : null,
      available: Boolean(whatsappNumber),
    },
    {
      id: "instagram",
      label: "Instagram",
      detail: instagramUsername ? `@${instagramUsername}` : "Recharza social inbox",
      href: instagramUsername
        ? `https://www.instagram.com/${encodeURIComponent(instagramUsername)}/`
        : null,
      available: Boolean(instagramUsername),
    },
    {
      id: "email",
      label: "Gmail",
      detail: email,
      href: `mailto:${email}?subject=${encodeURIComponent("Recharza support request")}`,
      available: true,
    },
  ];
}

export function getSupportNotificationEmail() {
  return process.env.SUPPORT_NOTIFICATION_EMAIL?.trim() || supportEmail();
}

export const PRIMARY_TELEGRAM_COMMANDS = [
  { command: "start", description: "Open the Recharza support menu" },
  { command: "menu", description: "Show support options" },
  { command: "new", description: "Start a new support request" },
  { command: "status", description: "Check a ticket linked to this chat" },
  { command: "cancel", description: "Cancel the current draft" },
  { command: "help", description: "Show commands and safety guidance" },
] as const;

export const PRIMARY_TELEGRAM_HELP = [
  "<b>Recharza Support commands</b>",
  "",
  "<code>/start</code> or <code>/menu</code> — open the support options.",
  "<code>/new</code> — start a fresh request.",
  "<code>/status RZS-XXXXXXXXXXXX</code> — check a support ticket already linked to this Telegram chat.",
  "<code>/cancel</code> — discard the current unfinished request.",
  "<code>/help</code> — show this guide again.",
  "",
  "Order details are only shown through the secure Recharza tracking link. Never send passwords, OTPs, PINs, card details, or private access tokens.",
].join("\n");

export const PRIMARY_TELEGRAM_MENU_BUTTON = {
  type: "commands",
} as const;

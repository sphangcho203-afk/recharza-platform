import "server-only";

const DEFAULT_GMAIL_FROM = "recherzatopup@gmail.com";

type MailProvider = "gmail" | "resend";

export type SystemEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type SystemEmailResult = {
  provider: MailProvider;
  messageId: string;
};

function value(name: string) {
  return process.env[name]?.trim() ?? "";
}

function cleanHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(cleanHeader(value), "utf8").toString("base64")}?=`;
}

function base64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function selectedProvider(): MailProvider {
  const configured = value("EMAIL_DELIVERY_PROVIDER").toLowerCase();
  return configured === "resend" ? "resend" : "gmail";
}

function gmailClientId() {
  return value("GOOGLE_MAIL_CLIENT_ID") || value("GOOGLE_CLIENT_ID");
}

function gmailClientSecret() {
  return value("GOOGLE_MAIL_CLIENT_SECRET") || value("GOOGLE_CLIENT_SECRET");
}

function gmailRefreshToken() {
  return value("GOOGLE_MAIL_REFRESH_TOKEN");
}

function gmailSender() {
  const configured =
    value("GOOGLE_MAIL_FROM") ||
    value("NEXT_PUBLIC_SUPPORT_EMAIL") ||
    DEFAULT_GMAIL_FROM;
  if (configured.includes("<") && configured.includes(">")) {
    return cleanHeader(configured);
  }
  return `Recharza <${cleanHeader(configured)}>`;
}

function gmailConfigured() {
  return Boolean(gmailClientId() && gmailClientSecret() && gmailRefreshToken());
}

function resendConfigured() {
  return Boolean(value("RESEND_API_KEY") && value("RESEND_FROM_EMAIL"));
}

function gmailMissingFields() {
  const missing: string[] = [];
  if (!gmailClientId()) missing.push("Google OAuth client ID");
  if (!gmailClientSecret()) missing.push("Google OAuth client secret");
  if (!gmailRefreshToken()) missing.push("GOOGLE_MAIL_REFRESH_TOKEN");
  return missing;
}

export function getMailDeliveryConfiguration() {
  const requestedProvider = selectedProvider();
  const gmail = {
    clientId: Boolean(gmailClientId()),
    clientSecret: Boolean(gmailClientSecret()),
    refreshToken: Boolean(gmailRefreshToken()),
    from: gmailSender(),
    configured: gmailConfigured(),
    usingSharedGoogleClient: Boolean(
      !value("GOOGLE_MAIL_CLIENT_ID") &&
        !value("GOOGLE_MAIL_CLIENT_SECRET") &&
        value("GOOGLE_CLIENT_ID") &&
        value("GOOGLE_CLIENT_SECRET"),
    ),
    missing: gmailMissingFields(),
  };
  const resend = {
    apiKey: Boolean(value("RESEND_API_KEY")),
    from: Boolean(value("RESEND_FROM_EMAIL")),
    configured: resendConfigured(),
  };

  return {
    requestedProvider,
    provider:
      requestedProvider === "gmail"
        ? gmail.configured
          ? ("gmail" as const)
          : null
        : resend.configured
          ? ("resend" as const)
          : null,
    gmail,
    resend,
  };
}

async function gmailAccessToken() {
  const clientId = gmailClientId();
  const clientSecret = gmailClientSecret();
  const refreshToken = gmailRefreshToken();

  if (!clientId || !clientSecret || !refreshToken) {
    const missing = gmailMissingFields();
    throw new Error(
      `Gmail OAuth delivery is incomplete${missing.length ? `: missing ${missing.join(", ")}` : ""}.`,
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | { access_token?: unknown; error?: unknown; error_description?: unknown }
    | null;

  if (!response.ok || typeof payload?.access_token !== "string") {
    const reason =
      typeof payload?.error_description === "string"
        ? payload.error_description
        : typeof payload?.error === "string"
          ? payload.error
          : `Google OAuth token exchange returned HTTP ${response.status}.`;
    throw new Error(`Gmail OAuth token exchange failed: ${reason}`);
  }

  return payload.access_token;
}

function buildGmailRawMessage(input: SystemEmailInput) {
  const boundary = `recharza_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${gmailSender()}`,
    `To: ${cleanHeader(input.to)}`,
    `Subject: ${encodeHeader(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
  ];

  if (input.replyTo) headers.push(`Reply-To: ${cleanHeader(input.replyTo)}`);
  if (input.idempotencyKey) {
    headers.push(
      `X-Recharza-Idempotency-Key: ${cleanHeader(input.idempotencyKey).slice(0, 200)}`,
    );
  }

  const text =
    input.text?.trim() || "This message requires an HTML-capable email client.";
  return [
    ...headers,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    input.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function sendWithGmail(
  input: SystemEmailInput,
): Promise<SystemEmailResult> {
  const accessToken = await gmailAccessToken();
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64Url(buildGmailRawMessage(input)) }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { id?: unknown; error?: { message?: unknown } }
    | null;

  if (!response.ok || typeof payload?.id !== "string") {
    const reason =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `Gmail API returned HTTP ${response.status}.`;
    throw new Error(`Gmail API send failed: ${reason}`);
  }

  return { provider: "gmail", messageId: payload.id };
}

async function sendWithResend(
  input: SystemEmailInput,
): Promise<SystemEmailResult> {
  const apiKey = value("RESEND_API_KEY");
  const from = value("RESEND_FROM_EMAIL");
  if (!apiKey || !from) throw new Error("Resend delivery is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey
        ? {
            "Idempotency-Key": cleanHeader(input.idempotencyKey).slice(0, 256),
          }
        : {}),
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      reply_to: input.replyTo || undefined,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: unknown; message?: unknown; error?: { message?: unknown } }
    | null;

  if (!response.ok || typeof payload?.id !== "string") {
    const reason =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error?.message === "string"
          ? payload.error.message
          : `Resend returned HTTP ${response.status}.`;
    throw new Error(reason);
  }

  return { provider: "resend", messageId: payload.id };
}

export async function sendSystemEmail(
  input: SystemEmailInput,
): Promise<SystemEmailResult> {
  const configuration = getMailDeliveryConfiguration();

  if (configuration.requestedProvider === "gmail") {
    if (!configuration.gmail.configured) {
      throw new Error(
        `Gmail is the configured Recharza mail transport but OAuth is incomplete: ${configuration.gmail.missing.join(", ") || "unknown Gmail configuration error"}.`,
      );
    }
    return sendWithGmail(input);
  }

  if (!configuration.resend.configured) {
    throw new Error(
      "Resend is explicitly selected but its API key or sender is missing.",
    );
  }
  return sendWithResend(input);
}

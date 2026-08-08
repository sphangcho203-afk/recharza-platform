const environment = (
  process.env.DEPLOYMENT_ENV ||
  (process.env.NODE_ENV === "production" ? "production" : "development")
).toLowerCase();
const hosted = environment === "staging" || environment === "production";

const errors = [];
const warnings = [];

function value(name) {
  return (process.env[name] || "").trim();
}

function requireSecret(name, minimum = 32) {
  const current = value(name);
  if (!current) errors.push(`${name} is required.`);
  else if (current.length < minimum) {
    errors.push(`${name} must contain at least ${minimum} characters.`);
  }
}

function validHttpUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validEmailList(input) {
  return input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry));
}

const databaseUrl = value("DATABASE_URL");
if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  errors.push("DATABASE_URL must be a PostgreSQL connection string.");
}

const appUrl = value("NEXT_PUBLIC_APP_URL");
if (!validHttpUrl(appUrl)) {
  errors.push("NEXT_PUBLIC_APP_URL must be a valid HTTP(S) URL.");
} else if (hosted && /localhost|127\.0\.0\.1/i.test(appUrl)) {
  errors.push("Hosted staging cannot use localhost in NEXT_PUBLIC_APP_URL.");
}

requireSecret("ORDER_ACCESS_SECRET");
requireSecret("RATE_LIMIT_SALT");
requireSecret("CRON_SECRET");

const emailDeliveryProvider = (
  value("EMAIL_DELIVERY_PROVIDER") || "gmail"
).toLowerCase();
if (!["gmail", "resend"].includes(emailDeliveryProvider)) {
  errors.push("EMAIL_DELIVERY_PROVIDER must be gmail or resend.");
}

const gmailClientId = value("GOOGLE_MAIL_CLIENT_ID") || value("GOOGLE_CLIENT_ID");
const gmailClientSecret =
  value("GOOGLE_MAIL_CLIENT_SECRET") || value("GOOGLE_CLIENT_SECRET");
const gmailRefreshToken = value("GOOGLE_MAIL_REFRESH_TOKEN");
const gmailMailReady = Boolean(
  gmailClientId && gmailClientSecret && gmailRefreshToken,
);
const resendMailValues = [value("RESEND_API_KEY"), value("RESEND_FROM_EMAIL")];
const resendMailConfiguredCount = resendMailValues.filter(Boolean).length;
const resendMailReady = resendMailConfiguredCount === resendMailValues.length;

if (gmailClientId && !gmailClientId.endsWith(".apps.googleusercontent.com")) {
  errors.push(
    "The Google OAuth client used for Gmail delivery must end in .apps.googleusercontent.com.",
  );
}
if (resendMailConfiguredCount > 0 && !resendMailReady) {
  errors.push("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured together.");
}
if (emailDeliveryProvider === "gmail" && !gmailMailReady) {
  errors.push(
    "EMAIL_DELIVERY_PROVIDER=gmail requires GOOGLE_MAIL_REFRESH_TOKEN plus a Google OAuth client ID and secret. GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET may be reused when they belong to the same OAuth client.",
  );
}
if (emailDeliveryProvider === "resend" && !resendMailReady) {
  errors.push(
    "EMAIL_DELIVERY_PROVIDER=resend requires RESEND_API_KEY and RESEND_FROM_EMAIL.",
  );
}

if (hosted) {
  if (!validEmailList(value("AUTH_ADMIN_EMAILS"))) {
    errors.push(
      "AUTH_ADMIN_EMAILS must contain at least one valid administrator email.",
    );
  }

  const googleClientId = value("GOOGLE_CLIENT_ID");
  if (!googleClientId.endsWith(".apps.googleusercontent.com")) {
    errors.push(
      "GOOGLE_CLIENT_ID must be a Google web client ID ending in .apps.googleusercontent.com.",
    );
  }
  if (!value("GOOGLE_CLIENT_SECRET")) {
    errors.push("GOOGLE_CLIENT_SECRET is required for hosted Google OAuth.");
  }
  requireSecret("GOOGLE_OAUTH_STATE_SECRET");

  if (emailDeliveryProvider === "gmail" && !gmailMailReady) {
    errors.push(
      "Hosted Recharza email is set to Gmail, but the Gmail OAuth transport is incomplete.",
    );
  }
  if (emailDeliveryProvider === "resend" && !resendMailReady) {
    errors.push(
      "Hosted Recharza email is set to Resend, but the Resend transport is incomplete.",
    );
  }
}

const paymentProvider = (value("PAYMENT_PROVIDER") || "internal").toLowerCase();
if (!["internal", "razorpay"].includes(paymentProvider)) {
  errors.push("PAYMENT_PROVIDER must be internal or razorpay.");
}

const internalOutcome = value("INTERNAL_PAYMENT_OUTCOME").toLowerCase();
if (internalOutcome && !["completed", "failed"].includes(internalOutcome)) {
  errors.push("INTERNAL_PAYMENT_OUTCOME must be completed, failed, or empty.");
}
if (environment === "production" && paymentProvider === "internal") {
  warnings.push(
    "Internal payment handling is enabled in production. Confirm this is an intentional controlled rollout.",
  );
}

const razorpayKeyId = value("RAZORPAY_KEY_ID");
const razorpayKeySecret = value("RAZORPAY_KEY_SECRET");
const razorpayWebhookSecret = value("RAZORPAY_WEBHOOK_SECRET");
const razorpayValues = [
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
];
const razorpayConfiguredCount = razorpayValues.filter(Boolean).length;

if (
  razorpayConfiguredCount > 0 &&
  razorpayConfiguredCount < razorpayValues.length
) {
  errors.push(
    "Razorpay key ID, key secret, and webhook secret must be configured together.",
  );
}
if (razorpayKeyId && !razorpayKeyId.startsWith("rzp_test_")) {
  errors.push(
    "RAZORPAY_KEY_ID must be a Test Mode key beginning with rzp_test_. Live keys are blocked in this rollout.",
  );
}
if (paymentProvider === "razorpay" && !razorpayKeyId) {
  errors.push("PAYMENT_PROVIDER=razorpay requires complete Razorpay credentials.");
}

const ignProvider = (value("IGN_LOOKUP_PROVIDER") || "internal").toLowerCase();
if (!["internal", "rapidapi"].includes(ignProvider)) {
  errors.push("IGN_LOOKUP_PROVIDER must be internal or rapidapi.");
}
if (ignProvider === "rapidapi") {
  warnings.push(
    "External player lookup is selected. Confirm the provider adapter and credentials before deployment.",
  );
}

const supplierKey = value("FAZERCARDS_API_KEY");
const supplierCategories = value("FAZERCARDS_PUBLISHED_CATEGORY_IDS");
const supplierCreatePath = value("FAZERCARDS_ORDER_CREATE_PATH");
const supplierStatusPath = value("FAZERCARDS_ORDER_STATUS_PATH");
const supplierWritesEnabled =
  value("FAZERCARDS_ORDER_WRITES_ENABLED") === "true";

if (supplierKey && !supplierCategories) {
  warnings.push(
    "FazerCards is configured without reviewed publication category IDs; no live offers should publish.",
  );
}
if (
  supplierStatusPath &&
  !supplierStatusPath.includes("{order_id}") &&
  !supplierStatusPath.includes(":orderId")
) {
  errors.push(
    "FAZERCARDS_ORDER_STATUS_PATH must contain {order_id} or :orderId.",
  );
}
if (supplierWritesEnabled) {
  if (!supplierKey) errors.push("Supplier writes require FAZERCARDS_API_KEY.");
  if (!supplierCreatePath) {
    errors.push("Supplier writes require FAZERCARDS_ORDER_CREATE_PATH.");
  }
  if (!supplierStatusPath) {
    errors.push("Supplier writes require FAZERCARDS_ORDER_STATUS_PATH.");
  }
  warnings.push(
    "FazerCards supplier writes are ENABLED. Confirm this is intentional before deploying.",
  );
} else {
  warnings.push(
    "FazerCards supplier writes are disabled; orders remain inside the controlled store flow.",
  );
}

console.log(`Recharza deployment environment: ${environment}`);
console.log(`Required configuration errors: ${errors.length}`);
for (const error of errors) console.error(`ERROR: ${error}`);
for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length) {
  console.error("Deployment validation failed. No secret values were printed.");
  process.exit(1);
}

console.log("Deployment configuration passed redacted validation.");

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

function requireValue(name, message = `${name} is required.`) {
  if (!value(name)) errors.push(message);
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

if (hosted) {
  if (!validEmailList(value("AUTH_ADMIN_EMAILS"))) {
    errors.push("AUTH_ADMIN_EMAILS must contain at least one valid administrator email.");
  }
  requireValue("RESEND_API_KEY", "RESEND_API_KEY is required for hosted magic-link delivery.");
  requireValue("RESEND_FROM_EMAIL", "RESEND_FROM_EMAIL is required for hosted magic-link delivery.");
}

const razorpayKeyId = value("RAZORPAY_KEY_ID");
const razorpayKeySecret = value("RAZORPAY_KEY_SECRET");
const razorpayWebhookSecret = value("RAZORPAY_WEBHOOK_SECRET");
const razorpayValues = [razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret];
const razorpayConfiguredCount = razorpayValues.filter(Boolean).length;

if (razorpayConfiguredCount > 0 && razorpayConfiguredCount < razorpayValues.length) {
  errors.push("Razorpay Test Mode key ID, key secret, and webhook secret must be configured together.");
}
if (razorpayKeyId && !razorpayKeyId.startsWith("rzp_test_")) {
  errors.push("RAZORPAY_KEY_ID must be a Test Mode key beginning with rzp_test_. Live keys are blocked.");
}
if (!razorpayKeyId) {
  warnings.push("Razorpay Test Mode is not configured; simulated checkout will remain unavailable.");
}

const supplierKey = value("FAZERCARDS_API_KEY");
const supplierCategories = value("FAZERCARDS_PUBLISHED_CATEGORY_IDS");
const supplierCreatePath = value("FAZERCARDS_ORDER_CREATE_PATH");
const supplierStatusPath = value("FAZERCARDS_ORDER_STATUS_PATH");
const supplierWritesEnabled = value("FAZERCARDS_ORDER_WRITES_ENABLED") === "true";

if (supplierKey && !supplierCategories) {
  warnings.push("FazerCards is configured without reviewed publication category IDs; no live offers should publish.");
}
if (supplierStatusPath && !supplierStatusPath.includes("{order_id}") && !supplierStatusPath.includes(":orderId")) {
  errors.push("FAZERCARDS_ORDER_STATUS_PATH must contain {order_id} or :orderId.");
}
if (supplierWritesEnabled) {
  if (!supplierKey) errors.push("Supplier writes require FAZERCARDS_API_KEY.");
  if (!supplierCreatePath) errors.push("Supplier writes require FAZERCARDS_ORDER_CREATE_PATH.");
  if (!supplierStatusPath) errors.push("Supplier writes require FAZERCARDS_ORDER_STATUS_PATH.");
  warnings.push("FazerCards supplier writes are ENABLED. Confirm this is intentional before deploying.");
} else {
  warnings.push("FazerCards supplier writes are disabled; paid orders will create dry-run fulfilment plans.");
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

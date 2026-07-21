import "server-only";

export type DeploymentCheck = {
  id: string;
  label: string;
  category: "core" | "accounts" | "payments" | "supplier" | "operations";
  required: boolean;
  ready: boolean;
  message: string;
};

export type DeploymentReadiness = {
  environment: "development" | "staging" | "production";
  coreReady: boolean;
  fullReady: boolean;
  liveChargingBlocked: true;
  supplierWritesEnabled: boolean;
  checks: DeploymentCheck[];
};

function value(name: string) {
  return process.env[name]?.trim() ?? "";
}

function isLongSecret(name: string, minimum = 32) {
  return value(name).length >= minimum;
}

function isHttpUrl(input: string) {
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isPostgresUrl(input: string) {
  return /^postgres(?:ql)?:\/\//i.test(input);
}

function hasEmailList(name: string) {
  return value(name)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry));
}

function resolveEnvironment(): DeploymentReadiness["environment"] {
  const configured = value("DEPLOYMENT_ENV").toLowerCase();
  if (configured === "production" || configured === "staging") return configured;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function evaluateDeploymentReadiness(): DeploymentReadiness {
  const environment = resolveEnvironment();
  const hosted = environment === "staging" || environment === "production";
  const appUrl = value("NEXT_PUBLIC_APP_URL");
  const razorpayKeyId = value("RAZORPAY_KEY_ID");
  const razorpayKeySecret = value("RAZORPAY_KEY_SECRET");
  const razorpayWebhookSecret = value("RAZORPAY_WEBHOOK_SECRET");
  const paymentAny = Boolean(razorpayKeyId || razorpayKeySecret || razorpayWebhookSecret);
  const paymentReady =
    razorpayKeyId.startsWith("rzp_test_") &&
    Boolean(razorpayKeySecret) &&
    Boolean(razorpayWebhookSecret);
  const supplierKey = value("FAZERCARDS_API_KEY");
  const supplierCategories = value("FAZERCARDS_PUBLISHED_CATEGORY_IDS");
  const supplierCreatePath = value("FAZERCARDS_ORDER_CREATE_PATH");
  const supplierStatusPath = value("FAZERCARDS_ORDER_STATUS_PATH");
  const supplierWritesEnabled = value("FAZERCARDS_ORDER_WRITES_ENABLED") === "true";
  const statusTemplateValid =
    !supplierStatusPath ||
    supplierStatusPath.includes("{order_id}") ||
    supplierStatusPath.includes(":orderId");
  const supplierWriteSafe =
    !supplierWritesEnabled ||
    (Boolean(supplierKey) && Boolean(supplierCreatePath) && statusTemplateValid);

  const checks: DeploymentCheck[] = [
    {
      id: "database-url",
      label: "PostgreSQL connection",
      category: "core",
      required: true,
      ready: isPostgresUrl(value("DATABASE_URL")),
      message: isPostgresUrl(value("DATABASE_URL"))
        ? "A PostgreSQL connection string is configured."
        : "DATABASE_URL must be a PostgreSQL connection string.",
    },
    {
      id: "public-url",
      label: "Public application URL",
      category: "core",
      required: true,
      ready: isHttpUrl(appUrl) && (!hosted || !/localhost|127\.0\.0\.1/i.test(appUrl)),
      message:
        isHttpUrl(appUrl) && (!hosted || !/localhost|127\.0\.0\.1/i.test(appUrl))
          ? "The public application URL is configured."
          : "NEXT_PUBLIC_APP_URL must be the deployed HTTP(S) URL, not localhost.",
    },
    {
      id: "order-secret",
      label: "Order access secret",
      category: "core",
      required: true,
      ready: isLongSecret("ORDER_ACCESS_SECRET"),
      message: isLongSecret("ORDER_ACCESS_SECRET")
        ? "Order access tokens can be derived securely."
        : "ORDER_ACCESS_SECRET must contain at least 32 characters.",
    },
    {
      id: "rate-limit-salt",
      label: "Rate-limit salt",
      category: "core",
      required: true,
      ready: isLongSecret("RATE_LIMIT_SALT"),
      message: isLongSecret("RATE_LIMIT_SALT")
        ? "Client fingerprints can be salted."
        : "RATE_LIMIT_SALT must contain at least 32 characters.",
    },
    {
      id: "cron-secret",
      label: "Maintenance secret",
      category: "operations",
      required: true,
      ready: isLongSecret("CRON_SECRET"),
      message: isLongSecret("CRON_SECRET")
        ? "Maintenance routes have a protected bearer secret."
        : "CRON_SECRET must contain at least 32 characters.",
    },
    {
      id: "admin-account",
      label: "Administrator allowlist",
      category: "accounts",
      required: hosted,
      ready: hasEmailList("AUTH_ADMIN_EMAILS"),
      message: hasEmailList("AUTH_ADMIN_EMAILS")
        ? "At least one reviewed administrator email is configured."
        : "AUTH_ADMIN_EMAILS needs at least one valid address for hosted staging.",
    },
    {
      id: "email-delivery",
      label: "Verified email delivery",
      category: "accounts",
      required: hosted,
      ready: Boolean(value("RESEND_API_KEY")) && Boolean(value("RESEND_FROM_EMAIL")),
      message:
        value("RESEND_API_KEY") && value("RESEND_FROM_EMAIL")
          ? "Production-style magic-link email delivery is configured."
          : "RESEND_API_KEY and RESEND_FROM_EMAIL are required for hosted sign-in.",
    },
    {
      id: "razorpay-test",
      label: "Razorpay Test Mode",
      category: "payments",
      required: false,
      ready: paymentReady,
      message: paymentReady
        ? "Test key, secret, and webhook secret are configured."
        : paymentAny
          ? "Razorpay is partially configured or the key is not a Test Mode key."
          : "Razorpay Test Mode is optional and currently disabled.",
    },
    {
      id: "fazercards-catalogue",
      label: "FazerCards catalogue",
      category: "supplier",
      required: false,
      ready: Boolean(supplierKey) && Boolean(supplierCategories),
      message:
        supplierKey && supplierCategories
          ? "Supplier access and reviewed publication categories are configured."
          : "Supplier catalogue sync is optional until an API key and reviewed categories are configured.",
    },
    {
      id: "supplier-write-gate",
      label: "Supplier write safety",
      category: "supplier",
      required: supplierWritesEnabled,
      ready: supplierWriteSafe,
      message: supplierWritesEnabled
        ? supplierWriteSafe
          ? "Supplier writes are explicitly enabled with required paths present."
          : "Supplier writes are enabled without complete create/status configuration."
        : "Supplier writes remain safely disabled; fulfilment will use dry-run plans.",
    },
    {
      id: "supplier-status-template",
      label: "Supplier status template",
      category: "supplier",
      required: Boolean(supplierStatusPath),
      ready: statusTemplateValid,
      message: statusTemplateValid
        ? supplierStatusPath
          ? "The status path includes a provider-order placeholder."
          : "Supplier status reconciliation is optional and not configured."
        : "FAZERCARDS_ORDER_STATUS_PATH must contain {order_id} or :orderId.",
    },
  ];

  const coreReady = checks.filter((check) => check.required).every((check) => check.ready);
  const fullReady = coreReady && checks.every((check) => !check.required || check.ready);

  return {
    environment,
    coreReady,
    fullReady,
    liveChargingBlocked: true,
    supplierWritesEnabled,
    checks,
  };
}

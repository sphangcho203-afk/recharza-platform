const baseUrl = (
  process.argv.find((argument) => argument.startsWith("--base="))?.slice(7) ||
  process.env.SMOKE_TEST_BASE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const failures = [];

async function check(input) {
  const startedAt = Date.now();
  const url = `${baseUrl}${input.path}`;

  try {
    const response = await fetch(url, {
      method: input.method ?? "GET",
      headers: {
        "User-Agent": "Recharza-Phase1-Smoke/2.0",
        ...(input.body ? { "Content-Type": "application/json" } : {}),
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const duration = Date.now() - startedAt;
    const location = response.headers.get("location");
    const statusPassed = input.expected.includes(response.status);
    const locationPassed =
      !input.expectedLocation || location === input.expectedLocation;
    const passed = statusPassed && locationPassed;

    console.log(
      `${passed ? "PASS" : "FAIL"} ${response.status} ${duration}ms ${input.label} ${input.path}${location ? ` -> ${location}` : ""}`,
    );

    if (!statusPassed) {
      failures.push(
        `${input.label} returned ${response.status}; expected ${input.expected.join(" or ")}.`,
      );
    } else if (!locationPassed) {
      failures.push(
        `${input.label} redirected to ${location ?? "nowhere"}; expected ${input.expectedLocation}.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown request failure";
    console.error(`FAIL request ${input.label}: ${message}`);
    failures.push(`${input.label} could not be reached.`);
  }
}

const checks = [
  {
    label: "liveness",
    path: "/api/health",
    expected: [200],
  },
  {
    label: "readiness",
    path: "/api/readiness",
    expected: [200, 503],
  },
  {
    label: "storefront",
    path: "/",
    expected: [200],
  },
  {
    label: "credentials account gateway",
    path: "/account",
    expected: [200],
  },
  {
    label: "forgot-password page",
    path: "/forgot-password",
    expected: [200],
  },
  {
    label: "reset-password page",
    path: "/reset-password",
    expected: [200],
  },
  {
    label: "cart page",
    path: "/cart",
    expected: [200],
  },
  {
    label: "support destination",
    path: "/support",
    expected: [200],
  },
  {
    label: "Mobile Legends market selector",
    path: "/games/mobile-legends",
    expected: [200],
  },
  {
    label: "Mobile Legends India checkout gateway",
    path: "/games/mobile-legends/india",
    expected: [200, 307],
  },
  {
    label: "anonymous session response",
    path: "/api/auth/session",
    expected: [200],
  },
  {
    label: "safe forgot-password response",
    path: "/api/auth/forgot-password",
    method: "POST",
    body: {
      email: `rollout-smoke-${Date.now()}@example.invalid`,
    },
    expected: [200],
  },
  {
    label: "invalid credential rejection or unavailable auth service",
    path: "/api/auth/login",
    method: "POST",
    body: {
      email: `rollout-smoke-${Date.now()}@example.invalid`,
      password: "NotARealPassword123",
    },
    expected: [401, 429, 503],
  },
  {
    label: "invalid player request rejection",
    path: "/api/games/mobile-legends/verify",
    method: "POST",
    body: {},
    expected: [400, 429, 503],
  },
];

console.log(`Recharza Phase 1 customer-flow target: ${baseUrl}`);

for (const input of checks) {
  await check(input);
}

if (failures.length) {
  console.error(`\nPhase 1 customer-flow smoke failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nAll Phase 1 customer-flow smoke checks passed.");

const baseUrl = (
  process.env.SMOKE_TEST_BASE_URL ||
  process.argv.find((argument) => argument.startsWith("--base="))?.slice(7) ||
  ""
).replace(/\/$/, "");
const allowUnready =
  process.env.SMOKE_ALLOW_UNREADY === "true" || process.argv.includes("--allow-unready");

if (!baseUrl) {
  console.error("SMOKE_TEST_BASE_URL or --base=https://example.com is required.");
  process.exit(1);
}

const routes = [
  { path: "/api/health", expected: [200], label: "liveness" },
  {
    path: "/api/readiness",
    expected: allowUnready ? [200, 503] : [200],
    label: "deployment readiness",
  },
  { path: "/", expected: [200], label: "storefront" },
  { path: "/account", expected: [200], label: "account" },
  { path: "/games/mobile-legends", expected: [200], label: "Mobile Legends checkout" },
  { path: "/orders/lookup", expected: [200], label: "order lookup" },
  { path: "/operator", expected: [200], label: "operator console" },
];

const failures = [];

for (const route of routes) {
  const url = `${baseUrl}${route.path}`;
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Recharza-Staging-Smoke-Test/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    const duration = Date.now() - startedAt;
    const passed = route.expected.includes(response.status);
    console.log(
      `${passed ? "PASS" : "FAIL"} ${response.status} ${duration}ms ${route.label} ${route.path}`,
    );

    if (!passed) {
      failures.push(
        `${route.path} returned ${response.status}; expected ${route.expected.join(" or ")}.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown request failure";
    console.error(`FAIL request ${route.label} ${route.path}: ${message}`);
    failures.push(`${route.path} could not be reached.`);
  }
}

if (failures.length) {
  console.error(`Smoke test failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("All Recharza staging smoke tests passed.");

import { lookupVolseverGameIdentity, volseverGameSlugs } from "../lib/volsever";

const checks: { name: string; run: () => Promise<void> | void }[] = [];
let passed = 0;
let failed = 0;

function check(name: string, run: () => Promise<void> | void) {
  checks.push({ name, run });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectProviderError(action: () => Promise<unknown>, message: string) {
  let threw = false;
  try {
    await action();
  } catch (error) {
    threw = true;
    assert(
      error instanceof Error && error.name === "VolseverProviderError",
      `${message}: expected VolseverProviderError, got ${(error as Error).name}`,
    );
  }
  assert(threw, `${message}: expected an error to be thrown`);
}

async function expectRuntimeConfigError(action: () => Promise<unknown>, message: string) {
  let threw = false;
  try {
    await action();
  } catch (error) {
    threw = true;
    assert(
      error instanceof Error && error.name === "RuntimeConfigurationError",
      `${message}: expected RuntimeConfigurationError, got ${(error as Error).name}`,
    );
  }
  assert(threw, `${message}: expected an error to be thrown`);
}

function mockFetch(latest: { url: URL | null; headers: Headers | null }) {
  return async (
    url: RequestInfo | URL,
    init: RequestInit | undefined,
    payload: unknown,
    options: { status?: number; contentType?: string } = {},
  ) => {
    latest.url =
      typeof url === "string"
        ? new URL(url)
        : url instanceof URL
          ? url
          : new URL(url.url);
    latest.headers = new Headers(init?.headers);
    const headers: Record<string, string> = {
      "content-type": options.contentType ?? "application/json",
    };
    if (typeof payload === "string") return new Response(payload, { status: options.status ?? 200, headers });
    return new Response(JSON.stringify(payload), { status: options.status ?? 200, headers });
  };
}

check("every store game maps to a Volsever game slug", () => {
  for (const game of ["mobile-legends", "free-fire", "pubg-mobile", "valorant", "genshin-impact"]) {
    assert(
      Object.prototype.hasOwnProperty.call(volseverGameSlugs, game),
      `${game} must be in volseverGameSlugs`,
    );
  }
  assert(
    volseverGameSlugs["pubg-mobile"] === "pubg-mobile-global",
    `pubg-mobile must map to pubg-mobile-global`,
  );
});

check("valid Volsever responses confirm each store game and echo the IGN", async () => {
  const cases = [
    { gameSlug: "mobile-legends" as const, playerId: "123456789", zoneId: "2045", providerSlug: "mobile-legends" },
    { gameSlug: "free-fire" as const, playerId: "987654321", zoneId: "", providerSlug: "free-fire" },
    { gameSlug: "pubg-mobile" as const, playerId: "55112233", zoneId: "", providerSlug: "pubg-mobile-global" },
    { gameSlug: "valorant" as const, playerId: "PlayerName#TAG", zoneId: "", providerSlug: "valorant" },
    { gameSlug: "genshin-impact" as const, playerId: "9012345678", zoneId: "America", providerSlug: "genshin-impact" },
  ];

  for (const testCase of cases) {
    const latest = { url: null as URL | null, headers: null as Headers | null };
    const result = await lookupVolseverGameIdentity(
      { gameSlug: testCase.gameSlug, playerId: testCase.playerId, zoneId: testCase.zoneId },
      {
        apiKey: "sk_test_volsever_placeholder_key",
        fetchImpl: (url, init) => mockFetch(latest)(url, init, {
          status: true,
          code: 200,
          message: "ok",
          data: { user_id: testCase.playerId, username: "InGameName" },
        }),
      },
    );

    assert(result.valid, `${testCase.gameSlug}: expected valid lookup`);
    assert(result.confirmed, `${testCase.gameSlug}: expected confirmed`);
    assert(result.nickname === "InGameName", `${testCase.gameSlug}: IGN must be returned`);
    assert(result.verificationMode === "volsever-lookup", `${testCase.gameSlug}: expected volsever-lookup mode`);
    assert(result.playerId === testCase.playerId, `${testCase.gameSlug}: playerId must be echoed back`);
    assert(result.zoneId === testCase.zoneId, `${testCase.gameSlug}: zoneId must be echoed back`);

    assert(latest.url !== null, `${testCase.gameSlug}: request must be made`);
    assert(
      latest.url.pathname === `/proxy/api/game/${testCase.providerSlug}`,
      `${testCase.gameSlug}: expected path /proxy/api/game/${testCase.providerSlug}, got ${latest.url.pathname}`,
    );
    assert(
      latest.url.searchParams.get("id") === testCase.playerId,
      `${testCase.gameSlug}: id param must be the player identifier`,
    );
    if (testCase.zoneId) {
      assert(
        latest.url.searchParams.get("zone") === testCase.zoneId,
        `${testCase.gameSlug}: zone param must be sent when a zone exists`,
      );
    } else {
      assert(
        !latest.url.search.includes("zone="),
        `${testCase.gameSlug}: zone param must be omitted when no zone exists`,
      );
    }
    assert(
      latest.headers?.get("x-api-key") === "sk_test_volsever_placeholder_key",
      `${testCase.gameSlug}: X-API-Key header must carry the configured key`,
    );
    assert(latest.headers?.get("accept") === "application/json", `${testCase.gameSlug}: Accept header expected`);
  }
});

check("valorant Riot IDs are URL-encoded in the request (contains # tag)", async () => {
  const latest = { url: null as URL | null, headers: null as Headers | null };
  await lookupVolseverGameIdentity(
    { gameSlug: "valorant", playerId: "PlayerName#TAG", zoneId: "" },
    {
      apiKey: "sk_test_volsever_placeholder_key",
      fetchImpl: (url, init) => mockFetch(latest)(url, init, {
        status: true,
        code: 200,
        data: { user_id: "PlayerName#TAG", username: "PlayerName" },
      }),
    },
  );
  assert(latest.url?.search.includes("%23"), "Riot ID hash tag must be percent-encoded in the query string");
});

check("invalid player and failed lookups return valid:false without confirmation", async () => {
  const latest = { url: null as URL | null, headers: null as Headers | null };
  const result = await lookupVolseverGameIdentity(
    { gameSlug: "free-fire", playerId: "999999999", zoneId: "" },
    {
      apiKey: "sk_test_volsever_placeholder_key",
      fetchImpl: (url, init) => mockFetch(latest)(url, init, {
        status: false,
        code: 404,
        message: "Player not found.",
        data: null,
      }),
    },
  );
  assert(!result.valid && !result.confirmed, "invalid player must fail verification");
  assert(result.nickname === null, "invalid player must not expose a nickname");
  assert(result.message === "Player not found.", "provider message must be preserved");
});

check("provider 401 responses surface as configuration errors", () =>
  expectRuntimeConfigError(
    async () =>
      lookupVolseverGameIdentity(
        { gameSlug: "mobile-legends", playerId: "123456789", zoneId: "2045" },
        {
          apiKey: "sk_test_volsever_placeholder_key",
          fetchImpl: async () =>
            new Response(JSON.stringify({ status: false, code: 401, message: "Invalid API key", data: null }), {
              status: 401,
            }),
        },
      ),
    "401 must throw RuntimeConfigurationError",
  ));

check("responses that do not echo the player id are never trusted", () =>
  expectProviderError(
    async () =>
      lookupVolseverGameIdentity(
        { gameSlug: "mobile-legends", playerId: "123456789", zoneId: "2045" },
        {
          apiKey: "sk_test_volsever_placeholder_key",
          fetchImpl: async () =>
            new Response(
              JSON.stringify({ status: true, code: 200, data: { user_id: "987654321", username: "SomeoneElse" } }),
            ),
        },
      ),
    "mismatched user_id must throw VolseverProviderError",
  ));

check("success responses without a username are never trusted", () =>
  expectProviderError(
    async () =>
      lookupVolseverGameIdentity(
        { gameSlug: "mobile-legends", playerId: "123456789", zoneId: "2045" },
        {
          apiKey: "sk_test_volsever_placeholder_key",
          fetchImpl: async () =>
            new Response(
              JSON.stringify({ status: true, code: 200, data: { user_id: "123456789", username: "" } }),
            ),
        },
      ),
    "empty username must throw VolseverProviderError",
  ));

check("malformed provider responses surface as provider errors", () =>
  expectProviderError(
    async () =>
      lookupVolseverGameIdentity(
        { gameSlug: "mobile-legends", playerId: "123456789", zoneId: "2045" },
        {
          apiKey: "sk_test_volsever_placeholder_key",
          fetchImpl: async () => new Response("not-json", { status: 200 }),
        },
      ),
    "malformed JSON must throw VolseverProviderError",
  ));

check("network failures surface as provider errors", () =>
  expectProviderError(
    async () =>
      lookupVolseverGameIdentity(
        { gameSlug: "mobile-legends", playerId: "123456789", zoneId: "2045" },
        {
          apiKey: "sk_test_volsever_placeholder_key",
          fetchImpl: async () => {
            throw new Error("network down");
          },
        },
      ),
    "network failure must throw VolseverProviderError",
  ));

check("oversized provider responses are rejected", () =>
  expectProviderError(
    async () =>
      lookupVolseverGameIdentity(
        { gameSlug: "mobile-legends", playerId: "123456789", zoneId: "2045" },
        {
          apiKey: "sk_test_volsever_placeholder_key",
          fetchImpl: () =>
            Promise.resolve(
              new Response("x".repeat(70 * 1024), {
                headers: { "content-length": String(70 * 1024) },
              }),
            ),
        },
      ),
    "oversized response must throw VolseverProviderError",
  ));

check("long player identifiers are bounded before the request", async () => {
  const latest = { url: null as URL | null, headers: null as Headers | null };
  await lookupVolseverGameIdentity(
    { gameSlug: "free-fire", playerId: "9".repeat(120), zoneId: "" },
    {
      apiKey: "sk_test_volsever_placeholder_key",
      fetchImpl: (url, init) => mockFetch(latest)(url, init, {
        status: true,
        code: 200,
        data: { user_id: "9".repeat(120).slice(0, 64), username: "LongId" },
      }),
    },
  );
  assert(
    latest.url?.searchParams.get("id")?.length === 64,
    "player id sent to the provider must be capped at 64 characters",
  );
});

for (const { name, run } of checks) {
  try {
    await run();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${name}`);
    console.error(`  ${(error as Error).message}`);
  }
}

console.log(`\nVolsever verification mapping: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
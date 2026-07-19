import { requireEnvironmentVariable } from "@/lib/runtime-config";

const DEFAULT_BASE_URL = "https://api.fzr.cards/api/v2";
const PAGE_LIMIT = 100;
const MAX_CATEGORY_PAGES = 25;

export type FazerCardsCategory = {
  categoryId: string;
  name: string;
  note: string;
  gameSlug: string | null;
};

export type FazerCardsOffer = {
  offerId: string;
  name: string;
  priceUsd: string;
  region: string | null;
  raw: Record<string, unknown>;
};

export type FazerCardsOfferGroup = {
  categoryId: string;
  categoryName: string;
  fields: unknown[];
  offers: FazerCardsOffer[];
};

type ApiObject = Record<string, unknown>;

function getBaseUrl() {
  return (process.env.FAZERCARDS_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function asObject(value: unknown): ApiObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiObject)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function inferRegion(name: string) {
  const parenthetical = name.match(/\(([^)]+)\)/)?.[1]?.trim();

  if (parenthetical) {
    return parenthetical.slice(0, 80);
  }

  const regionMatch = name.match(
    /\b(global|worldwide|india|indonesia|malaysia|singapore|philippines|thailand|vietnam|cambodia|turkey|pakistan|brazil|europe|usa|us|uk|uae|ksa)\b/i,
  );

  return regionMatch?.[1] ?? null;
}

export function mapFazerCardsCategoryToGameSlug(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("mobile legends") || normalized.includes("mlbb")) {
    return "mobile-legends";
  }

  if (normalized.includes("free fire")) {
    return "free-fire";
  }

  if (normalized.includes("pubg")) {
    return "pubg-mobile";
  }

  if (normalized.includes("valorant")) {
    return "valorant";
  }

  if (normalized.includes("genshin")) {
    return "genshin-impact";
  }

  if (normalized.includes("roblox") || normalized.includes("robux")) {
    return "roblox";
  }

  return null;
}

async function fazerCardsFetch(path: string, searchParams?: URLSearchParams) {
  const apiKey = requireEnvironmentVariable("FAZERCARDS_API_KEY", { minLength: 12 });
  const url = new URL(`${getBaseUrl()}${path}`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  const text = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`FazerCards returned a non-JSON response with status ${response.status}.`);
  }

  if (!response.ok) {
    const message = asString(asObject(payload)?.message) || `FazerCards request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const object = asObject(payload);

  if (!object || object.ok !== true) {
    throw new Error(asString(object?.message) || "FazerCards returned an unsuccessful response.");
  }

  return object;
}

export async function listFazerCardsTopupCategories() {
  const categories: FazerCardsCategory[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_CATEGORY_PAGES; page += 1) {
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });

    if (cursor) {
      params.set("cursor", cursor);
    }

    const payload = await fazerCardsFetch("/topups", params);
    const items = Array.isArray(payload.items) ? payload.items : [];

    for (const item of items) {
      const object = asObject(item);
      const categoryId = asString(object?.category_id);
      const name = asString(object?.name);

      if (!categoryId || !name) {
        continue;
      }

      categories.push({
        categoryId,
        name,
        note: asString(object?.note),
        gameSlug: mapFazerCardsCategoryToGameSlug(name),
      });
    }

    const meta = asObject(payload.meta);
    const nextCursor = asString(meta?.next_cursor);
    const hasMore = meta?.has_more === true;

    if (!hasMore || !nextCursor) {
      break;
    }

    cursor = nextCursor;
  }

  return categories;
}

export async function getFazerCardsTopupOffers(
  categoryId: string,
): Promise<FazerCardsOfferGroup> {
  const payload = await fazerCardsFetch(
    "/topups/offers",
    new URLSearchParams({ category_id: categoryId }),
  );
  const offers: FazerCardsOffer[] = [];

  for (const item of Array.isArray(payload.offers) ? payload.offers : []) {
    const object = asObject(item);
    const offerId = asString(object?.offer_id);
    const name = asString(object?.name);
    const priceUsd = asString(object?.price_usd);

    if (!offerId || !name || !priceUsd || !object) {
      continue;
    }

    offers.push({
      offerId,
      name,
      priceUsd,
      region: inferRegion(name),
      raw: object,
    });
  }

  return {
    categoryId,
    categoryName: asString(payload.name),
    fields: Array.isArray(payload.fields) ? payload.fields : [],
    offers,
  };
}

export function getApprovedFazerCardsCategoryIds() {
  return new Set(
    (process.env.FAZERCARDS_PUBLISHED_CATEGORY_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

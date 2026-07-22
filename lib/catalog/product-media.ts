export type ProductMediaSource = "supplier" | "catalog" | "publisher";

export type ProductMedia = {
  sources: string[];
  alt: string;
  source: ProductMediaSource;
};

const knownMediaHosts = new Set([
  "www.joytify.com",
  "img.joytify.com",
  "play-lh.googleusercontent.com",
  "upload.wikimedia.org",
  "www.pubgmobile.com",
  "dl.dir.freefiremobile.com",
  "freefiremobile-a.akamaihd.net",
  "cdn2.unrealengine.com",
]);

const imageKeyPattern = /(image|img|icon|logo|thumbnail|thumb|cover|banner|artwork|picture|media|asset)/i;
const imageExtensionPattern = /\.(?:avif|gif|jpe?g|png|webp)(?:$|\?)/i;

const mobileLegendsMedia = {
  gameIcon:
    "https://play-lh.googleusercontent.com/D8r13ijO9c-0_1N-CP4d63mR1w6YhDuR2mBQUl27ELJAx0sKdaKtM5vCUnSLODKBVzUx7rZ9cW4Ir9jYiufsSQ=w512-h512",
  diamond:
    "https://www.joytify.com/static/lapakgaming/images/rebranding/Icon_per_Denom/mobile_legends_1.png",
  weeklyPass:
    "https://www.joytify.com/static/product/Weekly%20Diamond%20Pass%20Mobile%20Legends.webp",
  twilightPass:
    "https://www.joytify.com/static/lapakgaming/images/rebranding/Icon_per_Denom/mobile_legends_twilight.png",
} as const;

const gameMediaDefaults: Record<string, string[]> = {
  "mobile-legends": [mobileLegendsMedia.gameIcon],
  "free-fire": [
    "https://dl.dir.freefiremobile.com/common/web_event/official2/dist/client/img/max_logo.b96cbd2.png",
    "https://dl.dir.freefiremobile.com/common/web_event/official2/dist/client/img/full_logo.969f536.png",
  ],
  "pubg-mobile": [
    "https://play-lh.googleusercontent.com/O8jPCZ2EXAt7wGlbZhkhA-3vPIWVBpz8tZrRnsr7uVeqp0UD1AQwIEl_N9So80kdp8gDvIksC64GypylkQV_=w512-h512",
    "https://www.pubgmobile.com/images/event/brandassets/img-logo1.png",
  ],
  bgmi: [
    "https://www.battlegroundsmobileindia.com/api/fileDownload/901/2",
    "https://upload.wikimedia.org/wikipedia/en/6/6f/Battlegrounds_Mobile_India.jpg",
  ],
  "call-of-duty-mobile": [
    "https://play-lh.googleusercontent.com/cfGSXkDwxa1jW3TlhhkDJBN16-1_KEtEDhnILPcs9rXcC25g14XY6MRGCtlXHFHs0g=w512-h512",
  ],
  valorant: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png",
  ],
  "genshin-impact": [
    "https://upload.wikimedia.org/wikipedia/en/5/5d/Genshin_Impact_cover.jpg",
  ],
  fortnite: [
    "https://cdn2.unrealengine.com/fnbr-35-00-c6ms1-discover-playlist-tiles-keyart-480x270-480x270-d8d88e6f0b9d.jpg",
  ],
};

function configuredMediaHosts() {
  return new Set(
    (process.env.FAZERCARDS_MEDIA_HOSTS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isTrustedProductMediaUrl(value: unknown) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;

    const hostname = url.hostname.toLowerCase();
    const allowed = knownMediaHosts.has(hostname) || configuredMediaHosts().has(hostname);
    return allowed && (imageExtensionPattern.test(url.pathname) || imageKeyPattern.test(url.pathname));
  } catch {
    return false;
  }
}

function collectImageUrls(value: unknown, output: string[], depth: number, parentKey = "") {
  if (depth > 5 || output.length >= 12) return;

  if (typeof value === "string") {
    if ((imageKeyPattern.test(parentKey) || imageExtensionPattern.test(value)) && isTrustedProductMediaUrl(value)) {
      output.push(value.trim());
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, output, depth + 1, parentKey);
    return;
  }

  if (!value || typeof value !== "object") return;

  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    collectImageUrls(item, output, depth + 1, key);
  }
}

export function extractSupplierProductMedia(raw: unknown) {
  const output: string[] = [];
  collectImageUrls(raw, output, 0);
  return Array.from(new Set(output));
}

function getMobileLegendsCatalogMedia(productName: string) {
  const normalized = productName.toLowerCase();

  if (normalized.includes("weekly diamond pass")) {
    return [mobileLegendsMedia.weeklyPass, mobileLegendsMedia.gameIcon];
  }

  if (normalized.includes("twilight pass")) {
    return [mobileLegendsMedia.twilightPass, mobileLegendsMedia.gameIcon];
  }

  return [mobileLegendsMedia.diamond, mobileLegendsMedia.gameIcon];
}

export function resolveProductMedia(input: {
  gameSlug: string;
  productName: string;
  supplierRaw?: unknown;
}): ProductMedia {
  const supplierSources = extractSupplierProductMedia(input.supplierRaw);
  const catalogSources =
    input.gameSlug === "mobile-legends"
      ? getMobileLegendsCatalogMedia(input.productName)
      : gameMediaDefaults[input.gameSlug] ?? [];
  const sources = Array.from(new Set([...supplierSources, ...catalogSources])).filter(
    isTrustedProductMediaUrl,
  );

  return {
    sources,
    alt: `${input.productName} product artwork`,
    source: supplierSources.length > 0 ? "supplier" : "catalog",
  };
}

export function getGameIconSources(gameSlug: string) {
  return gameMediaDefaults[gameSlug] ?? [];
}

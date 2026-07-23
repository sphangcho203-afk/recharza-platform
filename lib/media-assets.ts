import "server-only";

import { createHash } from "node:crypto";

import type {
  MediaAssetKind,
  MediaAssetStatus,
  Prisma,
} from "@/generated/prisma/client";
import { mainGames } from "@/lib/games";
import { getPrisma } from "@/lib/prisma";

export const MAX_MEDIA_ASSET_BYTES = 5 * 1024 * 1024;

export const MEDIA_ASSET_KINDS: MediaAssetKind[] = [
  "GENERAL",
  "BRAND",
  "GAME_LOGO",
  "GAME_ARTWORK",
  "BANNER",
  "SOCIAL",
  "PRODUCT",
];

export const MEDIA_ASSET_STATUSES: MediaAssetStatus[] = [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "ARCHIVED",
];

export type MediaPlacementDefinition = {
  key: string;
  label: string;
  group: "Storefront" | "Games" | "Brand" | "Social";
  description: string;
  allowedKinds: MediaAssetKind[];
  publicSurface: boolean;
};

const basePlacements: MediaPlacementDefinition[] = [
  {
    key: "storefront.hero.background",
    label: "Homepage hero background",
    group: "Storefront",
    description: "Large background artwork behind the public homepage hero.",
    allowedKinds: ["BANNER", "GAME_ARTWORK", "GENERAL"],
    publicSurface: true,
  },
  {
    key: "brand.primary.logo",
    label: "Primary Recharza logo",
    group: "Brand",
    description: "Approved master logo asset for exports and future interface use.",
    allowedKinds: ["BRAND", "GAME_LOGO", "GENERAL"],
    publicSurface: false,
  },
  {
    key: "social.instagram.square",
    label: "Instagram square master",
    group: "Social",
    description: "Reusable square creative source for Instagram and Facebook posts.",
    allowedKinds: ["SOCIAL", "BANNER", "GENERAL"],
    publicSurface: false,
  },
  {
    key: "social.instagram.story",
    label: "Instagram story master",
    group: "Social",
    description: "Reusable vertical creative source for stories and status posts.",
    allowedKinds: ["SOCIAL", "BANNER", "GENERAL"],
    publicSurface: false,
  },
  {
    key: "social.youtube.banner",
    label: "YouTube banner master",
    group: "Social",
    description: "Wide approved source for the Recharza YouTube channel banner.",
    allowedKinds: ["SOCIAL", "BANNER", "BRAND", "GENERAL"],
    publicSurface: false,
  },
  {
    key: "social.facebook.cover",
    label: "Facebook cover master",
    group: "Social",
    description: "Wide approved source for the Recharza Facebook Page cover.",
    allowedKinds: ["SOCIAL", "BANNER", "BRAND", "GENERAL"],
    publicSurface: false,
  },
  {
    key: "social.telegram.post",
    label: "Telegram post master",
    group: "Social",
    description: "Reusable approved announcement graphic for Telegram.",
    allowedKinds: ["SOCIAL", "BANNER", "GENERAL"],
    publicSurface: false,
  },
  {
    key: "social.whatsapp.channel",
    label: "WhatsApp channel master",
    group: "Social",
    description: "Reusable approved announcement graphic for WhatsApp Channel posts.",
    allowedKinds: ["SOCIAL", "BANNER", "GENERAL"],
    publicSurface: false,
  },
];

export function getMediaPlacementDefinitions(): MediaPlacementDefinition[] {
  return [
    ...basePlacements,
    ...mainGames.flatMap((game) => [
      {
        key: `game.${game.slug}.logo`,
        label: `${game.title} logo`,
        group: "Games" as const,
        description: `Approved logo override for ${game.title} cards and featured surfaces.`,
        allowedKinds: ["GAME_LOGO", "BRAND", "GENERAL"] as MediaAssetKind[],
        publicSurface: true,
      },
      {
        key: `game.${game.slug}.artwork`,
        label: `${game.title} artwork`,
        group: "Games" as const,
        description: `Approved artwork override for ${game.title} cards and featured surfaces.`,
        allowedKinds: ["GAME_ARTWORK", "BANNER", "GENERAL"] as MediaAssetKind[],
        publicSurface: true,
      },
    ]),
  ];
}

export type AdminMediaAsset = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  checksum: string;
  kind: MediaAssetKind;
  status: MediaAssetStatus;
  altText: string;
  notes: string | null;
  tags: string[];
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  previewUrl: string;
  publicUrl: string | null;
  placements: string[];
};

export type AdminMediaPlacement = {
  id: string;
  placementKey: string;
  label: string;
  assetId: string;
  assetName: string;
  assetKind: MediaAssetKind;
  assetStatus: MediaAssetStatus;
  publicUrl: string | null;
  publishedAt: string;
  updatedAt: string;
};

export type AdminMediaSnapshot = {
  assets: AdminMediaAsset[];
  placements: AdminMediaPlacement[];
  placementDefinitions: MediaPlacementDefinition[];
  limits: {
    maxBytes: number;
    allowedMimeTypes: string[];
  };
  metrics: {
    totalAssets: number;
    approvedAssets: number;
    reviewAssets: number;
    assignedPlacements: number;
    storedBytes: number;
  };
  generatedAt: string;
};

const assetSelect = {
  id: true,
  name: true,
  fileName: true,
  mimeType: true,
  byteSize: true,
  checksum: true,
  kind: true,
  status: true,
  altText: true,
  notes: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  createdByCustomer: { select: { email: true } },
  placements: { select: { placementKey: true }, orderBy: { placementKey: "asc" } },
} satisfies Prisma.MediaAssetSelect;

function serializeAsset(asset: Prisma.MediaAssetGetPayload<{ select: typeof assetSelect }>): AdminMediaAsset {
  const approved = asset.status === "APPROVED";
  return {
    id: asset.id,
    name: asset.name,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    byteSize: asset.byteSize,
    checksum: asset.checksum,
    kind: asset.kind,
    status: asset.status,
    altText: asset.altText,
    notes: asset.notes,
    tags: asset.tags,
    createdByEmail: asset.createdByCustomer?.email ?? null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
    previewUrl: `/api/admin/media/assets/${asset.id}`,
    publicUrl: approved ? `/api/media/assets/${asset.id}` : null,
    placements: asset.placements.map((placement) => placement.placementKey),
  };
}

export async function getAdminMediaSnapshot(): Promise<AdminMediaSnapshot> {
  const prisma = getPrisma();
  const [assets, placements] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: assetSelect,
    }),
    prisma.mediaPlacement.findMany({
      orderBy: { placementKey: "asc" },
      take: 250,
      select: {
        id: true,
        placementKey: true,
        label: true,
        assetId: true,
        publishedAt: true,
        updatedAt: true,
        asset: { select: { name: true, kind: true, status: true } },
      },
    }),
  ]);

  const serializedAssets = assets.map(serializeAsset);
  return {
    assets: serializedAssets,
    placements: placements.map((placement) => ({
      id: placement.id,
      placementKey: placement.placementKey,
      label: placement.label,
      assetId: placement.assetId,
      assetName: placement.asset.name,
      assetKind: placement.asset.kind,
      assetStatus: placement.asset.status,
      publicUrl:
        placement.asset.status === "APPROVED"
          ? `/api/media/assets/${placement.assetId}`
          : null,
      publishedAt: placement.publishedAt.toISOString(),
      updatedAt: placement.updatedAt.toISOString(),
    })),
    placementDefinitions: getMediaPlacementDefinitions(),
    limits: {
      maxBytes: MAX_MEDIA_ASSET_BYTES,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    },
    metrics: {
      totalAssets: serializedAssets.length,
      approvedAssets: serializedAssets.filter((asset) => asset.status === "APPROVED").length,
      reviewAssets: serializedAssets.filter((asset) => asset.status === "REVIEW").length,
      assignedPlacements: placements.length,
      storedBytes: serializedAssets.reduce((sum, asset) => sum + asset.byteSize, 0),
    },
    generatedAt: new Date().toISOString(),
  };
}

export type PublicMediaPlacement = {
  placementKey: string;
  assetId: string;
  url: string;
  altText: string;
  mimeType: string;
  checksum: string;
};

export async function getPublicMediaPlacements() {
  const placements = await getPrisma().mediaPlacement.findMany({
    where: { asset: { status: "APPROVED" } },
    select: {
      placementKey: true,
      assetId: true,
      asset: {
        select: {
          altText: true,
          mimeType: true,
          checksum: true,
        },
      },
    },
  });

  return new Map<string, PublicMediaPlacement>(
    placements.map((placement) => [
      placement.placementKey,
      {
        placementKey: placement.placementKey,
        assetId: placement.assetId,
        url: `/api/media/assets/${placement.assetId}`,
        altText: placement.asset.altText,
        mimeType: placement.asset.mimeType,
        checksum: placement.asset.checksum,
      },
    ]),
  );
}

export function sanitizeMediaTags(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      source
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"))
        .map((item) => item.replace(/^-+|-+$/g, ""))
        .filter(Boolean)
        .slice(0, 16),
    ),
  );
}

export function sanitizeMediaFileName(value: string) {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || "recharza-image";
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectImageMimeType(bytes: Uint8Array) {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  const gifHeader = String.fromCharCode(...bytes.slice(0, 6));
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") return "image/gif";
  return null;
}

export function validateMediaUpload(input: {
  bytes: Uint8Array;
  declaredMimeType: string;
}) {
  if (input.bytes.byteLength === 0) {
    throw new Error("The uploaded image is empty.");
  }
  if (input.bytes.byteLength > MAX_MEDIA_ASSET_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }
  const detectedMimeType = detectImageMimeType(input.bytes);
  if (!detectedMimeType) {
    throw new Error("Only PNG, JPEG, WebP, and GIF image files are accepted.");
  }
  if (input.declaredMimeType && input.declaredMimeType !== detectedMimeType) {
    throw new Error("The file content does not match its declared image type.");
  }
  return {
    mimeType: detectedMimeType,
    checksum: createHash("sha256").update(input.bytes).digest("hex"),
  };
}

export function getPlacementDefinition(placementKey: string) {
  return getMediaPlacementDefinitions().find((placement) => placement.key === placementKey) ?? null;
}

export function isMediaAssetKind(value: unknown): value is MediaAssetKind {
  return typeof value === "string" && MEDIA_ASSET_KINDS.includes(value as MediaAssetKind);
}

export function isMediaAssetStatus(value: unknown): value is MediaAssetStatus {
  return typeof value === "string" && MEDIA_ASSET_STATUSES.includes(value as MediaAssetStatus);
}

export function canMoveMediaAssetStatus(input: {
  from: MediaAssetStatus;
  to: MediaAssetStatus;
  placementCount: number;
}) {
  if (input.from === input.to) return true;
  if (input.placementCount > 0 && input.to !== "APPROVED") return false;
  if (input.from === "DRAFT") return input.to === "REVIEW" || input.to === "ARCHIVED";
  if (input.from === "REVIEW") {
    return input.to === "DRAFT" || input.to === "APPROVED" || input.to === "ARCHIVED";
  }
  if (input.from === "APPROVED") return input.to === "REVIEW" || input.to === "ARCHIVED";
  if (input.from === "ARCHIVED") return input.to === "DRAFT";
  return false;
}

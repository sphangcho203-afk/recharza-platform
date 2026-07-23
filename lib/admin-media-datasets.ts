import "server-only";

import type { AdminDataset } from "@/lib/admin-control-types";
import type { AdminMediaSnapshot } from "@/lib/media-assets";

export function createMediaAdminDatasets(
  snapshot: AdminMediaSnapshot,
): AdminDataset[] {
  return [
    {
      id: "media-assets",
      label: "Media assets",
      description:
        "Uploaded image metadata, review state, checksums, storage size, tags, and active placements.",
      total: snapshot.assets.length,
      columns: [
        { key: "id", label: "Asset ID", format: "code" },
        { key: "name", label: "Name" },
        { key: "kind", label: "Kind", format: "status" },
        { key: "status", label: "Status", format: "status" },
        { key: "mime", label: "MIME" },
        { key: "bytes", label: "Bytes" },
        { key: "checksum", label: "Checksum", format: "code" },
        { key: "tags", label: "Tags" },
        { key: "placements", label: "Placements" },
        { key: "creator", label: "Uploaded by" },
        { key: "created", label: "Created", format: "date" },
      ],
      rows: snapshot.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        kind: asset.kind,
        status: asset.status,
        mime: asset.mimeType,
        bytes: asset.byteSize,
        checksum: asset.checksum,
        tags: asset.tags.join(", "),
        placements: asset.placements.join(", "),
        creator: asset.createdByEmail,
        created: asset.createdAt,
      })),
    },
    {
      id: "media-placements",
      label: "Media placements",
      description:
        "Approved master assignments for storefront, game, brand, and social-media surfaces.",
      total: snapshot.placements.length,
      columns: [
        { key: "id", label: "Placement ID", format: "code" },
        { key: "key", label: "Placement", format: "code" },
        { key: "label", label: "Label" },
        { key: "asset", label: "Asset" },
        { key: "assetId", label: "Asset ID", format: "code" },
        { key: "kind", label: "Kind", format: "status" },
        { key: "status", label: "Status", format: "status" },
        { key: "published", label: "Published", format: "date" },
        { key: "updated", label: "Updated", format: "date" },
      ],
      rows: snapshot.placements.map((placement) => ({
        id: placement.id,
        key: placement.placementKey,
        label: placement.label,
        asset: placement.assetName,
        assetId: placement.assetId,
        kind: placement.assetKind,
        status: placement.assetStatus,
        published: placement.publishedAt,
        updated: placement.updatedAt,
      })),
    },
  ];
}

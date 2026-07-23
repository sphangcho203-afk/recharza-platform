import type { MediaAssetKind, MediaAssetStatus } from "@/generated/prisma/client";

import { getRequestSession } from "@/lib/auth";
import {
  canMoveMediaAssetStatus,
  getAdminMediaSnapshot,
  getMediaPlacementDefinitions,
  getPlacementDefinition,
  isMediaAssetKind,
  isMediaAssetStatus,
  sanitizeMediaFileName,
  sanitizeMediaTags,
  validateMediaUpload,
} from "@/lib/media-assets";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function requireAdmin(request: Request) {
  const session = await getRequestSession(request);
  return session?.customer.role === "ADMIN" ? session : null;
}

function readText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function requireReason(value: unknown) {
  const reason = readText(value, 500);
  if (reason.length < 8) {
    throw new Error("An audit reason of at least 8 characters is required.");
  }
  return reason;
}

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  return Response.json({ ok: true, snapshot: await getAdminMediaSnapshot() });
}

export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json(
        { ok: false, message: "Select an image file to upload." },
        { status: 400 },
      );
    }

    const reason = requireReason(form.get("reason"));
    const name = readText(form.get("name"), 120) || file.name.slice(0, 120);
    const altText = readText(form.get("altText"), 220) || name;
    const notes = readText(form.get("notes"), 1000) || null;
    const requestedKind = form.get("kind");
    const kind: MediaAssetKind = isMediaAssetKind(requestedKind)
      ? requestedKind
      : "GENERAL";
    const tags = sanitizeMediaTags(form.get("tags"));
    const bytes = new Uint8Array(await file.arrayBuffer());
    const verified = validateMediaUpload({
      bytes,
      declaredMimeType: file.type,
    });

    const prisma = getPrisma();
    const duplicate = await prisma.mediaAsset.findUnique({
      where: { checksum: verified.checksum },
      select: { id: true, name: true },
    });

    if (duplicate) {
      await prisma.adminAuditLog.create({
        data: {
          action: "MEDIA_ASSET_DUPLICATE_DETECTED",
          actorFingerprint: session.sessionId,
          actorCustomerId: session.customer.id,
          metadata: {
            assetId: duplicate.id,
            existingName: duplicate.name,
            uploadedFileName: file.name,
            checksum: verified.checksum,
            reason,
          },
        },
      });
      return Response.json({
        ok: true,
        duplicate: true,
        message: `That exact image already exists as ${duplicate.name}.`,
        snapshot: await getAdminMediaSnapshot(),
      });
    }

    const asset = await prisma.$transaction(async (transaction) => {
      const created = await transaction.mediaAsset.create({
        data: {
          name,
          fileName: sanitizeMediaFileName(file.name),
          mimeType: verified.mimeType,
          byteSize: bytes.byteLength,
          checksum: verified.checksum,
          data: bytes,
          kind,
          status: "DRAFT",
          altText,
          notes,
          tags,
          createdByCustomerId: session.customer.id,
        },
        select: { id: true },
      });

      await transaction.adminAuditLog.create({
        data: {
          action: "MEDIA_ASSET_UPLOADED",
          actorFingerprint: session.sessionId,
          actorCustomerId: session.customer.id,
          metadata: {
            assetId: created.id,
            name,
            fileName: sanitizeMediaFileName(file.name),
            mimeType: verified.mimeType,
            byteSize: bytes.byteLength,
            checksum: verified.checksum,
            kind,
            reason,
          },
        },
      });
      return created;
    });

    return Response.json({
      ok: true,
      assetId: asset.id,
      message: "Image uploaded as a private draft asset.",
      snapshot: await getAdminMediaSnapshot(),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "The image upload failed.",
      },
      { status: 400 },
    );
  }
}

type MediaPatchAction = "update" | "assign" | "unassign";

export async function PATCH(request: Request) {
  const session = await requireAdmin(request);
  if (!session) {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new Error("A valid media change is required.");
    const action = readText(body.action, 40) as MediaPatchAction;
    const reason = requireReason(body.reason);
    const prisma = getPrisma();

    if (action === "update") {
      const assetId = readText(body.assetId, 100);
      if (!assetId) throw new Error("assetId is required.");
      const current = await prisma.mediaAsset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          name: true,
          kind: true,
          status: true,
          placements: { select: { placementKey: true } },
        },
      });
      if (!current) throw new Error("The media asset was not found.");

      const requestedKind: MediaAssetKind = isMediaAssetKind(body.kind)
        ? body.kind
        : current.kind;
      const requestedStatus: MediaAssetStatus = isMediaAssetStatus(body.status)
        ? body.status
        : current.status;

      if (
        !canMoveMediaAssetStatus({
          from: current.status,
          to: requestedStatus,
          placementCount: current.placements.length,
        })
      ) {
        throw new Error(
          current.placements.length
            ? "Unassign this asset from every placement before removing approved status."
            : `The ${current.status.toLowerCase()} to ${requestedStatus.toLowerCase()} transition is not allowed.`,
        );
      }

      const definitions = new Map(
        getMediaPlacementDefinitions().map((definition) => [definition.key, definition]),
      );
      const incompatiblePlacement = current.placements.find((placement) => {
        const definition = definitions.get(placement.placementKey);
        return definition && !definition.allowedKinds.includes(requestedKind);
      });
      if (incompatiblePlacement) {
        throw new Error(
          `The selected asset kind is incompatible with ${incompatiblePlacement.placementKey}.`,
        );
      }

      const name = readText(body.name, 120) || current.name;
      const altText = readText(body.altText, 220) || name;
      const notes = readText(body.notes, 1000) || null;
      const tags = sanitizeMediaTags(body.tags);

      await prisma.$transaction([
        prisma.mediaAsset.update({
          where: { id: assetId },
          data: {
            name,
            altText,
            notes,
            tags,
            kind: requestedKind,
            status: requestedStatus,
          },
        }),
        prisma.adminAuditLog.create({
          data: {
            action: "MEDIA_ASSET_UPDATED",
            actorFingerprint: session.sessionId,
            actorCustomerId: session.customer.id,
            metadata: {
              assetId,
              previousKind: current.kind,
              kind: requestedKind,
              previousStatus: current.status,
              status: requestedStatus,
              placementCount: current.placements.length,
              reason,
            },
          },
        }),
      ]);
    } else if (action === "assign") {
      const assetId = readText(body.assetId, 100);
      const placementKey = readText(body.placementKey, 160);
      const definition = getPlacementDefinition(placementKey);
      if (!assetId || !definition) throw new Error("Choose a valid asset and placement.");

      const asset = await prisma.mediaAsset.findUnique({
        where: { id: assetId },
        select: { id: true, name: true, kind: true, status: true },
      });
      if (!asset) throw new Error("The media asset was not found.");
      if (asset.status !== "APPROVED") {
        throw new Error("Only approved media assets may be assigned.");
      }
      if (!definition.allowedKinds.includes(asset.kind)) {
        throw new Error(`${asset.kind.toLowerCase()} assets cannot be used for this placement.`);
      }

      const existing = await prisma.mediaPlacement.findUnique({
        where: { placementKey },
        select: { assetId: true },
      });
      await prisma.$transaction([
        prisma.mediaPlacement.upsert({
          where: { placementKey },
          update: {
            assetId,
            label: definition.label,
            publishedAt: new Date(),
          },
          create: {
            placementKey,
            label: definition.label,
            assetId,
          },
        }),
        prisma.adminAuditLog.create({
          data: {
            action: "MEDIA_PLACEMENT_ASSIGNED",
            actorFingerprint: session.sessionId,
            actorCustomerId: session.customer.id,
            metadata: {
              placementKey,
              label: definition.label,
              assetId,
              assetName: asset.name,
              previousAssetId: existing?.assetId ?? null,
              publicSurface: definition.publicSurface,
              reason,
            },
          },
        }),
      ]);
    } else if (action === "unassign") {
      const placementKey = readText(body.placementKey, 160);
      const existing = await prisma.mediaPlacement.findUnique({
        where: { placementKey },
        select: { id: true, assetId: true, label: true },
      });
      if (!existing) throw new Error("The media placement was not found.");

      await prisma.$transaction([
        prisma.mediaPlacement.delete({ where: { placementKey } }),
        prisma.adminAuditLog.create({
          data: {
            action: "MEDIA_PLACEMENT_UNASSIGNED",
            actorFingerprint: session.sessionId,
            actorCustomerId: session.customer.id,
            metadata: {
              placementKey,
              label: existing.label,
              assetId: existing.assetId,
              reason,
            },
          },
        }),
      ]);
    } else {
      throw new Error("Unsupported media action.");
    }

    return Response.json({
      ok: true,
      message: "Media library updated.",
      snapshot: await getAdminMediaSnapshot(),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "The media change failed.",
      },
      { status: 400 },
    );
  }
}

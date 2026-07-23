import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await context.params;
  const asset = await getPrisma().mediaAsset.findFirst({
    where: { id: assetId, status: "APPROVED" },
    select: {
      data: true,
      mimeType: true,
      fileName: true,
      checksum: true,
    },
  });

  if (!asset) {
    return Response.json({ ok: false, message: "Media asset not found." }, { status: 404 });
  }

  const etag = `"${asset.checksum}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  return new Response(Buffer.from(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.data.byteLength),
      "Content-Disposition": `inline; filename="${asset.fileName.replaceAll('"', '')}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

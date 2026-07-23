import { getRequestSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const session = await getRequestSession(request);
  if (session?.customer.role !== "ADMIN") {
    return Response.json(
      { ok: false, message: "Administrator access is required." },
      { status: 403 },
    );
  }

  const { assetId } = await context.params;
  const asset = await getPrisma().mediaAsset.findUnique({
    where: { id: assetId },
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
      "Cache-Control": "private, no-store",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { validateMobileLegendsPlayer } from "@/lib/order-validation";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { valid: false, message: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return Response.json(
      { valid: false, message: "Player details are required." },
      { status: 400 },
    );
  }

  const data = payload as Record<string, unknown>;
  const result = validateMobileLegendsPlayer(data.playerId, data.zoneId);

  return Response.json(result, { status: result.valid ? 200 : 400 });
}

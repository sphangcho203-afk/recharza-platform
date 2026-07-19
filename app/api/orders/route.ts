import { randomUUID } from "node:crypto";

import { getMobileLegendsPackage } from "@/lib/mobile-legends";
import {
  validateCustomerEmail,
  validateMobileLegendsPlayer,
} from "@/lib/order-validation";
import { paymentProvider } from "@/lib/payments/provider";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return Response.json(
      { ok: false, message: "Order details are required." },
      { status: 400 },
    );
  }

  const data = payload as Record<string, unknown>;

  if (data.gameSlug !== "mobile-legends") {
    return Response.json(
      { ok: false, message: "This game is not available for checkout yet." },
      { status: 400 },
    );
  }

  const selectedPackage =
    typeof data.packageId === "string"
      ? getMobileLegendsPackage(data.packageId)
      : null;

  if (!selectedPackage) {
    return Response.json(
      { ok: false, message: "Select a valid Mobile Legends package." },
      { status: 400 },
    );
  }

  const player = validateMobileLegendsPlayer(data.playerId, data.zoneId);

  if (!player.valid) {
    return Response.json(
      { ok: false, message: player.message },
      { status: 400 },
    );
  }

  const customerEmail = validateCustomerEmail(data.customerEmail);

  if (!customerEmail) {
    return Response.json(
      { ok: false, message: "Enter a valid email address for the order receipt." },
      { status: 400 },
    );
  }

  const orderId = `RZ-${randomUUID().split("-")[0].toUpperCase()}`;
  const paymentSession = await paymentProvider.createSession({
    orderId,
    amountInPaise: selectedPackage.amountInPaise,
    currency: "INR",
    customerEmail,
  });

  return Response.json(
    {
      ok: true,
      order: {
        id: orderId,
        status: "awaiting_payment_provider",
        gameSlug: "mobile-legends",
        package: {
          id: selectedPackage.id,
          name: selectedPackage.name,
          amountInPaise: selectedPackage.amountInPaise,
          currency: "INR",
        },
        player: {
          playerId: player.playerId,
          zoneId: player.zoneId,
          verificationMode: player.verificationMode,
        },
        customerEmail,
        createdAt: new Date().toISOString(),
        persistence: "not_configured",
      },
      paymentSession,
    },
    { status: 201 },
  );
}

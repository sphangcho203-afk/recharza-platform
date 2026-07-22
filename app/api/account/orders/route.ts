import { getRequestSession } from "@/lib/auth";
import { parseMobileLegendsMarket } from "@/lib/mobile-legends-market";
import { getPrisma } from "@/lib/prisma";
import { RuntimeConfigurationError } from "@/lib/runtime-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return Response.json({ ok: false, message: "Sign in to view your orders." }, { status: 401 });
    }

    const orders = await getPrisma().order.findMany({
      where: { customerId: session.customer.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        publicId: true,
        status: true,
        gameSlug: true,
        marketCode: true,
        packageName: true,
        amountInPaise: true,
        currency: true,
        playerId: true,
        zoneId: true,
        verifiedNickname: true,
        paymentProvider: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { fulfilmentAttempts: true } },
      },
    });

    return Response.json({
      ok: true,
      orders: orders.map((order) => {
        const market = parseMobileLegendsMarket(order.marketCode);

        return {
          id: order.publicId,
          status: order.status.toLowerCase(),
          gameSlug: order.gameSlug,
          market: market ? { code: market.code, label: market.label, flag: market.flag } : null,
          package: {
            name: order.packageName,
            amountInPaise: order.amountInPaise,
            currency: order.currency,
          },
          player: {
            playerId: order.playerId,
            zoneId: order.zoneId,
            nickname: order.verifiedNickname,
          },
          paymentProvider: order.paymentProvider,
          fulfilmentAttempts: order._count.fulfilmentAttempts,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        };
      }),
    });
  } catch (error) {
    if (!(error instanceof RuntimeConfigurationError)) {
      console.error("Account order history failed", error);
    }
    return Response.json({ ok: false, message: "Order history is temporarily unavailable." }, { status: 503 });
  }
}

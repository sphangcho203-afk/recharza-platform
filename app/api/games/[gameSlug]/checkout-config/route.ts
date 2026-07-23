import { getPublicGameCheckoutDefinition } from "@/lib/commerce/game-checkout";

export async function GET(
  _request: Request,
  context: { params: Promise<{ gameSlug: string }> },
) {
  const { gameSlug } = await context.params;
  const definition = getPublicGameCheckoutDefinition(gameSlug);

  if (!definition) {
    return Response.json(
      { ok: false, message: "That game is not registered for checkout." },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, checkout: definition });
}

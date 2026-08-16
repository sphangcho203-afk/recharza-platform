import { randomUUID } from "node:crypto";

import { validateBillingSelection } from "@/lib/commerce/billing";
import { validateSupplierCheckoutIdentity } from "@/lib/commerce/game-identity";
import { getCartForRequest } from "@/lib/cart";
import { deriveOrderAccessToken, hashOrderAccessToken, normalizeIdempotencyKey } from "@/lib/order-security";
import { getPrisma } from "@/lib/prisma";
import { consumeRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";
import { lookupVolseverGameIdentity, VolseverProviderError } from "@/lib/volsever";
import { getPublishedGamePackageForCheckout, isSupplierCheckoutGameSlug } from "@/lib/storefront-game-catalog";

export const runtime = "nodejs";
const LIMIT = 4;
const WINDOW_MS = 10 * 60 * 1000;

type ObjectValue = Record<string, unknown>;
function objectValue(value: unknown): ObjectValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ObjectValue : null;
}
function publicOrderId() { return `RZ-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`; }
function stringValue(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function uniqueError(error: unknown) { return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002"); }

export async function POST(request: Request) {
  const rate = await consumeRateLimit({ request, route: "POST:/api/checkout/cart", limit: LIMIT, windowMs: WINDOW_MS });
  const headers = createRateLimitHeaders(rate);
  if (!rate.allowed) return Response.json({ ok: false, code: "RATE_LIMITED", message: "Too many checkout attempts. Please wait and retry." }, { status: 429, headers });

  try {
    const data = objectValue(await request.json().catch(() => null));
    if (!data) return Response.json({ ok: false, code: "INVALID_JSON", message: "Checkout details are required." }, { status: 400, headers });
    const idempotencyKey = normalizeIdempotencyKey(request.headers.get("idempotency-key") ?? data.idempotencyKey);
    if (!idempotencyKey) return Response.json({ ok: false, code: "IDEMPOTENCY_REQUIRED", message: "A retry key is required." }, { status: 400, headers });
    const billingResult = validateBillingSelection(data.billing);
    if (!billingResult.ok) return Response.json({ ok: false, code: "BILLING_INVALID", message: billingResult.message }, { status: 400, headers });

    const submittedItems = Array.isArray(data.items) ? data.items : [];
    if (!submittedItems.length || submittedItems.length > 50) return Response.json({ ok: false, code: "CART_EMPTY", message: "Add at least one item to checkout." }, { status: 400, headers });
    const cartResult = await getCartForRequest(request);
    if (!cartResult.cart) return Response.json({ ok: false, code: "CART_EMPTY", message: "Your cart is empty." }, { status: 409, headers });

    const submittedById = new Map<string, ObjectValue>();
    for (const raw of submittedItems) {
      const item = objectValue(raw);
      const id = stringValue(item?.cartItemId);
      if (id) submittedById.set(id, item ?? {});
    }
    const selected = cartResult.cart.items.filter((item) => submittedById.has(item.id));
    if (selected.length !== cartResult.cart.items.length) return Response.json({ ok: false, code: "CART_CHANGED", message: "Your cart changed. Refresh and verify all items again." }, { status: 409, headers });

    const billing = billingResult.selection.address;
    const billingEmail = billing.email.trim().toLowerCase();
    const prisma = getPrisma();
    const existing = await prisma.order.findFirst({ where: { idempotencyKey: `${idempotencyKey}:0` }, include: { customer: true } });
    if (existing) {
      const accessToken = deriveOrderAccessToken(existing.publicId, idempotencyKey);
      return Response.json({ ok: true, duplicate: true, orderId: existing.publicId, accessToken, checkoutBatchId: existing.checkoutBatchId }, { headers });
    }

    const customer = await prisma.customer.upsert({ where: { email: billingEmail }, create: { email: billingEmail, displayName: billing.fullName }, update: {}, select: { id: true, email: true, role: true, accessStatus: true } });
    if (customer.accessStatus === "ORDER_RESTRICTED" || customer.accessStatus === "SUSPENDED") return Response.json({ ok: false, code: "ORDER_RESTRICTED", message: "Orders are restricted for this billing email." }, { status: 403, headers });

    const checkoutBatchId = `B-${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`;
    const prepared: Array<{ item: typeof selected[number]; packageInfo: NonNullable<Awaited<ReturnType<typeof getPublishedGamePackageForCheckout>>>; playerId: string; zoneId: string; verifiedNickname: string | null; verificationMode: string }> = [];
    for (const item of selected) {
      if (!isSupplierCheckoutGameSlug(item.gameSlug)) throw new Error(`Unsupported game: ${item.gameSlug}`);
      const packageInfo = await getPublishedGamePackageForCheckout(item.gameSlug, item.packageId);
      if (!packageInfo || packageInfo.marketCode !== item.marketCode) return Response.json({ ok: false, code: "PACKAGE_CHANGED", message: `${item.packageName} is no longer available. Refresh your cart.` }, { status: 409, headers });
      const submitted = submittedById.get(item.id) ?? {};
      const identityResult = validateSupplierCheckoutIdentity(item.gameSlug, objectValue(submitted.identity) ?? {}, packageInfo.fields);
      if (!identityResult.valid) return Response.json({ ok: false, code: "PLAYER_INVALID", cartItemId: item.id, message: identityResult.message }, { status: 400, headers });
      let verifiedNickname: string | null = null;
      let verificationMode: string = identityResult.verificationMode;
      if (process.env.IGN_LOOKUP_PROVIDER?.trim().toLowerCase() === "volsever") {
        const live = await lookupVolseverGameIdentity({ gameSlug: item.gameSlug, playerId: identityResult.playerId, zoneId: identityResult.zoneId, marketCode: packageInfo.marketCode });
        if (!live.valid || !live.confirmed) return Response.json({ ok: false, code: "PLAYER_NOT_FOUND", cartItemId: item.id, message: live.message || `We could not confirm the ${item.gameSlug} account.` }, { status: 400, headers });
        verifiedNickname = live.nickname;
        verificationMode = live.verificationMode;
      }
      const quantity = Math.max(1, Math.min(10, item.quantity));
      for (let index = 0; index < quantity; index += 1) prepared.push({ item, packageInfo, playerId: identityResult.playerId, zoneId: identityResult.zoneId, verifiedNickname, verificationMode });
    }

    const created = await prisma.$transaction(async (transaction) => {
      const orders = [];
      for (let index = 0; index < prepared.length; index += 1) {
        const line = prepared[index];
        const orderPublicId = publicOrderId();
        const token = deriveOrderAccessToken(orderPublicId, idempotencyKey);
        const order = await transaction.order.create({ data: { publicId: orderPublicId, idempotencyKey: `${idempotencyKey}:${index}`, checkoutBatchId, accessTokenHash: hashOrderAccessToken(token), status: "CREATED", gameSlug: line.item.gameSlug, marketCode: line.packageInfo.marketCode, packageId: line.packageInfo.id, packageName: line.packageInfo.name, amountInPaise: line.packageInfo.amountInPaise, currency: "INR", presentmentCurrency: line.packageInfo.marketCurrency ?? "INR", presentmentAmountMinor: line.packageInfo.amountInPaise, billingName: billing.fullName, billingEmail, billingPhone: billing.phone, billingLine1: billing.line1, billingLine2: billing.line2, billingCity: billing.city, billingState: billing.state, billingPostalCode: billing.postalCode, billingCountryCode: billing.countryCode, playerId: line.playerId, zoneId: line.zoneId, verifiedNickname: line.verifiedNickname, verificationMode: line.verificationMode, customerId: customer.id, supplierProductId: line.packageInfo.supplierProductId, supplierCategoryId: line.packageInfo.supplierCategoryId, supplierOfferId: line.packageInfo.supplierOfferId, events: { create: { type: "ORDER_CREATED", message: "Unified cart checkout line persisted.", metadata: { checkoutBatchId, cartItemId: line.item.id, checkoutMode: "unified-cart", verifiedNickname: line.verifiedNickname } } } }, select: { id: true, publicId: true, checkoutBatchId: true, amountInPaise: true, gameSlug: true, packageName: true, playerId: true, zoneId: true, verifiedNickname: true } });
        orders.push({ ...order, accessToken: index === 0 ? token : undefined });
      }
      await transaction.cartItem.deleteMany({ where: { cartId: cartResult.cart?.id } });
      return orders;
    });
    const totalInPaise = created.reduce((sum, order) => sum + order.amountInPaise, 0);
    return Response.json({ ok: true, duplicate: false, checkoutBatchId, orderId: created[0].publicId, accessToken: created[0].accessToken, totalInPaise, items: created.map((order) => ({ id: order.publicId, gameSlug: order.gameSlug, packageName: order.packageName, amountInPaise: order.amountInPaise, player: { playerId: order.playerId, zoneId: order.zoneId, nickname: order.verifiedNickname } })) }, { status: 201, headers });
  } catch (error) {
    if (error instanceof VolseverProviderError) return Response.json({ ok: false, code: "PLAYER_VERIFICATION_UNAVAILABLE", message: "Account validation is temporarily unavailable. Please retry shortly." }, { status: 502, headers });
    if (uniqueError(error)) return Response.json({ ok: false, code: "DUPLICATE_CHECKOUT", message: "This checkout is already being created. Refresh and retry." }, { status: 409, headers });
    console.error("Unified cart checkout failed", error);
    return Response.json({ ok: false, code: "CHECKOUT_FAILED", message: "The complete cart could not be checked out safely." }, { status: 500, headers });
  }
}

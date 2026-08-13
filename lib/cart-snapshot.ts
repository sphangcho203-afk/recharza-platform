export type CartItemView = {
  id: string;
  gameSlug: string;
  marketCode: string | null;
  package: {
    id: string;
    name: string;
    amountInPaise: number;
    currency: string;
  };
  quantity: number;
  player: {
    playerId: string | null;
    zoneId: string | null;
    nickname: string | null;
    verificationMode: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type CartSnapshot = {
  id: string | null;
  itemCount: number;
  totalInPaise: number;
  currency: string;
  items: CartItemView[];
};

export const emptyCartSnapshot: CartSnapshot = {
  id: null,
  itemCount: 0,
  totalInPaise: 0,
  currency: "INR",
  items: [],
};

export const CART_MAX_QUANTITY = 10;

export const CART_CHANGED_EVENT = "recharza:cart-changed";

export function checkoutHref(item: CartItemView) {
  const query = `?cartItem=${encodeURIComponent(item.id)}`;
  if (item.gameSlug === "mobile-legends") {
    const market = item.marketCode ? `/${item.marketCode}` : "";
    return `/games/mobile-legends${market}${query}`;
  }
  return `/games/${item.gameSlug}${query}`;
}
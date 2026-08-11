import type { Metadata } from "next";

import { CartPage } from "@/components/cart-page";

export const metadata: Metadata = {
  title: "Cart | Recharza",
  description: "Review the products currently in your Recharza cart.",
};

export default function CartRoute() {
  return <CartPage />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Continue Top-Up | Recharza",
  description:
    "Continue through Recharza's canonical Mobile Legends top-up checkout.",
};

export const dynamic = "force-dynamic";

export default function CartPage() {
  redirect("/games/mobile-legends/india");
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Control | Recharza",
  robots: { index: false, follow: false },
};

export default function OperatorPage() {
  redirect("/admin");
}
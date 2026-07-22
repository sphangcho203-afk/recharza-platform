import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireWorkspaceSession } from "@/lib/server-session";

export const metadata: Metadata = {
  title: "Operator Redirect | Recharza",
  description: "Routes verified staff and administrators to their dedicated Recharza workspace.",
  robots: { index: false, follow: false },
};

export default async function OperatorPage() {
  const session = await requireWorkspaceSession("staff", "/operator");

  redirect(session.customer.role === "ADMIN" ? "/admin#orders" : "/staff#orders");
}

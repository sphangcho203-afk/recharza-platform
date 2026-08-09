import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getStaffSessionByToken,
  getStaffSessionCookieName,
  type StaffRole,
} from "@/lib/staff-auth";

export async function getServerStaffSession() {
  const cookieStore = await cookies();
  return getStaffSessionByToken(
    cookieStore.get(getStaffSessionCookieName())?.value,
  );
}

export async function requireStaffPageRole(
  roles: readonly StaffRole[],
  returnTo: string,
) {
  const session = await getServerStaffSession();
  if (!session) {
    const params = new URLSearchParams({ returnTo });
    redirect(`/admin/login?${params.toString()}`);
  }
  if (session.mustChangePassword || !roles.includes(session.role)) {
    redirect("/admin/login?reason=forbidden");
  }
  return session;
}

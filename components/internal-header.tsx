import Link from "next/link";

import type { AccountRole } from "@/generated/prisma/client";
import { RecharzaMark } from "@/components/recharza-mark";
import { roleLabel } from "@/lib/server-session";

type InternalHeaderProps = {
  workspace: "Admin" | "Staff";
  role: AccountRole;
  email: string;
};

export function InternalHeader({ workspace, role, email }: InternalHeaderProps) {
  const isAdmin = role === "ADMIN";
  const navigation = [
    ...(isAdmin ? [{ href: "/admin", label: "Admin centre" }] : []),
    { href: "/staff", label: "Staff workspace" },
    { href: "/account", label: "My account" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--surface-0)]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[100rem] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={workspace === "Admin" ? "/admin" : "/staff"}
            className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <RecharzaMark compact />
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">
              {workspace} workspace
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {roleLabel(role)} · {email}
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-5 text-sm text-slate-400 lg:flex" aria-label={`${workspace} navigation`}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-300 min-[440px]:inline-flex">
            {roleLabel(role)}
          </span>
          <Link
            href="/"
            className="min-h-11 rounded-xl bg-white px-3.5 py-3 text-xs font-black text-slate-950 transition hover:bg-violet-200"
          >
            Customer store
          </Link>
        </div>
      </div>
    </header>
  );
}

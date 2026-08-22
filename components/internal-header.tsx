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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06070d]/80 backdrop-blur-xl">
      <div className="flex min-h-20 w-full items-center justify-between gap-4 px-6 py-3 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={workspace === "Admin" ? "/admin" : "/staff"}
            className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl transition-all hover:scale-105"
          >
            <RecharzaMark compact />
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-violet-400">
              {workspace} workspace
            </p>
            <p className="mt-1 truncate text-xs font-bold text-white">
              {roleLabel(role)} <span className="mx-1 text-white/10">·</span> <span className="text-slate-400 font-medium">{email}</span>
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-400 lg:flex" aria-label={`${workspace} navigation`}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-all hover:text-violet-400 hover:-translate-y-0.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 min-[440px]:inline-flex">
            {roleLabel(role)}
          </span>
          <Link
            href="/"
            className="min-h-11 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white shadow-2xl transition-all hover:-translate-y-1 hover:bg-white/10"
          >
            Customer store
          </Link>
        </div>
      </div>
    </header>
  );
}

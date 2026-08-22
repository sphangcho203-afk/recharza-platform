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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-20 w-full items-center justify-between gap-4 px-6 py-3 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={workspace === "Admin" ? "/admin" : "/staff"}
            className="shrink-0 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-all hover:scale-105"
          >
            <RecharzaMark compact />
          </Link>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-violet-600">
              {workspace} workspace
            </p>
            <p className="mt-1 truncate text-xs font-bold text-slate-900">
              {roleLabel(role)} <span className="mx-1 text-slate-300">·</span> <span className="text-slate-500 font-medium">{email}</span>
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-500 lg:flex" aria-label={`${workspace} navigation`}>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-all hover:text-violet-600 hover:-translate-y-0.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 min-[440px]:inline-flex">
            {roleLabel(role)}
          </span>
          <Link
            href="/"
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:bg-slate-50"
          >
            Customer store
          </Link>
        </div>
      </div>
    </header>
  );
}

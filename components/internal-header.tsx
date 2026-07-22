import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";

type InternalHeaderProps = {
  workspace: "Admin" | "Staff" | "Operator";
};

export function InternalHeader({ workspace }: InternalHeaderProps) {
  const navigation =
    workspace === "Admin"
      ? [
          { href: "/admin", label: "Admin overview" },
          { href: "/staff", label: "Staff workspace" },
          { href: "/operator", label: "Legacy console" },
        ]
      : [
          { href: "/staff", label: "Staff queue" },
          { href: "/operator", label: "Order operations" },
        ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080810]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[100rem] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={workspace === "Admin" ? "/admin" : "/staff"} className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
            <RecharzaMark compact />
          </Link>
          <span className="truncate rounded-full border border-violet-300/15 bg-violet-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-200">
            {workspace} workspace
          </span>
        </div>

        <nav className="hidden items-center gap-5 text-sm text-slate-400 lg:flex" aria-label={`${workspace} navigation`}>
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="hidden min-h-11 rounded-xl border border-white/10 px-3.5 py-3 text-xs font-bold text-slate-300 transition hover:bg-white/5 sm:block"
          >
            Account
          </Link>
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
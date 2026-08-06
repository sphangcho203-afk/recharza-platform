import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { PUBLIC_POLICY_KEYS, publicPolicies } from "@/lib/public-policies";

const primaryLinks = [
  { label: "Games", href: "/#games" },
  { label: "Orders", href: "/orders/lookup" },
  { label: "Support", href: "/support" },
  { label: "Account", href: "/account" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#04050a] px-4 pb-3 pt-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <RecharzaMark compact />
            <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
              Account-based game top-ups with clear markets, published prices and private order tracking.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-bold text-slate-400 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:recherzatopup@gmail.com"
              className="text-xs font-bold text-cyan-300 transition hover:text-cyan-200"
            >
              Email support
            </a>
          </nav>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.07] pt-4">
          {PUBLIC_POLICY_KEYS.map((key) => (
            <Link
              key={key}
              href={`/policies/${key}`}
              className="text-[10px] font-semibold text-slate-600 transition hover:text-slate-300"
            >
              {publicPolicies[key].title}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-white/[0.06] py-4 text-[10px] leading-4 text-slate-700 sm:flex-row sm:justify-between">
          <p>© 2026 Recharza.</p>
          <p>Game names and artwork belong to their respective publishers.</p>
        </div>
      </div>
    </footer>
  );
}

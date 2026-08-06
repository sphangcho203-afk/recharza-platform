import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { StorefrontIcon } from "@/components/storefront-icon";
import { PUBLIC_POLICY_KEYS, publicPolicies } from "@/lib/public-policies";

const storeLinks = [
  { label: "All games", href: "/#games" },
  { label: "Mobile Legends", href: "/games/mobile-legends" },
  { label: "Free Fire MAX", href: "/games/free-fire" },
  { label: "PUBG Mobile", href: "/games/pubg-mobile" },
];

const helpLinks = [
  { label: "Track order", href: "/orders/lookup" },
  { label: "Support centre", href: "/support" },
  { label: "My account", href: "/account" },
  { label: "Cart", href: "/cart" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#04050a] px-4 pb-3 pt-9 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr_0.75fr] lg:gap-14">
          <div>
            <RecharzaMark />
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Multi-game top-ups with clear regions, published product prices and private order tracking.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="mailto:recherzatopup@gmail.com"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-black text-slate-300"
              >
                <StorefrontIcon name="support" className="h-4 w-4 text-cyan-300" />
                Email support
              </a>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-black text-slate-400">
                <StorefrontIcon name="shield" className="h-4 w-4 text-emerald-300" />
                Razorpay checkout
              </span>
            </div>
          </div>

          <FooterLinks title="Store" links={storeLinks} />
          <FooterLinks title="Help" links={helpLinks} />
        </div>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.07] pt-5">
          {PUBLIC_POLICY_KEYS.map((key) => (
            <Link
              key={key}
              href={`/policies/${key}`}
              className="text-xs font-semibold text-slate-500 transition hover:text-white"
            >
              {publicPolicies[key].title}
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.06] py-5 text-[11px] leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Recharza. All rights reserved.</p>
          <p>Game names and artwork belong to their respective publishers.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 lg:grid-cols-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-semibold text-slate-400 transition hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

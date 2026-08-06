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

const customerLinks = [
  { label: "Track an order", href: "/orders/lookup" },
  { label: "My account", href: "/account" },
  { label: "Cart", href: "/cart" },
  { label: "Support centre", href: "/support" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#05060b] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl py-10 sm:py-12">
        <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.75fr_0.85fr] lg:gap-12">
          <div>
            <RecharzaMark />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Independent multi-game top-ups with clear regional selection,
              protected payment review and private order tracking.
            </p>
            <a
              href="mailto:recherzatopup@gmail.com"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3.5 text-sm font-black text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] hover:text-white"
            >
              <StorefrontIcon name="support" className="h-[17px] w-[17px] text-cyan-300" />
              recherzatopup@gmail.com
            </a>
          </div>

          <FooterColumn title="Store" links={storeLinks} />
          <FooterColumn title="Customer" links={customerLinks} />

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.19em] text-slate-500">
              Legal
            </p>
            <div className="mt-4 grid gap-3">
              {PUBLIC_POLICY_KEYS.map((key) => (
                <Link
                  key={key}
                  href={`/policies/${key}`}
                  className="text-sm font-semibold text-slate-400 transition hover:text-white"
                >
                  {publicPolicies[key].title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-3 border-t border-white/[0.07] pt-5 text-[11px] leading-5 text-slate-600 sm:grid-cols-[1fr_auto] sm:items-center">
          <p>© 2026 Recharza. All rights reserved.</p>
          <p className="sm:text-right">
            Game names, artwork and currencies belong to their respective publishers.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.19em] text-slate-500">
        {title}
      </p>
      <div className="mt-4 grid gap-3">
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

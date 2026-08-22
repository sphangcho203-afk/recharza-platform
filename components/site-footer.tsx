import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { SupportChannelIcon, type SupportChannelIconName } from "@/components/support-channel-icon";
import {
  getPublishedPolicy,
  getPublishedStorefrontContent,
  STOREFRONT_POLICY_KEYS,
} from "@/lib/storefront-content";
import { getPublicSupportChannels } from "@/lib/support-config";

const companyLinks = [
  { label: "Games", href: "/#games" },
  { label: "My account", href: "/account" },
  { label: "Track order", href: "/orders/lookup" },
];

const supportLinks = [
  { label: "Help Center", href: "/support" },
];

const channelIcons: Record<string, SupportChannelIconName> = {
  telegram: "telegram",
  whatsapp: "whatsapp",
  instagram: "instagram",
  email: "email",
};

const paymentMarks = [
  { label: "UPI", src: "/assets/payments/upi.svg", className: "h-5 w-auto max-w-[48px]" },
  { label: "Visa", src: "/assets/payments/visa.svg", className: "h-4 w-auto max-w-[42px]" },
  { label: "Mastercard", src: "/assets/payments/mastercard.svg", className: "h-5 w-auto max-w-[42px]" },
  { label: "Razorpay", src: "/assets/payments/razorpay.svg", className: "h-5 w-auto max-w-[70px]" },
  { label: "Paytm wallet", src: "/assets/payments/paytm.svg", className: "h-5 w-auto max-w-[54px]" },
];

export async function SiteFooter() {
  const [channels, storefront] = await Promise.all([
    Promise.resolve(getPublicSupportChannels()),
    getPublishedStorefrontContent().catch(() => null),
  ]);
  const publishedPolicies = storefront
    ? STOREFRONT_POLICY_KEYS.flatMap((key) => {
        const policy = getPublishedPolicy(storefront, key);
        return policy ? [{ key, title: policy.title }] : [];
      })
    : [];

  return (
    <footer className="border-t border-white/5 bg-[#020306] px-4 pb-8 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr]">
          <div className="max-w-sm">
            <RecharzaMark />
            <p className="mt-4 text-[0.95rem] leading-7 text-slate-400 font-medium">
              Game top-ups with published pricing, secure checkout, recoverable order tracking and connected support.
            </p>
            <div className="mt-6 flex gap-3" aria-label="Support channels">
              {channels.map((channel) => {
                const icon = channelIcons[channel.id];
                if (!icon) return null;
                const className = "grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.2)]";
                return channel.href && channel.available ? (
                  <a key={channel.id} href={channel.href} target={channel.id === "email" ? undefined : "_blank"} rel={channel.id === "email" ? undefined : "noreferrer"} aria-label={channel.label} className={className}>
                    <SupportChannelIcon name={icon} className="h-5 w-5" />
                  </a>
                ) : (
                  <span key={channel.id} aria-label={`${channel.label} unavailable`} className={`${className} opacity-30 grayscale`}>
                    <SupportChannelIcon name={icon} className="h-5 w-5" />
                  </span>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Store" links={companyLinks} />
          <FooterColumn title="Support" links={supportLinks} />

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-white text-shadow-sm">Payments</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3" aria-label="Accepted payment methods">
              {paymentMarks.map((mark) => (
                <span key={mark.label} title={mark.label} className="grid h-11 min-w-12 place-items-center rounded-xl border border-white/10 bg-white/5 px-3 shadow-2xl transition-all duration-300 hover:border-white/20 hover:bg-white/8">
                  <img src={mark.src} alt={mark.label} className={`${mark.className} object-contain opacity-90 brightness-0 invert`} />
                </span>
              ))}
            </div>
            <p className="mt-5 text-[11px] leading-5 text-slate-500 font-medium">Payment availability depends on the active checkout configuration and market.</p>
          </div>
        </div>

        {publishedPolicies.length > 0 ? (
          <section aria-labelledby="footer-legal-heading" className="mt-12 border-t border-white/10 pt-8">
            <h2 id="footer-legal-heading" className="text-xs font-extrabold uppercase tracking-[0.2em] text-white">Legal</h2>
            <nav aria-label="Legal policies" className="mt-4 max-w-md">
              <div className="grid gap-2">
                {publishedPolicies.map((policy) => (
                  <Link
                    key={policy.key}
                    href={`/policies/${policy.key}`}
                    className="group flex min-h-10 items-center rounded-xl px-3 py-2 text-[0.9rem] font-bold text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
                  >
                    {policy.title}
                  </Link>
                ))}
              </div>
            </nav>
          </section>
        ) : null}

        <div className="mt-8 flex flex-col gap-2 text-[11px] font-medium leading-5 text-slate-500 sm:flex-row sm:justify-between border-t border-white/5 pt-6">
          <p>© 2026 Recharza.</p>
          <p className="text-slate-600">Game names and artwork belong to their respective publishers.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white">{title}</h2>
      <nav className="mt-3 grid gap-2.5" aria-label={`${title} links`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-400 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

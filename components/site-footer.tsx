import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { StorefrontIcon } from "@/components/storefront-icon";
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
    <footer className="border-t border-slate-200/60 bg-slate-50 px-4 pb-12 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 md:grid-cols-[1.6fr_0.7fr_0.7fr_1fr]">
          <div className="max-w-sm">
            <RecharzaMark />
            <p className="mt-6 text-[1rem] leading-7 text-slate-500 font-medium tracking-tight">
              Recharza is the premium destination for gaming top-ups. We provide secure, transparent, and instant delivery for your favorite titles worldwide.
            </p>
            <div className="mt-8 flex gap-3" aria-label="Support channels">
              {channels.map((channel) => {
                const icon = channelIcons[channel.id];
                if (!icon) return null;
                const className = "grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all duration-300 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 hover:shadow-lg hover:-translate-y-1";
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
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900">Accepted Payments</h2>
            <div className="mt-5 flex flex-wrap items-center gap-2.5" aria-label="Accepted payment methods">
              {paymentMarks.map((mark) => (
                <span key={mark.label} title={mark.label} className="grid h-12 min-w-[3.5rem] place-items-center rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm transition-all duration-300 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-md">
                  <img src={mark.src} alt={mark.label} className={`${mark.className} object-contain opacity-80 group-hover:opacity-100`} />
                </span>
              ))}
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure & Encrypted Transactions</p>
          </div>
        </div>

        {publishedPolicies.length > 0 ? (
          <section aria-labelledby="footer-legal-heading" className="mt-16 border-t border-slate-200 pt-10">
            <div className="flex flex-col gap-6">
              <h2 id="footer-legal-heading" className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900">Legal Policies</h2>
              <nav aria-label="Legal policies">
                <ul className="flex flex-col gap-3">
                  {publishedPolicies.map((policy) => (
                    <li key={policy.key}>
                      <Link
                        href={`/policies/${policy.key}`}
                        className="text-[12px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-violet-600"
                      >
                        {policy.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
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
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-900">{title}</h2>
      <nav className="mt-3 grid gap-2.5" aria-label={`${title} links`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

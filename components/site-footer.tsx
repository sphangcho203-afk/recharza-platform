import Link from "next/link";

import { RecharzaMark } from "@/components/recharza-mark";
import { SupportChannelIcon, type SupportChannelIconName } from "@/components/support-channel-icon";
import { getPublicMediaPlacements } from "@/lib/media-assets";
import { PUBLIC_POLICY_KEYS, publicPolicies } from "@/lib/public-policies";
import { getPublicSupportChannels } from "@/lib/support-config";

const companyLinks = [
  { label: "Games", href: "/#games" },
  { label: "My account", href: "/account" },
  { label: "Track order", href: "/orders/lookup" },
];

const supportLinks = [
  { label: "Help Center", href: "/support" },
  { label: "Refund policy", href: "/policies/refunds" },
  { label: "Privacy policy", href: "/policies/privacy" },
  { label: "Terms of service", href: "/policies/terms" },
];

const channelIcons: Record<string, SupportChannelIconName> = {
  telegram: "telegram",
  whatsapp: "whatsapp",
  instagram: "instagram",
  email: "email",
};

export async function SiteFooter() {
  const [media, channels] = await Promise.all([
    getPublicMediaPlacements().catch(() => new Map()),
    Promise.resolve(getPublicSupportChannels()),
  ]);
  const brandLogo = media.get("brand.primary.logo");

  return (
    <footer className="border-t border-white/[0.08] bg-[#07080c] px-4 pb-6 pt-9 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-8 md:grid-cols-[1.4fr_0.7fr_0.8fr_0.9fr]">
          <div className="max-w-sm">
            <RecharzaMark logoUrl={brandLogo?.url} logoAlt={brandLogo?.altText} />
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Game top-ups with published pricing, secure checkout, recoverable order tracking and connected support.
            </p>
            <div className="mt-5 flex gap-2" aria-label="Support channels">
              {channels.map((channel) => {
                const icon = channelIcons[channel.id];
                if (!icon) return null;
                const className = "grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-slate-400 transition hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-white";
                return channel.href && channel.available ? (
                  <a key={channel.id} href={channel.href} target={channel.id === "email" ? undefined : "_blank"} rel={channel.id === "email" ? undefined : "noreferrer"} aria-label={channel.label} className={className}>
                    <SupportChannelIcon name={icon} className="h-4.5 w-4.5" />
                  </a>
                ) : (
                  <span key={channel.id} aria-label={`${channel.label} unavailable`} className={`${className} opacity-40`}>
                    <SupportChannelIcon name={icon} className="h-4.5 w-4.5" />
                  </span>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Store" links={companyLinks} />
          <FooterColumn title="Support" links={supportLinks} />

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">Payments</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-500">
              {["UPI", "Cards", "Razorpay", "Wallets"].map((item) => (
                <span key={item} className="rounded-md border border-white/[0.08] bg-white/[0.025] px-2.5 py-2">{item}</span>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-600">Payment availability depends on the active checkout configuration and market.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.07] pt-5">
          {PUBLIC_POLICY_KEYS.map((key) => (
            <Link key={key} href={`/policies/${key}`} className="text-[10px] font-semibold text-slate-600 transition hover:text-slate-300">
              {publicPolicies[key].title}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1 text-[10px] leading-4 text-slate-700 sm:flex-row sm:justify-between">
          <p>© 2026 Recharza.</p>
          <p>Game names and artwork belong to their respective publishers.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-300">{title}</h2>
      <nav className="mt-3 grid gap-2.5" aria-label={`${title} links`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm text-slate-500 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

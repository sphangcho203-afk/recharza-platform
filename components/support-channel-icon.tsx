import type { SVGProps } from "react";

export type SupportChannelIconName = "telegram" | "whatsapp" | "instagram" | "email";

export function SupportChannelIcon({
  name,
  className = "h-5 w-5",
  ...props
}: SVGProps<SVGSVGElement> & { name: SupportChannelIconName }) {
  const gradientId = `support-${name}-gradient`;

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} {...props}>
      {name === "telegram" ? (
        <>
          <circle cx="12" cy="12" r="11" fill="#229ED9" />
          <path fill="#fff" d="m5.3 11.7 12.4-4.8c.57-.2 1.06.14.88.98l-2.1 9.84c-.15.7-.56.87-1.14.55l-3.28-2.42-1.58 1.52c-.17.17-.31.31-.63.31l.23-3.32 6.08-5.46c.26-.23-.06-.36-.4-.13l-7.5 4.72-3.23-1.01c-.7-.22-.7-.69.27-1.08Z" />
        </>
      ) : null}
      {name === "whatsapp" ? (
        <>
          <circle cx="12" cy="12" r="11" fill="#25D366" />
          <path fill="#fff" d="M7.27 17.28 8 14.02a5.9 5.9 0 1 1 2 1.9l-2.73 1.36Z" />
          <path fill="#25D366" d="M10.08 9.2c.16-.2.3-.2.48-.2h.4c.15 0 .3.06.36.24l.55 1.34c.07.18.04.32-.08.47l-.4.47c-.1.12-.1.23-.02.37.23.42.83 1.27 1.86 1.75.16.08.28.07.38-.05l.5-.6c.1-.13.23-.15.38-.1l1.25.58c.18.08.24.2.2.4-.1.48-.54 1.08-1.04 1.2-.45.1-1.02.04-1.63-.2-.57-.22-1.38-.7-2.23-1.53-.7-.7-1.2-1.46-1.44-2.04-.25-.6-.25-1.25.03-1.63Z" />
        </>
      ) : null}
      {name === "instagram" ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#F58529" />
              <stop offset="0.45" stopColor="#DD2A7B" />
              <stop offset="1" stopColor="#8134AF" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.1" />
          <circle cx="12" cy="12" r="4.1" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2" />
          <circle cx="17.35" cy="6.75" r="1.2" fill="#E1306C" />
        </>
      ) : null}
      {name === "email" ? (
        <>
          <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" fill="#fff" />
          <path d="m3.5 6 8.5 6.4L20.5 6" fill="none" stroke="#EA4335" strokeWidth="1.8" />
          <path d="m3.5 18 6-5.2M20.5 18l-6-5.2" fill="none" stroke="#4285F4" strokeWidth="1.6" />
          <path d="M3.5 6v12" stroke="#34A853" strokeWidth="1.6" />
          <path d="M20.5 6v12" stroke="#FBBC04" strokeWidth="1.6" />
        </>
      ) : null}
    </svg>
  );
}

export type { SVGProps };

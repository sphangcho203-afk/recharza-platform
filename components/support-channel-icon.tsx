import type { SVGProps } from "react";

export type SupportChannelIconName =
  | "telegram"
  | "whatsapp"
  | "instagram"
  | "email";

export function SupportChannelIcon({
  name,
  className = "h-5 w-5",
  ...props
}: SVGProps<SVGSVGElement> & { name: SupportChannelIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      {...props}
    >
      {name === "telegram" ? (
        <path
          fill="currentColor"
          d="M21.6 3.45 18.5 20.1c-.23 1.18-.84 1.47-1.7.92l-4.73-3.49-2.28 2.2c-.25.25-.46.46-.95.46l.34-4.82 8.77-7.92c.38-.34-.08-.53-.59-.19L6.52 14.09l-4.67-1.46c-1.02-.32-1.04-1.02.21-1.51L20.32 4.1c.85-.31 1.59.2 1.28 1.35Z"
        />
      ) : null}

      {name === "whatsapp" ? (
        <>
          <path
            fill="currentColor"
            d="M12.04 2a9.77 9.77 0 0 0-8.43 14.7L2.2 22l5.42-1.38A9.83 9.83 0 1 0 12.04 2Zm0 17.88a8 8 0 0 1-4.08-1.12l-.29-.17-3.22.82.86-3.14-.19-.32A8.08 8.08 0 1 1 12.04 19.88Z"
          />
          <path
            fill="currentColor"
            d="M16.46 13.98c-.24-.12-1.44-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.28 7.28 0 0 1-1.34-1.67c-.14-.24-.02-.37.1-.49.11-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.65.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.72 2.62 4.16 3.68.58.25 1.04.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z"
          />
        </>
      ) : null}

      {name === "instagram" ? (
        <>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.4" cy="6.8" r="1.15" fill="currentColor" />
        </>
      ) : null}

      {name === "email" ? (
        <>
          <rect
            x="2.5"
            y="4.5"
            width="19"
            height="15"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m4 7 8 6 8-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M3.5 18 9 12.9M20.5 18 15 12.9" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : null}
    </svg>
  );
}

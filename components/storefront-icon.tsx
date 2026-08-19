import type { SVGProps } from "react";

export type StorefrontIconName =
  | "account"
  | "arrow"
  | "cart"
  | "games"
  | "globe"
  | "coin"
  | "id"
  | "info"
  | "menu"
  | "receipt"
  | "search"
  | "shield"
  | "support"
  | "track"
  | "close"
  | "check"
  | "copy"
  | "phone"
  | "chat"
  | "mail"
  | "lock"
  | "package"
  | "refresh"
  | "eye"
  | "chevron";

type StorefrontIconProps = SVGProps<SVGSVGElement> & {
  name: StorefrontIconName;
};

export function StorefrontIcon({
  name,
  className = "h-5 w-5",
  ...props
}: StorefrontIconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      {...common}
      {...props}
    >
      {name === "games" ? (
        <>
          <path d="M8.5 8.5h7a4.5 4.5 0 0 1 4.22 6.06l-.8 2.17a2.2 2.2 0 0 1-3.6.82l-1.28-1.22a3 3 0 0 0-4.08 0l-1.28 1.22a2.2 2.2 0 0 1-3.6-.82l-.8-2.17A4.5 4.5 0 0 1 8.5 8.5Z" />
          <path d="M8 12v3M6.5 13.5h3M15.75 12.75h.01M17.5 14.5h.01" />
        </>
      ) : null}

      {name === "cart" ? (
        <>
          <path d="M3.5 5h2l1.6 9.2a2 2 0 0 0 2 1.65h7.55a2 2 0 0 0 1.95-1.56L20 8H6" />
          <circle cx="9.3" cy="19" r="1.2" />
          <circle cx="17" cy="19" r="1.2" />
        </>
      ) : null}

      {name === "track" ? (
        <>
          <path d="M4 6.5h12.5a3.5 3.5 0 0 1 0 7H8" />
          <path d="m8 10-4 3.5L8 17" />
          <circle cx="17" cy="13.5" r="3.5" />
          <path d="M17 11.8v2l1.2.8" />
        </>
      ) : null}

      {name === "account" ? (
        <>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 19c.55-3.15 2.72-5 6.5-5s5.95 1.85 6.5 5" />
        </>
      ) : null}

      {name === "support" ? (
        <>
          <path d="M5 13v-2a7 7 0 0 1 14 0v2" />
          <path d="M5 12.5H4a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1ZM19 12.5h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1Z" />
          <path d="M19 17.5c0 2-1.6 3-4 3h-1" />
        </>
      ) : null}

      {name === "arrow" ? (
        <>
          <path d="M5 12h14" />
          <path d="m14 7 5 5-5 5" />
        </>
      ) : null}

      {name === "shield" ? (
        <>
          <path d="M12 3.5 19 6v5.5c0 4.35-2.55 7.35-7 9-4.45-1.65-7-4.65-7-9V6l7-2.5Z" />
          <path d="m8.7 12 2.1 2.1 4.5-4.5" />
        </>
      ) : null}

      {name === "globe" ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4M12 3.5c2.25 2.3 3.4 5.13 3.4 8.5S14.25 18.2 12 20.5M12 3.5C9.75 5.8 8.6 8.63 8.6 12s1.15 6.2 3.4 8.5" />
        </>
      ) : null}

      {name === "receipt" ? (
        <>
          <path d="M7 3.5h10v17l-2-1.35-2 1.35-2-1.35-2 1.35-2-1.35V3.5Z" />
          <path d="M9.5 8h5M9.5 11.5h5M9.5 15h3" />
        </>
      ) : null}

      {name === "search" ? (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 4 4" />
        </>
      ) : null}

      {name === "menu" ? (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </>
      ) : null}

      {name === "coin" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.2c-.6-.7-1.5-1.1-2.5-1.1-1.9 0-3.4 1.5-3.4 3.4 0 1.2.6 2.1 1.5 2.7.9.6 1.3 1.1 1.3 1.9 0 .9-.7 1.7-1.7 1.7s-1.8-.5-2.2-1.2" />
        </>
      ) : null}

      {name === "id" ? (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <circle cx="9.5" cy="11" r="2" />
          <path d="M14.5 9h3M14.5 13h3M6 16.5c.8-.9 2.1-1.5 3.5-1.5s2.7.6 3.5 1.5" />
        </>
      ) : null}

      {name === "info" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8.5v.01M12 11.5v5" />
        </>
      ) : null}

      {name === "close" ? (
        <>
          <path d="m7 7 10 10M17 7 7 17" />
        </>
      ) : null}

      {name === "check" ? (
        <path d="m6 12.5 4 4L18 8" />
      ) : null}

      {name === "copy" ? (
        <>
          <rect x="9.5" y="9.5" width="9.5" height="9.5" rx="2" />
          <path d="M5 16v-8a3 3 0 0 1 3-3h8" />
        </>
      ) : null}

      {name === "phone" ? (
        <>
          <path d="M4.6 3.4c.7-.7 1.9-.7 2.6 0l1.4 1.4c.6.6.8 1.6.4 2.4l-.6 1.3a1 1 0 0 0 .3 1.2c1.3 1.3 2.9 2.4 4.6 3.2.4.2.9.1 1.2-.3l1.2-.7c.8-.4 1.8-.3 2.5.3l1.4 1.4c.7.7.7 1.9 0 2.6l-.5.5c-.8.8-2 .9-3 .6a20.6 20.6 0 0 1-8.4-5.6 20.6 20.6 0 0 1-3.2-5.5c-.3-1-.2-2.2.6-3l.5-.4Z" />
        </>
      ) : null}

      {name === "chat" ? (
        <>
          <path d="M4 15c0 2.8 2.7 5 6 5 .8 0 1.6-.1 2.3-.4L17 21v-3.3c1.9-1.1 3-2.7 3-4.7 0-3.3-2.7-6-6-6H10C6.7 7 4 9.2 4 12v3Z" />
          <path d="M8 11h.01M11.5 11h.01M15 11h.01" />
        </>
      ) : null}

      {name === "mail" ? (
        <>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="m4 8 8 6 8-6" />
        </>
      ) : null}

      {name === "lock" ? (
        <>
          <rect x="6.5" y="10" width="11" height="9" rx="2" />
          <path d="M9 10V7a3 3 0 0 1 6 0v3" />
        </>
      ) : null}

      {name === "package" ? (
        <>
          <path d="m3.5 8.5 8.5-5 8.5 5-8.5 5-8.5-5Z" />
          <path d="M3.5 8.5v7l8.5 5 8.5-5v-7M12 13.5v7" />
        </>
      ) : null}

      {name === "refresh" ? (
        <>
          <path d="M3.5 12a8.5 8.5 0 0 1 14.8-5.4L20.5 9" />
          <path d="M20.5 6.2V9h-2.8" />
          <path d="M20.5 12a8.5 8.5 0 0 1-14.8 5.4L3.5 15" />
          <path d="M3.5 17.8V15h2.8" />
        </>
      ) : null}

      {name === "eye" ? (
        <>
          <path d="M3 12s3.4-6.2 9-6.2S21 12 21 12s-3.4 6.2-9 6.2S3 12 3 12Z" />
          <circle cx="12" cy="12" r="2.8" />
        </>
      ) : null}

      {name === "chevron" ? (
        <path d="m9 7 5 5-5 5" />
      ) : null}
    </svg>
  );
}

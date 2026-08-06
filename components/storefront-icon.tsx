import type { SVGProps } from "react";

export type StorefrontIconName =
  | "account"
  | "arrow"
  | "games"
  | "globe"
  | "menu"
  | "receipt"
  | "search"
  | "shield"
  | "support"
  | "track";

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
    strokeWidth: 1.8,
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
    </svg>
  );
}

"use client";

import { useCallback } from "react";
import type { MouseEvent, ReactNode } from "react";

type TelegramGroupLauncherProps = {
  className?: string;
  children: ReactNode;
  showArrow?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const APP_URL = "tg://resolve?domain=supprtrz";
const WEB_URL = "https://t.me/supprtrz";

export function TelegramGroupLauncher({
  className,
  children,
  showArrow = true,
  onClick,
}: TelegramGroupLauncherProps) {
  const openTelegram = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    event.preventDefault();
    let appOpened = false;
    const markOpened = () => {
      appOpened = true;
    };
    document.addEventListener("visibilitychange", markOpened, { once: true });
    window.location.href = APP_URL;
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", markOpened);
      if (!appOpened && document.visibilityState === "visible") {
        window.location.href = WEB_URL;
      }
    }, 700);
  }, [onClick]);

  return (
    <a
      href={WEB_URL}
      onClick={openTelegram}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      {showArrow ? <span className="ml-2" aria-hidden="true">↗</span> : null}
    </a>
  );
}

export { APP_URL as TELEGRAM_GROUP_APP_URL, WEB_URL as TELEGRAM_GROUP_WEB_URL };

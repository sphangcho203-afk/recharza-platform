import type { Metadata, Viewport } from "next";

import { MobileBottomNav } from "@/components/mobile-bottom-nav";

import "./globals.css";
import "./frontend-tuning.css";
import "./storefront-redesign.css";
import "./electric-brand.css";

export const metadata: Metadata = {
  applicationName: "Recharza",
  title: {
    default: "Recharza | Game Top-Ups",
    template: "%s | Recharza",
  },
  description:
    "A multi-game top-up platform with clear regional checkout, protected payment review and private order tracking.",
  category: "gaming",
  creator: "Recharza",
  publisher: "Recharza",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}

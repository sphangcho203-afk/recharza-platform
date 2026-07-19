import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Recharza | Game Top-Ups",
    template: "%s | Recharza",
  },
  description:
    "A modern multi-game top-up and digital recharge platform built for secure checkout, clear order tracking, and fast fulfilment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

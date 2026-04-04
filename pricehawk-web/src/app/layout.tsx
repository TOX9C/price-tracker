import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceHawk — Track Prices, Never Overpay",
  description:
    "Monitor product prices across Amazon, Walmart, Best Buy, and more. Get alerts when prices drop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise-bg min-h-full flex flex-col">{children}</body>
    </html>
  );
}

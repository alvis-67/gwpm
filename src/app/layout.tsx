import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";
import { PRODUCT_FULL, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/labels";

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT_NAME}｜${PRODUCT_FULL}`,
    template: `%s｜${PRODUCT_NAME}`,
  },
  description: PRODUCT_TAGLINE,
  applicationName: PRODUCT_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: PRODUCT_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f5c56",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.bunny.net" crossOrigin="" />
        <link
          href="https://fonts.bunny.net/css?family=ibm-plex-mono:400,500|noto-sans-tc:400,500,700"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

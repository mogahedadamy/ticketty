import type { Metadata } from "next";
import { Alexandria, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ticketty | نظام إدارة النقل",
  description: "منصة تشغيل وإدارة شركات النقل والحجوزات والمدفوعات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} ${alexandria.variable}`}
      suppressHydrationWarning
    >
      <body className={ibmPlexSansArabic.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
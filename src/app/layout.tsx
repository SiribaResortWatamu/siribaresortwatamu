import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Siriba Resort Watamu — Coastal Apartments, Safaris & Transfers",
    template: "%s — Siriba Resort Watamu",
  },
  description:
    "Boutique self-catering apartments in Watamu on the Kenyan coast, with safaris, private transfers and direct booking.",
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Siriba Resort Watamu",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

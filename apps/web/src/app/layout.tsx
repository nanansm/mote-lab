import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mote LAB — Marketplace Research Tool",
    template: "%s | Mote LAB",
  },
  description:
    "Tool riset produk marketplace berbasis data. Analisis Shopee & Tokopedia dengan collective intelligence dari ribuan seller.",
  keywords: ["riset produk", "marketplace", "shopee", "tokopedia shop", "seller", "analisis data"],
  authors: [{ name: "Mote Kreatif" }],
  creator: "Mote Kreatif",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Mote LAB — Marketplace Research Tool",
    description:
      "Tool riset produk marketplace berbasis data. Analisis Shopee & Tokopedia.",
    siteName: "Mote LAB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mote LAB — Marketplace Research Tool",
    description: "Tool riset produk marketplace berbasis data.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1E40AF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

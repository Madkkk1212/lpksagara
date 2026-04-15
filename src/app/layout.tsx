import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getTheme } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const theme = await getTheme();
  const timestamp = theme?.updated_at ? new Date(theme.updated_at).getTime() : Date.now();
  let favicon = theme?.favicon_url || null;
  
  // Only append cache-buster if it's a regular URL, not a Base64/Data URL
  if (favicon && !favicon.startsWith('data:')) {
    favicon = `${favicon}${favicon.includes('?') ? '&' : '?'}v=${timestamp}`;
  }
  
  return {
    title: theme?.app_name || "Reiwa LMS",
    description: theme?.tagline || "Premium Japanese Study Experience",
    icons: favicon ? {
      icon: favicon,
      apple: favicon,
      shortcut: favicon,
    } : {
      icon: "/favicon.ico",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import SmoothScroll from "@/app/components/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}

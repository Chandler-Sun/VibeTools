import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AISettingsProvider } from '@/components/AISettingsProvider';
import SiteHeader from '@/components/SiteHeader';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "小游戏小工具中心",
  description: "小游戏小工具中心",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AISettingsProvider><SiteHeader />{children}</AISettingsProvider>
      </body>
    </html>
  );
}

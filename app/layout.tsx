import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeInitializer } from "@/modules/ui-global/ThemeInitializer";
import { CriticalStyles } from "@/modules/ui-global/CriticalStyles";
import { PreloadLCP } from "@/modules/ui-global/PreloadLCP";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wildmind Canvas",
  description: "A powerful canvas application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <CriticalStyles />
        <PreloadLCP />
        <link rel="preload" as="image" href="/loader-dark.svg" />
        <link rel="preload" as="image" href="/loader-light.svg" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}

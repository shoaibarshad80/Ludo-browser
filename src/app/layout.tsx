import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lilita_One } from "next/font/google";
import "./globals.css";
import "./ludo-theme.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lilita = Lilita_One({
  weight: "400",
  variable: "--font-lilita",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070a18",
};

export const metadata: Metadata = {
  title: "Ludo Royale — Premium Multiplayer Ludo",
  description: "Ludo Royale: premium multiplayer Ludo — play vs Computer, Pass & Play offline, or Online with bets, emotes and chat. Web now, mobile later.",
  keywords: ["Ludo", "Ludo Royale", "board game", "multiplayer", "dice game"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎲</text></svg>",
  },
  openGraph: {
    title: "Ludo Royale",
    description: "Premium Ludo with bets, emotes and online rooms",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lilita.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

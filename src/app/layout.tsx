import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/shared/header";
import { BottomNav } from "@/components/shared/bottom-nav";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Siege",
  description: "We Don't Negotiate With The Plan",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Siege",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <Header />
          <main className="pt-14 pb-24">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/shared/header";
import { BottomNav } from "@/components/shared/bottom-nav";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Siege",
  description: "We Don't Negotiate With The Plan",
  manifest: "/manifest.json",
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
          <ServiceWorkerRegister />
          <Header />
          <main className="pt-14 pb-24 min-h-[100dvh]">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

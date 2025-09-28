import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Roboto } from "next/font/google";
import { Lilita_One } from "next/font/google";
import "./globals.css";
import { DeepgramNav } from "@/components/DeepgramNav";
import Footer from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { cn } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProvider from "@/components/SessionProvider";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

// Configure Google Fonts
const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

const lilitaOne = Lilita_One({
  subsets: ['latin'],
  variable: '--font-lilita',
  display: 'swap',
  weight: ['400'],
});

export const metadata: Metadata = {
  title: "Bleepy Simulator - AI-Powered Clinical Skills Training",
  description: "Practice realistic clinical consultations with AI patients, get instant expert feedback, and master your clinical skills.",
  icons: {
    icon: [
      { url: '/favicon.png?v=7', type: 'image/png', sizes: '32x32' },
      { url: '/Bleepy-Logo-1-1.webp?v=7', type: 'image/webp', sizes: '32x32' },
      { url: '/favicon.ico?v=7', type: 'image/x-icon' }
    ],
    apple: '/favicon.png?v=7',
    shortcut: '/favicon.png?v=7',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png?v=7" type="image/png" sizes="32x32" />
        <link rel="icon" href="/Bleepy-Logo-1-1.webp?v=7" type="image/webp" sizes="32x32" />
        <link rel="icon" href="/favicon.ico?v=7" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.png?v=7" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body
        className={cn(
          GeistSans.variable,
          GeistMono.variable,
          roboto.variable,
          lilitaOne.variable,
          "flex flex-col min-h-screen base-font"
        )}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <DeepgramNav />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <CookieConsent />
              <PerformanceMonitor />
            </div>
            <Toaster position="top-center" richColors={true} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

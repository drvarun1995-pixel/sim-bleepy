import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Roboto } from "next/font/google";
import { Lilita_One } from "next/font/google";
import "./globals.css";
import { DeepgramNav } from "@/components/DeepgramNav";
import Footer from "@/components/Footer";
import { cn } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProvider from "@/components/SessionProvider";

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
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', type: 'image/x-icon' }
    ],
    apple: '/favicon.svg?v=2',
    shortcut: '/favicon.svg?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.svg?v=2" />
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
            </div>
            <Toaster position="top-center" richColors={true} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

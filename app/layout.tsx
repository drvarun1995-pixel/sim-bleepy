import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter, Space_Grotesk } from "next/font/google";
import { Lilita_One } from "next/font/google";
import "./globals.css";
import { BleepyNav } from "@/components/BleepyNav";
import Footer from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { cn } from "@/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionProvider from "@/components/SessionProvider";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollableTables } from "@/components/ScrollableTables";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { EmailStorage } from "@/components/EmailStorage";
import { UserActivityTracker } from "@/components/UserActivityTracker";
import { PageTracker } from "@/components/PageTracker";
import { PushNotificationProvider } from "@/components/push/PushNotificationProvider";
import {
  BUSINESS_SITE_ORIGIN,
  PRODUCTION_SITE_ORIGIN,
  absoluteUrl,
  getSiteOrigin,
} from "@/lib/site-url";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const lilitaOne = Lilita_One({
  subsets: ['latin'],
  variable: '--font-lilita',
  display: 'swap',
  weight: ['400'],
});

const siteOrigin = getSiteOrigin()

const homeTitle = 'Bleepy | AI Clinical Skills Training for NHS Doctors'
const homeDescription =
  'Practice realistic clinical consultations with AI patients, get expert feedback, and access Foundation Year guides — Bleepy’s Basildon trust pilot for NHS doctors.'

export const metadata: Metadata = {
  // Indexing host for this Basildon pilot app — not bleepy.co.uk.
  // Homepage defaults live here; other public routes override via their layouts.
  metadataBase: new URL(siteOrigin),
  title: {
    default: homeTitle,
    template: '%s | Bleepy',
  },
  description: homeDescription,
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    siteName: 'Bleepy',
    type: 'website',
    locale: 'en_GB',
    url: absoluteUrl('/'),
    title: homeTitle,
    description: homeDescription,
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE.url),
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
        alt: DEFAULT_OG_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: [absoluteUrl(DEFAULT_OG_IMAGE.url)],
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=10', type: 'image/x-icon', sizes: '32x32' },
      { url: '/favicon.png?v=10', type: 'image/png', sizes: '32x32' },
      { url: '/Bleepy-Logo-1-1.webp?v=10', type: 'image/webp', sizes: '32x32' }
    ],
    apple: '/favicon.png?v=10',
    shortcut: '/favicon.ico?v=10'
  }
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bleepy',
  url: PRODUCTION_SITE_ORIGIN,
  description:
    'Basildon trust pilot of Bleepy simulation and Foundation Year teaching resources.',
  sameAs: [BUSINESS_SITE_ORIGIN],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png?v=10" type="image/png" sizes="32x32" />
        <link rel="icon" href="/Bleepy-Logo-1-1.webp?v=10" type="image/webp" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon.png?v=10" />
        <meta name="theme-color" content="#060818" />
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          GeistSans.variable,
          GeistMono.variable,
          inter.variable,
          spaceGrotesk.variable,
          lilitaOne.variable,
          "flex flex-col min-h-screen base-font bg-[#060818] text-slate-400 antialiased"
        )}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress dark mode extension errors
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('customDarkModeManagerCS')) {
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <PushNotificationProvider>
              <EmailStorage />
              <UserActivityTracker />
              <div className="flex flex-col min-h-screen">
                <BleepyNav />
                <main className="flex-1 pt-[4.25rem]">
                  {children}
                </main>
                <Footer />
                <CookieConsent />
                <PerformanceMonitor />
                <ScrollToTop />
                <ScrollableTables />
              </div>
              <Toaster position="top-center" richColors={true} />
            </PushNotificationProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

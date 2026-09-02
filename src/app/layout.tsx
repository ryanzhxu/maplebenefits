import type { Metadata, Viewport } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import { SITE } from "@/config/site";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Manrope powers only the logo wordmark; the rest of the app stays Geist.
const manrope = Manrope({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: ["800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://maplebenefits.pages.dev"),
  title: {
    default: `${SITE.name} — ${SITE.tagline.en}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description.en,
  applicationName: SITE.name,
  keywords: [
    "Canadian benefits",
    "government benefits Canada",
    "British Columbia benefits",
    "am I eligible",
    "Disability Tax Credit",
    "Canada Child Benefit",
    "GIS",
    "benefits finder",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline.en}`,
    description: SITE.description.en,
    locale: "en_CA",
    url: "https://maplebenefits.pages.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline.en}`,
    description: SITE.description.en,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-CA" className={`${geistSans.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <LocaleProvider>
          <a
            href="#main"
            className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}

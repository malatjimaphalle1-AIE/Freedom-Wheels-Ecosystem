import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MarketingTracker } from "@/components/marketing-tracker";
import { PageViewTracker } from "@/components/page-view-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.freedomwheels.online";

export const metadata: Metadata = {
  title: "Freedom Wheels — Tools, resources, and community for South African entrepreneurs",
  description:
    "A subscription platform that curates the software, books, and equipment freelancers and side-hustlers actually need — with a revenue share paid back to active members from external affiliate commissions.",
  keywords: [
    "South Africa",
    "freelancers",
    "entrepreneurs",
    "subscription",
    "affiliate",
    "revenue share",
    "tools",
  ],
  authors: [{ name: "Maphalle Malatji" }],
  openGraph: {
    title: "Freedom Wheels — Tools for South African entrepreneurs",
    description:
      "Subscription + revenue share from external affiliate commissions. Not an investment. Not a pyramid. Just tools, community, and fair revenue sharing.",
    url: SITE_URL,
    siteName: "Freedom Wheels",
    type: "website",
    locale: "en_ZA",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Freedom Wheels — Tools, resources, and community for South African entrepreneurs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freedom Wheels — Tools for SA entrepreneurs",
    description:
      "Subscription + revenue share for South African entrepreneurs. Not an investment. Not a pyramid.",
    images: ["/og-image.png"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <MarketingTracker />
        <PageViewTracker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

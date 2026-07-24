import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    title: "Freedom Wheels",
    description:
      "Tools, resources, and community for South African entrepreneurs. Subscription + revenue share from external affiliate commissions.",
    url: "https://www.freedomwheels.online",
    siteName: "Freedom Wheels",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Freedom Wheels",
    description:
      "Subscription + revenue share for South African entrepreneurs. Not an investment. Not a pyramid.",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}

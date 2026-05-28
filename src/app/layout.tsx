import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/freedom/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Freedom Wheels™ Ecosystem — AI-Powered Business Automation",
  description: "Build income that works without you. Deploy autonomous income engines, capture intelligent leads, and build multi-asset wealth on sovereign infrastructure.",
  keywords: ["Freedom Wheels", "AI automation", "passive income", "income engines", "business automation", "sovereign wealth"],
  authors: [{ name: "Freedom Wheels" }, { name: "Maphalle Malatji" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Freedom Wheels™ Ecosystem",
    description: "AI-powered business automation platform for sovereign income",
    url: "https://freedomwheels.io",
    siteName: "Freedom Wheels",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Freedom Wheels™ Ecosystem",
    description: "AI-powered business automation platform for sovereign income",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-fw-bg text-fw-text`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}

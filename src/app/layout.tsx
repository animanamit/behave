import type React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/providers";

// Initialize fonts
// Using Geist Sans as primary font
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

// Using Geist Mono for data/code
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Behave - Practice Behavioral Interviews",
  description:
    "AI-powered behavioral interview practice with personalized feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

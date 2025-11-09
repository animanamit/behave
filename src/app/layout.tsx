import type React from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

import { Inter, Geist_Mono as V0_Font_Geist_Mono } from "next/font/google";
import Providers from "@/providers";

// Initialize fonts
const _geistMono = V0_Font_Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview Coach AI - Practice Behavioral Interviews",
  description:
    "AI-powered behavioral interview practice with personalized feedback",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

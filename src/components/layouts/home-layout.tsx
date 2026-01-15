"use client";

import React from "react";
import { SiteHeader } from "@/components/layouts/site-header";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="p-6">{children}</main>
    </div>
  );
}

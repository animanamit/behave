"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User } from "lucide-react";
import SignOutButton from "@/components/auth/sign-out-button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

/*
  HOME LAYOUT
  - Sidebar on desktop
  - Sheet on mobile
  - Header with UserNav
*/

interface HomeLayoutProps {
  children: React.ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const { data: session } = authClient.useSession();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-6 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="font-sans text-lg font-normal">BEHAVE</div>
      </header>

      <aside className="hidden w-[240px] flex-col border-r border-border bg-sidebar md:flex h-screen sticky top-0">
        
        {/* User Info Section */}
        <div className="p-4 border-b border-border">
            {!session ? (
              <div className="flex items-center gap-3 mb-4 px-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                  </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate">{session.user?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground truncate font-mono">{session.user?.email || "user@behave.ai"}</span>
                  </div>
              </div>
            )}
            <SignOutButton />
        </div>

        <ScrollArea className="flex-1 py-6">
          <Sidebar />
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <nav className="grid gap-1 px-4">
      <SidebarItem href="/home">Overview</SidebarItem>
      <SidebarItem href="/upload">Upload Document</SidebarItem>
      <SidebarItem href="/practice">Practice Session</SidebarItem>
      <SidebarItem href="/review">Past Sessions</SidebarItem>
      <div className="my-4 border-t border-border" />
      <SidebarItem href="/settings">Settings</SidebarItem>
    </nav>
  );
}

function SidebarItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </Link>
  );
}


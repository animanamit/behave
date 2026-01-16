"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import SignOutButton from "@/components/auth/sign-out-button";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { title: "Dashboard", href: "/home" },
  { title: "Upload", href: "/upload" },
  { title: "Practice", href: "/practice" },
  { title: "Sessions", href: "/review" },
  { title: "Answers", href: "/answers" },
];

/**
 * Site Header with navigation.
 *
 * Uses prefetch on hover for faster perceived navigation.
 * See revisions.md for explanation of preloading on user intent.
 */
export function SiteHeader() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  // Prefetch route when user hovers - page loads before they click
  const handlePrefetch = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  return (
    <header className="border-b border-border px-6 flex justify-between items-center bg-background sticky top-0 z-50 h-16">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-sans text-lg font-bold tracking-tight">
          BEHAVE
        </Link>
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => handlePrefetch(item.href)}
              onFocus={() => handlePrefetch(item.href)}
              className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {!session ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {session.user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {session.user?.email || "user@behave.ai"}
                </span>
              </div>
            </div>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}

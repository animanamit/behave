"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import SignOutButton from "@/components/auth/sign-out-button";
import { User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Answers", href: "/answers" },
  { title: "Practice", href: "/practice" },
  { title: "Sessions", href: "/review" },
];

/**
 * Site Header with navigation.
 *
 * Ultra-minimal header:
 * - No border, clean separation
 * - Simple navigation with underline active state
 * - Compact user menu
 */
export function SiteHeader() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering dropdowns after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prefetch route when user hovers
  const handlePrefetch = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(href);
  };

  return (
    <header className="px-6 flex justify-between items-center bg-background sticky top-0 z-50 h-14">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-sans text-base font-semibold tracking-tight text-foreground"
        >
          behave
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => handlePrefetch(item.href)}
              onFocus={() => handlePrefetch(item.href)}
              className={cn(
                "text-sm font-medium transition-colors relative py-1",
                isActive(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.title}
              {isActive(item.href) && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile Navigation - only render after mount to avoid hydration mismatch */}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon-sm">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="w-full">
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Profile - only render dropdown after mount */}
        {!mounted || !session ? (
          <div className="h-7 w-7 rounded-full bg-secondary animate-pulse" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center rounded-full hover:opacity-80 transition-opacity">
                <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{session.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user?.email}
                </p>
              </div>
              <DropdownMenuItem asChild>
                <SignOutButton className="w-full justify-start" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

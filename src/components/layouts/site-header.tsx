import Link from "next/link";
import { Heading } from "@/components/ui/typography";

export function SiteHeader() {
  return (
    <header className="border-b border-border p-4 flex justify-between items-center bg-background sticky top-0 z-50 h-14">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-sans text-lg font-medium tracking-tight">
          BEHAVE
        </Link>
      </div>
      <nav className="flex gap-6">
        <Link href="/home" className="font-sans text-sm hover:underline underline-offset-4">
          Dashboard
        </Link>
      </nav>
    </header>
  );
}

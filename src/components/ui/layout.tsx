import React from "react";
import { cn } from "@/lib/utils";

/*
  DESIGN SYSTEM - LAYOUT
  
  Standardized layout wrappers for consistent spacing and grids.
  Updated for HIGHER DENSITY.

  STANDARD PAGE LAYOUT RULES:
  1. Max Width: max-w-5xl (for all standard pages like Home, Upload, Review)
  2. Max Width: max-w-7xl (for dashboard-like views with split panes, e.g., Practice)
  3. Padding: p-6 md:p-8 lg:p-12 (handled by HomeLayout wrapper)
  4. Vertical Spacing: space-y-8 (for main content sections)
  5. Grids: Use <Grid> or simple grid-cols-* classes. 
     - 1 column for stacking
     - 2 columns for split views
     - 3 columns for card grids
*/

// The main page wrapper (usually inside layout or page)
export function Section({
  className,
  children,
  fullWidth = false,
  ...props
}: React.HTMLAttributes<HTMLElement> & { fullWidth?: boolean }) {
  return (
    <section
      className={cn(
        "py-8 md:py-12 px-4 md:px-6 w-full", // Reduced padding from py-12/20
        {
          "max-w-5xl mx-auto": !fullWidth, // Reduced max-width from 7xl
        },
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

// A standard grid for cards (Lexiconic style)
// Starts single column, goes to 2 or 3 based on props
export function Grid({
  className,
  children,
  cols = 3,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { cols?: 1 | 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-4", // Reduced gap from 6
        {
          "grid-cols-1": cols === 1,
          "grid-cols-1 md:grid-cols-2": cols === 2,
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": cols === 3,
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-4": cols === 4,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// A flex container for centering content or creating rows
export function Flex({
  className,
  children,
  direction = "row",
  align = "center",
  justify = "start",
  gap = "md",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
}) {
  return (
    <div
      className={cn(
        "flex",
        {
          "flex-row": direction === "row",
          "flex-col": direction === "col",
          "items-start": align === "start",
          "items-center": align === "center",
          "items-end": align === "end",
          "items-stretch": align === "stretch",
          "justify-start": justify === "start",
          "justify-center": justify === "center",
          "justify-end": justify === "end",
          "justify-between": justify === "between",
          "gap-0": gap === "none",
          "gap-1": gap === "xs", // Added xs gap
          "gap-2": gap === "sm",
          "gap-4": gap === "md",
          "gap-6": gap === "lg", // Reduced from 8
          "gap-8": gap === "xl", // Reduced from 12
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

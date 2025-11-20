import * as React from "react"

import { cn } from "@/lib/utils"

/*
  DESIGN SYSTEM - INPUT
  
  Modifications for Minimal Style:
  - Borders: Thin, subtle 1px borders.
  - Focus: Minimal high-contrast ring.
  - Typography: Mono font for precision.
  - "Hero" Variant: Added for the main search bar (Lexiconic style).
*/

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: "default" | "hero";
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    
    // "Hero" input style for main search pages
    if (variant === "hero") {
      return (
        <input
          type={type}
          className={cn(
            "flex w-full bg-transparent py-4 text-3xl md:text-5xl font-sans font-normal placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-b border-border focus:border-primary transition-colors",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }

    // Default input style
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-normal file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

import React from "react";
import { cn } from "@/lib/utils";

/*
  DESIGN SYSTEM - TYPOGRAPHY
  
  Standardized typography components to enforce the system.
  - Headings: Geist Sans (Medium/Normal - lighter feel)
  - Text: Geist Sans (Regular)
  - Mono: Geist Mono (Data)
  
  Design Philosophy: Light, airy text similar to Cursor docs
*/

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
}

export function Heading({
  as: Component = "h2",
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <Component
      className={cn(
        "font-sans font-medium tracking-tight text-foreground leading-relaxed",
        {
          "text-2xl md:text-3xl": Component === "h1",
          "text-xl md:text-2xl": Component === "h2",
          "text-lg md:text-xl": Component === "h3",
          "text-base md:text-lg": Component === "h4",
          "text-base font-normal": Component === "h5",
          "text-sm font-normal": Component === "h6",
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Text({
  as: Component = "p",
  className,
  children,
  variant = "body",
  ...props
}: TypographyProps & { variant?: "body" | "lead" | "small" | "muted" | "mono" }) {
  return (
    <Component
      className={cn(
        "leading-relaxed font-normal",
        {
          "font-sans text-sm": variant === "body",
          "font-sans text-base text-muted-foreground": variant === "lead",
          "font-sans text-xs leading-normal": variant === "small",
          "font-sans text-xs text-muted-foreground": variant === "muted",
          "font-mono text-xs": variant === "mono",
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Caption({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-normal", className)}
      {...props}
    >
      {children}
    </span>
  );
}

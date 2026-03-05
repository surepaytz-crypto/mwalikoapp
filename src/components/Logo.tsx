"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "gold" | "charcoal" | "white";
}

export function Logo({ className, size = "md", variant = "gold" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xl",
    md: "h-12 w-12 text-2xl",
    lg: "h-16 w-16 text-3xl",
    xl: "h-24 w-24 text-5xl",
  };

  const variantClasses = {
    gold: "border-accent text-accent bg-primary/10",
    charcoal: "border-primary text-primary bg-accent/10",
    white: "border-white text-white bg-white/10",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 font-headline font-bold transition-transform hover:scale-105 duration-300 shadow-lg",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span className="tracking-tighter">MA</span>
    </div>
  );
}

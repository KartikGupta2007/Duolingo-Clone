"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The chunky Duolingo button: rounded-2xl with a *solid* darker slab offset a
 * few pixels below it, which compresses on press (§8). Not a soft drop shadow.
 */
type Variant = "green" | "blue" | "red" | "ghost" | "outline" | "super";

const VARIANTS: Record<Variant, string> = {
  green:
    "bg-duo-green text-white shadow-[0_4px_0_#46A302] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_#46A302]",
  blue: "bg-duo-blue text-white shadow-[0_4px_0_#1899D6] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_#1899D6]",
  red: "bg-duo-red text-white shadow-[0_4px_0_#E03131] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_#E03131]",
  // Duolingo's Super CTA is flat rather than slabbed, like `ghost`.
  super: "bg-duo-super text-white hover:brightness-110",
  ghost: "bg-transparent text-duo-muted hover:bg-duo-card",
  outline:
    "bg-transparent text-duo-blue border-2 border-duo-border shadow-[0_4px_0_#37464F] hover:bg-duo-card active:translate-y-[3px] active:shadow-[0_1px_0_#37464F]",
};

const SIZES = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
} as const;

interface DuoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof SIZES;
  fullWidth?: boolean;
  children: ReactNode;
}

export default function DuoButton({
  variant = "green",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: DuoButtonProps) {
  return (
    <button
      {...props}
      className={[
        "select-none rounded-2xl font-extrabold uppercase tracking-wide",
        "transition-[transform,box-shadow,filter] duration-75",
        // Disabled loses the 3D slab entirely — it reads as inert, like Duolingo's.
        "disabled:cursor-not-allowed disabled:bg-duo-border disabled:text-duo-muted",
        "disabled:shadow-none disabled:translate-y-0 disabled:brightness-100",
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

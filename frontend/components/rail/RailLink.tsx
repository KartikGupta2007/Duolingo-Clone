"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The blue uppercase action link used for "VIEW ALL" and "REMOVE ADS".
 * Reference: #49C0F8, 15px / 700, uppercase, 0.8px letter-spacing.
 *
 * Takes either an `href` — for links whose destination exists — or an `onClick`,
 * for the ones that still raise a toast. Rendering the first kind as a button
 * would leave it a dead end.
 */
export default function RailLink({
  children,
  onClick,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const style = `text-[15px] font-bold uppercase tracking-[0.8px] text-duo-link transition-opacity hover:opacity-80 ${className}`;

  if (href) {
    return (
      <Link href={href} className={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={style}>
      {children}
    </button>
  );
}

import type { ElementType, ReactNode } from "react";

/**
 * The bordered container every rail card sits in.
 *
 * Reference values: 2px #37464F border, 16px radius, 18px padding, and the page
 * background rather than a fill — the cards are outlined, not raised.
 *
 * This is the rail's extension point: a new card composes RailCard instead of
 * restating the chrome, so the shared look can change in one place.
 */
export default function RailCard({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: ReactNode;
  /** Merged last, so callers can override padding (e.g. `pb-2`). */
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      className={`rounded-2xl border-2 border-duo-border bg-duo-bg p-[18px] ${className}`}
    >
      {children}
    </Tag>
  );
}
